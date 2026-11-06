-- ==============================================================================
-- Homeo India — Research with images/PDF, and handing over admin access
-- Migration: 20261106000000_research_files_and_admin_transfer.sql
--
-- 1. Research posts can carry up to 6 images and one PDF (the paper itself).
--    Files live in the public 'research-files' bucket; only admins upload or
--    delete them (research is added from the admin panel).
-- 2. public.transfer_super_admin(new_email, old_email) gives the new Gmail
--    full admin access and removes it from the old one, in one step.
--    Run it in the Supabase SQL Editor only (not callable from the website):
--      CALL public.transfer_super_admin('new.person@gmail.com', 'old.person@gmail.com');
--    The new person must have signed up on the website first.
-- Idempotent.
-- ==============================================================================

ALTER TABLE public.knowledge_posts ADD COLUMN IF NOT EXISTS image_urls text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.knowledge_posts ADD COLUMN IF NOT EXISTS attachment_url text;
ALTER TABLE public.knowledge_posts DROP CONSTRAINT IF EXISTS knowledge_posts_image_urls_max;
ALTER TABLE public.knowledge_posts ADD CONSTRAINT knowledge_posts_image_urls_max CHECK (cardinality(image_urls) <= 6);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('research-files', 'research-files', true, 20971520,
        ARRAY['application/pdf', 'image/webp', 'image/jpeg', 'image/png'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public can view research files" ON storage.objects;
CREATE POLICY "Public can view research files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'research-files');

DROP POLICY IF EXISTS "Admins can upload research files" ON storage.objects;
CREATE POLICY "Admins can upload research files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'research-files' AND public.is_admin());

DROP POLICY IF EXISTS "Admins can delete research files" ON storage.objects;
CREATE POLICY "Admins can delete research files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'research-files' AND public.is_admin());

-- ------------------------------------------------------------------------------
-- Hand over admin access
-- ------------------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE public.transfer_super_admin(p_new_email text, p_old_email text DEFAULT NULL)
LANGUAGE plpgsql
AS $$
DECLARE
  v_new uuid;
  v_old uuid;
BEGIN
  SELECT id INTO v_new FROM auth.users WHERE lower(trim(email)) = lower(trim(p_new_email));
  IF v_new IS NULL THEN
    RAISE EXCEPTION 'No account found for %. Ask them to sign up on the website first, then run this again.', p_new_email;
  END IF;

  -- 1. New admin: super admin + admin, verified.
  UPDATE public.profiles
     SET role = 'super_admin', status = 'verified', verification_status = 'verified', updated_at = now()
   WHERE id = v_new;
  DELETE FROM public.user_roles WHERE user_id = v_new AND role IN ('member', 'doctor', 'student', 'researcher');
  INSERT INTO public.user_roles (user_id, role) VALUES (v_new, 'super_admin') ON CONFLICT (user_id, role) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (v_new, 'admin') ON CONFLICT (user_id, role) DO NOTHING;

  -- 2. Old admin (optional): back to a normal member of their verified type.
  IF p_old_email IS NOT NULL AND trim(p_old_email) <> '' THEN
    SELECT id INTO v_old FROM auth.users WHERE lower(trim(email)) = lower(trim(p_old_email));
    IF v_old IS NULL THEN
      RAISE EXCEPTION 'No account found for % (the admin to remove). Nothing was changed.', p_old_email;
    END IF;
    IF v_old = v_new THEN
      RAISE EXCEPTION 'The new and old admin are the same account. Nothing was changed.';
    END IF;
    DELETE FROM public.user_roles WHERE user_id = v_old AND role IN ('admin', 'super_admin', 'moderator');
    UPDATE public.profiles
       SET role = COALESCE(account_type, 'member'), updated_at = now()
     WHERE id = v_old;
    INSERT INTO public.user_roles (user_id, role)
    SELECT v_old, COALESCE(account_type, 'member') FROM public.profiles WHERE id = v_old
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  INSERT INTO public.admin_audit_logs (actor_id, actor_name, action, target_type, target_id, metadata)
  VALUES ('db-console', 'DB console: ' || session_user, 'SUPER_ADMIN_TRANSFERRED', 'profile', v_new::text,
          jsonb_build_object('new_admin', lower(trim(p_new_email)), 'removed_admin', lower(trim(p_old_email)), 'at', now()));

  RAISE NOTICE 'Admin access given to %', p_new_email;
END;
$$;

REVOKE ALL ON PROCEDURE public.transfer_super_admin(text, text) FROM PUBLIC, anon, authenticated, service_role;
