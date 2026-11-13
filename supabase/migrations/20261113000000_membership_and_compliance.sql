-- ==============================================================================
-- Homeo India — Membership categories, verification, consent, privacy requests,
-- grievances, moderation and least-privilege staff roles
-- Migration: 20261113000000_membership_and_compliance.sql
--
-- ADDITIVE ONLY: no table, column or row is dropped. Existing members keep
-- their access. One accuracy change is applied to existing data:
--   * Existing "doctor" members were approved on their degree only (no
--     registration check), so their registration_status is set to 'pending'.
--     They stay verified members; the site shows "Qualification verified —
--     registration pending" until an admin records a registration check.
-- Idempotent.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Membership categories
--    doctor     = Registered Practitioner (badge only once registration verified)
--    student    = BHMS Student
--    intern     = Intern
--    graduate   = Qualified Graduate (registration pending)
--    researcher = Academic / Research Member
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_account_type_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_account_type_check
  CHECK (account_type = ANY (ARRAY['doctor', 'student', 'intern', 'graduate', 'researcher']));

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role = ANY (ARRAY['member', 'doctor', 'student', 'intern', 'graduate', 'researcher', 'moderator', 'admin', 'super_admin']));

ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_role_check
  CHECK (role = ANY (ARRAY['member', 'doctor', 'student', 'intern', 'graduate', 'researcher',
                           'moderator', 'publisher', 'verification_admin', 'event_manager', 'research_reviewer',
                           'admin', 'super_admin']));

-- Verification facts kept separate: a verified degree is NOT a verified registration.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS qualification_verified boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS registration_status text NOT NULL DEFAULT 'not_applicable';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS registration_verified_at timestamptz;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS registration_verification_source text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS registration_valid_until date;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS reverification_due_at date;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_registration_status_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_registration_status_check
  CHECK (registration_status IN ('not_applicable', 'pending', 'verified', 'lapsed', 'expired', 'rejected'));

-- Accuracy fix for existing members (see header).
UPDATE public.profiles SET qualification_verified = true
 WHERE status = 'verified' AND account_type IS NOT NULL AND qualification_verified = false;
UPDATE public.profiles SET registration_status = 'pending'
 WHERE account_type = 'doctor' AND registration_status = 'not_applicable';

-- Applications: per-category fields.
ALTER TABLE public.practitioner_applications ADD COLUMN IF NOT EXISTS internship_details text;
ALTER TABLE public.practitioner_applications ADD COLUMN IF NOT EXISTS graduation_year text;
ALTER TABLE public.practitioner_applications ADD COLUMN IF NOT EXISTS registration_status_declared text;
ALTER TABLE public.practitioner_applications ADD COLUMN IF NOT EXISTS academic_role text;
ALTER TABLE public.practitioner_applications ADD COLUMN IF NOT EXISTS adult_confirmed boolean NOT NULL DEFAULT false;
ALTER TABLE public.practitioner_applications DROP CONSTRAINT IF EXISTS applications_extra_len;
ALTER TABLE public.practitioner_applications ADD CONSTRAINT applications_extra_len CHECK (
  char_length(COALESCE(internship_details, '')) <= 1000 AND char_length(COALESCE(graduation_year, '')) <= 10
  AND char_length(COALESCE(registration_status_declared, '')) <= 100 AND char_length(COALESCE(academic_role, '')) <= 300
  AND char_length(COALESCE(registration_number, '')) <= 100 AND char_length(COALESCE(registration_authority, '')) <= 200);

-- Review history records what exactly was checked.
ALTER TABLE public.verification_reviews ADD COLUMN IF NOT EXISTS registration_verified boolean;
ALTER TABLE public.verification_reviews ADD COLUMN IF NOT EXISTS registration_valid_until date;
ALTER TABLE public.verification_reviews ADD COLUMN IF NOT EXISTS category text;

-- ------------------------------------------------------------------------------
-- 2. Staff roles (least privilege)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.has_staff_role(p_roles text[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = ANY (p_roles));
$$;
REVOKE ALL ON FUNCTION public.has_staff_role(text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_staff_role(text[]) TO authenticated, service_role;

-- Who may review applications and open verification documents.
CREATE OR REPLACE FUNCTION public.is_verification_staff()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT public.has_staff_role(ARRAY['super_admin', 'verification_admin']); $$;
CREATE OR REPLACE FUNCTION public.is_moderation_staff()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT public.has_staff_role(ARRAY['super_admin', 'admin', 'moderator']); $$;
CREATE OR REPLACE FUNCTION public.is_event_staff()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT public.has_staff_role(ARRAY['super_admin', 'admin', 'event_manager']); $$;
CREATE OR REPLACE FUNCTION public.is_research_staff()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT public.has_staff_role(ARRAY['super_admin', 'admin', 'research_reviewer']); $$;
CREATE OR REPLACE FUNCTION public.is_privacy_staff()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT public.has_staff_role(ARRAY['super_admin']); $$;
DO $$
DECLARE f text;
BEGIN
  FOREACH f IN ARRAY ARRAY['is_verification_staff', 'is_moderation_staff', 'is_event_staff', 'is_research_staff', 'is_privacy_staff'] LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION public.%I() FROM PUBLIC, anon', f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%I() TO authenticated, service_role', f);
  END LOOP;
END;
$$;

-- Verification documents: only the applicant, super admins and verification
-- admins (a general admin account is not enough).
DROP POLICY IF EXISTS "Applicant and admins can view verification documents" ON storage.objects;
DROP POLICY IF EXISTS "Applicant and verification staff can view verification documents" ON storage.objects;
CREATE POLICY "Applicant and verification staff can view verification documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'verification-documents'
         AND ((auth.uid() IS NOT NULL AND (storage.foldername(name))[1] = auth.uid()::text)
              OR public.is_verification_staff()));

DROP POLICY IF EXISTS "Verification staff can read applications" ON public.practitioner_applications;
CREATE POLICY "Verification staff can read applications" ON public.practitioner_applications FOR SELECT TO authenticated
  USING (public.is_verification_staff());
DROP POLICY IF EXISTS "Verification staff can read review history" ON public.verification_reviews;
CREATE POLICY "Verification staff can read review history" ON public.verification_reviews FOR SELECT TO authenticated
  USING (public.is_verification_staff());

-- Moderators: reports, and hiding posts/comments.
DROP POLICY IF EXISTS "Moderators manage reports" ON public.reports;
CREATE POLICY "Moderators manage reports" ON public.reports FOR ALL TO authenticated
  USING (public.is_moderation_staff()) WITH CHECK (public.is_moderation_staff());
DROP POLICY IF EXISTS "Moderators can moderate posts" ON public.posts;
CREATE POLICY "Moderators can moderate posts" ON public.posts FOR UPDATE TO authenticated
  USING (public.is_moderation_staff()) WITH CHECK (public.is_moderation_staff());
DROP POLICY IF EXISTS "Moderators can read all posts" ON public.posts;
CREATE POLICY "Moderators can read all posts" ON public.posts FOR SELECT TO authenticated
  USING (public.is_moderation_staff());
DROP POLICY IF EXISTS "Moderators can moderate comments" ON public.comments;
CREATE POLICY "Moderators can moderate comments" ON public.comments FOR UPDATE TO authenticated
  USING (public.is_moderation_staff()) WITH CHECK (public.is_moderation_staff());
DROP POLICY IF EXISTS "Moderators can delete comments" ON public.comments;
CREATE POLICY "Moderators can delete comments" ON public.comments FOR DELETE TO authenticated
  USING (public.is_moderation_staff());

DROP POLICY IF EXISTS "Event managers manage events" ON public.events;
CREATE POLICY "Event managers manage events" ON public.events FOR ALL TO authenticated
  USING (public.is_event_staff()) WITH CHECK (public.is_event_staff());
DROP POLICY IF EXISTS "Research reviewers manage research" ON public.knowledge_posts;
CREATE POLICY "Research reviewers manage research" ON public.knowledge_posts FOR ALL TO authenticated
  USING (public.is_research_staff()) WITH CHECK (public.is_research_staff());

-- Moderators may hide/remove posts (status only); content stays uneditable.
CREATE OR REPLACE FUNCTION public.prevent_post_edits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_trusted_writer() THEN
    RETURN NEW;
  END IF;
  IF NEW.title IS DISTINCT FROM OLD.title
     OR NEW.body IS DISTINCT FROM OLD.body
     OR NEW.category_id IS DISTINCT FROM OLD.category_id
     OR NEW.source_url IS DISTINCT FROM OLD.source_url
     OR NEW.author_id IS DISTINCT FROM OLD.author_id
     OR NEW.image_urls IS DISTINCT FROM OLD.image_urls
     OR NEW.attachment_url IS DISTINCT FROM OLD.attachment_url THEN
    RAISE EXCEPTION 'Posts cannot be edited. You can delete the post and publish a new one.' USING ERRCODE = '42501';
  END IF;
  IF (NEW.status IS DISTINCT FROM OLD.status AND NOT public.is_moderation_staff())
     OR NEW.likes_count IS DISTINCT FROM OLD.likes_count
     OR NEW.comments_count IS DISTINCT FROM OLD.comments_count
     OR NEW.author_name IS DISTINCT FROM OLD.author_name
     OR NEW.author_avatar IS DISTINCT FROM OLD.author_avatar
     OR NEW.author_qualification IS DISTINCT FROM OLD.author_qualification
     OR NEW.author_experience IS DISTINCT FROM OLD.author_experience
     OR NEW.author_role IS DISTINCT FROM OLD.author_role
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Only administrators can change this.' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.prevent_post_edits() FROM PUBLIC, anon, authenticated;

-- Admin tools: give / take staff roles (super admins only).
CREATE OR REPLACE FUNCTION public.set_staff_role(p_email text, p_role text, p_grant boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE v_id uuid;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_staff_role(ARRAY['super_admin']) THEN
    RAISE EXCEPTION 'Only super admins can change staff roles.' USING ERRCODE = '42501';
  END IF;
  IF p_role NOT IN ('verification_admin', 'moderator', 'event_manager', 'research_reviewer', 'publisher') THEN
    RAISE EXCEPTION 'Unknown staff role: %', p_role;
  END IF;
  SELECT id INTO v_id FROM auth.users WHERE lower(trim(email)) = lower(trim(p_email));
  IF v_id IS NULL THEN
    RAISE EXCEPTION 'No account found for %. Ask them to sign up first.', trim(p_email);
  END IF;
  IF p_grant THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (v_id, p_role) ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    DELETE FROM public.user_roles WHERE user_id = v_id AND role = p_role;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.list_staff()
RETURNS TABLE (user_id uuid, name text, email text, role text, added_at timestamptz)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
#variable_conflict use_column
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_staff_role(ARRAY['super_admin']) THEN
    RAISE EXCEPTION 'Only super admins can see staff roles.' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
    SELECT r.user_id, COALESCE(NULLIF(p.display_name, ''), NULLIF(p.full_name, ''), u.email::text), u.email::text, r.role, r.created_at
    FROM public.user_roles r JOIN auth.users u ON u.id = r.user_id LEFT JOIN public.profiles p ON p.id = r.user_id
    WHERE r.role IN ('super_admin', 'admin', 'verification_admin', 'moderator', 'event_manager', 'research_reviewer', 'publisher')
    ORDER BY r.role, r.created_at;
END;
$$;
REVOKE ALL ON FUNCTION public.set_staff_role(text, text, boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.list_staff() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_staff_role(text, text, boolean) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.list_staff() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.audit_role_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE r record;
BEGIN
  IF TG_OP = 'DELETE' THEN r := OLD; ELSE r := NEW; END IF;
  IF r.role IN ('admin', 'super_admin', 'moderator', 'publisher', 'verification_admin', 'event_manager', 'research_reviewer') THEN
    INSERT INTO public.admin_audit_logs (actor_id, actor_name, action, target_type, target_id, metadata)
    VALUES (COALESCE(auth.uid()::text, 'db-console'),
            COALESCE((SELECT COALESCE(display_name, full_name, email) FROM public.profiles WHERE id = auth.uid()), 'DB console: ' || session_user),
            CASE TG_OP WHEN 'INSERT' THEN 'ROLE_GRANTED' ELSE 'ROLE_REVOKED' END,
            'profile', r.user_id::text, jsonb_build_object('role', r.role, 'at', now()));
  END IF;
  RETURN NULL;
END;
$$;
REVOKE ALL ON FUNCTION public.audit_role_change() FROM PUBLIC, anon, authenticated;

-- ------------------------------------------------------------------------------
-- 3. Members cannot change their own verification facts
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.prevent_self_elevation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  IF auth.uid() IS NULL OR public.is_admin() OR public.is_verification_staff() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.role := 'member';
    NEW.account_type := NULL;
    NEW.status := 'pending';
    NEW.verification_status := 'pending';
    NEW.qualification_verified := false;
    NEW.registration_status := 'not_applicable';
    NEW.registration_verified_at := NULL;
    NEW.registration_verification_source := NULL;
    NEW.registration_valid_until := NULL;
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status
     OR NEW.verification_status IS DISTINCT FROM OLD.verification_status
     OR NEW.qualification_verified IS DISTINCT FROM OLD.qualification_verified
     OR NEW.registration_status IS DISTINCT FROM OLD.registration_status
     OR NEW.registration_verified_at IS DISTINCT FROM OLD.registration_verified_at
     OR NEW.registration_verification_source IS DISTINCT FROM OLD.registration_verification_source
     OR NEW.registration_valid_until IS DISTINCT FROM OLD.registration_valid_until
     OR NEW.reverification_due_at IS DISTINCT FROM OLD.reverification_due_at
     OR NEW.registration_number IS DISTINCT FROM OLD.registration_number
     OR NEW.registration_authority IS DISTINCT FROM OLD.registration_authority THEN
    RAISE EXCEPTION 'Only administrators can change verification details.' USING ERRCODE = '42501';
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role OR NEW.account_type IS DISTINCT FROM OLD.account_type THEN
    RAISE EXCEPTION 'Your account type is set when your verification form is approved.' USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.prevent_self_elevation() FROM PUBLIC, anon, authenticated;

-- ------------------------------------------------------------------------------
-- 4. Review function: per-category outcomes; registration verified only when
--    the reviewer records a registration check.
-- ------------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.review_practitioner_application(uuid, text, text, text, text, uuid);
CREATE OR REPLACE FUNCTION public.review_practitioner_application(
  p_application_id uuid,
  p_new_status text,
  p_decision_reason text DEFAULT NULL,
  p_verification_source text DEFAULT NULL,
  p_internal_notes text DEFAULT NULL,
  p_reviewer_id uuid DEFAULT NULL,
  p_registration_verified boolean DEFAULT false,
  p_registration_valid_until date DEFAULT NULL
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
  v_reg_status    text;
BEGIN
  IF auth.role() <> 'service_role' AND NOT public.is_verification_staff() THEN
    RAISE EXCEPTION 'Access denied: only verification staff can review applications.';
  END IF;
  IF p_new_status NOT IN ('pending_review', 'needs_information', 'verified', 'declined', 'suspended') THEN
    RAISE EXCEPTION 'Invalid status transition: %', p_new_status;
  END IF;

  SELECT * INTO v_app FROM public.practitioner_applications WHERE id = p_application_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Application not found with id %', p_application_id;
  END IF;

  v_type := CASE WHEN v_app.role_applied IN ('doctor', 'student', 'intern', 'graduate', 'researcher') THEN v_app.role_applied END;
  IF p_new_status = 'verified' AND p_registration_verified AND v_type IS DISTINCT FROM 'doctor' THEN
    RAISE EXCEPTION 'Registration can only be recorded for a Registered Practitioner application.';
  END IF;
  IF p_new_status = 'verified' AND p_registration_verified AND NULLIF(trim(COALESCE(p_verification_source, '')), '') IS NULL THEN
    RAISE EXCEPTION 'Record where the registration was checked (verification source) before verifying it.';
  END IF;

  v_reviewer_id := COALESCE(auth.uid(), p_reviewer_id);
  IF v_reviewer_id IS NOT NULL THEN
    SELECT COALESCE(display_name, full_name, 'Verification Officer') INTO v_reviewer_name FROM public.profiles WHERE id = v_reviewer_id;
  END IF;
  v_reviewer_name := COALESCE(v_reviewer_name, 'Verification Officer');

  UPDATE public.practitioner_applications
     SET status = p_new_status, reviewed_at = now(), reviewed_by = v_reviewer_name,
         decision_reason = p_decision_reason, verification_source = p_verification_source,
         verification_checked_at = now(), internal_notes = p_internal_notes
   WHERE id = p_application_id;

  INSERT INTO public.verification_reviews (
    application_id, reviewer_id, reviewer_name, previous_status, new_status,
    decision_reason, verification_source, internal_notes, registration_verified, registration_valid_until, category
  ) VALUES (
    p_application_id, v_reviewer_id, v_reviewer_name, v_app.status, p_new_status,
    p_decision_reason, p_verification_source, p_internal_notes,
    CASE WHEN v_type = 'doctor' THEN p_registration_verified END, p_registration_valid_until, v_type
  );

  IF v_app.user_id IS NOT NULL THEN
    UPDATE public.profiles
       SET status = p_new_status,
           verification_status = CASE WHEN p_new_status = 'verified' THEN 'verified'
                                      WHEN p_new_status = 'declined' THEN 'rejected' ELSE 'pending' END,
           updated_at = now()
     WHERE id = v_app.user_id;

    IF p_new_status = 'verified' AND v_type IS NOT NULL THEN
      v_reg_status := CASE
        WHEN v_type = 'doctor' AND p_registration_verified THEN 'verified'
        WHEN v_type IN ('doctor', 'graduate') THEN 'pending'
        ELSE 'not_applicable' END;
      UPDATE public.profiles p
         SET account_type = v_type,
             role = CASE WHEN p.role IN ('member', 'doctor', 'student', 'intern', 'graduate', 'researcher') THEN v_type ELSE p.role END,
             qualification_verified = (v_type IN ('doctor', 'graduate', 'intern')),
             registration_status = v_reg_status,
             registration_verified_at = CASE WHEN v_reg_status = 'verified' THEN now() ELSE NULL END,
             registration_verification_source = CASE WHEN v_reg_status = 'verified' THEN p_verification_source ELSE NULL END,
             registration_valid_until = CASE WHEN v_reg_status = 'verified' THEN p_registration_valid_until ELSE NULL END,
             qualification = COALESCE(NULLIF(trim(v_app.qualification), ''), p.qualification),
             state = COALESCE(NULLIF(trim(v_app.state), ''), p.state),
             city = COALESCE(NULLIF(trim(v_app.city), ''), p.city),
             clinic_institution = COALESCE(NULLIF(trim(v_app.clinic_institution), ''), NULLIF(trim(v_app.institution), ''), p.clinic_institution),
             specialization = COALESCE(NULLIF(trim(v_app.specialization), ''), p.specialization),
             experience_years = CASE WHEN v_type = 'doctor' AND COALESCE(v_app.experience_years, 0) > 0 THEN v_app.experience_years ELSE p.experience_years END,
             registration_number = COALESCE(NULLIF(trim(v_app.registration_number), ''), p.registration_number),
             registration_authority = COALESCE(NULLIF(trim(v_app.registration_authority), ''), p.registration_authority),
             student_details = CASE WHEN v_type IN ('student', 'intern') THEN jsonb_build_object(
                                 'institution', COALESCE(v_app.institution, ''),
                                 'course_year', COALESCE(v_app.course_year, ''),
                                 'internship', COALESCE(v_app.internship_details, ''),
                                 'mentorship_needs', to_jsonb(COALESCE(v_app.mentorship_needs, '{}'::text[])))
                               ELSE p.student_details END,
             updated_at = now()
       WHERE p.id = v_app.user_id;
    END IF;

    INSERT INTO public.app_notifications (user_id, type, title, message, link, action_url, action_status, metadata)
    VALUES (
      v_app.user_id, 'verification_update',
      CASE WHEN p_new_status = 'verified' THEN 'Membership verified' ELSE 'Application status update' END,
      CASE
        WHEN p_new_status = 'verified' AND v_reg_status = 'pending' THEN 'Your qualification is verified. Your professional registration has not been verified yet.'
        WHEN p_new_status = 'verified' THEN 'Your membership has been verified.'
        WHEN p_new_status = 'declined' THEN COALESCE(p_decision_reason, 'We could not verify the details you submitted.')
        WHEN p_new_status = 'needs_information' THEN COALESCE(p_decision_reason, 'We need more information to verify your membership.')
        ELSE 'Your application status was updated to: ' || p_new_status
      END,
      CASE WHEN p_new_status = 'verified' THEN '/dashboard' ELSE '/application-status' END,
      CASE WHEN p_new_status = 'verified' THEN '/dashboard' ELSE '/application-status' END,
      CASE WHEN p_new_status = 'verified' THEN 'accepted' WHEN p_new_status = 'declined' THEN 'declined' ELSE 'pending' END,
      jsonb_build_object('application_id', p_application_id, 'status', p_new_status));
  END IF;

  INSERT INTO public.admin_audit_logs (actor_id, actor_name, action, target_type, target_id, metadata)
  VALUES (COALESCE(v_reviewer_id::text, 'verification-service'), v_reviewer_name, 'APPLICATION_REVIEWED',
          'practitioner_application', p_application_id::text,
          jsonb_build_object('previous_status', v_app.status, 'new_status', p_new_status, 'category', v_type,
                             'registration_verified', p_registration_verified, 'source', p_verification_source));

  RETURN jsonb_build_object('success', true, 'application_id', p_application_id, 'status', p_new_status);
END;
$$;
REVOKE ALL ON FUNCTION public.review_practitioner_application(uuid, text, text, text, text, uuid, boolean, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.review_practitioner_application(uuid, text, text, text, text, uuid, boolean, date) TO authenticated, service_role;

-- Registration lapsed / expired / re-verified later (verification staff).
CREATE OR REPLACE FUNCTION public.set_registration_status(
  p_user_id uuid, p_status text, p_source text DEFAULT NULL, p_valid_until date DEFAULT NULL, p_note text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_old text; v_type text;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_verification_staff() THEN
    RAISE EXCEPTION 'Only verification staff can change registration status.' USING ERRCODE = '42501';
  END IF;
  IF p_status NOT IN ('pending', 'verified', 'lapsed', 'expired', 'rejected') THEN
    RAISE EXCEPTION 'Invalid registration status: %', p_status;
  END IF;
  SELECT registration_status, account_type INTO v_old, v_type FROM public.profiles WHERE id = p_user_id;
  IF v_type IS DISTINCT FROM 'doctor' THEN
    RAISE EXCEPTION 'Registration status applies to Registered Practitioner members only.';
  END IF;
  IF p_status = 'verified' AND NULLIF(trim(COALESCE(p_source, '')), '') IS NULL THEN
    RAISE EXCEPTION 'Record where the registration was checked before marking it verified.';
  END IF;
  UPDATE public.profiles
     SET registration_status = p_status,
         registration_verified_at = CASE WHEN p_status = 'verified' THEN now() ELSE registration_verified_at END,
         registration_verification_source = CASE WHEN p_status = 'verified' THEN p_source ELSE registration_verification_source END,
         registration_valid_until = CASE WHEN p_status = 'verified' THEN p_valid_until ELSE registration_valid_until END,
         updated_at = now()
   WHERE id = p_user_id;
  INSERT INTO public.admin_audit_logs (actor_id, actor_name, action, target_type, target_id, metadata)
  VALUES (COALESCE(auth.uid()::text, 'db-console'),
          COALESCE((SELECT COALESCE(display_name, full_name) FROM public.profiles WHERE id = auth.uid()), 'DB console'),
          'REGISTRATION_STATUS_CHANGED', 'profile', p_user_id::text,
          jsonb_build_object('from', v_old, 'to', p_status, 'source', p_source, 'valid_until', p_valid_until, 'note', p_note));
  INSERT INTO public.app_notifications (user_id, type, title, message, link, action_url)
  VALUES (p_user_id, 'verification_update', 'Registration status updated',
          CASE p_status WHEN 'verified' THEN 'Your professional registration has been verified.'
                        WHEN 'lapsed' THEN 'Your registration appears to have lapsed. Please submit updated details to re-verify.'
                        WHEN 'expired' THEN 'Your registration has expired. Please submit updated details to re-verify.'
                        ELSE 'Your registration status is now: ' || p_status END,
          '/apply?role=doctor', '/apply?role=doctor');
END;
$$;
REVOKE ALL ON FUNCTION public.set_registration_status(uuid, text, text, date, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_registration_status(uuid, text, text, date, text) TO authenticated, service_role;

-- Applications: category list and per-category requirements.
CREATE OR REPLACE FUNCTION public.stamp_application()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_trusted_writer() THEN
    RETURN NEW;
  END IF;
  IF NEW.role_applied NOT IN ('doctor', 'student', 'intern', 'graduate', 'researcher') THEN
    RAISE EXCEPTION 'Please choose a membership category.';
  END IF;
  IF NOT COALESCE(NEW.adult_confirmed, false) THEN
    RAISE EXCEPTION 'Membership is open to people aged 18 or over.';
  END IF;
  IF NEW.role_applied = 'doctor' AND (NULLIF(trim(COALESCE(NEW.registration_number, '')), '') IS NULL
                                      OR NULLIF(trim(COALESCE(NEW.registration_authority, '')), '') IS NULL) THEN
    RAISE EXCEPTION 'Registered practitioners must give their registration number and registering authority.';
  END IF;
  NEW.user_id := auth.uid();
  NEW.status := 'pending_review';
  NEW.submitted_at := now();
  NEW.reviewed_at := NULL;
  NEW.reviewed_by := NULL;
  NEW.decision_reason := NULL;
  NEW.verification_source := NULL;
  NEW.verification_checked_at := NULL;
  NEW.internal_notes := NULL;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.stamp_application() FROM PUBLIC, anon, authenticated;

-- ------------------------------------------------------------------------------
-- 5. Policy versions and consent records
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.policy_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document text NOT NULL CHECK (document IN ('privacy', 'terms', 'community_guidelines', 'verification', 'copyright', 'clinical_disclaimer', 'grievance', 'cookies')),
  version text NOT NULL,
  effective_date date NOT NULL,
  requires_acceptance boolean NOT NULL DEFAULT false,
  summary text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (document, version)
);
ALTER TABLE public.policy_versions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read policy versions" ON public.policy_versions;
CREATE POLICY "Anyone can read policy versions" ON public.policy_versions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Super admins manage policy versions" ON public.policy_versions;
CREATE POLICY "Super admins manage policy versions" ON public.policy_versions FOR ALL TO authenticated
  USING (public.has_staff_role(ARRAY['super_admin'])) WITH CHECK (public.has_staff_role(ARRAY['super_admin']));
GRANT SELECT ON public.policy_versions TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.policy_versions TO authenticated;

INSERT INTO public.policy_versions (document, version, effective_date, requires_acceptance, summary) VALUES
  ('privacy', '2.0', '2026-11-13', true, 'Full rewrite describing the data the platform actually processes.'),
  ('terms', '2.0', '2026-11-13', true, 'Full rewrite with separate obligations for each membership category.'),
  ('community_guidelines', '2.0', '2026-11-13', false, 'Clinical discussion rules and moderation process.'),
  ('verification', '1.0', '2026-11-13', false, 'How each membership category is verified.'),
  ('copyright', '1.0', '2026-11-13', false, 'Research library rules and takedown process.'),
  ('clinical_disclaimer', '1.0', '2026-11-13', false, 'Clinical discussions are educational only.'),
  ('grievance', '1.0', '2026-11-13', false, 'How complaints are handled.'),
  ('cookies', '1.0', '2026-11-13', false, 'Essential storage used for sign-in.')
ON CONFLICT (document, version) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.consent_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type text NOT NULL CHECK (consent_type IN ('privacy_notice', 'terms', 'community_guidelines', 'age_18_plus', 'marketing')),
  policy_version text,
  granted boolean NOT NULL,
  source text CHECK (char_length(COALESCE(source, '')) <= 60),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_consent_records_user ON public.consent_records (user_id, consent_type, created_at DESC);
ALTER TABLE public.consent_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members record their own consent" ON public.consent_records;
CREATE POLICY "Members record their own consent" ON public.consent_records FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Members see their own consent; privacy staff see all" ON public.consent_records;
CREATE POLICY "Members see their own consent; privacy staff see all" ON public.consent_records FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_privacy_staff());
GRANT SELECT, INSERT ON public.consent_records TO authenticated;
-- Append-only: no UPDATE/DELETE policies. Withdrawal is a new row with granted = false.

-- Server-side timestamp: the browser cannot backdate a consent.
CREATE OR REPLACE FUNCTION public.stamp_consent()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    NEW.user_id := auth.uid();
    NEW.created_at := now();
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.stamp_consent() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_stamp_consent ON public.consent_records;
CREATE TRIGGER trg_stamp_consent BEFORE INSERT ON public.consent_records FOR EACH ROW EXECUTE FUNCTION public.stamp_consent();

-- Consent ticked on the sign-up form travels in the sign-up metadata and is
-- recorded here when the account is created.
CREATE OR REPLACE FUNCTION public.record_signup_consents()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE m jsonb := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
BEGIN
  IF m ? 'consent_privacy_version' THEN
    INSERT INTO public.consent_records (user_id, consent_type, policy_version, granted, source)
    VALUES (NEW.id, 'privacy_notice', left(m->>'consent_privacy_version', 20), true, 'signup');
  END IF;
  IF m ? 'consent_terms_version' THEN
    INSERT INTO public.consent_records (user_id, consent_type, policy_version, granted, source)
    VALUES (NEW.id, 'terms', left(m->>'consent_terms_version', 20), true, 'signup');
  END IF;
  IF (m->>'consent_age_18_plus') = 'true' THEN
    INSERT INTO public.consent_records (user_id, consent_type, policy_version, granted, source)
    VALUES (NEW.id, 'age_18_plus', NULL, true, 'signup');
  END IF;
  IF m ? 'consent_marketing' THEN
    INSERT INTO public.consent_records (user_id, consent_type, policy_version, granted, source)
    VALUES (NEW.id, 'marketing', NULL, (m->>'consent_marketing') = 'true', 'signup');
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never block account creation; the site asks again on first sign-in.
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.record_signup_consents() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_record_signup_consents ON auth.users;
CREATE TRIGGER trg_record_signup_consents AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.record_signup_consents();

-- Members' latest answer for each consent type.
CREATE OR REPLACE FUNCTION public.my_consents()
RETURNS TABLE (consent_type text, policy_version text, granted boolean, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT DISTINCT ON (c.consent_type) c.consent_type, c.policy_version, c.granted, c.created_at
    FROM public.consent_records c WHERE c.user_id = auth.uid()
   ORDER BY c.consent_type, c.created_at DESC;
$$;
REVOKE ALL ON FUNCTION public.my_consents() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_consents() TO authenticated;

-- ------------------------------------------------------------------------------
-- 6. Privacy requests (access, correction, erasure, consent withdrawal, nomination)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.privacy_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_type text NOT NULL CHECK (request_type IN ('access', 'correction', 'erasure', 'withdraw_consent', 'nomination', 'other')),
  details text CHECK (char_length(COALESCE(details, '')) <= 3000),
  status text NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'in_progress', 'completed', 'rejected')),
  response text CHECK (char_length(COALESCE(response, '')) <= 3000),
  handled_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_privacy_requests_user ON public.privacy_requests (user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_privacy_requests_status ON public.privacy_requests (status, created_at);
ALTER TABLE public.privacy_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members submit own privacy requests" ON public.privacy_requests;
CREATE POLICY "Members submit own privacy requests" ON public.privacy_requests FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Members see own privacy requests" ON public.privacy_requests;
CREATE POLICY "Members see own privacy requests" ON public.privacy_requests FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_privacy_staff());
DROP POLICY IF EXISTS "Privacy staff handle requests" ON public.privacy_requests;
CREATE POLICY "Privacy staff handle requests" ON public.privacy_requests FOR UPDATE TO authenticated
  USING (public.is_privacy_staff()) WITH CHECK (public.is_privacy_staff());
GRANT SELECT, INSERT, UPDATE ON public.privacy_requests TO authenticated;

CREATE OR REPLACE FUNCTION public.stamp_privacy_request()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF auth.uid() IS NOT NULL AND NOT public.is_privacy_staff() THEN
      NEW.user_id := auth.uid();
      NEW.status := 'received';
      NEW.response := NULL;
      NEW.handled_by := NULL;
      NEW.completed_at := NULL;
      NEW.created_at := now();
    END IF;
    INSERT INTO public.admin_audit_logs (actor_id, actor_name, action, target_type, target_id, metadata)
    VALUES (NEW.user_id::text, 'Member', 'PRIVACY_REQUEST_RECEIVED', 'privacy_request', NEW.id::text,
            jsonb_build_object('type', NEW.request_type));
  ELSE
    NEW.updated_at := now();
    NEW.handled_by := COALESCE(auth.uid(), NEW.handled_by);
    IF NEW.status IN ('completed', 'rejected') AND OLD.status NOT IN ('completed', 'rejected') THEN
      NEW.completed_at := now();
      INSERT INTO public.app_notifications (user_id, type, title, message, link, action_url)
      VALUES (NEW.user_id, 'system_notice', 'Privacy request ' || NEW.status,
              COALESCE(NEW.response, 'Your privacy request has been ' || NEW.status || '.'), '/profile', '/profile');
    END IF;
    INSERT INTO public.admin_audit_logs (actor_id, actor_name, action, target_type, target_id, metadata)
    VALUES (COALESCE(auth.uid()::text, 'db-console'), 'Privacy staff', 'PRIVACY_REQUEST_UPDATED', 'privacy_request', NEW.id::text,
            jsonb_build_object('from', OLD.status, 'to', NEW.status));
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.stamp_privacy_request() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_stamp_privacy_request ON public.privacy_requests;
CREATE TRIGGER trg_stamp_privacy_request BEFORE INSERT OR UPDATE ON public.privacy_requests
  FOR EACH ROW EXECUTE FUNCTION public.stamp_privacy_request();

-- Erasure: anonymise a member's personal data (super admins), keeping records
-- that must be retained. The login itself is then removed in Supabase Auth.
CREATE OR REPLACE FUNCTION public.anonymise_member(p_user_id uuid, p_request_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
DECLARE v_files text[];
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_privacy_staff() THEN
    RAISE EXCEPTION 'Only super admins can erase member data.' USING ERRCODE = '42501';
  END IF;
  IF public.has_staff_role(ARRAY['super_admin']) AND p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'You cannot erase your own super admin account.';
  END IF;

  UPDATE public.profiles SET
    display_name = 'Former member', full_name = 'Former member', email = NULL, avatar_url = NULL, avatar_path = NULL,
    bio = NULL, city = NULL, state = 'Not specified', clinic_institution = NULL, specialization = NULL, qualification = 'Not specified',
    registration_number = NULL, registration_authority = NULL, social_links = '{}'::jsonb, interests = '{}',
    student_details = NULL, researcher_details = NULL, profile_visibility = 'private', mentorship_available = false,
    status = 'suspended', updated_at = now()
  WHERE id = p_user_id;

  UPDATE public.posts SET author_name = 'Former member', author_avatar = NULL, author_qualification = NULL, author_experience = NULL
   WHERE author_id = p_user_id;
  UPDATE public.comments SET author_name = 'Former member', author_avatar = NULL, author_qualification = NULL
   WHERE author_id = p_user_id;
  UPDATE public.practitioner_applications SET
    full_name = 'Former member', email = 'erased@invalid', phone = '', document_url = NULL,
    clinic_institution = NULL, institution = NULL, city = NULL, research_interests = NULL, publications = NULL,
    internship_details = NULL
  WHERE user_id = p_user_id;

  -- Supabase blocks deleting files with SQL; return them so the admin screen
  -- deletes them through the Storage API.
  SELECT COALESCE(array_agg(bucket_id || '/' || name), '{}') INTO v_files FROM storage.objects
   WHERE bucket_id IN ('verification-documents', 'avatars', 'post-images') AND (storage.foldername(name))[1] = p_user_id::text;

  DELETE FROM public.connection_requests WHERE sender_id = p_user_id OR recipient_id = p_user_id;
  DELETE FROM public.app_notifications WHERE user_id = p_user_id;
  DELETE FROM public.post_bookmarks WHERE user_id = p_user_id;

  IF p_request_id IS NOT NULL THEN
    UPDATE public.privacy_requests SET status = 'completed',
      response = 'Your personal data has been erased or anonymised. Records we must keep by law (such as audit logs of verification decisions) are retained as described in our Privacy Policy.'
     WHERE id = p_request_id;
  END IF;

  INSERT INTO public.admin_audit_logs (actor_id, actor_name, action, target_type, target_id, metadata)
  VALUES (COALESCE(auth.uid()::text, 'db-console'), 'Privacy staff', 'MEMBER_ANONYMISED', 'profile', p_user_id::text,
          jsonb_build_object('files', v_files, 'request_id', p_request_id));
  RETURN jsonb_build_object('success', true, 'files', to_jsonb(v_files));
END;
$$;
REVOKE ALL ON FUNCTION public.anonymise_member(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.anonymise_member(uuid, uuid) TO authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 7. Grievances / complaints / appeals / copyright notices (guests may submit)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.grievances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  email text NOT NULL CHECK (char_length(email) BETWEEN 3 AND 254 AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  category text NOT NULL CHECK (category IN ('grievance', 'privacy', 'copyright', 'content', 'account', 'appeal', 'verification', 'other')),
  subject text NOT NULL CHECK (char_length(subject) BETWEEN 1 AND 200),
  details text NOT NULL CHECK (char_length(details) BETWEEN 1 AND 5000),
  related_url text CHECK (public.is_web_url(related_url)),
  status text NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'acknowledged', 'in_progress', 'resolved', 'rejected')),
  resolution text CHECK (char_length(COALESCE(resolution, '')) <= 5000),
  handled_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  acknowledged_at timestamptz,
  resolved_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_grievances_status ON public.grievances (status, created_at);
CREATE INDEX IF NOT EXISTS idx_grievances_email ON public.grievances (lower(email), created_at);
CREATE INDEX IF NOT EXISTS idx_grievances_user ON public.grievances (user_id);
ALTER TABLE public.grievances ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can submit a complaint" ON public.grievances;
CREATE POLICY "Anyone can submit a complaint" ON public.grievances FOR INSERT
  WITH CHECK ((auth.uid() IS NULL AND user_id IS NULL) OR user_id = auth.uid());
DROP POLICY IF EXISTS "Submitters and staff can read complaints" ON public.grievances;
CREATE POLICY "Submitters and staff can read complaints" ON public.grievances FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_moderation_staff() OR public.is_privacy_staff());
DROP POLICY IF EXISTS "Staff handle complaints" ON public.grievances;
CREATE POLICY "Staff handle complaints" ON public.grievances FOR UPDATE TO authenticated
  USING (public.is_moderation_staff() OR public.is_privacy_staff())
  WITH CHECK (public.is_moderation_staff() OR public.is_privacy_staff());
GRANT INSERT ON public.grievances TO anon, authenticated;
GRANT SELECT, UPDATE ON public.grievances TO authenticated;

CREATE OR REPLACE FUNCTION public.stamp_grievance()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_recent int;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NOT (public.is_moderation_staff() OR public.is_privacy_staff()) THEN
      NEW.user_id := auth.uid();
      NEW.status := 'received';
      NEW.resolution := NULL;
      NEW.handled_by := NULL;
      NEW.acknowledged_at := NULL;
      NEW.resolved_at := NULL;
      NEW.created_at := now();
      SELECT count(*) INTO v_recent FROM public.grievances
       WHERE lower(email) = lower(NEW.email) AND created_at > now() - interval '1 day';
      IF v_recent >= 5 THEN
        RAISE EXCEPTION 'You have sent several complaints today. Please wait before sending another.' USING ERRCODE = 'P0429';
      END IF;
    END IF;
  ELSE
    NEW.updated_at := now();
    NEW.handled_by := COALESCE(auth.uid(), NEW.handled_by);
    IF NEW.status <> 'received' AND OLD.acknowledged_at IS NULL THEN NEW.acknowledged_at := now(); END IF;
    IF NEW.status IN ('resolved', 'rejected') AND OLD.status NOT IN ('resolved', 'rejected') THEN
      NEW.resolved_at := now();
      IF NEW.user_id IS NOT NULL THEN
        INSERT INTO public.app_notifications (user_id, type, title, message, link, action_url)
        VALUES (NEW.user_id, 'system_notice', 'Your complaint was ' || NEW.status,
                COALESCE(NEW.resolution, 'Your complaint "' || NEW.subject || '" was ' || NEW.status || '.'), '/contact', '/contact');
      END IF;
    END IF;
    INSERT INTO public.admin_audit_logs (actor_id, actor_name, action, target_type, target_id, metadata)
    VALUES (COALESCE(auth.uid()::text, 'db-console'), 'Staff', 'GRIEVANCE_UPDATED', 'grievance', NEW.id::text,
            jsonb_build_object('from', OLD.status, 'to', NEW.status, 'category', NEW.category));
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.stamp_grievance() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_stamp_grievance ON public.grievances;
CREATE TRIGGER trg_stamp_grievance BEFORE INSERT OR UPDATE ON public.grievances
  FOR EACH ROW EXECUTE FUNCTION public.stamp_grievance();

-- Rate limits for the new member tables.
DROP TRIGGER IF EXISTS trg_rate_limit ON public.privacy_requests;
CREATE TRIGGER trg_rate_limit BEFORE INSERT ON public.privacy_requests
  FOR EACH ROW EXECUTE FUNCTION public.enforce_rate_limit('user_id', '5', '1 day', 'privacy requests');
DROP TRIGGER IF EXISTS trg_rate_limit ON public.consent_records;
CREATE TRIGGER trg_rate_limit BEFORE INSERT ON public.consent_records
  FOR EACH ROW EXECUTE FUNCTION public.enforce_rate_limit('user_id', '60', '1 day', 'consent updates');

-- ------------------------------------------------------------------------------
-- 8. Reports: more targets (profiles, research, events)
-- ------------------------------------------------------------------------------
ALTER TABLE public.reports DROP CONSTRAINT IF EXISTS reports_target_type_check;
ALTER TABLE public.reports ADD CONSTRAINT reports_target_type_check
  CHECK (target_type = ANY (ARRAY['post', 'comment', 'member', 'profile', 'research', 'event']));

-- ------------------------------------------------------------------------------
-- 9. Research library: licence / copyright basis
-- ------------------------------------------------------------------------------
ALTER TABLE public.knowledge_posts ADD COLUMN IF NOT EXISTS licence text NOT NULL DEFAULT 'summary_link';
ALTER TABLE public.knowledge_posts ADD COLUMN IF NOT EXISTS copyright_notice text;
ALTER TABLE public.knowledge_posts ADD COLUMN IF NOT EXISTS publication_date text;
ALTER TABLE public.knowledge_posts DROP CONSTRAINT IF EXISTS knowledge_posts_licence_check;
ALTER TABLE public.knowledge_posts ADD CONSTRAINT knowledge_posts_licence_check
  CHECK (licence IN ('summary_link', 'open_access', 'permission', 'original'));
-- A full-text PDF may only be attached when it is open access, used with
-- permission, or the contributor's own work.
ALTER TABLE public.knowledge_posts DROP CONSTRAINT IF EXISTS knowledge_posts_pdf_licence;
CREATE OR REPLACE FUNCTION public.check_research_licence()
RETURNS trigger LANGUAGE plpgsql SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.attachment_url IS NOT DISTINCT FROM OLD.attachment_url AND NEW.licence IS NOT DISTINCT FROM OLD.licence THEN
    RETURN NEW;
  END IF;
  IF COALESCE(NEW.attachment_url, '') <> '' AND NEW.licence NOT IN ('open_access', 'permission', 'original') THEN
    RAISE EXCEPTION 'A full-text PDF can only be attached if it is open access, shared with permission, or your own work. Otherwise add a summary and a link.';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.check_research_licence() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_check_research_licence ON public.knowledge_posts;
CREATE TRIGGER trg_check_research_licence BEFORE INSERT OR UPDATE ON public.knowledge_posts
  FOR EACH ROW EXECUTE FUNCTION public.check_research_licence();
ALTER TABLE public.knowledge_posts DROP CONSTRAINT IF EXISTS knowledge_posts_text_len;
ALTER TABLE public.knowledge_posts ADD CONSTRAINT knowledge_posts_text_len CHECK (
  char_length(COALESCE(copyright_notice, '')) <= 500 AND char_length(COALESCE(publication_date, '')) <= 30
  AND char_length(COALESCE(author_name, '')) <= 300 AND char_length(COALESCE(author_affiliation, '')) <= 300);

-- ------------------------------------------------------------------------------
-- 10. Events: accreditation only when confirmed
-- ------------------------------------------------------------------------------
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS accreditation_status text NOT NULL DEFAULT 'not_accredited';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS accreditation_details text;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS certificate_info text;
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_accreditation_check;
ALTER TABLE public.events ADD CONSTRAINT events_accreditation_check CHECK (
  accreditation_status IN ('not_accredited', 'accredited')
  AND (accreditation_status = 'not_accredited' OR char_length(trim(COALESCE(accreditation_details, ''))) > 0)
  AND char_length(COALESCE(accreditation_details, '')) <= 500 AND char_length(COALESCE(certificate_info, '')) <= 500);
-- Publishers cannot claim accreditation; only admins / event managers can.
CREATE OR REPLACE FUNCTION public.stamp_publisher_content()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.is_admin() THEN
    RETURN NEW;
  END IF;
  IF TG_TABLE_NAME = 'events' AND public.is_event_staff() THEN RETURN NEW; END IF;
  IF TG_TABLE_NAME = 'knowledge_posts' AND public.is_research_staff() THEN RETURN NEW; END IF;
  NEW.created_by := auth.uid();
  NEW.status := 'published';
  NEW.created_at := now();
  IF TG_TABLE_NAME = 'events' THEN
    NEW.attendees_count := 0;
    NEW.accreditation_status := 'not_accredited';
    NEW.accreditation_details := NULL;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.stamp_publisher_content() FROM PUBLIC, anon, authenticated;

-- Directory view: expose the new verification facts (no private data).
CREATE OR REPLACE VIEW public.profile_public_view AS
SELECT id, display_name, full_name, role, specialization, qualification, experience_years,
       experience_years AS years_of_practice, state, city,
       COALESCE(CASE WHEN city IS NOT NULL AND city <> '' THEN (city || ', ') || state ELSE state END, state) AS location,
       clinic_institution, bio, avatar_url, avatar_path, profile_visibility, verification_status, status, created_at,
       account_type, interests, mentorship_available, student_details,
       qualification_verified, registration_status
  FROM public.profiles p
 WHERE status <> 'suspended'
   AND (profile_visibility = 'public'
        OR (profile_visibility = 'members_only' AND public.is_active_member())
        OR id = auth.uid() OR public.is_admin());
GRANT SELECT ON public.profile_public_view TO anon, authenticated, service_role;

-- Trigger functions are never called directly.
DO $$
DECLARE f record;
BEGIN
  FOR f IN SELECT p.oid::regprocedure AS sig FROM pg_proc p
           WHERE p.pronamespace = 'public'::regnamespace AND p.prorettype = 'trigger'::regtype LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', f.sig);
  END LOOP;
END;
$$;
