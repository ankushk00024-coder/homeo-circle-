-- ==============================================================================
-- Homeo India — Publisher role (posting-only helpers)
-- Migration: 20261109000000_publisher_role.sql
--
-- A publisher is a helper who can ONLY post: discussions, research and events.
-- They use the separate Publishing panel (/publish). They cannot see member
-- lists, numbers, applications, reports or any admin data, cannot approve
-- anyone, and can only edit or delete what they posted themselves.
--
-- Super admins / admins add or remove publishers from Admin → Publishers, or in
-- the SQL editor:  SELECT public.add_publisher('helper@gmail.com');
-- Idempotent.
-- ==============================================================================

ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_role_check
  CHECK (role = ANY (ARRAY['member', 'doctor', 'student', 'researcher', 'moderator', 'publisher', 'admin', 'super_admin']));

CREATE OR REPLACE FUNCTION public.is_publisher()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'publisher');
$$;
REVOKE ALL ON FUNCTION public.is_publisher() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_publisher() TO authenticated, service_role;

-- ------------------------------------------------------------------------------
-- Events
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Publishers can add events" ON public.events;
CREATE POLICY "Publishers can add events" ON public.events FOR INSERT TO authenticated
  WITH CHECK (public.is_publisher() AND created_by = auth.uid());

DROP POLICY IF EXISTS "Publishers can see own events" ON public.events;
CREATE POLICY "Publishers can see own events" ON public.events FOR SELECT TO authenticated
  USING (public.is_publisher() AND created_by = auth.uid());

DROP POLICY IF EXISTS "Publishers can delete own events" ON public.events;
CREATE POLICY "Publishers can delete own events" ON public.events FOR DELETE TO authenticated
  USING (public.is_publisher() AND created_by = auth.uid());

-- ------------------------------------------------------------------------------
-- Research
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Publishers can add research" ON public.knowledge_posts;
CREATE POLICY "Publishers can add research" ON public.knowledge_posts FOR INSERT TO authenticated
  WITH CHECK (public.is_publisher() AND created_by = auth.uid());

DROP POLICY IF EXISTS "Publishers can see own research" ON public.knowledge_posts;
CREATE POLICY "Publishers can see own research" ON public.knowledge_posts FOR SELECT TO authenticated
  USING (public.is_publisher() AND created_by = auth.uid());

DROP POLICY IF EXISTS "Publishers can delete own research" ON public.knowledge_posts;
CREATE POLICY "Publishers can delete own research" ON public.knowledge_posts FOR DELETE TO authenticated
  USING (public.is_publisher() AND created_by = auth.uid());

-- Publishers' events and research are always stamped as theirs and published.
CREATE OR REPLACE FUNCTION public.stamp_publisher_content()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.is_admin() THEN
    RETURN NEW;
  END IF;
  NEW.created_by := auth.uid();
  NEW.status := 'published';
  NEW.created_at := now();
  IF TG_TABLE_NAME = 'events' THEN
    NEW.attendees_count := 0;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.stamp_publisher_content() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_stamp_publisher_content ON public.events;
CREATE TRIGGER trg_stamp_publisher_content BEFORE INSERT ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.stamp_publisher_content();
DROP TRIGGER IF EXISTS trg_stamp_publisher_content ON public.knowledge_posts;
CREATE TRIGGER trg_stamp_publisher_content BEFORE INSERT ON public.knowledge_posts
  FOR EACH ROW EXECUTE FUNCTION public.stamp_publisher_content();

ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_urls_safe;
ALTER TABLE public.events ADD CONSTRAINT events_urls_safe
  CHECK (public.is_web_url(image_url) AND public.is_web_url(meeting_link) AND public.is_web_url(source_url)
         AND (registration_url LIKE '/%' OR public.is_web_url(registration_url)));

-- ------------------------------------------------------------------------------
-- Discussions: publishers may post even if they are not a verified member.
-- (Author name/photo are still taken from their own profile.)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Publishers can create posts" ON public.posts;
CREATE POLICY "Publishers can create posts" ON public.posts FOR INSERT TO authenticated
  WITH CHECK (public.is_publisher() AND author_id = auth.uid());

-- ------------------------------------------------------------------------------
-- Uploads: photos for discussions, photos/PDF for research and event posters,
-- always inside the publisher's own folder.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Publishers can upload post images" ON storage.objects;
CREATE POLICY "Publishers can upload post images" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'post-images' AND public.is_publisher()
              AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "Publishers can upload research files" ON storage.objects;
CREATE POLICY "Publishers can upload research files" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'research-files' AND public.is_publisher()
              AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "Publishers can delete own research files" ON storage.objects;
CREATE POLICY "Publishers can delete own research files" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'research-files' AND public.is_publisher()
         AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);

-- ------------------------------------------------------------------------------
-- Rate limits: publishers post a lot, so they get the same exemption as admins.
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
  IF public.is_trusted_writer() OR (TG_TABLE_NAME = 'posts' AND public.is_publisher()) THEN
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
REVOKE ALL ON FUNCTION public.enforce_rate_limit() FROM PUBLIC, anon, authenticated;

-- Publisher changes are written to the admin audit log too.
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
  IF r.role IN ('admin', 'super_admin', 'moderator', 'publisher') THEN
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

-- ------------------------------------------------------------------------------
-- Admin tools: add / remove / list publishers
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.add_publisher(p_email text)
RETURNS TABLE (user_id uuid, name text, email text, added_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
#variable_conflict use_column
DECLARE
  v_id uuid;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only administrators can add publishers.' USING ERRCODE = '42501';
  END IF;
  SELECT u.id INTO v_id FROM auth.users u WHERE lower(trim(u.email)) = lower(trim(p_email));
  IF v_id IS NULL THEN
    RAISE EXCEPTION 'No account found for %. Ask them to sign up on the website first, then add them again.', trim(p_email);
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (v_id, 'publisher')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN QUERY
    SELECT r.user_id, COALESCE(NULLIF(p.display_name, ''), NULLIF(p.full_name, ''), u.email::text), u.email::text, r.created_at
    FROM public.user_roles r
    JOIN auth.users u ON u.id = r.user_id
    LEFT JOIN public.profiles p ON p.id = r.user_id
    WHERE r.user_id = v_id AND r.role = 'publisher';
END;
$$;

CREATE OR REPLACE FUNCTION public.remove_publisher(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only administrators can remove publishers.' USING ERRCODE = '42501';
  END IF;
  DELETE FROM public.user_roles WHERE user_id = p_user_id AND role = 'publisher';
END;
$$;

CREATE OR REPLACE FUNCTION public.list_publishers()
RETURNS TABLE (user_id uuid, name text, email text, added_at timestamptz)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
#variable_conflict use_column
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only administrators can see publishers.' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
    SELECT r.user_id, COALESCE(NULLIF(p.display_name, ''), NULLIF(p.full_name, ''), u.email::text), u.email::text, r.created_at
    FROM public.user_roles r
    JOIN auth.users u ON u.id = r.user_id
    LEFT JOIN public.profiles p ON p.id = r.user_id
    WHERE r.role = 'publisher'
    ORDER BY r.created_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.add_publisher(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.remove_publisher(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.list_publishers() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.add_publisher(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.remove_publisher(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.list_publishers() TO authenticated, service_role;
