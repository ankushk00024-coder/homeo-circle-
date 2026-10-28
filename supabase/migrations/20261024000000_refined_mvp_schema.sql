-- ==============================================================================
-- Homeo Circle India — Refined MVP Schema & Role-Based Workflows
-- Migration: 20261024000000_refined_mvp_schema.sql
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. EXTEND PROFILES FOR UNIFIED ROLE-BASED SYSTEM
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'doctor' 
    CHECK (role IN ('doctor', 'student', 'researcher', 'admin', 'super_admin')),
  ADD COLUMN IF NOT EXISTS account_type text DEFAULT 'doctor'
    CHECK (account_type IN ('doctor', 'student', 'researcher')),
  ADD COLUMN IF NOT EXISTS verification_status text DEFAULT 'pending'
    CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  ADD COLUMN IF NOT EXISTS registration_number text,
  ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '{"linkedin":"","website":"","whatsapp":"","orcid":""}'::jsonb,
  ADD COLUMN IF NOT EXISTS privacy_settings jsonb DEFAULT '{"show_email":false,"show_phone":false,"show_experience":true}'::jsonb,
  ADD COLUMN IF NOT EXISTS student_details jsonb DEFAULT '{"institution":"","course_year":"","mentorship_needs":[]}'::jsonb,
  ADD COLUMN IF NOT EXISTS researcher_details jsonb DEFAULT '{"academic_affiliation":"","research_interests":[],"publications_count":0}'::jsonb;

-- ------------------------------------------------------------------------------
-- 2. PEER CONNECTION REQUESTS SYSTEM (Prevent self-connect & duplicate requests)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.connection_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT chk_not_self_connect CHECK (sender_id <> recipient_id),
  CONSTRAINT uq_connection_pair UNIQUE(sender_id, recipient_id)
);

ALTER TABLE public.connection_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view connection requests they sent or received"
  ON public.connection_requests FOR SELECT
  USING (sender_id = auth.uid() OR recipient_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can insert connection requests as sender"
  ON public.connection_requests FOR INSERT
  WITH CHECK (sender_id = auth.uid() AND sender_id <> recipient_id);

CREATE POLICY "Recipients or admins can update connection request status"
  ON public.connection_requests FOR UPDATE
  USING (recipient_id = auth.uid() OR sender_id = auth.uid() OR public.is_admin());

CREATE POLICY "Senders or admins can cancel connection requests"
  ON public.connection_requests FOR DELETE
  USING (sender_id = auth.uid() OR recipient_id = auth.uid() OR public.is_admin());

-- ------------------------------------------------------------------------------
-- 3. CLINICAL MENTORSHIP REQUESTS (Student Corner)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.mentorship_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mentor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  topics text[] DEFAULT '{}',
  message text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT chk_not_self_mentor CHECK (student_id <> mentor_id)
);

ALTER TABLE public.mentorship_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mentorship requests viewable by student or mentor"
  ON public.mentorship_requests FOR SELECT
  USING (student_id = auth.uid() OR mentor_id = auth.uid() OR public.is_admin());

CREATE POLICY "Students can submit mentorship requests"
  ON public.mentorship_requests FOR INSERT
  WITH CHECK (student_id = auth.uid() AND student_id <> mentor_id);

CREATE POLICY "Mentors or admins can update mentorship status"
  ON public.mentorship_requests FOR UPDATE
  USING (mentor_id = auth.uid() OR student_id = auth.uid() OR public.is_admin());

-- ------------------------------------------------------------------------------
-- 4. REAL-TIME IN-APP NOTIFICATIONS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.app_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('connection_request', 'connection_accepted', 'mentorship_request', 'discussion_reply', 'event_reminder', 'system_notice')),
  title text NOT NULL,
  message text NOT NULL,
  action_url text,
  is_read boolean NOT NULL DEFAULT false,
  sender_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.app_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.app_notifications FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can update own notification read state"
  ON public.app_notifications FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "System or authenticated peers can create notifications"
  ON public.app_notifications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ------------------------------------------------------------------------------
-- 5. EVENT REGISTRATIONS (CME Webinars & Study Circles)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.event_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  registered_at timestamptz DEFAULT now(),
  status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'attended')),
  CONSTRAINT uq_event_user_registration UNIQUE(event_id, user_id)
);

ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own event registrations"
  ON public.event_registrations FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can register for events"
  ON public.event_registrations FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can cancel own registration"
  ON public.event_registrations FOR DELETE
  USING (user_id = auth.uid() OR public.is_admin());

-- ------------------------------------------------------------------------------
-- 6. POST BOOKMARKS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.post_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT uq_user_post_bookmark UNIQUE(user_id, post_id)
);

ALTER TABLE public.post_bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookmarks"
  ON public.post_bookmarks FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert bookmarks"
  ON public.post_bookmarks FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own bookmarks"
  ON public.post_bookmarks FOR DELETE
  USING (user_id = auth.uid());

-- ------------------------------------------------------------------------------
-- 7. PLATFORM ADMINISTRATION SETTINGS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id text PRIMARY KEY DEFAULT 'global',
  require_doctor_verification boolean NOT NULL DEFAULT true,
  require_researcher_verification boolean NOT NULL DEFAULT true,
  require_student_verification boolean NOT NULL DEFAULT false,
  allow_student_mentorship_requests boolean NOT NULL DEFAULT true,
  auto_appeal_enabled boolean NOT NULL DEFAULT true,
  announcement_banner text,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform settings viewable by authenticated users"
  ON public.platform_settings FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Platform settings editable by super admins only"
  ON public.platform_settings FOR ALL
  USING (public.is_admin());

-- Insert default row if not exists
INSERT INTO public.platform_settings (id, require_doctor_verification, require_researcher_verification, require_student_verification, allow_student_mentorship_requests, auto_appeal_enabled)
VALUES ('global', true, true, false, true, true)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 8. QUERY OPTIMIZATION INDEXES
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_conn_requests_recipient ON public.connection_requests(recipient_id, status);
CREATE INDEX IF NOT EXISTS idx_conn_requests_sender ON public.connection_requests(sender_id, status);
CREATE INDEX IF NOT EXISTS idx_mentorship_requests_mentor ON public.mentorship_requests(mentor_id, status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.app_notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_event_registrations_user ON public.event_registrations(user_id, event_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON public.post_bookmarks(user_id, post_id);
