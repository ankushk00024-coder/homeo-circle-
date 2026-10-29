-- ==============================================================================
-- Homeo Circle India — Launch fixes
-- Migration: 20261029000000_launch_fixes.sql
--
-- Every problem fixed here was reproduced by applying migrations 20261022 →
-- 20261028 to a fresh Postgres 17 database with Supabase's auth/storage schemas.
-- Idempotent: safe to run more than once. Runs as one transaction.
--
--  1. SIGNUP WAS BROKEN for doctors, researchers, users who skip the account
--     type, and every Google sign-in: handle_new_user() wrote
--     status = 'pending_review' / role = 'member', both rejected by the
--     profiles CHECK constraints ("Database error saving new user").
--  2. ADMIN REVIEWS crashed for declined / needs-information / pending
--     decisions: review_practitioner_application() copies the decision into
--     profiles.status, which only allowed verified / suspended / pending.
--  3. ACCESS MODEL: everything required is_verified_member(), so a newly
--     signed-up member saw an empty site. Now any signed-in, non-suspended
--     member can browse and take part; verification stays as a badge and for
--     the admin workflow.
--  4. SECURITY: profile_public_view granted INSERT/UPDATE/DELETE to anon and
--     ran with owner privileges, so a logged-out visitor could rewrite any
--     public profile. It is now read-only.
--  5. SECURITY: any signed-in user could create notifications for any other
--     user (spam / phishing). Now only for yourself, or by admins.
--  6. ACCOUNT TYPE: members can switch between doctor / student / researcher
--     themselves (never to admin). Switching resets the verification badge.
--     user_roles is kept in sync automatically.
--     Self-created profile rows (INSERT) are also sanitised: a browser could
--     previously insert its own profile as status = 'verified', role = 'admin'.
--  7. Reviews run by the Edge Function (service role, no user session) were
--     rejected by prevent_self_elevation(). Server-side callers are now
--     trusted; browser users are still checked.
--  8. Admins can call review_practitioner_application() directly (it checks
--     is_admin() itself), so reviews work even before the Edge Function is
--     deployed.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1–2. Constraints that rejected values the app itself writes
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_status_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_status_check
  CHECK (status IN ('verified', 'pending', 'pending_review', 'needs_information', 'declined', 'suspended'));

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('member', 'doctor', 'student', 'researcher', 'moderator', 'admin', 'super_admin'));

-- ------------------------------------------------------------------------------
-- 3. Membership helper: any signed-in member who is not suspended
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_active_member()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;
  IF public.is_admin() THEN
    RETURN true;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND status <> 'suspended'
  );
END;
$$;
-- anon needs EXECUTE because profile_public_view calls it for visitors (returns false).
REVOKE ALL ON FUNCTION public.is_active_member() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_active_member() TO anon, authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 1. Signup trigger: never fails, works for email and Google sign-ups
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_meta         jsonb := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  v_full_name    text;
  v_account_type text;
  v_role         text;
  v_status       text;
BEGIN
  -- Email sign-up sends full_name; Google sends full_name and/or name.
  v_full_name := COALESCE(
    NULLIF(trim(v_meta->>'full_name'), ''),
    NULLIF(trim(v_meta->>'name'), ''),
    split_part(COALESCE(NEW.email, 'member'), '@', 1)
  );

  -- Account type is optional at sign-up; members choose it later.
  v_account_type := CASE
    WHEN v_meta->>'account_type' IN ('doctor', 'student', 'researcher') THEN v_meta->>'account_type'
    ELSE NULL
  END;
  v_role := COALESCE(v_account_type, 'member');
  -- Students are auto-verified (platform default); others await review.
  v_status := CASE WHEN v_account_type = 'student' THEN 'verified' ELSE 'pending' END;

  BEGIN
    INSERT INTO public.profiles (
      id, email, full_name, display_name, avatar_url, role, account_type,
      status, verification_status, qualification, state, city,
      clinic_institution, specialization, registration_number, registration_authority,
      created_at, updated_at
    ) VALUES (
      NEW.id,
      NEW.email,
      v_full_name,
      v_full_name,
      COALESCE(NULLIF(v_meta->>'avatar_url', ''), NULLIF(v_meta->>'picture', '')),
      v_role,
      v_account_type,
      v_status,
      CASE WHEN v_status = 'verified' THEN 'verified' ELSE 'pending' END,
      COALESCE(NULLIF(v_meta->>'qualification', ''),
               CASE v_account_type WHEN 'student' THEN 'BHMS (Student)' WHEN 'doctor' THEN 'BHMS' ELSE 'Not specified' END),
      COALESCE(NULLIF(v_meta->>'state', ''), 'Not specified'),
      NULLIF(v_meta->>'city', ''),
      COALESCE(NULLIF(v_meta->>'clinic_institution', ''), NULLIF(v_meta->>'institution', '')),
      NULLIF(v_meta->>'specialization', ''),
      NULLIF(v_meta->>'registration_number', ''),
      NULLIF(v_meta->>'registration_authority', ''),
      now(),
      now()
    )
    ON CONFLICT (id) DO UPDATE SET
      email      = EXCLUDED.email,
      avatar_url = COALESCE(public.profiles.avatar_url, EXCLUDED.avatar_url);

    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, v_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    -- Never block account creation; the app creates a missing profile on first login.
    RAISE WARNING 'handle_new_user: profile setup failed for %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- ------------------------------------------------------------------------------
-- 6–7. Profile guard: members may switch account type; server is trusted
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.prevent_self_elevation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_member_roles constant text[] := ARRAY['member', 'doctor', 'student', 'researcher'];
BEGIN
  NEW.updated_at := now();

  -- Self-created profiles (the app's fallback when sign-up left no profile
  -- row): never trust role or status sent from the browser.
  IF TG_OP = 'INSERT' THEN
    IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
      IF NEW.account_type IN ('doctor', 'student', 'researcher') THEN
        NEW.role := NEW.account_type;
      ELSE
        NEW.account_type := NULL;
        NEW.role := 'member';
      END IF;
      NEW.status := CASE WHEN NEW.role = 'student' THEN 'verified' ELSE 'pending' END;
      NEW.verification_status := NEW.status;
      IF NEW.verification_status <> 'verified' THEN NEW.verification_status := 'pending'; END IF;
    END IF;
    RETURN NEW;
  END IF;

  -- Server-side callers (Edge Functions with the service role, SQL editor,
  -- SECURITY DEFINER routines invoked without a user) have no auth.uid().
  -- Browser users always do, and anon users cannot update profiles at all (RLS).
  IF auth.uid() IS NULL OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status
     OR NEW.verification_status IS DISTINCT FROM OLD.verification_status THEN
    RAISE EXCEPTION 'Only administrators can change verification status.'
      USING ERRCODE = '42501';
  END IF;

  -- Keep account_type and role consistent: whichever one the member changed wins.
  IF NEW.account_type IS DISTINCT FROM OLD.account_type AND NEW.account_type IS NOT NULL THEN
    NEW.role := NEW.account_type;
  ELSIF NEW.role IS DISTINCT FROM OLD.role AND NEW.role IN ('doctor', 'student', 'researcher') THEN
    NEW.account_type := NEW.role;
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF NOT (OLD.role = ANY (v_member_roles) AND NEW.role = ANY (v_member_roles)) THEN
      RAISE EXCEPTION 'Only administrators can assign administrative roles.'
        USING ERRCODE = '42501';
    END IF;
    -- New account type → credentials must be checked again (students are auto-verified).
    IF OLD.status <> 'suspended' THEN
      NEW.status := CASE WHEN NEW.role = 'student' THEN 'verified' ELSE 'pending' END;
      NEW.verification_status := CASE WHEN NEW.role = 'student' THEN 'verified' ELSE 'pending' END;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.prevent_self_elevation() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_prevent_self_elevation ON public.profiles;
CREATE TRIGGER trg_prevent_self_elevation
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_self_elevation();

-- Keep user_roles in step with profiles.role (is_admin() reads user_roles).
CREATE OR REPLACE FUNCTION public.sync_user_role_from_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.role IS NOT DISTINCT FROM OLD.role THEN
    RETURN NEW;
  END IF;
  IF NEW.role IN ('member', 'doctor', 'student', 'researcher') THEN
    DELETE FROM public.user_roles
     WHERE user_id = NEW.id
       AND role IN ('member', 'doctor', 'student', 'researcher')
       AND role <> NEW.role;
  END IF;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, NEW.role)
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.sync_user_role_from_profile() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_sync_user_role_from_profile ON public.profiles;
CREATE TRIGGER trg_sync_user_role_from_profile
  AFTER UPDATE ON public.profiles  -- not "OF role": role may change via account_type in the BEFORE trigger
  FOR EACH ROW EXECUTE FUNCTION public.sync_user_role_from_profile();

-- ------------------------------------------------------------------------------
-- 3. Read / participate policies: any active member (not only verified)
-- ------------------------------------------------------------------------------
-- posts
DROP POLICY IF EXISTS "Verified members can read published posts" ON public.posts;
DROP POLICY IF EXISTS "Members can read published posts" ON public.posts;
CREATE POLICY "Members can read published posts"
  ON public.posts FOR SELECT TO authenticated
  USING ((public.is_active_member() AND status = 'published') OR author_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Verified members can create posts" ON public.posts;
DROP POLICY IF EXISTS "Members can create posts" ON public.posts;
CREATE POLICY "Members can create posts"
  ON public.posts FOR INSERT TO authenticated
  WITH CHECK (public.is_active_member() AND author_id = auth.uid());

-- comments
DROP POLICY IF EXISTS "Verified members can read comments" ON public.comments;
DROP POLICY IF EXISTS "Members can read comments" ON public.comments;
CREATE POLICY "Members can read comments"
  ON public.comments FOR SELECT TO authenticated
  USING (public.is_active_member());

DROP POLICY IF EXISTS "Verified members can insert comments" ON public.comments;
DROP POLICY IF EXISTS "Members can insert comments" ON public.comments;
CREATE POLICY "Members can insert comments"
  ON public.comments FOR INSERT TO authenticated
  WITH CHECK (public.is_active_member() AND author_id = auth.uid());

-- post likes
DROP POLICY IF EXISTS "Verified members can view post likes" ON public.post_likes;
DROP POLICY IF EXISTS "Members can view post likes" ON public.post_likes;
CREATE POLICY "Members can view post likes"
  ON public.post_likes FOR SELECT TO authenticated
  USING (public.is_active_member());

DROP POLICY IF EXISTS "Verified members can like posts" ON public.post_likes;
DROP POLICY IF EXISTS "Members can like posts" ON public.post_likes;
CREATE POLICY "Members can like posts"
  ON public.post_likes FOR INSERT TO authenticated
  WITH CHECK (public.is_active_member() AND user_id = auth.uid());

-- events, research, opportunities: readable by members; admins see drafts too
DROP POLICY IF EXISTS "Verified members can read published events" ON public.events;
DROP POLICY IF EXISTS "Members can read published events" ON public.events;
CREATE POLICY "Members can read published events"
  ON public.events FOR SELECT TO authenticated
  USING ((public.is_active_member() AND status = 'published') OR public.is_admin());

DROP POLICY IF EXISTS "Verified members can read research" ON public.knowledge_posts;
DROP POLICY IF EXISTS "Members can read research" ON public.knowledge_posts;
CREATE POLICY "Members can read research"
  ON public.knowledge_posts FOR SELECT TO authenticated
  USING ((public.is_active_member() AND status = 'published') OR public.is_admin());

DROP POLICY IF EXISTS "Verified members can read opportunities" ON public.opportunities;
DROP POLICY IF EXISTS "Members can read opportunities" ON public.opportunities;
CREATE POLICY "Members can read opportunities"
  ON public.opportunities FOR SELECT TO authenticated
  USING ((public.is_active_member() AND status = 'published') OR public.is_admin());

-- ------------------------------------------------------------------------------
-- 5. Notifications: create only for yourself (admins: anyone). DB triggers
--    that notify other users run as SECURITY DEFINER and are unaffected.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "System or authenticated peers can create notifications" ON public.app_notifications;
DROP POLICY IF EXISTS "Users or admins can create notifications" ON public.app_notifications;
CREATE POLICY "Users or admins can create notifications"
  ON public.app_notifications FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- ------------------------------------------------------------------------------
-- 4. profile_public_view: read-only, members_only visible to active members
-- ------------------------------------------------------------------------------
-- The view reads profiles with its owner's privileges (needed so members can
-- see each other while the profiles table itself only exposes your own row).
-- Its WHERE clause is therefore the access rule, and it must never be writable.
CREATE OR REPLACE VIEW public.profile_public_view
WITH (security_barrier = true)
AS
SELECT
  p.id,
  p.display_name,
  p.full_name,
  p.role,
  p.specialization,
  p.qualification,
  p.experience_years,
  p.experience_years AS years_of_practice,
  p.state,
  p.city,
  COALESCE(
    CASE WHEN p.city IS NOT NULL AND p.city <> '' THEN p.city || ', ' || p.state ELSE p.state END,
    p.state
  ) AS location,
  p.clinic_institution,
  p.bio,
  p.avatar_url,
  p.avatar_path,
  p.profile_visibility,
  p.verification_status,
  p.status,
  p.created_at,
  p.account_type,
  p.interests,
  p.mentorship_available,
  p.student_details
FROM public.profiles p
WHERE p.status <> 'suspended'
  AND (
        p.profile_visibility = 'public'
     OR (p.profile_visibility = 'members_only' AND public.is_active_member())
     OR p.id = auth.uid()
     OR public.is_admin()
  );

REVOKE ALL ON public.profile_public_view FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.profile_public_view TO anon, authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 8. Review RPC: callable by signed-in admins (checked inside) and the server
-- ------------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.review_practitioner_application(uuid, text, text, text, text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.review_practitioner_application(uuid, text, text, text, text, uuid) TO authenticated, service_role;

-- ------------------------------------------------------------------------------
-- Data repair for databases where sign-ups already half-failed
-- ------------------------------------------------------------------------------
-- Users created while the trigger was broken have an auth.users row but no
-- profile. Create the missing profiles now.
INSERT INTO public.profiles (id, email, full_name, display_name, role, status, verification_status, qualification, state)
SELECT u.id,
       u.email,
       COALESCE(NULLIF(u.raw_user_meta_data->>'full_name', ''), NULLIF(u.raw_user_meta_data->>'name', ''), split_part(u.email, '@', 1)),
       COALESCE(NULLIF(u.raw_user_meta_data->>'full_name', ''), NULLIF(u.raw_user_meta_data->>'name', ''), split_part(u.email, '@', 1)),
       'member', 'pending', 'pending', 'Not specified', 'Not specified'
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

INSERT INTO public.user_roles (user_id, role)
SELECT p.id, p.role FROM public.profiles p
WHERE p.role IN ('member', 'doctor', 'student', 'researcher')
ON CONFLICT (user_id, role) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 9. First super-admin provisioning could never succeed:
--    • min(uuid) does not exist in PostgreSQL ("function min(uuid) does not exist")
--    • the audit row used actor_id = NULL, but admin_audit_logs.actor_id is NOT NULL
--    Usage (Supabase SQL Editor, once, after the person has signed up):
--      CALL public.provision_first_super_admin('you@example.com');
-- ------------------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE public.provision_first_super_admin(p_email text)
LANGUAGE plpgsql
AS $$
DECLARE
  v_email   text := lower(trim(p_email));
  v_ids     uuid[];
  v_user_id uuid;
  v_rows    int;
BEGIN
  IF v_email IS NULL OR v_email = '' THEN
    RAISE EXCEPTION 'p_email must not be empty.';
  END IF;

  -- Serialize concurrent calls and block other role writes until commit.
  PERFORM pg_advisory_xact_lock(hashtext('provision_first_super_admin'));
  LOCK TABLE public.user_roles IN SHARE ROW EXCLUSIVE MODE;

  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'super_admin') THEN
    RAISE EXCEPTION 'Super admin already initialized. Promote further admins from the admin panel.';
  END IF;

  SELECT array_agg(u.id) INTO v_ids
  FROM auth.users u
  WHERE lower(trim(u.email)) = v_email;

  IF COALESCE(array_length(v_ids, 1), 0) = 0 THEN
    RAISE EXCEPTION 'No account found for %. Sign up on the website first, then run this again.', v_email;
  ELSIF array_length(v_ids, 1) > 1 THEN
    RAISE EXCEPTION 'Multiple accounts found for %. Resolve the duplicates first.', v_email;
  END IF;
  v_user_id := v_ids[1];

  UPDATE public.profiles
     SET role = 'super_admin', status = 'verified', verification_status = 'verified', updated_at = now()
   WHERE id = v_user_id;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows <> 1 THEN
    RAISE EXCEPTION 'Expected exactly 1 profile for %, found %. Nothing was changed.', v_email, v_rows;
  END IF;

  DELETE FROM public.user_roles WHERE user_id = v_user_id AND role IN ('member', 'doctor', 'student', 'researcher');
  INSERT INTO public.user_roles (user_id, role) VALUES (v_user_id, 'super_admin') ON CONFLICT (user_id, role) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (v_user_id, 'admin') ON CONFLICT (user_id, role) DO NOTHING;

  INSERT INTO public.admin_audit_logs (actor_id, actor_name, action, target_type, target_id, metadata)
  VALUES ('db-console', 'DB console: ' || session_user, 'SUPER_ADMIN_PROVISIONED', 'profile', v_user_id::text,
          jsonb_build_object('email', v_email, 'at', now()));

  RAISE NOTICE 'Super admin provisioned: % (%)', v_email, v_user_id;
END;
$$;

REVOKE ALL ON PROCEDURE public.provision_first_super_admin(text) FROM PUBLIC, anon, authenticated, service_role;
