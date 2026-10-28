-- ==============================================================================
-- Post-migration verification for 20261028000000_schema_harmonization
--
-- Run section by section in the SQL Editor of a STAGING copy first (Supabase
-- branch or a backup restored into a scratch project), then in production.
-- Sections A–C are read-only catalog/data checks.
-- Sections D–F impersonate API roles inside BEGIN … ROLLBACK and change nothing.
-- Replace the <PLACEHOLDER> UUIDs with real ids from that environment.
-- Every query states its expected result. Any deviation = do not ship.
-- ==============================================================================


-- ── A. CATALOG: functions, privileges, view options ─────────────────────────

-- A1. Function/procedure privilege matrix.
-- Expected:
--   review_practitioner_application(uuid,text,uuid,text,text,text): anon f, authenticated f, service_role t, definer t
--   provision_first_super_admin(text):           anon f, authenticated f, service_role f, definer f
--   lookup_guest_application_status(uuid,text):  anon t, authenticated t, definer t
--   app_private.public_profiles():               anon t, authenticated t, definer t
--   get_public_profiles():                       anon t, authenticated t, definer f
--   trigger functions (notify_*, sync_*, guard_*): anon f, authenticated f
--   every row: search_path set (has_search_path = t)
SELECT p.oid::regprocedure                                       AS routine,
       p.prokind                                                 AS kind,      -- f=function p=procedure
       p.prosecdef                                               AS definer,
       EXISTS (SELECT 1 FROM unnest(coalesce(p.proconfig,'{}')) c WHERE c LIKE 'search_path=%') AS has_search_path,
       has_function_privilege('anon',          p.oid, 'EXECUTE') AS anon,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated,
       has_function_privilege('service_role',  p.oid, 'EXECUTE') AS service_role,
       pg_get_userbyid(p.proowner)                               AS owner
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE (n.nspname = 'public' AND p.proname IN (
          'review_practitioner_application','provision_first_super_admin','bootstrap_super_admin',
          'lookup_guest_application_status','get_public_profiles','sync_profile_avatar_fields',
          'guard_profile_privileged_fields','notify_on_connection_request',
          'notify_on_mentorship_request','notify_on_comment',
          'is_admin','is_super_admin','is_verified_member'))
    OR n.nspname = 'app_private'
 ORDER BY 1;

-- A2. Removed objects. Expected: both NULL.
SELECT to_regprocedure('public.review_practitioner_application(uuid,text,text,text,text)') AS old_review_rpc,
       to_regprocedure('public.bootstrap_super_admin(text)')                               AS bootstrap_fn;

-- A3. View configuration. Expected: reloptions contains security_invoker=true and
-- security_barrier=true; anon/authenticated have SELECT only.
SELECT c.relname, c.reloptions,
       has_table_privilege('anon',          c.oid, 'SELECT') AS anon_select,
       has_table_privilege('anon',          c.oid, 'INSERT') AS anon_insert,
       has_table_privilege('authenticated', c.oid, 'SELECT') AS auth_select,
       has_table_privilege('authenticated', c.oid, 'UPDATE') AS auth_update,
       has_table_privilege('authenticated', c.oid, 'DELETE') AS auth_delete
  FROM pg_class c WHERE c.oid = 'public.profile_public_view'::regclass;

-- A4. View must expose ONLY the 12 safe columns. Expected: exactly
-- id, display_name, full_name, role, specialization, location, bio, avatar_url,
-- years_of_practice, profile_visibility, verification_status, created_at.
SELECT column_name, data_type FROM information_schema.columns
 WHERE table_schema = 'public' AND table_name = 'profile_public_view'
 ORDER BY ordinal_position;

-- A5. Schema app_private: USAGE only, no CREATE for API roles. Expected: usage t, create f.
SELECT has_schema_privilege('anon','app_private','USAGE')          AS anon_usage,
       has_schema_privilege('anon','app_private','CREATE')         AS anon_create,
       has_schema_privilege('authenticated','app_private','CREATE') AS auth_create;
-- Also confirm in Dashboard → Project Settings → API → "Exposed schemas" that
-- app_private is NOT listed (it must not be reachable over PostgREST).


-- ── B. CATALOG: RLS, policies, constraints, triggers ───────────────────────

-- B1. Tables in public WITHOUT RLS. Expected: zero rows (or only tables you
-- have consciously decided are public reference data).
SELECT c.relname
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
 WHERE n.nspname = 'public' AND c.relkind IN ('r','p') AND NOT c.relrowsecurity
 ORDER BY 1;

-- B2. Policies on the tables this migration touched. Review every row.
-- Expected on profiles: SELECT only "Users can view own profile row" (plus any
-- admin-only policy); NO "Profiles viewable by verified members only".
SELECT tablename, policyname, permissive, roles, cmd, qual, with_check
  FROM pg_policies
 WHERE (schemaname = 'public' AND tablename IN
         ('profiles','user_roles','practitioner_applications','reports','app_notifications',
          'verification_reviews','admin_audit_logs'))
    OR (schemaname = 'storage' AND tablename = 'objects')
 ORDER BY schemaname, tablename, cmd, policyname;

-- B3. Constraints recreated by this migration. Expected: 3 rows with the new value lists.
SELECT conrelid::regclass, conname, pg_get_constraintdef(oid)
  FROM pg_constraint
 WHERE conname IN ('app_notifications_type_check','user_roles_role_check','profiles_profile_visibility_check');

-- B4. Triggers that should be bound. Expected:
--   profiles: trg_guard_profile_privileged_fields, trg_sync_profile_avatar_fields
--   connection_requests / mentorship_requests / comments: one trigger each calling
--   notify_on_* (if any of these is missing, notifications are silently not created —
--   this migration replaces the functions but does not create those triggers)
--   auth.users: on_auth_user_created
SELECT t.tgrelid::regclass AS table_name, t.tgname, t.tgfoid::regproc AS function, t.tgenabled
  FROM pg_trigger t
 WHERE NOT t.tgisinternal
   AND (t.tgfoid::regproc::text IN ('notify_on_connection_request','notify_on_mentorship_request',
                                    'notify_on_comment','sync_profile_avatar_fields',
                                    'guard_profile_privileged_fields','handle_new_user')
        OR t.tgname = 'on_auth_user_created')
 ORDER BY 1, 2;

-- B5. Storage buckets. Expected: avatars public=t 5242880; verification-documents public=f 10485760.
SELECT id, public, file_size_limit, allowed_mime_types FROM storage.buckets
 WHERE id IN ('avatars','verification-documents');


-- ── C. DATA CONSISTENCY ────────────────────────────────────────────────────

-- C1. Expected: 0 / 0 / 0.
SELECT (SELECT count(*) FROM public.app_notifications WHERE link IS DISTINCT FROM action_url) AS notif_link_mismatch,
       (SELECT count(*) FROM public.profiles WHERE avatar_url IS DISTINCT FROM avatar_path)  AS avatar_mismatch,
       (SELECT count(*) FROM public.posts WHERE author_role IS NULL)                         AS posts_without_author_role;

-- C2. Super admins. Expected before provisioning: 0. After: exactly 1.
SELECT count(*) AS super_admins FROM public.user_roles WHERE role = 'super_admin';

-- C3. Seeds. Expected: 6 categories, 1 platform_settings row (pre-existing values untouched).
SELECT (SELECT count(*) FROM public.categories WHERE id IN
          ('general','clinical-cases','research','students','practice-management','events')) AS categories,
       (SELECT count(*) FROM public.platform_settings WHERE id = 'global')                   AS settings;


-- ── D. IMPERSONATION: profile visibility (no changes; ROLLBACK) ────────────

-- D1. Anonymous visitor. Expected: non_public = 0, base_table_rows = 0.
BEGIN;
  SELECT set_config('request.jwt.claims', '{"role":"anon"}', true);
  SET LOCAL ROLE anon;
  SELECT count(*) FILTER (WHERE profile_visibility <> 'public') AS non_public,
         count(*)                                               AS visible
    FROM public.profile_public_view;
  SELECT count(*) AS base_table_rows FROM public.profiles;   -- RLS: anon has no SELECT policy
ROLLBACK;

-- D2. Supabase anonymous sign-in (role authenticated, is_anonymous true).
-- Expected: members_only = 0, private = 0.
BEGIN;
  SELECT set_config('request.jwt.claims',
    '{"role":"authenticated","sub":"00000000-0000-0000-0000-000000000001","is_anonymous":true}', true);
  SET LOCAL ROLE authenticated;
  SELECT count(*) FILTER (WHERE profile_visibility = 'members_only') AS members_only,
         count(*) FILTER (WHERE profile_visibility = 'private')      AS private
    FROM public.profile_public_view;
ROLLBACK;

-- D3. Signed-in but NOT eligible (is_verified_member() = false).
-- Expected: members_only = 0, private = 0; own_rows_in_base_table = 1; other_rows = 0.
BEGIN;
  SELECT set_config('request.jwt.claims',
    '{"role":"authenticated","sub":"<UNVERIFIED_USER_ID>"}', true);
  SET LOCAL ROLE authenticated;
  SELECT public.is_verified_member() AS eligible;            -- expect false
  SELECT count(*) FILTER (WHERE profile_visibility = 'members_only') AS members_only,
         count(*) FILTER (WHERE profile_visibility = 'private')      AS private
    FROM public.profile_public_view;
  SELECT count(*) FILTER (WHERE id =  auth.uid()) AS own_rows_in_base_table,
         count(*) FILTER (WHERE id <> auth.uid()) AS other_rows
    FROM public.profiles;
ROLLBACK;

-- D4. Verified member. Expected: eligible = t, members_only > 0 (if any exist), private = 0,
-- suspended = 0, other_rows_in_base_table = 0.
BEGIN;
  SELECT set_config('request.jwt.claims',
    '{"role":"authenticated","sub":"<VERIFIED_MEMBER_ID>"}', true);
  SET LOCAL ROLE authenticated;
  SELECT public.is_verified_member() AS eligible;
  SELECT count(*) FILTER (WHERE v.profile_visibility = 'members_only') AS members_only,
         count(*) FILTER (WHERE v.profile_visibility = 'private')      AS private
    FROM public.profile_public_view v;
  SELECT count(*) FILTER (WHERE id <> auth.uid()) AS other_rows_in_base_table FROM public.profiles;
ROLLBACK;
-- Cross-check D4 suspended exclusion as postgres (expected: 0):
--   SELECT count(*) FROM public.profile_public_view v JOIN public.profiles p USING (id)
--    WHERE p.status = 'suspended';   -- run as postgres → postgres is not "admin" by JWT → 0


-- ── E. IMPERSONATION: privilege escalation must FAIL ───────────────────────
-- Run each block separately; each statement marked "expect ERROR" must error.

-- E1. User promotes themselves via profiles. Expect ERROR 42501 (guard trigger).
BEGIN;
  SELECT set_config('request.jwt.claims', '{"role":"authenticated","sub":"<UNVERIFIED_USER_ID>"}', true);
  SET LOCAL ROLE authenticated;
  UPDATE public.profiles SET verification_status = 'verified' WHERE id = auth.uid();  -- expect ERROR
ROLLBACK;

-- E2. Non-super admin grants super_admin. Expect ERROR (RLS WITH CHECK violation).
BEGIN;
  SELECT set_config('request.jwt.claims', '{"role":"authenticated","sub":"<ADMIN_NOT_SUPER_ID>"}', true);
  SET LOCAL ROLE authenticated;
  INSERT INTO public.user_roles (user_id, role) VALUES (auth.uid(), 'super_admin');    -- expect ERROR
ROLLBACK;

-- E3. Browser-role call of the review RPC. Expect ERROR: permission denied for function.
BEGIN;
  SELECT set_config('request.jwt.claims', '{"role":"authenticated","sub":"<ADMIN_USER_ID>"}', true);
  SET LOCAL ROLE authenticated;
  SELECT public.review_practitioner_application(gen_random_uuid(), 'verified', auth.uid());  -- expect ERROR
ROLLBACK;

-- E4. service_role with a NON-admin reviewer id. Expect ERROR 'reviewer is not an administrator'.
BEGIN;
  SELECT set_config('request.jwt.claims', '{"role":"service_role"}', true);
  SET LOCAL ROLE service_role;
  SELECT public.review_practitioner_application(gen_random_uuid(), 'verified', '<UNVERIFIED_USER_ID>'::uuid);
ROLLBACK;

-- E5. service_role + real admin + unknown application. Expect ERROR 'Application not found' (P0002).
-- Proves the service_role → in-DB admin re-check path works end to end.
BEGIN;
  SELECT set_config('request.jwt.claims', '{"role":"service_role"}', true);
  SET LOCAL ROLE service_role;
  SELECT public.review_practitioner_application(gen_random_uuid(), 'verified', '<ADMIN_USER_ID>'::uuid);
ROLLBACK;

-- E6. Provisioning from API roles. Expect ERROR: permission denied for procedure (each role).
BEGIN;
  SET LOCAL ROLE service_role;
  CALL public.provision_first_super_admin('someone@example.com');   -- expect ERROR
ROLLBACK;

-- E7. Guest INSERT cannot pre-approve itself. Expect ERROR (RLS WITH CHECK).
-- Adjust the column list to your table's NOT NULL columns if needed.
BEGIN;
  SELECT set_config('request.jwt.claims', '{"role":"anon"}', true);
  SET LOCAL ROLE anon;
  INSERT INTO public.practitioner_applications (email, full_name, status)
  VALUES ('probe@example.com', 'Probe', 'verified');                 -- expect ERROR
ROLLBACK;


-- ── F. GUEST STATUS LOOKUP ─────────────────────────────────────────────────
-- F1. Wrong email for a real guest application id. Expected: 0 rows.
BEGIN;
  SET LOCAL ROLE anon;
  SELECT * FROM public.lookup_guest_application_status('<GUEST_APPLICATION_ID>'::uuid, 'wrong@example.com');
ROLLBACK;


-- ── G. PROVISIONING (only when you are ready to create the first super admin) ──
-- As postgres in the SQL Editor. NOT part of verification; listed for completeness.
--   CALL public.provision_first_super_admin('admin@yourdomain.com');
--   -- Expected NOTICE: Super admin provisioned: user_id=… email=…
--   -- Re-running must fail with 'Super admin already initialized'.
--   SELECT role FROM public.user_roles
--    WHERE user_id = (SELECT id FROM auth.users WHERE lower(email) = 'admin@yourdomain.com');
--   -- Expected: admin, super_admin (plus their signup role)


-- ── H. OUTSIDE SQL ─────────────────────────────────────────────────────────
-- H1. Dashboard → Advisors → Security Advisor: no new ERROR-level lints
--     (in particular no "security_definer_view" for profile_public_view).
-- H2. Edge Function (see docs/MIGRATION_RUNBOOK.md §4 for curl commands):
--     no token → 401; non-admin token → 403; admin token + bad UUID → 400;
--     admin token + real application → 200 and a new verification_reviews row.
-- H3. Search the frontend bundle for the service-role key (must find nothing):
--     grep -rE "service_role|SERVICE_ROLE|sb_secret_" dist/ build/ .next/ src/
