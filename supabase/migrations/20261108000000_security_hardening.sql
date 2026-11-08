-- ==============================================================================
-- Homeo India — Security hardening (security checklist review, Nov 2026)
-- Migration: 20261108000000_security_hardening.sql
--
-- Fixes found in the review. None of these change how the site works for
-- normal members; they close ways a member could bypass the website and send
-- crafted requests straight to the database API.
--
--  1. Posts, comments and reports: the author's name, photo, qualification and
--     role are now filled in by the database from the real profile, so nobody
--     can post under a fake name or title. Like/comment counters start at 0.
--  2. Posts: members can no longer re-publish a post an admin hid or removed,
--     or change like/comment counts or author details.
--  3. Mentorship requests: only the mentor can accept or decline; nobody can
--     re-point a request at a different person.
--  4. Verification applications: must come from a signed-in account and always
--     start as "pending review" (no self-approved applications).
--  5. Input limits: maximum lengths on text fields, and links must start with
--     http:// or https:// (blocks javascript: links).
--  6. Rate limits: caps on posts, comments, connection and mentorship requests,
--     reports and applications per account, to stop spam and abuse.
--  7. Database advisor fixes: fixed search_path on admin procedures; trigger
--     functions can no longer be called directly through the API.
--  8. Monitoring: every change to admin/moderator roles is written to the
--     admin audit log.
-- Idempotent.
-- ==============================================================================

-- Trusted callers: server-side code / SQL editor (no signed-in user), admins,
-- and updates made by other database triggers (e.g. counter sync).
CREATE OR REPLACE FUNCTION public.is_trusted_writer()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() IS NULL OR public.is_admin() OR pg_trigger_depth() > 1;
$$;
REVOKE ALL ON FUNCTION public.is_trusted_writer() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_trusted_writer() TO authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 1 & 2. Posts
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.stamp_post_author()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  p public.profiles%ROWTYPE;
BEGIN
  IF public.is_trusted_writer() THEN
    RETURN NEW;
  END IF;
  SELECT * INTO p FROM public.profiles WHERE id = auth.uid();
  NEW.author_id := auth.uid();
  NEW.author_name := COALESCE(NULLIF(p.display_name, ''), NULLIF(p.full_name, ''), 'Member');
  NEW.author_avatar := COALESCE(NULLIF(p.avatar_url, ''), NULLIF(p.avatar_path, ''));
  NEW.author_qualification := CASE WHEN p.qualification IS NULL OR p.qualification IN ('', 'Not specified') THEN NULL ELSE p.qualification END;
  NEW.author_experience := CASE WHEN COALESCE(p.experience_years, 0) > 0 THEN p.experience_years || ' years experience' ELSE NULL END;
  NEW.author_role := COALESCE(p.account_type, p.role, 'member');
  NEW.likes_count := 0;
  NEW.comments_count := 0;
  NEW.status := 'published';
  NEW.created_at := now();
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_stamp_post_author ON public.posts;
CREATE TRIGGER trg_stamp_post_author
  BEFORE INSERT ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.stamp_post_author();

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
    RAISE EXCEPTION 'Posts cannot be edited. You can delete the post and publish a new one.'
      USING ERRCODE = '42501';
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status
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

-- ------------------------------------------------------------------------------
-- 1. Comments and reports
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.stamp_comment_author()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  p public.profiles%ROWTYPE;
BEGIN
  IF public.is_trusted_writer() THEN
    RETURN NEW;
  END IF;
  SELECT * INTO p FROM public.profiles WHERE id = auth.uid();
  NEW.author_id := auth.uid();
  NEW.author_name := COALESCE(NULLIF(p.display_name, ''), NULLIF(p.full_name, ''), 'Member');
  NEW.author_avatar := COALESCE(NULLIF(p.avatar_url, ''), NULLIF(p.avatar_path, ''));
  NEW.author_qualification := COALESCE(NULLIF(p.qualification, ''), 'BHMS');
  NEW.status := 'published';
  NEW.created_at := now();
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_stamp_comment_author ON public.comments;
CREATE TRIGGER trg_stamp_comment_author
  BEFORE INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.stamp_comment_author();

CREATE OR REPLACE FUNCTION public.stamp_report()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_trusted_writer() THEN
    RETURN NEW;
  END IF;
  NEW.reporter_id := auth.uid();
  NEW.reporter_name := (SELECT COALESCE(NULLIF(display_name, ''), NULLIF(full_name, ''), 'Member') FROM public.profiles WHERE id = auth.uid());
  NEW.status := 'open';
  NEW.resolution_note := NULL;
  NEW.resolved_at := NULL;
  NEW.created_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_stamp_report ON public.reports;
CREATE TRIGGER trg_stamp_report
  BEFORE INSERT ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.stamp_report();

-- ------------------------------------------------------------------------------
-- 3. Mentorship requests
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.guard_mentorship_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_trusted_writer() THEN
    NEW.updated_at := now();
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.student_id := auth.uid();
    NEW.status := 'pending';
    NEW.created_at := now();
    NEW.updated_at := now();
    RETURN NEW;
  END IF;

  IF NEW.student_id IS DISTINCT FROM OLD.student_id
     OR NEW.mentor_id IS DISTINCT FROM OLD.mentor_id
     OR NEW.topics IS DISTINCT FROM OLD.topics
     OR NEW.message IS DISTINCT FROM OLD.message
     OR NEW.goals IS DISTINCT FROM OLD.goals
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'A mentorship request cannot be edited.' USING ERRCODE = '42501';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF auth.uid() <> OLD.mentor_id THEN
      RAISE EXCEPTION 'Only the mentor can accept or decline this request.' USING ERRCODE = '42501';
    END IF;
    IF OLD.status <> 'pending' OR NEW.status NOT IN ('accepted', 'declined') THEN
      RAISE EXCEPTION 'This request has already been answered.' USING ERRCODE = '42501';
    END IF;
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_mentorship_request ON public.mentorship_requests;
CREATE TRIGGER trg_guard_mentorship_request
  BEFORE INSERT OR UPDATE ON public.mentorship_requests
  FOR EACH ROW EXECUTE FUNCTION public.guard_mentorship_request();

-- ------------------------------------------------------------------------------
-- 4. Verification applications: signed-in only, always start pending
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Applicants can insert own application" ON public.practitioner_applications;
CREATE POLICY "Applicants can insert own application"
  ON public.practitioner_applications FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

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

DROP TRIGGER IF EXISTS trg_stamp_application ON public.practitioner_applications;
CREATE TRIGGER trg_stamp_application
  BEFORE INSERT ON public.practitioner_applications
  FOR EACH ROW EXECUTE FUNCTION public.stamp_application();

-- ------------------------------------------------------------------------------
-- 5. Input limits
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_web_url(u text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT u IS NULL OR u = '' OR (u ~* '^https?://[^\s]+$' AND char_length(u) <= 2048);
$$;

CREATE OR REPLACE FUNCTION public.all_web_urls(arr text[])
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT arr IS NULL OR NOT EXISTS (SELECT 1 FROM unnest(arr) x WHERE NOT public.is_web_url(x));
$$;

DO $$
DECLARE
  c record;
BEGIN
  FOR c IN SELECT * FROM (VALUES
    ('posts', 'posts_title_len', 'char_length(title) <= 300'),
    ('posts', 'posts_body_len', 'char_length(body) <= 20000'),
    ('posts', 'posts_urls_safe', 'public.is_web_url(source_url) AND public.is_web_url(attachment_url) AND public.all_web_urls(image_urls)'),
    ('comments', 'comments_body_len', 'char_length(body) <= 5000'),
    ('profiles', 'profiles_text_len', 'char_length(COALESCE(display_name, '''')) <= 120 AND char_length(COALESCE(full_name, '''')) <= 120 AND char_length(COALESCE(bio, '''')) <= 3000 AND char_length(COALESCE(clinic_institution, '''')) <= 200 AND char_length(COALESCE(specialization, '''')) <= 200 AND char_length(COALESCE(qualification, '''')) <= 200 AND char_length(COALESCE(city, '''')) <= 100 AND char_length(COALESCE(state, '''')) <= 100'),
    ('profiles', 'profiles_urls_safe', 'public.is_web_url(avatar_url) AND public.is_web_url(social_links->>''website'') AND public.is_web_url(social_links->>''linkedin'')'),
    ('reports', 'reports_text_len', 'char_length(COALESCE(reason, '''')) <= 300 AND char_length(COALESCE(note, '''')) <= 3000'),
    ('mentorship_requests', 'mentorship_text_len', 'char_length(COALESCE(message, '''')) <= 2000 AND char_length(COALESCE(goals, '''')) <= 2000'),
    ('practitioner_applications', 'applications_text_len', 'char_length(COALESCE(full_name, '''')) <= 120 AND char_length(COALESCE(email, '''')) <= 254 AND char_length(COALESCE(phone, '''')) <= 20 AND char_length(COALESCE(qualification, '''')) <= 200 AND char_length(COALESCE(clinic_institution, '''')) <= 200 AND char_length(COALESCE(institution, '''')) <= 200 AND char_length(COALESCE(city, '''')) <= 100 AND char_length(COALESCE(state, '''')) <= 100 AND char_length(COALESCE(research_interests, '''')) <= 3000 AND char_length(COALESCE(publications, '''')) <= 3000'),
    ('knowledge_posts', 'knowledge_urls_safe', 'public.is_web_url(source_url) AND public.is_web_url(attachment_url) AND public.all_web_urls(image_urls)')
  ) AS t(tbl, name, expr)
  LOOP
    EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS %I', c.tbl, c.name);
    EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I CHECK (%s)', c.tbl, c.name, c.expr);
  END LOOP;
END;
$$;

-- ------------------------------------------------------------------------------
-- 6. Rate limits (per signed-in account; admins and server code are exempt)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_col text := TG_ARGV[0];
  v_max int := TG_ARGV[1]::int;
  v_window interval := TG_ARGV[2]::interval;
  v_label text := TG_ARGV[3];
  v_count int;
BEGIN
  IF public.is_trusted_writer() THEN
    RETURN NEW;
  END IF;
  EXECUTE format('SELECT count(*) FROM %I.%I WHERE %I = $1 AND created_at > now() - $2',
                 TG_TABLE_SCHEMA, TG_TABLE_NAME, v_owner_col)
    INTO v_count USING auth.uid(), v_window;
  IF v_count >= v_max THEN
    RAISE EXCEPTION 'You are doing that too often (% limit reached). Please wait a while and try again.', v_label
      USING ERRCODE = 'P0429';
  END IF;
  RETURN NEW;
END;
$$;

ALTER TABLE public.practitioner_applications ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN SELECT * FROM (VALUES
    ('posts', 'author_id', '15', '1 hour', 'posts'),
    ('comments', 'author_id', '60', '1 hour', 'comments'),
    ('connection_requests', 'sender_id', '50', '1 day', 'connection requests'),
    ('mentorship_requests', 'student_id', '20', '1 day', 'mentorship requests'),
    ('reports', 'reporter_id', '20', '1 day', 'reports'),
    ('practitioner_applications', 'user_id', '5', '1 day', 'applications'),
    ('post_likes', 'user_id', '300', '1 hour', 'likes')
  ) AS t(tbl, col, max_n, win, label)
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_rate_limit ON public.%I', r.tbl);
    EXECUTE format('CREATE TRIGGER trg_rate_limit BEFORE INSERT ON public.%I FOR EACH ROW EXECUTE FUNCTION public.enforce_rate_limit(%L, %L, %L, %L)',
                   r.tbl, r.col, r.max_n, r.win, r.label);
  END LOOP;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_posts_author_created ON public.posts (author_id, created_at);
CREATE INDEX IF NOT EXISTS idx_comments_author_created ON public.comments (author_id, created_at);

-- ------------------------------------------------------------------------------
-- 7. Advisor fixes
-- ------------------------------------------------------------------------------
ALTER PROCEDURE public.provision_first_super_admin(text) SET search_path = public, auth;
ALTER PROCEDURE public.transfer_super_admin(text, text) SET search_path = public, auth;

DO $$
DECLARE
  f record;
BEGIN
  -- Trigger functions are only ever run by their triggers; nobody needs to
  -- call them through the API.
  FOR f IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    WHERE p.pronamespace = 'public'::regnamespace
      AND p.prorettype = 'trigger'::regtype
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', f.sig);
  END LOOP;
END;
$$;

-- ------------------------------------------------------------------------------
-- 8. Audit every admin/moderator role change
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.audit_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
BEGIN
  IF TG_OP = 'DELETE' THEN r := OLD; ELSE r := NEW; END IF;
  IF r.role IN ('admin', 'super_admin', 'moderator') THEN
    INSERT INTO public.admin_audit_logs (actor_id, actor_name, action, target_type, target_id, metadata)
    VALUES (COALESCE(auth.uid()::text, 'db-console'),
            COALESCE((SELECT COALESCE(display_name, full_name, email) FROM public.profiles WHERE id = auth.uid()), 'DB console: ' || session_user),
            CASE TG_OP WHEN 'INSERT' THEN 'ROLE_GRANTED' ELSE 'ROLE_REVOKED' END,
            'profile', r.user_id::text,
            jsonb_build_object('role', r.role, 'at', now()));
  END IF;
  RETURN NULL;
END;
$$;
REVOKE ALL ON FUNCTION public.audit_role_change() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_audit_role_change ON public.user_roles;
CREATE TRIGGER trg_audit_role_change
  AFTER INSERT OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.audit_role_change();
