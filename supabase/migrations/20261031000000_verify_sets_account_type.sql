-- ==============================================================================
-- Homeo Circle India — Approving an application sets the member's type
-- Migration: 20261031000000_verify_sets_account_type.sql
--
-- Members now choose doctor / student / researcher by filling the
-- verification form instead of picking it from a dropdown. When an admin
-- verifies the application, the member's profile takes the type they applied
-- for (so they appear in the directory under it) and the details from the
-- form: qualification, institution, city, state, specialization, experience,
-- registration and student details. Fields left empty on the form keep the
-- profile's current value. Admin accounts keep their admin role.
-- Idempotent: safe to run more than once.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.review_practitioner_application(
  p_application_id uuid,
  p_new_status text,
  p_decision_reason text DEFAULT NULL,
  p_verification_source text DEFAULT NULL,
  p_internal_notes text DEFAULT NULL,
  p_reviewer_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_app           record;
  v_reviewer_id   uuid;
  v_reviewer_name text;
  v_type          text;
BEGIN
  -- Strict caller verification: service_role (Edge Function) or admin
  IF auth.role() <> 'service_role' AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: Only administrators or the trusted verification service can review practitioner applications.';
  END IF;

  IF p_new_status NOT IN ('pending_review', 'needs_information', 'verified', 'declined', 'suspended') THEN
    RAISE EXCEPTION 'Invalid status transition: %', p_new_status;
  END IF;

  SELECT * INTO v_app FROM public.practitioner_applications WHERE id = p_application_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Application not found with id %', p_application_id;
  END IF;

  v_reviewer_id := COALESCE(auth.uid(), p_reviewer_id);
  IF v_reviewer_id IS NOT NULL THEN
    SELECT COALESCE(display_name, full_name, 'Verification Officer') INTO v_reviewer_name
    FROM public.profiles WHERE id = v_reviewer_id;
  END IF;
  v_reviewer_name := COALESCE(v_reviewer_name, 'Verification Officer');

  -- 1. Update application record
  UPDATE public.practitioner_applications
  SET status = p_new_status,
      reviewed_at = now(),
      reviewed_by = v_reviewer_name,
      decision_reason = p_decision_reason,
      verification_source = p_verification_source,
      verification_checked_at = now(),
      internal_notes = p_internal_notes
  WHERE id = p_application_id;

  -- 2. Immutable review history
  INSERT INTO public.verification_reviews (
    application_id, reviewer_id, reviewer_name, previous_status, new_status,
    decision_reason, verification_source, internal_notes
  ) VALUES (
    p_application_id, v_reviewer_id, v_reviewer_name, v_app.status, p_new_status,
    p_decision_reason, p_verification_source, p_internal_notes
  );

  -- 3. Sync the applicant's profile and notify them
  IF v_app.user_id IS NOT NULL THEN
    UPDATE public.profiles
    SET status = p_new_status,
        verification_status = CASE
          WHEN p_new_status = 'verified' THEN 'verified'
          WHEN p_new_status = 'declined' THEN 'rejected'
          ELSE 'pending'
        END,
        updated_at = now()
    WHERE id = v_app.user_id;

    -- Verified: the profile becomes the type applied for, with the form's details.
    v_type := CASE WHEN v_app.role_applied IN ('doctor', 'student', 'researcher') THEN v_app.role_applied END;
    IF p_new_status = 'verified' AND v_type IS NOT NULL THEN
      UPDATE public.profiles p
      SET account_type           = v_type,
          role                   = CASE WHEN p.role IN ('member', 'doctor', 'student', 'researcher') THEN v_type ELSE p.role END,
          qualification          = COALESCE(NULLIF(trim(v_app.qualification), ''), p.qualification),
          state                  = COALESCE(NULLIF(trim(v_app.state), ''), p.state),
          city                   = COALESCE(NULLIF(trim(v_app.city), ''), p.city),
          clinic_institution     = COALESCE(NULLIF(trim(v_app.clinic_institution), ''), NULLIF(trim(v_app.institution), ''), p.clinic_institution),
          specialization         = COALESCE(NULLIF(trim(v_app.specialization), ''), p.specialization),
          experience_years       = CASE WHEN v_type = 'doctor' AND COALESCE(v_app.experience_years, 0) > 0 THEN v_app.experience_years ELSE p.experience_years END,
          registration_number    = COALESCE(NULLIF(trim(v_app.registration_number), ''), p.registration_number),
          registration_authority = COALESCE(NULLIF(trim(v_app.registration_authority), ''), p.registration_authority),
          student_details        = CASE WHEN v_type = 'student' THEN jsonb_build_object(
                                     'institution', COALESCE(v_app.institution, ''),
                                     'course_year', COALESCE(v_app.course_year, ''),
                                     'mentorship_needs', to_jsonb(COALESCE(v_app.mentorship_needs, '{}'::text[])))
                                   ELSE p.student_details END,
          updated_at             = now()
      WHERE p.id = v_app.user_id;
    END IF;

    INSERT INTO public.app_notifications (
      user_id, type, title, message, link, action_url, action_status, metadata
    ) VALUES (
      v_app.user_id,
      'verification_update',
      CASE WHEN p_new_status = 'verified' THEN 'Credentials Verified!' ELSE 'Application Status Update' END,
      CASE
        WHEN p_new_status = 'verified' THEN 'Your application has been verified. Your profile now appears in the member directory.'
        WHEN p_new_status = 'declined' THEN COALESCE(p_decision_reason, 'Your registration could not be verified against the state register.')
        WHEN p_new_status = 'needs_information' THEN COALESCE(p_decision_reason, 'The committee requires additional information regarding your credentials.')
        ELSE 'Your application status was updated to: ' || p_new_status
      END,
      CASE WHEN p_new_status = 'verified' THEN '/dashboard' ELSE '/application-status' END,
      CASE WHEN p_new_status = 'verified' THEN '/dashboard' ELSE '/application-status' END,
      CASE WHEN p_new_status = 'verified' THEN 'accepted' WHEN p_new_status = 'declined' THEN 'declined' ELSE 'pending' END,
      jsonb_build_object('application_id', p_application_id, 'status', p_new_status)
    );
  END IF;

  -- 4. Audit log
  INSERT INTO public.admin_audit_logs (actor_id, actor_name, action, target_type, target_id, metadata)
  VALUES (
    COALESCE(v_reviewer_id::text, 'verification-service'),
    v_reviewer_name,
    'APPLICATION_REVIEWED',
    'practitioner_application',
    p_application_id::text,
    jsonb_build_object(
      'previous_status', v_app.status,
      'new_status', p_new_status,
      'role_applied', v_app.role_applied,
      'decision_reason', p_decision_reason,
      'has_user_id', (v_app.user_id IS NOT NULL)
    )
  );

  RETURN jsonb_build_object('success', true, 'application_id', p_application_id, 'status', p_new_status);
END;
$$;

REVOKE ALL ON FUNCTION public.review_practitioner_application(uuid, text, text, text, text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.review_practitioner_application(uuid, text, text, text, text, uuid) TO authenticated, service_role;

-- ------------------------------------------------------------------------------
-- The type comes only from a verified application. Sign-up ignores any
-- account_type sent in the sign-up metadata (it auto-verified students), and
-- members can no longer change their own type, role or verification status.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_meta      jsonb := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  v_full_name text;
BEGIN
  -- Email sign-up sends full_name; Google sends full_name and/or name.
  v_full_name := COALESCE(
    NULLIF(trim(v_meta->>'full_name'), ''),
    NULLIF(trim(v_meta->>'name'), ''),
    split_part(COALESCE(NEW.email, 'member'), '@', 1)
  );

  BEGIN
    INSERT INTO public.profiles (
      id, email, full_name, display_name, avatar_url, role, account_type,
      status, verification_status, qualification, state, created_at, updated_at
    ) VALUES (
      NEW.id,
      NEW.email,
      v_full_name,
      v_full_name,
      COALESCE(NULLIF(v_meta->>'avatar_url', ''), NULLIF(v_meta->>'picture', '')),
      'member',
      NULL,
      'pending',
      'pending',
      'Not specified',
      'Not specified',
      now(),
      now()
    )
    ON CONFLICT (id) DO UPDATE SET
      email      = EXCLUDED.email,
      avatar_url = COALESCE(public.profiles.avatar_url, EXCLUDED.avatar_url);

    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'member')
    ON CONFLICT (user_id, role) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    -- Never block account creation; the app creates a missing profile on first login.
    RAISE WARNING 'handle_new_user: profile setup failed for %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.prevent_self_elevation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at := now();

  -- Server-side callers (Edge Functions, SQL editor, review function run by
  -- the service) have no auth.uid(); admins manage members. Both are trusted.
  IF auth.uid() IS NULL OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    -- Self-created profile (app fallback): always a plain, unverified member.
    NEW.role := 'member';
    NEW.account_type := NULL;
    NEW.status := 'pending';
    NEW.verification_status := 'pending';
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status
     OR NEW.verification_status IS DISTINCT FROM OLD.verification_status THEN
    RAISE EXCEPTION 'Only administrators can change verification status.' USING ERRCODE = '42501';
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role OR NEW.account_type IS DISTINCT FROM OLD.account_type THEN
    RAISE EXCEPTION 'Your account type is set when your verification form is approved.' USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.prevent_self_elevation() FROM PUBLIC, anon, authenticated;

-- ------------------------------------------------------------------------------
-- Posts cannot be edited once published; authors can only delete them.
-- Like/comment counters and admin moderation (status) still update posts.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.prevent_post_edits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.is_admin() THEN
    RETURN NEW;
  END IF;
  IF NEW.title IS DISTINCT FROM OLD.title
     OR NEW.body IS DISTINCT FROM OLD.body
     OR NEW.category_id IS DISTINCT FROM OLD.category_id
     OR NEW.source_url IS DISTINCT FROM OLD.source_url
     OR NEW.author_id IS DISTINCT FROM OLD.author_id THEN
    RAISE EXCEPTION 'Posts cannot be edited. You can delete the post and publish a new one.'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.prevent_post_edits() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_prevent_post_edits ON public.posts;
CREATE TRIGGER trg_prevent_post_edits
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.prevent_post_edits();
