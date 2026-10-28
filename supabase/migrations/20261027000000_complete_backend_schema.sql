-- ==============================================================================
-- Homeo Circle India — Complete Production-Grade Backend Schema & Security Policies
-- Migration: 20261027000000_complete_backend_schema.sql
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. SECURITY DEFINER FUNCTIONS WITH EXPLICIT SEARCH_PATH
-- ------------------------------------------------------------------------------

-- Check if current user is an admin or super_admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Check if current user is specifically a super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Check if current user is a moderator or admin
CREATE OR REPLACE FUNCTION public.is_moderator()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('moderator', 'admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Check if current user is an approved, verified member (doctor, student, researcher, admin)
CREATE OR REPLACE FUNCTION public.is_verified_member()
RETURNS boolean AS $$
BEGIN
  IF public.is_admin() OR public.is_moderator() THEN
    RETURN true;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND status = 'verified'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- ------------------------------------------------------------------------------
-- 2. ENSURE PROFILES COLUMNS & SAFE UPDATE TRIGGER
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS mentorship_available boolean DEFAULT false;

-- Populate email / full_name for profiles if missing
UPDATE public.profiles p
SET 
  email = COALESCE(p.email, u.email),
  full_name = COALESCE(p.full_name, p.display_name)
FROM auth.users u
WHERE p.id = u.id AND (p.email IS NULL OR p.full_name IS NULL);

-- Prevent regular users from self-elevating role or verification_status in profiles table
CREATE OR REPLACE FUNCTION public.prevent_self_elevation()
RETURNS trigger AS $$
BEGIN
  -- If not an admin, disallow changes to role and status
  IF NOT public.is_admin() THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'Privilege escalation rejected: Only administrators can modify account roles.';
    END IF;
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION 'Privilege escalation rejected: Only administrators can modify verification status.';
    END IF;
    IF NEW.verification_status IS DISTINCT FROM OLD.verification_status THEN
      RAISE EXCEPTION 'Privilege escalation rejected: Only administrators can modify verification badge status.';
    END IF;
  END IF;

  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_prevent_self_elevation ON public.profiles;
CREATE TRIGGER trg_prevent_self_elevation
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_self_elevation();

-- ------------------------------------------------------------------------------
-- 3. PRACTITIONER APPLICATIONS & VERIFICATION REVIEWS HISTORY
-- ------------------------------------------------------------------------------
ALTER TABLE public.practitioner_applications
  ADD COLUMN IF NOT EXISTS role_applied text NOT NULL DEFAULT 'doctor',
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS institution text,
  ADD COLUMN IF NOT EXISTS course_year text,
  ADD COLUMN IF NOT EXISTS mentorship_needs text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS research_interests text,
  ADD COLUMN IF NOT EXISTS publications text;

CREATE TABLE IF NOT EXISTS public.verification_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.practitioner_applications(id) ON DELETE CASCADE,
  reviewer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewer_name text NOT NULL,
  previous_status text,
  new_status text NOT NULL,
  decision_reason text,
  verification_source text,
  internal_notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.verification_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view verification reviews"
  ON public.verification_reviews FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can insert verification reviews"
  ON public.verification_reviews FOR INSERT
  WITH CHECK (public.is_admin());

-- Secure Application Determination Stored Procedure
CREATE OR REPLACE FUNCTION public.review_practitioner_application(
  p_application_id uuid,
  p_new_status text,
  p_decision_reason text DEFAULT NULL,
  p_verification_source text DEFAULT NULL,
  p_internal_notes text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_app record;
  v_reviewer_name text;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: Only administrators can review practitioner applications.';
  END IF;

  IF p_new_status NOT IN ('pending_review', 'needs_information', 'verified', 'declined', 'suspended') THEN
    RAISE EXCEPTION 'Invalid status transition: %', p_new_status;
  END IF;

  SELECT * INTO v_app FROM public.practitioner_applications WHERE id = p_application_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Application not found with id %', p_application_id;
  END IF;

  SELECT display_name INTO v_reviewer_name FROM public.profiles WHERE id = auth.uid();
  IF v_reviewer_name IS NULL THEN
    v_reviewer_name := 'Verification Officer';
  END IF;

  -- 1. Update application record
  UPDATE public.practitioner_applications
  SET 
    status = p_new_status,
    reviewed_at = now(),
    reviewed_by = v_reviewer_name,
    decision_reason = p_decision_reason,
    verification_source = p_verification_source,
    verification_checked_at = now(),
    internal_notes = p_internal_notes
  WHERE id = p_application_id;

  -- 2. Record immutable verification review history
  INSERT INTO public.verification_reviews (
    application_id,
    reviewer_id,
    reviewer_name,
    previous_status,
    new_status,
    decision_reason,
    verification_source,
    internal_notes
  ) VALUES (
    p_application_id,
    auth.uid(),
    v_reviewer_name,
    v_app.status,
    p_new_status,
    p_decision_reason,
    p_verification_source,
    p_internal_notes
  );

  -- 3. If application has an associated user, sync their profile status
  IF v_app.user_id IS NOT NULL THEN
    UPDATE public.profiles
    SET 
      status = p_new_status,
      verification_status = CASE 
        WHEN p_new_status = 'verified' THEN 'verified'
        WHEN p_new_status = 'declined' THEN 'rejected'
        ELSE 'pending'
      END,
      updated_at = now()
    WHERE id = v_app.user_id;

    -- Send in-app notification to applicant
    INSERT INTO public.app_notifications (
      user_id,
      type,
      title,
      message,
      link,
      action_status,
      metadata
    ) VALUES (
      v_app.user_id,
      'verification_update',
      CASE WHEN p_new_status = 'verified' THEN 'Credentials Verified!' ELSE 'Application Status Update' END,
      CASE 
        WHEN p_new_status = 'verified' THEN 'Your professional credentials have been verified by the council committee. Full community access is enabled.'
        WHEN p_new_status = 'declined' THEN COALESCE(p_decision_reason, 'Your registration could not be verified against the state register.')
        WHEN p_new_status = 'needs_information' THEN COALESCE(p_internal_notes, 'The committee requires additional information regarding your credentials.')
        ELSE 'Your application status was updated to: ' || p_new_status
      END,
      CASE WHEN p_new_status = 'verified' THEN '/dashboard' ELSE '/application-status' END,
      CASE WHEN p_new_status = 'verified' THEN 'accepted' WHEN p_new_status = 'declined' THEN 'declined' ELSE 'pending' END,
      jsonb_build_object('application_id', p_application_id, 'status', p_new_status)
    );
  END IF;

  -- 4. Record audit log
  INSERT INTO public.admin_audit_logs (
    actor_id,
    actor_name,
    action,
    target_type,
    target_id,
    metadata
  ) VALUES (
    auth.uid()::text,
    v_reviewer_name,
    'APPLICATION_' || upper(p_new_status),
    'practitioner_application',
    p_application_id::text,
    jsonb_build_object(
      'new_status', p_new_status,
      'previous_status', v_app.status,
      'applicant_name', v_app.full_name,
      'reason', p_decision_reason,
      'source', p_verification_source
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'application_id', p_application_id,
    'new_status', p_new_status
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- ------------------------------------------------------------------------------
-- 4. POST LIKES & REAL DATABASE COUNTERS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT uq_post_user_like UNIQUE(post_id, user_id)
);

ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Verified members can view post likes"
  ON public.post_likes FOR SELECT
  USING (public.is_verified_member() OR public.is_admin());

CREATE POLICY "Verified members can like posts"
  ON public.post_likes FOR INSERT
  WITH CHECK (public.is_verified_member() AND user_id = auth.uid());

CREATE POLICY "Users can remove their own post likes"
  ON public.post_likes FOR DELETE
  USING (user_id = auth.uid() OR public.is_admin());

-- Real-time count synchronizer for likes
CREATE OR REPLACE FUNCTION public.sync_post_likes_count()
RETURNS trigger AS $$
DECLARE
  v_post_id uuid;
BEGIN
  v_post_id := COALESCE(NEW.post_id, OLD.post_id);
  UPDATE public.posts
  SET likes_count = (SELECT count(*) FROM public.post_likes WHERE post_id = v_post_id)
  WHERE id = v_post_id;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_sync_post_likes_count ON public.post_likes;
CREATE TRIGGER trg_sync_post_likes_count
AFTER INSERT OR DELETE ON public.post_likes
FOR EACH ROW EXECUTE FUNCTION public.sync_post_likes_count();

-- Real-time count synchronizer for comments
CREATE OR REPLACE FUNCTION public.sync_post_comments_count()
RETURNS trigger AS $$
DECLARE
  v_post_id uuid;
BEGIN
  v_post_id := COALESCE(NEW.post_id, OLD.post_id);
  UPDATE public.posts
  SET comments_count = (SELECT count(*) FROM public.comments WHERE post_id = v_post_id AND status = 'published')
  WHERE id = v_post_id;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_sync_post_comments_count ON public.comments;
CREATE TRIGGER trg_sync_post_comments_count
AFTER INSERT OR UPDATE OF status OR DELETE ON public.comments
FOR EACH ROW EXECUTE FUNCTION public.sync_post_comments_count();

-- ------------------------------------------------------------------------------
-- 5. EVENT ATTENDEES REAL-TIME COUNTER
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_event_attendees_count()
RETURNS trigger AS $$
DECLARE
  v_event_id uuid;
BEGIN
  v_event_id := COALESCE(NEW.event_id, OLD.event_id);
  UPDATE public.events
  SET attendees_count = (
    SELECT count(*) FROM public.event_registrations 
    WHERE event_id = v_event_id AND status IN ('confirmed', 'attended', 'registered')
  )
  WHERE id = v_event_id;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_sync_event_attendees_count ON public.event_registrations;
CREATE TRIGGER trg_sync_event_attendees_count
AFTER INSERT OR UPDATE OF status OR DELETE ON public.event_registrations
FOR EACH ROW EXECUTE FUNCTION public.sync_event_attendees_count();

-- ------------------------------------------------------------------------------
-- 6. AUTOMATIC IN-APP NOTIFICATION TRIGGERS
-- ------------------------------------------------------------------------------

-- A. Connection Request Notifications
CREATE OR REPLACE FUNCTION public.notify_on_connection_request()
RETURNS trigger AS $$
DECLARE
  v_sender_name text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT display_name INTO v_sender_name FROM public.profiles WHERE id = NEW.sender_id;
    INSERT INTO public.app_notifications (
      user_id,
      sender_id,
      type,
      title,
      message,
      link,
      action_id,
      action_status,
      metadata
    ) VALUES (
      NEW.recipient_id,
      NEW.sender_id,
      'connection_request',
      'New Connection Request',
      COALESCE(v_sender_name, 'A member') || ' wants to connect with you.',
      '/members/' || NEW.sender_id,
      NEW.id::text,
      'pending',
      jsonb_build_object('sender_id', NEW.sender_id, 'request_id', NEW.id)
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status = 'accepted' THEN
    SELECT display_name INTO v_sender_name FROM public.profiles WHERE id = NEW.recipient_id;
    INSERT INTO public.app_notifications (
      user_id,
      sender_id,
      type,
      title,
      message,
      link,
      action_id,
      action_status,
      metadata
    ) VALUES (
      NEW.sender_id,
      NEW.recipient_id,
      'connection_accepted',
      'Connection Request Accepted',
      COALESCE(v_sender_name, 'A member') || ' accepted your connection request.',
      '/members/' || NEW.recipient_id,
      NEW.id::text,
      'accepted',
      jsonb_build_object('recipient_id', NEW.recipient_id, 'request_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_notify_connection_request ON public.connection_requests;
CREATE TRIGGER trg_notify_connection_request
AFTER INSERT OR UPDATE ON public.connection_requests
FOR EACH ROW EXECUTE FUNCTION public.notify_on_connection_request();

-- B. Mentorship Request Notifications
CREATE OR REPLACE FUNCTION public.notify_on_mentorship_request()
RETURNS trigger AS $$
DECLARE
  v_student_name text;
  v_mentor_name text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT display_name INTO v_student_name FROM public.profiles WHERE id = NEW.student_id;
    INSERT INTO public.app_notifications (
      user_id,
      sender_id,
      type,
      title,
      message,
      link,
      action_id,
      action_status,
      metadata
    ) VALUES (
      NEW.mentor_id,
      NEW.student_id,
      'mentorship_request',
      'New Student Mentorship Request',
      COALESCE(v_student_name, 'A student') || ' requested clinical case mentorship.',
      '/students?tab=mentors',
      NEW.id::text,
      'pending',
      jsonb_build_object('student_id', NEW.student_id, 'request_id', NEW.id)
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status = 'accepted' THEN
    SELECT display_name INTO v_mentor_name FROM public.profiles WHERE id = NEW.mentor_id;
    INSERT INTO public.app_notifications (
      user_id,
      sender_id,
      type,
      title,
      message,
      link,
      action_id,
      action_status,
      metadata
    ) VALUES (
      NEW.student_id,
      NEW.mentor_id,
      'mentorship_accepted',
      'Mentorship Accepted!',
      COALESCE(v_mentor_name, 'Your mentor') || ' accepted your mentorship request.',
      '/members/' || NEW.mentor_id,
      NEW.id::text,
      'accepted',
      jsonb_build_object('mentor_id', NEW.mentor_id, 'request_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_notify_mentorship_request ON public.mentorship_requests;
CREATE TRIGGER trg_notify_mentorship_request
AFTER INSERT OR UPDATE ON public.mentorship_requests
FOR EACH ROW EXECUTE FUNCTION public.notify_on_mentorship_request();

-- C. Comment Reply Notifications
CREATE OR REPLACE FUNCTION public.notify_on_comment()
RETURNS trigger AS $$
DECLARE
  v_post_author_id uuid;
  v_commenter_name text;
BEGIN
  SELECT author_id INTO v_post_author_id FROM public.posts WHERE id = NEW.post_id;
  
  -- Only notify if commenter is not the author themselves
  IF v_post_author_id IS NOT NULL AND v_post_author_id <> NEW.author_id THEN
    SELECT display_name INTO v_commenter_name FROM public.profiles WHERE id = NEW.author_id;
    INSERT INTO public.app_notifications (
      user_id,
      sender_id,
      type,
      title,
      message,
      link,
      metadata
    ) VALUES (
      v_post_author_id,
      NEW.author_id,
      'discussion_reply',
      'New Response on Your Post',
      COALESCE(v_commenter_name, 'A member') || ' commented on your clinical case discussion.',
      '/community/' || NEW.post_id,
      jsonb_build_object('post_id', NEW.post_id, 'comment_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_notify_comment ON public.comments;
CREATE TRIGGER trg_notify_comment
AFTER INSERT ON public.comments
FOR EACH ROW EXECUTE FUNCTION public.notify_on_comment();

-- ------------------------------------------------------------------------------
-- 7. SUPABASE AUTH USER INITIALIZATION TRIGGER
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_full_name text;
  v_account_type text;
  v_role text;
  v_status text;
BEGIN
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
  v_account_type := COALESCE(NEW.raw_user_meta_data->>'account_type', 'doctor');
  
  -- Assign role matching account_type, strictly refusing admin / super_admin elevation
  IF v_account_type IN ('doctor', 'student', 'researcher') THEN
    v_role := v_account_type;
  ELSE
    v_role := 'member';
    v_account_type := 'doctor';
  END IF;

  -- Default verification status:
  -- Students get status = 'verified' for immediate access to student corner
  -- Practitioners/researchers begin in 'pending_review' until reviewed by council admin
  IF v_account_type = 'student' THEN
    v_status := 'verified';
  ELSE
    v_status := 'pending_review';
  END IF;

  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    display_name,
    role,
    account_type,
    status,
    verification_status,
    qualification,
    state,
    clinic_institution,
    specialization,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    v_full_name,
    v_full_name,
    v_role,
    v_account_type,
    v_status,
    CASE WHEN v_status = 'verified' THEN 'verified' ELSE 'pending' END,
    COALESCE(NEW.raw_user_meta_data->>'qualification', CASE WHEN v_account_type = 'student' THEN 'Student BHMS' ELSE 'BHMS' END),
    COALESCE(NEW.raw_user_meta_data->>'state', 'Maharashtra'),
    COALESCE(NEW.raw_user_meta_data->>'clinic_institution', NEW.raw_user_meta_data->>'institution'),
    COALESCE(NEW.raw_user_meta_data->>'specialization', 'Clinical Practice'),
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name);

  -- Safe user role assignment
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, v_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 8. INITIAL SUPER ADMIN BOOTSTRAP PROCEDURE
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.bootstrap_super_admin(p_email text)
RETURNS jsonb AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- If super_admins already exist, ensure caller is a super_admin
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'super_admin') THEN
    IF NOT public.is_super_admin() THEN
      RAISE EXCEPTION 'Access denied: Initial bootstrap can only run when no super admin exists or caller is already a super admin.';
    END IF;
  END IF;

  SELECT id INTO v_user_id FROM auth.users WHERE email = lower(trim(p_email));
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Target user not found in auth.users for email: %', p_email;
  END IF;

  -- 1. Elevate profile
  UPDATE public.profiles
  SET 
    role = 'super_admin',
    status = 'verified',
    verification_status = 'verified',
    updated_at = now()
  WHERE id = v_user_id;

  -- 2. Elevate user_roles table
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'super_admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Also ensure admin role is present
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- 3. Log audit action
  INSERT INTO public.admin_audit_logs (
    actor_id,
    actor_name,
    action,
    target_type,
    target_id,
    metadata
  ) VALUES (
    COALESCE(auth.uid()::text, 'system_bootstrap'),
    'Super Admin Provisioning',
    'SUPER_ADMIN_ELEVATED',
    'profile',
    v_user_id::text,
    jsonb_build_object('email', p_email, 'timestamp', now())
  );

  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_user_id,
    'email', p_email,
    'role', 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- ------------------------------------------------------------------------------
-- 9. SUPABASE STORAGE BUCKET CONFIGURATION & RLS POLICIES
-- ------------------------------------------------------------------------------

-- Ensure storage buckets exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('verification-documents', 'verification-documents', false, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage Policies for 'avatars' bucket (Publicly viewable, users manage their own)
DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;
CREATE POLICY "Public can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' 
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' 
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage Policies for 'verification-documents' bucket (Strictly private: only applicant or admin)
DROP POLICY IF EXISTS "Applicant and admins can view verification documents" ON storage.objects;
CREATE POLICY "Applicant and admins can view verification documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'verification-documents'
    AND (
      (auth.uid() IS NOT NULL AND (storage.foldername(name))[1] = auth.uid()::text)
      OR public.is_admin()
    )
  );

DROP POLICY IF EXISTS "Applicants can upload their own verification documents" ON storage.objects;
CREATE POLICY "Applicants can upload their own verification documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'verification-documents'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Admins can delete verification documents" ON storage.objects;
CREATE POLICY "Admins can delete verification documents"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'verification-documents'
    AND public.is_admin()
  );

-- ------------------------------------------------------------------------------
-- 10. COMPREHENSIVE ROW LEVEL SECURITY HARMONIZATION
-- ------------------------------------------------------------------------------

-- Ensure RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practitioner_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connection_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentorship_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Post delete policy
DROP POLICY IF EXISTS "Authors or admins can delete posts" ON public.posts;
CREATE POLICY "Authors or admins can delete posts"
  ON public.posts FOR DELETE
  USING (author_id = auth.uid() OR public.is_admin());

-- Comment delete policy
DROP POLICY IF EXISTS "Authors or admins can delete comments" ON public.comments;
CREATE POLICY "Authors or admins can delete comments"
  ON public.comments FOR DELETE
  USING (author_id = auth.uid() OR public.is_admin());
