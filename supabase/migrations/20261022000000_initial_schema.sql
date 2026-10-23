-- ==============================================================================
-- Homeo Circle India — Supabase Initial Database Schema & RLS Security Policies
-- Migration: 20261022000000_initial_schema.sql
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. USER ROLES & ACCESS CONTROL HELPER FUNCTIONS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'admin', 'super_admin')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Helper to check if current user is an admin or super_admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper to check if current user is an approved, verified practitioner
CREATE OR REPLACE FUNCTION public.is_verified_member()
RETURNS boolean AS $$
BEGIN
  -- If user has admin/super_admin role
  IF public.is_admin() THEN
    RETURN true;
  END IF;

  -- Or user has verified profile status
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND status = 'verified'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- 2. PRACTITIONER PROFILES (Safe member-visible details only)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  avatar_path text,
  state text NOT NULL,
  qualification text NOT NULL DEFAULT 'BHMS',
  experience_years int DEFAULT 5,
  registration_authority text,
  specialization text DEFAULT 'Clinical Practice',
  clinic_institution text,
  bio text,
  interests text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'verified' CHECK (status IN ('verified', 'suspended', 'pending')),
  profile_visibility text DEFAULT 'members_only' CHECK (profile_visibility IN ('members_only', 'private')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Only verified members or admins can view member profiles
CREATE POLICY "Profiles viewable by verified members only"
  ON public.profiles FOR SELECT
  USING (
    (public.is_verified_member() AND profile_visibility = 'members_only')
    OR id = auth.uid()
    OR public.is_admin()
  );

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid() OR public.is_admin());

CREATE POLICY "Admins can insert profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (id = auth.uid() OR public.is_admin());

-- ------------------------------------------------------------------------------
-- 3. PRACTITIONER APPLICATIONS (Private verification records)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.practitioner_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  qualification text NOT NULL,
  registration_number text NOT NULL,
  registration_authority text NOT NULL,
  state text NOT NULL,
  clinic_institution text,
  experience_years int DEFAULT 0,
  specialization text,
  consent_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'pending_review' 
    CHECK (status IN ('draft', 'submitted', 'pending_review', 'needs_information', 'verified', 'declined', 'suspended')),
  submitted_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by text,
  decision_reason text,
  verification_source text,
  verification_checked_at timestamptz,
  internal_notes text,
  document_url text
);

ALTER TABLE public.practitioner_applications ENABLE ROW LEVEL SECURITY;

-- Applicants can view ONLY their own application
CREATE POLICY "Applicants can read own application"
  ON public.practitioner_applications FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

-- Authenticated users can insert an application
CREATE POLICY "Applicants can insert own application"
  ON public.practitioner_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Only admins can update application status and reviewer notes
CREATE POLICY "Only admins can update applications"
  ON public.practitioner_applications FOR UPDATE
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 4. CATEGORIES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
  id text PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  type text NOT NULL CHECK (type IN ('discussion', 'event', 'opportunity', 'knowledge')),
  badge_color text DEFAULT 'bg-teal-50 text-teal-700 border-teal-200',
  active boolean DEFAULT true
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories viewable by authenticated users"
  ON public.categories FOR SELECT
  USING (true);

-- ------------------------------------------------------------------------------
-- 5. DISCUSSION POSTS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES auth.users(id),
  author_name text NOT NULL,
  author_avatar text,
  author_qualification text,
  author_experience text,
  title text NOT NULL,
  body text NOT NULL,
  category_id text REFERENCES public.categories(id),
  category_name text NOT NULL DEFAULT 'Clinical Case',
  category_badge_color text DEFAULT 'bg-teal-50 text-teal-700 border-teal-200',
  source_url text,
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'hidden', 'removed')),
  likes_count int DEFAULT 0,
  comments_count int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Security Rule: ONLY verified members can read published posts
CREATE POLICY "Verified members can read published posts"
  ON public.posts FOR SELECT
  USING (
    (public.is_verified_member() AND status = 'published')
    OR author_id = auth.uid()
    OR public.is_admin()
  );

CREATE POLICY "Verified members can create posts"
  ON public.posts FOR INSERT
  WITH CHECK (public.is_verified_member() AND author_id = auth.uid());

CREATE POLICY "Authors or admins can update posts"
  ON public.posts FOR UPDATE
  USING (author_id = auth.uid() OR public.is_admin());

-- ------------------------------------------------------------------------------
-- 6. COMMENTS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id),
  author_name text NOT NULL,
  author_avatar text,
  author_qualification text,
  parent_comment_id uuid REFERENCES public.comments(id) ON DELETE CASCADE,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'hidden', 'removed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Verified members can read comments"
  ON public.comments FOR SELECT
  USING (public.is_verified_member() OR public.is_admin());

CREATE POLICY "Verified members can insert comments"
  ON public.comments FOR INSERT
  WITH CHECK (public.is_verified_member() AND author_id = auth.uid());

-- ------------------------------------------------------------------------------
-- 7. EVENTS & WEBINARS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  summary text NOT NULL,
  organizer text NOT NULL,
  speaker text NOT NULL,
  speaker_title text,
  date_badge_day text NOT NULL,
  date_badge_month text NOT NULL,
  time_display text NOT NULL,
  start_at timestamptz NOT NULL,
  end_at timestamptz,
  format text NOT NULL DEFAULT 'Webinar',
  location text NOT NULL,
  registration_url text NOT NULL,
  source_url text,
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'draft', 'archived')),
  attendees_count int DEFAULT 0,
  image_url text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Verified members can read published events"
  ON public.events FOR SELECT
  USING (public.is_verified_member() OR public.is_admin());

CREATE POLICY "Admins can manage events"
  ON public.events FOR ALL
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 8. OPPORTUNITIES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  organization text NOT NULL,
  type text NOT NULL CHECK (type IN ('Job', 'Internship', 'Research', 'Collaboration')),
  description text NOT NULL,
  eligibility text NOT NULL,
  location text NOT NULL,
  mode text NOT NULL DEFAULT 'On-site',
  timing text NOT NULL DEFAULT 'Full-time',
  deadline date NOT NULL,
  source_url text,
  application_url text NOT NULL,
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'draft', 'expired')),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Verified members can read opportunities"
  ON public.opportunities FOR SELECT
  USING (public.is_verified_member() OR public.is_admin());

CREATE POLICY "Admins can manage opportunities"
  ON public.opportunities FOR ALL
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 9. KNOWLEDGE & CURATED RESEARCH
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.knowledge_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  summary text NOT NULL,
  journal text NOT NULL,
  source_url text NOT NULL,
  content_type text NOT NULL,
  limitations text NOT NULL,
  status text NOT NULL DEFAULT 'published',
  published_at date NOT NULL DEFAULT CURRENT_DATE,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.knowledge_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Verified members can read research"
  ON public.knowledge_posts FOR SELECT
  USING (public.is_verified_member() OR public.is_admin());

CREATE POLICY "Admins can manage knowledge posts"
  ON public.knowledge_posts FOR ALL
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 10. CONTENT REPORTS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES auth.users(id),
  reporter_name text,
  target_type text NOT NULL CHECK (target_type IN ('post', 'comment', 'member')),
  target_id text NOT NULL,
  target_title text NOT NULL,
  reason text NOT NULL,
  note text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'resolved', 'dismissed')),
  resolution_note text,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can submit reports"
  ON public.reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Admins can view and manage reports"
  ON public.reports FOR ALL
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 11. ADMIN AUDIT LOGS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id text NOT NULL,
  actor_name text NOT NULL,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view audit logs"
  ON public.admin_audit_logs FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins or server actions can insert audit logs"
  ON public.admin_audit_logs FOR INSERT
  WITH CHECK (public.is_admin());
