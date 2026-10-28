-- ==============================================================================
-- Homeo Circle India — Schema Harmonization & Backend Security Fixes
-- Migration: 20261028000000_schema_harmonization.sql   (revision 2)
--
-- Idempotent, non-destructive to row data, and atomic when executed as a single
-- transaction (see "TRANSACTION BEHAVIOUR" below and docs/MIGRATION_RUNBOOK.md).
--
-- STATUS: NOT PRODUCTION-READY until docs/verification_queries.sql passes on a
-- staging copy (Supabase branch or backup restored into a scratch project).
--
-- CHANGE SUMMARY
--   § 0  Preflight. Collects every problem, then fails once with the full list:
--        server version, roles, tables, columns, column types/nullability,
--        unique indexes needed by ON CONFLICT, CHECK compatibility + text types for every
--        value this migration writes, helper-function signatures + SECURITY
--        DEFINER + pinned search_path, object ownership, trigger dependencies,
--        view dependents, and historical-data audits for tightened constraints.
--   § 1  app_notifications: missing columns, link/action_url backfill, 10-type CHECK.
--   § 2  user_roles: widened role CHECK; RLS; admins may manage only
--        non-privileged roles; only super_admins may grant/revoke admin/super_admin.
--   § 3  practitioner_applications: 4 RLS policies (INSERT can no longer self-set
--        a decision); guest status RPC (dual-factor, minimal projection, casts).
--   § 4  profiles: avatar_url + sync trigger; privileged-column guard trigger;
--        visibility CHECK; broad SELECT policy dropped; own-row policy; post-drop
--        assertion that no other permissive SELECT policy remains;
--        profile_public_view = security_invoker view over a definer function in a
--        non-API schema (app_private) that encodes the visibility rules.
--   § 5  Column harmonization: posts, mentorship_requests, events,
--        knowledge_posts, opportunities, reports.
--   § 6  Notification trigger functions: synchronized link + action_url.
--   § 7  review_practitioner_application: 5-arg version DROPPED; 6-arg version
--        takes p_reviewer_id, is executable by service_role ONLY, requires a
--        service_role JWT, and re-verifies the reviewer's admin role in-DB.
--        Called exclusively from the review-practitioner-application Edge Function.
--   § 8  Storage buckets + 8 named policies (explicit WITH CHECK on UPDATE).
--   § 9  Seed data (categories upsert; platform_settings DO NOTHING).
--   §10  bootstrap_super_admin dropped; provision_first_super_admin(text)
--        SECURITY INVOKER procedure with transaction-level advisory lock + table
--        lock, exactly-one-user and exactly-one-profile checks.
--   §11  In-migration privilege/config assertions (rolls everything back if any
--        grant or view option is wrong).
--
-- TRANSACTION BEHAVIOUR
--   * Supabase SQL Editor: the whole script is sent as ONE multi-statement query.
--     PostgreSQL runs a multi-statement simple query as a single implicit
--     transaction, so any error (including a preflight RAISE) rolls back every
--     statement before it. Do NOT add BEGIN/COMMIT: an explicit BEGIN in a
--     multi-statement query turns the implicit transaction into a regular block
--     that is left open in an aborted state on error.
--   * psql: `psql "$DB_URL" -X -1 -v ON_ERROR_STOP=1 -f <this file>` (-1 = single transaction).
--   * Supabase CLI (`supabase db push` / `migration up`): the file runs inside the
--     CLI's own transaction, together with the schema_migrations bookkeeping row.
--   * Nothing in this file is disallowed inside a transaction block
--     (no CONCURRENTLY, VACUUM, or ALTER TYPE ... ADD VALUE).
--   * SET LOCAL below bounds lock waits so the migration fails fast instead of
--     queueing ACCESS EXCLUSIVE locks behind long-running app queries.
-- ==============================================================================

SET LOCAL lock_timeout = '10s';
SET LOCAL statement_timeout = '5min';

-- ------------------------------------------------------------------------------
-- 0. PREFLIGHT
-- ------------------------------------------------------------------------------
DO $preflight$
DECLARE
  v_problems text[] := ARRAY[]::text[];
  r          record;
  v_val      text;
  v_def      text;
  v_cnt      bigint;
  v_list     text;
BEGIN
  -- 0.1 Server version (security_invoker views need PostgreSQL 15+)
  IF current_setting('server_version_num')::int < 150000 THEN
    v_problems := v_problems || format('PostgreSQL >= 15 required for security_invoker views (found %s)',
                                       current_setting('server_version'));
  END IF;

  -- 0.2 Roles
  FOR r IN SELECT unnest(ARRAY['anon','authenticated','service_role','postgres']) AS rolname LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = r.rolname) THEN
      v_problems := v_problems || format('role %s', r.rolname);
    END IF;
  END LOOP;

  -- 0.3 Tables
  FOR r IN
    SELECT split_part(t, '.', 1) AS s, split_part(t, '.', 2) AS n
    FROM unnest(ARRAY[
      'public.profiles','public.user_roles','public.practitioner_applications',
      'public.verification_reviews','public.app_notifications','public.posts',
      'public.comments','public.connection_requests','public.mentorship_requests',
      'public.events','public.knowledge_posts','public.opportunities','public.reports',
      'public.categories','public.platform_settings','public.admin_audit_logs',
      'storage.buckets','storage.objects','auth.users'
    ]) AS t
  LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
                   WHERE n.nspname = r.s AND c.relname = r.n AND c.relkind IN ('r','p')) THEN
      v_problems := v_problems || format('table %I.%I', r.s, r.n);
    END IF;
  END LOOP;

  -- 0.4 Columns referenced anywhere in this migration (DML, policies, functions, view)
  FOR r IN
    SELECT split_part(c, '.', 1) AS s, split_part(c, '.', 2) AS t, split_part(c, '.', 3) AS col
    FROM unnest(ARRAY[
      -- profiles
      'public.profiles.id','public.profiles.avatar_path','public.profiles.profile_visibility',
      'public.profiles.role','public.profiles.status','public.profiles.verification_status',
      'public.profiles.display_name','public.profiles.full_name','public.profiles.specialization',
      'public.profiles.location','public.profiles.bio','public.profiles.years_of_practice',
      'public.profiles.created_at','public.profiles.updated_at',
      -- user_roles
      'public.user_roles.user_id','public.user_roles.role',
      -- practitioner_applications (policies, guest RPC, review RPC)
      'public.practitioner_applications.id','public.practitioner_applications.user_id',
      'public.practitioner_applications.email','public.practitioner_applications.status',
      'public.practitioner_applications.full_name','public.practitioner_applications.qualification',
      'public.practitioner_applications.registration_number',
      'public.practitioner_applications.registration_authority',
      'public.practitioner_applications.submitted_at','public.practitioner_applications.decision_reason',
      'public.practitioner_applications.reviewed_at','public.practitioner_applications.reviewed_by',
      'public.practitioner_applications.verification_source',
      'public.practitioner_applications.verification_checked_at',
      'public.practitioner_applications.internal_notes',
      -- verification_reviews
      'public.verification_reviews.application_id','public.verification_reviews.reviewer_id',
      'public.verification_reviews.reviewer_name','public.verification_reviews.previous_status',
      'public.verification_reviews.new_status','public.verification_reviews.decision_reason',
      'public.verification_reviews.verification_source','public.verification_reviews.internal_notes',
      -- admin_audit_logs
      'public.admin_audit_logs.actor_id','public.admin_audit_logs.actor_name',
      'public.admin_audit_logs.action','public.admin_audit_logs.target_type',
      'public.admin_audit_logs.target_id','public.admin_audit_logs.metadata',
      -- app_notifications (link/action_id/action_status/metadata are added below if absent)
      'public.app_notifications.user_id','public.app_notifications.sender_id',
      'public.app_notifications.type','public.app_notifications.title',
      'public.app_notifications.message','public.app_notifications.action_url',
      -- trigger sources
      'public.posts.id','public.posts.author_id',
      'public.comments.id','public.comments.post_id','public.comments.author_id',
      'public.connection_requests.id','public.connection_requests.sender_id',
      'public.connection_requests.recipient_id','public.connection_requests.status',
      'public.mentorship_requests.id','public.mentorship_requests.student_id',
      'public.mentorship_requests.mentor_id','public.mentorship_requests.status',
      -- harmonization targets
      'public.opportunities.deadline','public.reports.reporter_id',
      -- seeds
      'public.categories.id','public.categories.name','public.categories.slug',
      'public.categories.type','public.categories.badge_color','public.categories.active',
      'public.platform_settings.id','public.platform_settings.require_doctor_verification',
      'public.platform_settings.require_researcher_verification',
      'public.platform_settings.require_student_verification',
      'public.platform_settings.allow_student_mentorship_requests',
      'public.platform_settings.auto_appeal_enabled',
      -- storage / auth
      'storage.buckets.id','storage.buckets.name','storage.buckets.public',
      'storage.buckets.file_size_limit','storage.buckets.allowed_mime_types',
      'storage.objects.bucket_id','storage.objects.name',
      'auth.users.id','auth.users.email'
    ]) AS c
  LOOP
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = r.s AND table_name = r.t AND column_name = r.col) THEN
      v_problems := v_problems || format('column %I.%I.%I', r.s, r.t, r.col);
    END IF;
  END LOOP;

  -- 0.5 Column types / nullability that the code below depends on
  FOR r IN
    SELECT * FROM (VALUES
      ('profiles','id',                     ARRAY['uuid']),
      ('profiles','years_of_practice',      ARRAY['smallint','integer','bigint']),
      ('user_roles','user_id',              ARRAY['uuid']),
      ('practitioner_applications','id',    ARRAY['uuid']),
      ('practitioner_applications','user_id',ARRAY['uuid']),
      ('verification_reviews','reviewer_id',ARRAY['uuid']),
      ('admin_audit_logs','actor_id',       ARRAY['text','character varying']),
      ('admin_audit_logs','target_id',      ARRAY['text','character varying']),
      ('admin_audit_logs','metadata',       ARRAY['jsonb']),
      ('app_notifications','action_id',     ARRAY['text','character varying']),
      ('app_notifications','link',          ARRAY['text','character varying']),
      ('app_notifications','metadata',      ARRAY['jsonb']),
      -- written from text expressions; enum/domain types would need explicit casts
      ('profiles','role',                   ARRAY['text','character varying']),
      ('profiles','status',                 ARRAY['text','character varying']),
      ('profiles','verification_status',    ARRAY['text','character varying']),
      ('profiles','profile_visibility',     ARRAY['text','character varying']),
      ('user_roles','role',                 ARRAY['text','character varying']),
      ('practitioner_applications','status',ARRAY['text','character varying']),
      ('app_notifications','type',          ARRAY['text','character varying'])
    ) AS v(tbl, col, allowed)
  LOOP
    SELECT data_type INTO v_def FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = r.tbl AND column_name = r.col;
    -- NULL = column absent: either reported in 0.4 or added later with the right type
    IF v_def IS NOT NULL AND NOT (v_def = ANY (r.allowed)) THEN
      v_problems := v_problems || format('column public.%I.%I has type %s; expected one of %s',
                                         r.tbl, r.col, v_def, array_to_string(r.allowed, '/'));
    END IF;
  END LOOP;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'admin_audit_logs'
               AND column_name = 'actor_id' AND is_nullable = 'NO') THEN
    v_problems := v_problems || text 'public.admin_audit_logs.actor_id is NOT NULL; provision_first_super_admin logs actor_id = NULL';
  END IF;

  -- 0.6 Unique indexes required by ON CONFLICT targets (non-partial, exact column set)
  FOR r IN
    SELECT * FROM (VALUES
      ('public.user_roles',        ARRAY['role','user_id']),
      ('public.categories',        ARRAY['id']),
      ('public.platform_settings', ARRAY['id']),
      ('storage.buckets',          ARRAY['id'])
    ) AS v(tbl, cols)
  LOOP
    IF to_regclass(r.tbl) IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM pg_index i
      WHERE i.indrelid = to_regclass(r.tbl) AND i.indisunique AND i.indpred IS NULL
        AND (SELECT array_agg(a.attname::text ORDER BY a.attname)
               FROM pg_attribute a
              WHERE a.attrelid = i.indrelid AND a.attnum = ANY (i.indkey)) = r.cols
    ) THEN
      v_problems := v_problems || format('unique index on %s(%s) required by ON CONFLICT',
                                         r.tbl, array_to_string(r.cols, ','));
    END IF;
  END LOOP;

  -- 0.7 Existing single-column CHECK constraints must accept every
  --     value this migration (or its functions) will write. Constraints that this
  --     migration itself drops and recreates are excluded.
  FOR r IN
    SELECT * FROM (VALUES
      ('profiles','role',                   ARRAY['super_admin','admin']),
      ('profiles','status',                 ARRAY['pending_review','needs_information','verified','declined','suspended']),
      ('profiles','verification_status',    ARRAY['verified','rejected','pending']),
      ('practitioner_applications','status',ARRAY['pending_review','needs_information','verified','declined','suspended']),
      ('verification_reviews','new_status', ARRAY['pending_review','needs_information','verified','declined','suspended']),
      ('app_notifications','action_status', ARRAY['pending','accepted','declined']),
      ('admin_audit_logs','action',         ARRAY['APPLICATION_REVIEWED','SUPER_ADMIN_PROVISIONED']),
      ('admin_audit_logs','target_type',    ARRAY['practitioner_application','profile'])
    ) AS v(tbl, col, vals)
  LOOP
    CONTINUE WHEN to_regclass(format('public.%I', r.tbl)) IS NULL;  -- reported in 0.3
    -- CHECK constraints that reference only this column
    FOR v_def IN
      SELECT pg_get_constraintdef(con.oid)
        FROM pg_constraint con
        JOIN pg_attribute a ON a.attrelid = con.conrelid AND a.attname = r.col
       WHERE con.conrelid = format('public.%I', r.tbl)::regclass
         AND con.contype = 'c'
         AND con.conkey = ARRAY[a.attnum]
         AND con.conname NOT IN ('app_notifications_type_check','user_roles_role_check',
                                 'profiles_profile_visibility_check')
    LOOP
      FOREACH v_val IN ARRAY r.vals LOOP
        IF position(quote_literal(v_val) IN v_def) = 0 THEN
          v_problems := v_problems || format('CHECK on public.%I.%I does not allow %L (%s)',
                                             r.tbl, r.col, v_val, v_def);
        END IF;
      END LOOP;
    END LOOP;
  END LOOP;

  -- 0.8 Function signatures. Helper functions used inside RLS policies must be
  --     SECURITY DEFINER (otherwise user_roles/profiles policies recurse) and must
  --     pin search_path.
  FOR r IN
    SELECT * FROM (VALUES
      ('public','is_admin',           0, 'boolean', true),
      ('public','is_super_admin',     0, 'boolean', true),
      ('public','is_verified_member', 0, 'boolean', true),
      ('public','handle_new_user',    0, 'trigger', false),
      ('auth',  'uid',                0, 'uuid',    false),
      ('auth',  'jwt',                0, 'jsonb',   false),
      ('storage','foldername',        1, 'text[]',  false)
    ) AS v(s, fn, nargs, ret, must_be_definer)
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = r.s AND p.proname = r.fn AND p.pronargs = r.nargs
        AND pg_get_function_result(p.oid) = r.ret
    ) THEN
      v_problems := v_problems || format('function %I.%I with %s args returning %s', r.s, r.fn, r.nargs, r.ret);
    ELSIF r.must_be_definer AND NOT EXISTS (
      SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = r.s AND p.proname = r.fn AND p.pronargs = r.nargs
        AND p.prosecdef
        AND EXISTS (SELECT 1 FROM unnest(coalesce(p.proconfig, '{}')) cfg WHERE cfg LIKE 'search_path=%')
    ) THEN
      v_problems := v_problems || format('function %I.%I() must be SECURITY DEFINER with SET search_path (used in RLS policies)', r.s, r.fn);
    END IF;
  END LOOP;

  -- review_practitioner_application: the 5-arg version (pre-migration) or the
  -- 6-arg version (re-run) must exist; anything else means an unknown state.
  IF to_regprocedure('public.review_practitioner_application(uuid,text,text,text,text)') IS NULL
     AND to_regprocedure('public.review_practitioner_application(uuid,text,uuid,text,text,text)') IS NULL THEN
    v_problems := v_problems || text 'function public.review_practitioner_application (5-arg original or 6-arg revision)';
  END IF;

  -- 0.9 Ownership: every object this migration replaces/alters must be owned by a
  --     role the executing user belongs to, or CREATE OR REPLACE / ALTER will fail.
  FOR r IN
    SELECT p.oid::regprocedure::text AS obj, p.proowner AS owner
      FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public'
       AND p.proname IN ('lookup_guest_application_status','sync_profile_avatar_fields',
                         'guard_profile_privileged_fields','get_public_profiles',
                         'notify_on_connection_request','notify_on_mentorship_request',
                         'notify_on_comment','review_practitioner_application',
                         'bootstrap_super_admin','provision_first_super_admin')
    UNION ALL
    SELECT c.oid::regclass::text, c.relowner
      FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public'
       AND c.relname IN ('profiles','user_roles','practitioner_applications','app_notifications',
                         'posts','mentorship_requests','events','knowledge_posts','opportunities',
                         'reports','profile_public_view')
  LOOP
    IF NOT pg_has_role(current_user, r.owner, 'USAGE') THEN
      v_problems := v_problems || format('%s is owned by %s, not by %s', r.obj, r.owner::regrole, current_user);
    END IF;
  END LOOP;

  -- 0.10 Trigger dependency
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'auth' AND c.relname = 'users' AND t.tgname = 'on_auth_user_created'
  ) THEN
    v_problems := v_problems || text 'trigger on_auth_user_created on auth.users';
  END IF;

  -- 0.11 View / function dependents that would block the DROPs in § 4
  IF to_regclass('public.profile_public_view') IS NOT NULL THEN
    IF (SELECT relkind FROM pg_class WHERE oid = to_regclass('public.profile_public_view')) <> 'v' THEN
      v_problems := v_problems || text 'public.profile_public_view exists but is not a view';
    END IF;
    SELECT string_agg(DISTINCT dep.ev_class::regclass::text, ', ') INTO v_list
      FROM pg_depend d JOIN pg_rewrite dep ON dep.oid = d.objid
     WHERE d.classid = 'pg_rewrite'::regclass
       AND d.refobjid = to_regclass('public.profile_public_view')
       AND dep.ev_class <> to_regclass('public.profile_public_view');
    IF v_list IS NOT NULL THEN
      v_problems := v_problems || format('views depend on public.profile_public_view: %s', v_list);
    END IF;
  END IF;
  IF to_regprocedure('public.get_public_profiles()') IS NOT NULL THEN
    SELECT string_agg(DISTINCT pg_describe_object(d.classid, d.objid, d.objsubid), ', ') INTO v_list
      FROM pg_depend d
     WHERE d.refobjid = to_regprocedure('public.get_public_profiles()') AND d.deptype = 'n';
    IF v_list IS NOT NULL THEN
      v_problems := v_problems || format('objects depend on public.get_public_profiles(): %s', v_list);
    END IF;
  END IF;

  -- 0.12 Historical-data audits for constraints tightened below (never mutate silently)
  IF to_regclass('public.app_notifications') IS NOT NULL THEN
    SELECT string_agg(t || ' (' || n || ')', ', '), coalesce(sum(n), 0) INTO v_list, v_cnt
      FROM (SELECT coalesce(type, 'NULL') AS t, count(*) AS n
              FROM public.app_notifications
             WHERE type IS NULL OR type NOT IN (
               'connection_request','connection_accepted','mentorship_request',
               'mentorship_accepted','comment_reply','discussion_reply','event_reminder',
               'system_notice','verification_update','system')
             GROUP BY 1) s;
    IF v_cnt > 0 THEN
      v_problems := v_problems || format('%s app_notifications rows with unsupported type: %s', v_cnt, v_list);
    END IF;
  END IF;

  IF to_regclass('public.user_roles') IS NOT NULL THEN
    SELECT string_agg(t || ' (' || n || ')', ', '), coalesce(sum(n), 0) INTO v_list, v_cnt
      FROM (SELECT coalesce(role::text, 'NULL') AS t, count(*) AS n
              FROM public.user_roles
             WHERE role IS NULL OR role::text NOT IN
               ('member','doctor','student','researcher','moderator','admin','super_admin')
             GROUP BY 1) s;
    IF v_cnt > 0 THEN
      v_problems := v_problems || format('%s user_roles rows with unsupported role: %s', v_cnt, v_list);
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public'
               AND table_name = 'profiles' AND column_name = 'profile_visibility') THEN
    SELECT string_agg(t || ' (' || n || ')', ', '), coalesce(sum(n), 0) INTO v_list, v_cnt
      FROM (SELECT coalesce(profile_visibility::text, 'NULL') AS t, count(*) AS n
              FROM public.profiles
             WHERE profile_visibility::text NOT IN ('members_only','private','public')
             GROUP BY 1) s;   -- NULL passes a CHECK, so it is not flagged
    IF v_cnt > 0 THEN
      v_problems := v_problems || format('%s profiles rows with unsupported profile_visibility: %s', v_cnt, v_list);
    END IF;
  END IF;

  IF to_regclass('public.categories') IS NOT NULL THEN
    SELECT string_agg(format('%s (existing id %s)', c.slug, c.id), ', ') INTO v_list
      FROM public.categories c
      JOIN (VALUES ('general'),('clinical-cases'),('research'),('students'),
                   ('practice-management'),('events')) s(slug) ON s.slug = c.slug
     WHERE c.id::text <> s.slug;
    IF v_list IS NOT NULL THEN
      v_problems := v_problems || format('category slug already used by a different id: %s', v_list);
    END IF;
  END IF;

  IF array_length(v_problems, 1) > 0 THEN
    RAISE EXCEPTION E'PREFLIGHT FAILED for 20261028000000_schema_harmonization (nothing was changed).\n  - %',
      array_to_string(v_problems, E'\n  - ')
      USING HINT = 'Resolve each item, then re-run. Earlier migrations 20261022000000, 20261024000000 and 20261027000000 must already be applied.';
  END IF;
END
$preflight$;

-- ------------------------------------------------------------------------------
-- 1. NOTIFICATIONS
-- ------------------------------------------------------------------------------
ALTER TABLE public.app_notifications
  ADD COLUMN IF NOT EXISTS link          text,
  ADD COLUMN IF NOT EXISTS action_id     text,
  ADD COLUMN IF NOT EXISTS action_status text,
  ADD COLUMN IF NOT EXISTS metadata      jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Both SET expressions read the pre-update row, so this is a symmetric backfill.
UPDATE public.app_notifications
   SET link       = COALESCE(link, action_url),
       action_url = COALESCE(action_url, link)
 WHERE link IS NULL OR action_url IS NULL;

-- Historical types were audited in § 0.12.
ALTER TABLE public.app_notifications DROP CONSTRAINT IF EXISTS app_notifications_type_check;
ALTER TABLE public.app_notifications
  ADD CONSTRAINT app_notifications_type_check
  CHECK (type IN (
    'connection_request','connection_accepted','mentorship_request','mentorship_accepted',
    'comment_reply','discussion_reply','event_reminder','system_notice',
    'verification_update','system'
  ));

-- ------------------------------------------------------------------------------
-- 2. USER ROLES
-- ------------------------------------------------------------------------------
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;
ALTER TABLE public.user_roles
  ADD CONSTRAINT user_roles_role_check
  CHECK (role IN ('member','doctor','student','researcher','moderator','admin','super_admin'));

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()) OR (SELECT public.is_admin()));

-- Previously: FOR ALL USING (is_admin()) — let any admin grant themselves or
-- anyone else super_admin. Now admins manage only non-privileged roles; only a
-- super_admin may insert/update/delete 'admin' or 'super_admin' rows.
-- USING guards the existing row, WITH CHECK guards the new row (covers UPDATE
-- that tries to rewrite role 'member' -> 'super_admin').
DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;
CREATE POLICY "Admins can manage user roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (
    (SELECT public.is_super_admin())
    OR ((SELECT public.is_admin()) AND role NOT IN ('admin','super_admin'))
  )
  WITH CHECK (
    (SELECT public.is_super_admin())
    OR ((SELECT public.is_admin()) AND role NOT IN ('admin','super_admin'))
  );

-- ------------------------------------------------------------------------------
-- 3. PRACTITIONER APPLICATIONS
-- ------------------------------------------------------------------------------
ALTER TABLE public.practitioner_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Applicants can read own application" ON public.practitioner_applications;
CREATE POLICY "Applicants can read own application"
  ON public.practitioner_applications FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()) OR (SELECT public.is_admin()));

-- Guests (anon, user_id NULL) and signed-in users (own user_id) may apply, but
-- an INSERT can no longer pre-set a decision or reviewer fields.
DROP POLICY IF EXISTS "Applicants can insert own application" ON public.practitioner_applications;
CREATE POLICY "Applicants can insert own application"
  ON public.practitioner_applications FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    (
      ((SELECT auth.uid()) IS NOT NULL AND user_id = (SELECT auth.uid()))
      OR ((SELECT auth.uid()) IS NULL AND user_id IS NULL)
    )
    AND (status IS NULL OR status NOT IN ('verified','declined','suspended'))
    AND reviewed_at IS NULL
    AND reviewed_by IS NULL
    AND decision_reason IS NULL
    AND verification_source IS NULL
    AND verification_checked_at IS NULL
    AND internal_notes IS NULL
  );

DROP POLICY IF EXISTS "Only admins can update applications" ON public.practitioner_applications;
CREATE POLICY "Only admins can update applications"
  ON public.practitioner_applications FOR UPDATE
  TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "Only admins can delete applications" ON public.practitioner_applications;
CREATE POLICY "Only admins can delete applications"
  ON public.practitioner_applications FOR DELETE
  TO authenticated
  USING ((SELECT public.is_admin()));

-- Guest status lookup: requires exact UUID + normalized email, guest rows only,
-- 8 display columns. Explicit casts keep RETURN QUERY valid if a column is
-- varchar/enum. DROP first because CREATE OR REPLACE cannot change OUT columns.
-- Rate-limit at the edge (<= 10 req/min/IP).
DROP FUNCTION IF EXISTS public.lookup_guest_application_status(uuid, text);
CREATE FUNCTION public.lookup_guest_application_status(
  p_application_id uuid,
  p_email          text
)
RETURNS TABLE (
  id                     uuid,
  status                 text,
  full_name              text,
  qualification          text,
  registration_number    text,
  registration_authority text,
  submitted_at           timestamptz,
  decision_reason        text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF p_application_id IS NULL OR p_email IS NULL OR length(trim(p_email)) = 0 THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT pa.id,
         pa.status::text,
         pa.full_name::text,
         pa.qualification::text,
         pa.registration_number::text,
         pa.registration_authority::text,
         pa.submitted_at::timestamptz,
         pa.decision_reason::text
    FROM public.practitioner_applications pa
   WHERE pa.id = p_application_id
     AND lower(trim(pa.email)) = lower(trim(p_email))
     AND pa.user_id IS NULL
   LIMIT 1;
END;
$$;

-- New functions in Supabase's public schema get EXECUTE for anon/authenticated
-- via ALTER DEFAULT PRIVILEGES, not just via PUBLIC — so revoke both explicitly.
REVOKE ALL ON FUNCTION public.lookup_guest_application_status(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.lookup_guest_application_status(uuid, text) TO anon, authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 4. PROFILES
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;

UPDATE public.profiles
   SET avatar_url  = COALESCE(avatar_url, avatar_path),
       avatar_path = COALESCE(avatar_path, avatar_url)
 WHERE avatar_url IS NULL OR avatar_path IS NULL;

CREATE OR REPLACE FUNCTION public.sync_profile_avatar_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.avatar_url IS NOT NULL AND NEW.avatar_path IS NULL THEN
      NEW.avatar_path := NEW.avatar_url;
    ELSIF NEW.avatar_path IS NOT NULL AND NEW.avatar_url IS NULL THEN
      NEW.avatar_url := NEW.avatar_path;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.avatar_url IS DISTINCT FROM OLD.avatar_url
       AND NEW.avatar_path IS NOT DISTINCT FROM OLD.avatar_path THEN
      NEW.avatar_path := NEW.avatar_url;
    ELSIF NEW.avatar_path IS DISTINCT FROM OLD.avatar_path
       AND NEW.avatar_url IS NOT DISTINCT FROM OLD.avatar_url THEN
      NEW.avatar_url := NEW.avatar_path;
    ELSIF NEW.avatar_url IS DISTINCT FROM NEW.avatar_path THEN
      -- Both changed to conflicting values: avatar_url wins unless it is NULL
      IF NEW.avatar_url IS NOT NULL THEN
        NEW.avatar_path := NEW.avatar_url;
      ELSE
        NEW.avatar_url := NEW.avatar_path;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.sync_profile_avatar_fields() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_sync_profile_avatar_fields ON public.profiles;
CREATE TRIGGER trg_sync_profile_avatar_fields
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_avatar_fields();

-- Privileged-column guard. The preserved INSERT/UPDATE policies from
-- 20261022000000 allow a user to write their own row; without this trigger a
-- user could PATCH their own role/status/verification_status to admin/verified.
-- Applies only to requests running as the API roles (anon/authenticated).
-- SECURITY DEFINER functions (review RPC, handle_new_user), service_role and
-- the SQL Editor run as other roles and are unaffected.
CREATE OR REPLACE FUNCTION public.guard_profile_privileged_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF current_user NOT IN ('anon', 'authenticated') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF (NEW.role IN ('moderator','admin','super_admin')
        OR NEW.status = 'verified'
        OR NEW.verification_status = 'verified')
       AND NOT public.is_admin() THEN
      RAISE EXCEPTION 'Not allowed to create a profile with a privileged role or verified status.'
        USING ERRCODE = '42501';
    END IF;
    IF NEW.role IN ('admin','super_admin') AND NOT public.is_super_admin() THEN
      RAISE EXCEPTION 'Only a super admin can assign admin roles.' USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
  END IF;

  -- UPDATE
  IF (NEW.role IS DISTINCT FROM OLD.role
      OR NEW.status IS DISTINCT FROM OLD.status
      OR NEW.verification_status IS DISTINCT FROM OLD.verification_status)
     AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only administrators can change role, status or verification_status.'
      USING ERRCODE = '42501';
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role
     AND (NEW.role IN ('admin','super_admin') OR OLD.role IN ('admin','super_admin'))
     AND NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Only a super admin can grant or remove admin roles.' USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.guard_profile_privileged_fields() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_guard_profile_privileged_fields ON public.profiles;
CREATE TRIGGER trg_guard_profile_privileged_fields
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_profile_privileged_fields();

-- Visibility values audited in § 0.12.
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_profile_visibility_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_profile_visibility_check
  CHECK (profile_visibility IN ('members_only','private','public'));

-- ── Profile RLS ─────────────────────────────────────────────────────────────
-- "Profiles viewable by verified members only" (20261022000000) let verified
-- members SELECT every column (email, phone, clinic address …) of every row.
-- Permissive policies are OR-combined, so it must be removed, not supplemented.
DROP POLICY IF EXISTS "Profiles viewable by verified members only" ON public.profiles;

DROP POLICY IF EXISTS "Users can view own profile row" ON public.profiles;
CREATE POLICY "Users can view own profile row"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = (SELECT auth.uid()) OR (SELECT public.is_admin()));

-- Fail if any OTHER permissive SELECT/ALL policy on profiles survives (an
-- unknown policy would silently re-open full-row access). Admin-only policies
-- are tolerated.
DO $assert_profiles_rls$
DECLARE
  v_list text;
BEGIN
  SELECT string_agg(format('%I (%s: %s)', policyname, cmd, coalesce(qual, 'true')), '; ')
    INTO v_list
    FROM pg_policies
   WHERE schemaname = 'public' AND tablename = 'profiles'
     AND permissive = 'PERMISSIVE'
     AND cmd IN ('SELECT', 'ALL')
     AND policyname <> 'Users can view own profile row'
     AND coalesce(qual, '') !~ '^[(\s]*(SELECT\s+)?(public\.)?is_(super_)?admin\(\)(\s+AS\s+is_(super_)?admin)?[)\s]*$';
  IF v_list IS NOT NULL THEN
    RAISE EXCEPTION 'Unexpected permissive SELECT policies on public.profiles would expose full rows: %', v_list
      USING HINT = 'Drop or narrow them (or add them to this allowlist after review), then re-run.';
  END IF;
END
$assert_profiles_rls$;

-- ── Profile discovery: profile_public_view ─────────────────────────────────
-- VERIFIED BEHAVIOUR OF VIEWS AND RLS:
--   A view WITHOUT security_invoker reads its base tables with the VIEW OWNER's
--   privileges. The owner here is `postgres`, which owns public.profiles (table
--   owners are exempt from RLS unless FORCE ROW LEVEL SECURITY) and has
--   BYPASSRLS on Supabase. So a plain view bypasses the profiles RLS entirely
--   and its WHERE clause becomes the only access control — anything it omits
--   (e.g. checking the caller is signed in) leaks to anon.
--
-- DESIGN:
--   * app_private.public_profiles(): SECURITY DEFINER function, the single
--     explicit security boundary. It returns only safe columns and filters rows
--     from the caller's JWT. app_private is not in PostgREST's exposed schemas,
--     so it cannot be called directly over the API.
--   * public.profile_public_view: WITH (security_invoker = true) — the view
--     itself never borrows owner privileges; callers need EXECUTE on the
--     function, which is granted deliberately. security_barrier stops
--     caller-supplied predicates from being evaluated before the view's own.
--
-- ROW RULES (non-admin callers never see suspended accounts):
--   anon / anonymous-sign-in users  → profile_visibility = 'public'
--   authenticated + is_verified_member() → 'public' + 'members_only'
--   authenticated, not eligible      → 'public'
--   admin                            → all rows
--   'private' rows                   → admins only
--
-- NOTE: filters on the view (e.g. ?id=eq.X) are applied after the function
-- returns, and PostgREST cannot embed this view from posts/comments (no FK).
-- Fine at MVP scale; see runbook for the computed-relationship follow-up.
CREATE SCHEMA IF NOT EXISTS app_private;
REVOKE ALL ON SCHEMA app_private FROM PUBLIC;
GRANT USAGE ON SCHEMA app_private TO anon, authenticated, service_role;

DROP VIEW IF EXISTS public.profile_public_view;
DROP FUNCTION IF EXISTS public.get_public_profiles();
DROP FUNCTION IF EXISTS app_private.public_profiles();

CREATE FUNCTION app_private.public_profiles()
RETURNS TABLE (
  id                  uuid,
  display_name        text,
  full_name           text,
  role                text,
  specialization      text,
  location            text,
  bio                 text,
  avatar_url          text,
  years_of_practice   int,
  profile_visibility  text,
  verification_status text,
  created_at          timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_claims        jsonb   := coalesce(auth.jwt(), '{}'::jsonb);
  v_uid           uuid    := auth.uid();
  v_is_signed_in  boolean;
  v_is_admin      boolean := false;
  v_is_member     boolean := false;
BEGIN
  -- Signed-in = a real authenticated user, not anon and not an anonymous sign-in.
  v_is_signed_in := v_uid IS NOT NULL
                AND coalesce(v_claims ->> 'role', '') = 'authenticated'
                AND coalesce((v_claims ->> 'is_anonymous')::boolean, false) = false;

  IF v_is_signed_in THEN
    v_is_admin  := coalesce(public.is_admin(), false);
    v_is_member := coalesce(public.is_verified_member(), false);
  END IF;

  RETURN QUERY
  SELECT p.id,
         p.display_name::text,
         p.full_name::text,
         p.role::text,
         p.specialization::text,
         p.location::text,
         p.bio::text,
         p.avatar_url::text,
         p.years_of_practice::int,
         p.profile_visibility::text,
         p.verification_status::text,
         p.created_at::timestamptz
    FROM public.profiles p
   WHERE v_is_admin
      OR (
           p.status IS DISTINCT FROM 'suspended'
           AND (
                 p.profile_visibility = 'public'
              OR (p.profile_visibility = 'members_only' AND v_is_signed_in AND v_is_member)
           )
         );
END;
$$;

REVOKE ALL ON FUNCTION app_private.public_profiles() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION app_private.public_profiles() TO anon, authenticated, service_role;

CREATE VIEW public.profile_public_view
  WITH (security_invoker = true, security_barrier = true)
AS
  SELECT * FROM app_private.public_profiles();

COMMENT ON VIEW public.profile_public_view IS
  'Column-restricted profile directory. security_invoker view; row rules live in app_private.public_profiles().';

-- Supabase default privileges grant ALL on new relations to anon/authenticated.
REVOKE ALL ON public.profile_public_view FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.profile_public_view TO anon, authenticated, service_role;

-- Backward-compatible RPC name for clients written against the previous draft.
-- SECURITY INVOKER: it adds no privileges beyond the view's.
CREATE FUNCTION public.get_public_profiles()
RETURNS SETOF public.profile_public_view
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
  SELECT * FROM public.profile_public_view;
$$;
REVOKE ALL ON FUNCTION public.get_public_profiles() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_profiles() TO anon, authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 5. COLUMN HARMONIZATION
-- ------------------------------------------------------------------------------
-- posts.author_role: no constant default (the previous draft stamped every
-- existing student/researcher post as 'doctor'); backfill from the author.
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS author_role    text,
  ADD COLUMN IF NOT EXISTS attachment_url text;

UPDATE public.posts po
   SET author_role = pr.role::text
  FROM public.profiles pr
 WHERE pr.id = po.author_id
   AND po.author_role IS NULL;

ALTER TABLE public.mentorship_requests ADD COLUMN IF NOT EXISTS goals text DEFAULT '';
ALTER TABLE public.events              ADD COLUMN IF NOT EXISTS meeting_link text;
ALTER TABLE public.knowledge_posts
  ADD COLUMN IF NOT EXISTS doi                text,
  ADD COLUMN IF NOT EXISTS author_name        text,
  ADD COLUMN IF NOT EXISTS author_affiliation text;
ALTER TABLE public.opportunities ALTER COLUMN deadline DROP NOT NULL;

DROP POLICY IF EXISTS "Users can view own reports" ON public.reports;
CREATE POLICY "Users can view own reports"
  ON public.reports FOR SELECT
  TO authenticated
  USING (reporter_id = (SELECT auth.uid()) OR (SELECT public.is_admin()));

-- ------------------------------------------------------------------------------
-- 6. NOTIFICATION TRIGGER FUNCTIONS
-- ------------------------------------------------------------------------------
-- CREATE OR REPLACE keeps the existing owner, grants and trigger bindings.
CREATE OR REPLACE FUNCTION public.notify_on_connection_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_name text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT COALESCE(display_name, full_name) INTO v_name FROM public.profiles WHERE id = NEW.sender_id;
    INSERT INTO public.app_notifications
      (user_id, sender_id, type, title, message, link, action_url, action_id, action_status, metadata)
    VALUES
      (NEW.recipient_id, NEW.sender_id, 'connection_request', 'New Connection Request',
       COALESCE(v_name, 'A member') || ' wants to connect with you.',
       '/members/' || NEW.sender_id, '/members/' || NEW.sender_id,
       NEW.id::text, 'pending',
       jsonb_build_object('sender_id', NEW.sender_id, 'request_id', NEW.id));
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status = 'accepted' THEN
    SELECT COALESCE(display_name, full_name) INTO v_name FROM public.profiles WHERE id = NEW.recipient_id;
    INSERT INTO public.app_notifications
      (user_id, sender_id, type, title, message, link, action_url, action_id, action_status, metadata)
    VALUES
      (NEW.sender_id, NEW.recipient_id, 'connection_accepted', 'Connection Request Accepted',
       COALESCE(v_name, 'A member') || ' accepted your connection request.',
       '/members/' || NEW.recipient_id, '/members/' || NEW.recipient_id,
       NEW.id::text, 'accepted',
       jsonb_build_object('recipient_id', NEW.recipient_id, 'request_id', NEW.id));
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_on_mentorship_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_name text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT COALESCE(display_name, full_name) INTO v_name FROM public.profiles WHERE id = NEW.student_id;
    INSERT INTO public.app_notifications
      (user_id, sender_id, type, title, message, link, action_url, action_id, action_status, metadata)
    VALUES
      (NEW.mentor_id, NEW.student_id, 'mentorship_request', 'New Student Mentorship Request',
       COALESCE(v_name, 'A student') || ' requested clinical case mentorship.',
       '/students?tab=mentors', '/students?tab=mentors',
       NEW.id::text, 'pending',
       jsonb_build_object('student_id', NEW.student_id, 'request_id', NEW.id));
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status = 'accepted' THEN
    SELECT COALESCE(display_name, full_name) INTO v_name FROM public.profiles WHERE id = NEW.mentor_id;
    INSERT INTO public.app_notifications
      (user_id, sender_id, type, title, message, link, action_url, action_id, action_status, metadata)
    VALUES
      (NEW.student_id, NEW.mentor_id, 'mentorship_accepted', 'Mentorship Accepted!',
       COALESCE(v_name, 'Your mentor') || ' accepted your mentorship request.',
       '/members/' || NEW.mentor_id, '/members/' || NEW.mentor_id,
       NEW.id::text, 'accepted',
       jsonb_build_object('mentor_id', NEW.mentor_id, 'request_id', NEW.id));
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_on_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_post_author_id uuid;
  v_name           text;
BEGIN
  SELECT author_id INTO v_post_author_id FROM public.posts WHERE id = NEW.post_id;

  IF v_post_author_id IS NOT NULL AND v_post_author_id IS DISTINCT FROM NEW.author_id THEN
    SELECT COALESCE(display_name, full_name) INTO v_name FROM public.profiles WHERE id = NEW.author_id;
    INSERT INTO public.app_notifications
      (user_id, sender_id, type, title, message, link, action_url, metadata)
    VALUES
      (v_post_author_id, NEW.author_id, 'discussion_reply', 'New Response on Your Post',
       COALESCE(v_name, 'A member') || ' commented on your clinical case discussion.',
       '/community/' || NEW.post_id, '/community/' || NEW.post_id,
       jsonb_build_object('post_id', NEW.post_id, 'comment_id', NEW.id));
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.notify_on_connection_request() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_on_mentorship_request() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_on_comment()            FROM PUBLIC, anon, authenticated;

-- ------------------------------------------------------------------------------
-- 7. review_practitioner_application — service_role only, via Edge Function
-- ------------------------------------------------------------------------------
-- WHY THE SIGNATURE CHANGES:
--   The previous draft granted EXECUTE only to service_role but still checked
--   public.is_admin() / auth.uid() inside. A service_role request carries no
--   user `sub`, so auth.uid() is NULL, is_admin() is false, and every review
--   would have failed. The Edge Function now authenticates the admin from their
--   JWT and passes their id as p_reviewer_id; the function re-verifies that id
--   against user_roles (defense in depth) and requires a service_role JWT.
--
-- NOTE ON GRANTS: CREATE OR REPLACE preserves existing grants; a NEW function
--   receives PUBLIC EXECUTE plus Supabase's default grants to anon/authenticated.
--   Since this is a new signature, everything is revoked after CREATE.
--
-- BREAKING: browser calls to rpc('review_practitioner_application') stop
--   working. Use supabase.functions.invoke('review-practitioner-application').
DROP FUNCTION IF EXISTS public.review_practitioner_application(uuid, text, text, text, text);

CREATE OR REPLACE FUNCTION public.review_practitioner_application(
  p_application_id      uuid,
  p_new_status          text,
  p_reviewer_id         uuid,
  p_decision_reason     text DEFAULT NULL,
  p_verification_source text DEFAULT NULL,
  p_internal_notes      text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_app           public.practitioner_applications%ROWTYPE;
  v_reviewer_name text;
BEGIN
  IF coalesce(auth.jwt() ->> 'role', '') <> 'service_role' THEN
    RAISE EXCEPTION 'Access denied: this function must be called by the review Edge Function.'
      USING ERRCODE = '42501';
  END IF;

  IF p_application_id IS NULL OR p_reviewer_id IS NULL THEN
    RAISE EXCEPTION 'p_application_id and p_reviewer_id are required.' USING ERRCODE = '22004';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.user_roles
                  WHERE user_id = p_reviewer_id AND role IN ('admin','super_admin')) THEN
    RAISE EXCEPTION 'Access denied: reviewer is not an administrator.' USING ERRCODE = '42501';
  END IF;

  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = p_reviewer_id AND status = 'suspended') THEN
    RAISE EXCEPTION 'Access denied: reviewer account is suspended.' USING ERRCODE = '42501';
  END IF;

  IF p_new_status IS NULL OR p_new_status NOT IN
     ('pending_review','needs_information','verified','declined','suspended') THEN
    RAISE EXCEPTION 'Invalid status: %', p_new_status USING ERRCODE = '22023';
  END IF;

  -- Row lock: concurrent reviews of the same application serialize, so
  -- previous_status in the history is always accurate.
  SELECT * INTO v_app FROM public.practitioner_applications
   WHERE id = p_application_id
   FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Application not found: %', p_application_id USING ERRCODE = 'P0002';
  END IF;

  IF v_app.user_id IS NOT DISTINCT FROM p_reviewer_id THEN
    RAISE EXCEPTION 'Reviewers cannot review their own application.' USING ERRCODE = '42501';
  END IF;

  SELECT COALESCE(display_name, full_name) INTO v_reviewer_name
    FROM public.profiles WHERE id = p_reviewer_id;
  v_reviewer_name := COALESCE(v_reviewer_name, 'Verification Officer');

  UPDATE public.practitioner_applications
     SET status                  = p_new_status,
         reviewed_at             = now(),
         reviewed_by             = v_reviewer_name,
         decision_reason         = p_decision_reason,
         verification_source     = p_verification_source,
         verification_checked_at = now(),
         internal_notes          = p_internal_notes
   WHERE id = p_application_id;

  INSERT INTO public.verification_reviews
    (application_id, reviewer_id, reviewer_name, previous_status, new_status,
     decision_reason, verification_source, internal_notes)
  VALUES
    (p_application_id, p_reviewer_id, v_reviewer_name, v_app.status, p_new_status,
     p_decision_reason, p_verification_source, p_internal_notes);

  IF v_app.user_id IS NOT NULL THEN
    UPDATE public.profiles
       SET status              = p_new_status,
           verification_status = CASE p_new_status
                                   WHEN 'verified' THEN 'verified'
                                   WHEN 'declined' THEN 'rejected'
                                   ELSE 'pending'
                                 END,
           updated_at          = now()
     WHERE id = v_app.user_id;

    INSERT INTO public.app_notifications
      (user_id, type, title, message, link, action_url, action_status, metadata)
    VALUES (
      v_app.user_id,
      'verification_update',
      CASE WHEN p_new_status = 'verified' THEN 'Credentials Verified!' ELSE 'Application Status Update' END,
      CASE p_new_status
        WHEN 'verified' THEN 'Your professional credentials have been verified by the council committee. Full community access is enabled.'
        WHEN 'declined' THEN COALESCE(p_decision_reason, 'Your registration could not be verified against the state register.')
        WHEN 'needs_information' THEN COALESCE(p_decision_reason, 'The committee requires additional information regarding your credentials.')
        ELSE 'Your application status was updated to: ' || p_new_status
      END,
      CASE WHEN p_new_status = 'verified' THEN '/dashboard' ELSE '/application-status' END,
      CASE WHEN p_new_status = 'verified' THEN '/dashboard' ELSE '/application-status' END,
      CASE p_new_status WHEN 'verified' THEN 'accepted' WHEN 'declined' THEN 'declined' ELSE 'pending' END,
      jsonb_build_object('application_id', p_application_id, 'status', p_new_status)
    );
  END IF;

  INSERT INTO public.admin_audit_logs
    (actor_id, actor_name, action, target_type, target_id, metadata)
  VALUES (
    p_reviewer_id::text,
    v_reviewer_name,
    'APPLICATION_REVIEWED',
    'practitioner_application',
    p_application_id::text,
    jsonb_build_object(
      'previous_status', v_app.status,
      'new_status',      p_new_status,
      'decision_reason', p_decision_reason,
      'has_user_id',     (v_app.user_id IS NOT NULL),
      'via',             'edge:review-practitioner-application'
    )
  );

  RETURN jsonb_build_object('success', true, 'application_id', p_application_id, 'status', p_new_status);
END;
$$;

REVOKE ALL ON FUNCTION public.review_practitioner_application(uuid, text, uuid, text, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.review_practitioner_application(uuid, text, uuid, text, text, text)
  TO service_role;

-- ------------------------------------------------------------------------------
-- 8. STORAGE
-- ------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg','image/png','image/webp','image/gif']),
  ('verification-documents', 'verification-documents', false, 10485760, ARRAY['application/pdf','image/jpeg','image/png'])
ON CONFLICT (id) DO UPDATE SET
  public             = EXCLUDED.public,
  file_size_limit    = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Only the 8 policies below (from 20261027000000) are dropped/recreated;
-- policies for other buckets are untouched.
DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;
CREATE POLICY "Public can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND ((storage.foldername(name))[1] = (SELECT auth.uid())::text OR (SELECT public.is_admin()))
  );

DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND ((storage.foldername(name))[1] = (SELECT auth.uid())::text OR (SELECT public.is_admin()))
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND ((storage.foldername(name))[1] = (SELECT auth.uid())::text OR (SELECT public.is_admin()))
  );

DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND ((storage.foldername(name))[1] = (SELECT auth.uid())::text OR (SELECT public.is_admin()))
  );

DROP POLICY IF EXISTS "Applicant and admins can view verification documents" ON storage.objects;
CREATE POLICY "Applicant and admins can view verification documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'verification-documents'
    AND ((storage.foldername(name))[1] = (SELECT auth.uid())::text OR (SELECT public.is_admin()))
  );

DROP POLICY IF EXISTS "Applicants can upload their own verification documents" ON storage.objects;
CREATE POLICY "Applicants can upload their own verification documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'verification-documents'
    AND ((storage.foldername(name))[1] = (SELECT auth.uid())::text OR (SELECT public.is_admin()))
  );

DROP POLICY IF EXISTS "Applicants can update their own verification documents" ON storage.objects;
CREATE POLICY "Applicants can update their own verification documents"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'verification-documents'
    AND ((storage.foldername(name))[1] = (SELECT auth.uid())::text OR (SELECT public.is_admin()))
  )
  WITH CHECK (
    bucket_id = 'verification-documents'
    AND ((storage.foldername(name))[1] = (SELECT auth.uid())::text OR (SELECT public.is_admin()))
  );

DROP POLICY IF EXISTS "Admins can delete verification documents" ON storage.objects;
CREATE POLICY "Admins can delete verification documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'verification-documents' AND (SELECT public.is_admin()));

-- ------------------------------------------------------------------------------
-- 9. SEED DATA (non-destructive)
-- ------------------------------------------------------------------------------
INSERT INTO public.categories (id, name, slug, type, badge_color, active) VALUES
  ('general',             'General Discussion',  'general',             'discussion', 'bg-slate-100 text-slate-800 border-slate-200',      true),
  ('clinical-cases',      'Clinical Learning',   'clinical-cases',      'discussion', 'bg-teal-50 text-teal-800 border-teal-200',          true),
  ('research',            'Research',            'research',            'discussion', 'bg-sky-50 text-sky-800 border-sky-200',             true),
  ('students',            'Student Corner',      'students',            'discussion', 'bg-emerald-50 text-emerald-800 border-emerald-200', true),
  ('practice-management', 'Practice Management', 'practice-management', 'discussion', 'bg-indigo-50 text-indigo-800 border-indigo-200',    true),
  ('events',              'Events & CMEs',       'events',              'event',      'bg-purple-50 text-purple-800 border-purple-200',    true)
ON CONFLICT (id) DO UPDATE SET
  name        = EXCLUDED.name,
  badge_color = EXCLUDED.badge_color,
  active      = EXCLUDED.active;

INSERT INTO public.platform_settings (
  id, require_doctor_verification, require_researcher_verification,
  require_student_verification, allow_student_mentorship_requests, auto_appeal_enabled
) VALUES ('global', true, true, false, true, true)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 10. FIRST SUPER-ADMIN PROVISIONING
-- ------------------------------------------------------------------------------
-- bootstrap_super_admin (20261027000000) was SECURITY DEFINER and checked
-- current_user, which inside a definer function is always the owner — the
-- check was always true. It is removed.
--
-- provision_first_super_admin is SECURITY INVOKER: it runs with the caller's
-- privileges. EXECUTE is revoked from PUBLIC/anon/authenticated/service_role,
-- PostgREST does not expose procedures, and it reads auth.users, which the API
-- roles cannot read. The supported caller is the `postgres` role in the
-- Supabase SQL Editor (on Supabase, `postgres` is a privileged role that owns
-- these objects, not the cluster superuser `supabase_admin`).
--
-- USAGE (SQL Editor, once, after the user has signed up):
--   CALL public.provision_first_super_admin('admin@yourdomain.com');
--
-- CONCURRENCY: pg_advisory_xact_lock serializes concurrent CALLs; the lock is
-- held until the surrounding transaction commits or rolls back (released
-- automatically — no session-level lock can leak). LOCK TABLE ... SHARE ROW
-- EXCLUSIVE additionally blocks any other writer to user_roles (e.g. the admin
-- panel) between the "no super_admin yet" check and the insert. The lock is
-- held for milliseconds; concurrent signups simply wait.
DROP FUNCTION IF EXISTS public.bootstrap_super_admin(text);

CREATE OR REPLACE PROCEDURE public.provision_first_super_admin(p_email text)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_email   text := lower(trim(p_email));
  v_ids     uuid[];
  v_user_id uuid;
  v_rows    int;
BEGIN
  IF v_email IS NULL OR v_email = '' THEN
    RAISE EXCEPTION 'p_email must not be empty.' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('homeo_circle'), hashtext('provision_first_super_admin'));
  LOCK TABLE public.user_roles IN SHARE ROW EXCLUSIVE MODE;

  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'super_admin') THEN
    RAISE EXCEPTION 'Super admin already initialized; use the admin panel to promote further admins.'
      USING ERRCODE = '55000';
  END IF;

  SELECT array_agg(u.id) INTO v_ids
    FROM auth.users u
   WHERE lower(trim(u.email)) = v_email;

  IF coalesce(array_length(v_ids, 1), 0) = 0 THEN
    RAISE EXCEPTION 'No auth user with email %; the user must complete sign-up first.', v_email
      USING ERRCODE = 'P0002';
  ELSIF array_length(v_ids, 1) > 1 THEN
    RAISE EXCEPTION 'Email % matches % auth users; resolve the duplicates first.', v_email, array_length(v_ids, 1)
      USING ERRCODE = '21000';
  END IF;
  v_user_id := v_ids[1];

  -- Exactly one profile row must exist and be updated before roles are touched.
  UPDATE public.profiles
     SET role                = 'super_admin',
         status              = 'verified',
         verification_status = 'verified',
         updated_at          = now()
   WHERE id = v_user_id;
  GET DIAGNOSTICS v_rows = ROW_COUNT;

  IF v_rows <> 1 THEN
    RAISE EXCEPTION 'Expected exactly 1 profile row for user_id %, updated %. Nothing was changed.', v_user_id, v_rows
      USING ERRCODE = 'P0002',
            HINT = 'If 0: handle_new_user did not create the profile; insert it and retry.';
  END IF;

  INSERT INTO public.user_roles (user_id, role) VALUES (v_user_id, 'super_admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (v_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;

  INSERT INTO public.admin_audit_logs (actor_id, actor_name, action, target_type, target_id, metadata)
  VALUES (NULL, 'DB console: ' || session_user, 'SUPER_ADMIN_PROVISIONED', 'profile', v_user_id::text,
          jsonb_build_object('email', v_email, 'at', now()));

  RAISE NOTICE 'Super admin provisioned: user_id=% email=%', v_user_id, v_email;
END;
$$;

REVOKE ALL ON PROCEDURE public.provision_first_super_admin(text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON PROCEDURE public.provision_first_super_admin(text) TO postgres;

-- ------------------------------------------------------------------------------
-- 11. IN-MIGRATION ASSERTIONS (any failure rolls back the whole migration)
-- ------------------------------------------------------------------------------
DO $assert$
DECLARE
  v_problems text[] := ARRAY[]::text[];
  r record;
BEGIN
  FOR r IN
    SELECT * FROM (VALUES
      ('public.review_practitioner_application(uuid,text,uuid,text,text,text)', 'anon',          false),
      ('public.review_practitioner_application(uuid,text,uuid,text,text,text)', 'authenticated', false),
      ('public.review_practitioner_application(uuid,text,uuid,text,text,text)', 'service_role',  true),
      ('public.provision_first_super_admin(text)',                              'anon',          false),
      ('public.provision_first_super_admin(text)',                              'authenticated', false),
      ('public.provision_first_super_admin(text)',                              'service_role',  false),
      ('public.lookup_guest_application_status(uuid,text)',                     'anon',          true),
      ('app_private.public_profiles()',                                         'anon',          true),
      ('public.guard_profile_privileged_fields()',                              'authenticated', false)
    ) AS v(fn, rolname, expected)
  LOOP
    IF has_function_privilege(r.rolname, r.fn, 'EXECUTE') IS DISTINCT FROM r.expected THEN
      v_problems := v_problems || format('EXECUTE on %s for %s should be %s', r.fn, r.rolname, r.expected);
    END IF;
  END LOOP;

  IF to_regprocedure('public.review_practitioner_application(uuid,text,text,text,text)') IS NOT NULL THEN
    v_problems := v_problems || text 'old 5-arg review_practitioner_application still exists';
  END IF;
  IF to_regprocedure('public.bootstrap_super_admin(text)') IS NOT NULL THEN
    v_problems := v_problems || text 'bootstrap_super_admin still exists';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_class
                  WHERE oid = 'public.profile_public_view'::regclass
                    AND 'security_invoker=true' = ANY (reloptions)) THEN
    v_problems := v_problems || text 'profile_public_view is not security_invoker';
  END IF;

  IF has_table_privilege('anon', 'public.profile_public_view', 'INSERT')
     OR has_table_privilege('authenticated', 'public.profile_public_view', 'UPDATE') THEN
    v_problems := v_problems || text 'profile_public_view grants write privileges';
  END IF;

  IF array_length(v_problems, 1) > 0 THEN
    RAISE EXCEPTION E'POST-MIGRATION ASSERTIONS FAILED (rolled back):\n  - %',
      array_to_string(v_problems, E'\n  - ');
  END IF;
END
$assert$;
