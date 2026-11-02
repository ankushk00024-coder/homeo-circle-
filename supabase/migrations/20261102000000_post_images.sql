-- ==============================================================================
-- Homeo Circle India — Photos in discussion posts
-- Migration: 20261102000000_post_images.sql
--
-- * posts.image_urls holds up to 4 photo URLs per post.
-- * 'post-images' storage bucket: public to read, members upload only into
--   their own folder (userId/...), authors or admins can delete. Photos are
--   compressed in the browser first (max ~500 KB), the bucket caps at 2 MB.
-- * The avatars bucket is capped at 2 MB too (the app uploads ~200 KB).
-- Idempotent.
-- ==============================================================================
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS image_urls text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_image_urls_max;
ALTER TABLE public.posts ADD CONSTRAINT posts_image_urls_max CHECK (cardinality(image_urls) <= 4);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('post-images', 'post-images', true, 2097152, ARRAY['image/webp', 'image/jpeg', 'image/png'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

UPDATE storage.buckets SET file_size_limit = 2097152 WHERE id = 'avatars';

DROP POLICY IF EXISTS "Public can view post images" ON storage.objects;
CREATE POLICY "Public can view post images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'post-images');

DROP POLICY IF EXISTS "Members can upload their own post images" ON storage.objects;
CREATE POLICY "Members can upload their own post images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'post-images'
    AND (storage.foldername(name))[1] = (select auth.uid())::text
    AND public.is_active_member()
  );

DROP POLICY IF EXISTS "Authors or admins can delete post images" ON storage.objects;
CREATE POLICY "Authors or admins can delete post images"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'post-images'
    AND ((storage.foldername(name))[1] = (select auth.uid())::text OR public.is_admin())
  );
