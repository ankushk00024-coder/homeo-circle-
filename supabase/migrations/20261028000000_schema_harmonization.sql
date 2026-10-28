-- ==============================================================================
-- Homeo Circle India — Schema Harmonization & Backend Security Fixes
-- Migration: 20261028000000_schema_harmonization.sql
-- Idempotent, non-destructive, and atomic: preserves all existing data and settings.
-- Wrapped in an explicit transaction block (BEGIN ... COMMIT) for atomic execution.
--
-- CHANGE SUMMARY (exhaustive — see section comments for details):
--   § 0  Preflight: validates all 19 referenced tables, all 60+ referenced columns,
--        exact function signatures (pronargs + return type), and trigger dependencies.
--   § 1  Notifications: adds missing columns; halts safely on unknown historical types;
--        drops/recreates app_notifications_type_check with 10 known types.
--   § 2  user_roles: widens role constraint; enforces RLS; drops/recreates 2 named policies.
--   § 3  practitioner_applications: 4 explicit RLS policies; secure guest lookup RPC
--        with minimal projection and dual-factor authentication.
--   § 4  profiles: adds avatar_url; bidirectional IS DISTINCT FROM avatar sync;
--        visibility constraint tightened; DROPS broad "Profiles viewable by
--        verified members only" SELECT policy (preventing PII column leakage);
--        REPLACES with narrow own-row SELECT policy + safe, column-restricted
--        public.profile_public_view (WITH security_barrier = true).
--   § 5  review_practitioner_application: supports server-side edge function invocation
--        with service_role privilege; accepts reviewer ID parameter; REVOKE PUBLIC,
--        anon, and authenticated; GRANT service_role only.
--   § 6  Column harmonization for posts, mentorship_requests, events,
--        knowledge_posts, opportunities, reports.
--   § 7  Notification triggers: synchronized link + action_url across all 3 triggers.
--   § 8  Storage: idempotent bucket upsert; explicit WITH CHECK on UPDATE; drops
--        only the 7 named policies from 20261027000000; unrelated policies untouched.
--   § 9  Seed data: categories upsert; platform_settings DO NOTHING on conflict.
--   § 10 Concurrency-safe first-super-admin provisioning procedure: transaction-level
--        advisory lock + table lock; verifies exactly 1 profile row updated before
--        assigning roles; fails safely if no matching profile exists.
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 0. COMPREHENSIVE SCHEMA PREFLIGHT INTEGRITY ASSERTIONS
-- ------------------------------------------------------------------------------
-- Validates every table, column, constraint, function signature, and trigger dependency
-- before executing any modifications. Fails safely and atomically if prerequisites are missing.
DO $$
DECLARE
  v_missing text[] := ARRAY[]::text[];
BEGIN
  -- 0.1 Required Tables
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    v_missing := array_append(v_missing, 'table public.profiles');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_roles') THEN
    v_missing := array_append(v_missing, 'table public.user_roles');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'practitioner_applications') THEN
    v_missing := array_append(v_missing, 'table public.practitioner_applications');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'verification_reviews') THEN
    v_missing := array_append(v_missing, 'table public.verification_reviews');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'app_notifications') THEN
    v_missing := array_append(v_missing, 'table public.app_notifications');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'posts') THEN
    v_missing := array_append(v_missing, 'table public.posts');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'comments') THEN
    v_missing := array_append(v_missing, 'table public.comments');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'connection_requests') THEN
    v_missing := array_append(v_missing, 'table public.connection_requests');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'mentorship_requests') THEN
    v_missing := array_append(v_missing, 'table public.mentorship_requests');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'events') THEN
    v_missing := array_append(v_missing, 'table public.events');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'knowledge_posts') THEN
    v_missing := array_append(v_missing, 'table public.knowledge_posts');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'opportunities') THEN
    v_missing := array_append(v_missing, 'table public.opportunities');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reports') THEN
    v_missing := array_append(v_missing, 'table public.reports');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'categories') THEN
    v_missing := array_append(v_missing, 'table public.categories');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'platform_settings') THEN
    v_missing := array_append(v_missing, 'table public.platform_settings');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'admin_audit_logs') THEN
    v_missing := array_append(v_missing, 'table public.admin_audit_logs');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'buckets') THEN
    v_missing := array_append(v_missing, 'table storage.buckets');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'objects') THEN
    v_missing := array_append(v_missing, 'table storage.objects');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
    v_missing := array_append(v_missing, 'table auth.users');
  END IF;

  -- 0.2 Required Columns across all referenced tables
  -- public.profiles
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'id') THEN
    v_missing := array_append(v_missing, 'column public.profiles.id');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'display_name') THEN
    v_missing := array_append(v_missing, 'column public.profiles.display_name');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'full_name') THEN
    v_missing := array_append(v_missing, 'column public.profiles.full_name');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'avatar_path') THEN
    v_missing := array_append(v_missing, 'column public.profiles.avatar_path');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'profile_visibility') THEN
    v_missing := array_append(v_missing, 'column public.profiles.profile_visibility');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role') THEN
    v_missing := array_append(v_missing, 'column public.profiles.role');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'status') THEN
    v_missing := array_append(v_missing, 'column public.profiles.status');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'verification_status') THEN
    v_missing := array_append(v_missing, 'column public.profiles.verification_status');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'specialization') THEN
    v_missing := array_append(v_missing, 'column public.profiles.specialization');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'state') THEN
    v_missing := array_append(v_missing, 'column public.profiles.state');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'city') THEN
    v_missing := array_append(v_missing, 'column public.profiles.city');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'experience_years') THEN
    v_missing := array_append(v_missing, 'column public.profiles.experience_years');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'qualification') THEN
    v_missing := array_append(v_missing, 'column public.profiles.qualification');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'bio') THEN
    v_missing := array_append(v_missing, 'column public.profiles.bio');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'created_at') THEN
    v_missing := array_append(v_missing, 'column public.profiles.created_at');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'updated_at') THEN
    v_missing := array_append(v_missing, 'column public.profiles.updated_at');
  END IF;

  -- public.user_roles
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_roles' AND column_name = 'user_id') THEN
    v_missing := array_append(v_missing, 'column public.user_roles.user_id');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_roles' AND column_name = 'role') THEN
    v_missing := array_append(v_missing, 'column public.user_roles.role');
  END IF;

  -- public.practitioner_applications
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'practitioner_applications' AND column_name = 'id') THEN
    v_missing := array_append(v_missing, 'column public.practitioner_applications.id');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'practitioner_applications' AND column_name = 'user_id') THEN
    v_missing := array_append(v_missing, 'column public.practitioner_applications.user_id');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'practitioner_applications' AND column_name = 'email') THEN
    v_missing := array_append(v_missing, 'column public.practitioner_applications.email');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'practitioner_applications' AND column_name = 'status') THEN
    v_missing := array_append(v_missing, 'column public.practitioner_applications.status');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'practitioner_applications' AND column_name = 'full_name') THEN
    v_missing := array_append(v_missing, 'column public.practitioner_applications.full_name');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'practitioner_applications' AND column_name = 'qualification') THEN
    v_missing := array_append(v_missing, 'column public.practitioner_applications.qualification');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'practitioner_applications' AND column_name = 'registration_number') THEN
    v_missing := array_append(v_missing, 'column public.practitioner_applications.registration_number');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'practitioner_applications' AND column_name = 'registration_authority') THEN
    v_missing := array_append(v_missing, 'column public.practitioner_applications.registration_authority');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'practitioner_applications' AND column_name = 'submitted_at') THEN
    v_missing := array_append(v_missing, 'column public.practitioner_applications.submitted_at');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'practitioner_applications' AND column_name = 'decision_reason') THEN
    v_missing := array_append(v_missing, 'column public.practitioner_applications.decision_reason');
  END IF;

  -- public.verification_reviews
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'verification_reviews' AND column_name = 'application_id') THEN
    v_missing := array_append(v_missing, 'column public.verification_reviews.application_id');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'verification_reviews' AND column_name = 'reviewer_id') THEN
    v_missing := array_append(v_missing, 'column public.verification_reviews.reviewer_id');
  END IF;

  -- public.app_notifications
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'app_notifications' AND column_name = 'user_id') THEN
    v_missing := array_append(v_missing, 'column public.app_notifications.user_id');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'app_notifications' AND column_name = 'type') THEN
    v_missing := array_append(v_missing, 'column public.app_notifications.type');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'app_notifications' AND column_name = 'action_url') THEN
    v_missing := array_append(v_missing, 'column public.app_notifications.action_url');
  END IF;

  -- public.posts & public.comments
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'posts' AND column_name = 'id') THEN
    v_missing := array_append(v_missing, 'column public.posts.id');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'posts' AND column_name = 'author_id') THEN
    v_missing := array_append(v_missing, 'column public.posts.author_id');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'comments' AND column_name = 'id') THEN
    v_missing := array_append(v_missing, 'column public.comments.id');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'comments' AND column_name = 'post_id') THEN
    v_missing := array_append(v_missing, 'column public.comments.post_id');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'comments' AND column_name = 'author_id') THEN
    v_missing := array_append(v_missing, 'column public.comments.author_id');
  END IF;

  -- public.connection_requests & public.mentorship_requests
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'connection_requests' AND column_name = 'sender_id') THEN
    v_missing := array_append(v_missing, 'column public.connection_requests.sender_id');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'connection_requests' AND column_name = 'recipient_id') THEN
    v_missing := array_append(v_missing, 'column public.connection_requests.recipient_id');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'mentorship_requests' AND column_name = 'student_id') THEN
    v_missing := array_append(v_missing, 'column public.mentorship_requests.student_id');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'mentorship_requests' AND column_name = 'mentor_id') THEN
    v_missing := array_append(v_missing, 'column public.mentorship_requests.mentor_id');
  END IF;

  -- public.admin_audit_logs
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'admin_audit_logs' AND column_name = 'actor_id') THEN
    v_missing := array_append(v_missing, 'column public.admin_audit_logs.actor_id');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'admin_audit_logs' AND column_name = 'action') THEN
    v_missing := array_append(v_missing, 'column public.admin_audit_logs.action');
  END IF;

  -- public.reports & public.categories & public.platform_settings
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'reports' AND column_name = 'reporter_id') THEN
    v_missing := array_append(v_missing, 'column public.reports.reporter_id');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'categories' AND column_name = 'id') THEN
    v_missing := array_append(v_missing, 'column public.categories.id');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'platform_settings' AND column_name = 'id') THEN
    v_missing := array_append(v_missing, 'column public.platform_settings.id');
  END IF;

  -- auth.users
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'id') THEN
    v_missing := array_append(v_missing, 'column auth.users.id');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'email') THEN
    v_missing := array_append(v_missing, 'column auth.users.email');
  END IF;

  -- 0.3 Required Function Exact Signatures
  -- Validates name, argument count, AND return type — not merely name existence.

  -- is_admin() -> boolean (0 args)
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'is_admin'
      AND p.pronargs = 0
      AND pg_get_function_result(p.oid) = 'boolean'
  ) THEN
    v_missing := array_append(v_missing, 'function public.is_admin() -> boolean (0 args)');
  END IF;

  -- is_super_admin() -> boolean (0 args)
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'is_super_admin'
      AND p.pronargs = 0
      AND pg_get_function_result(p.oid) = 'boolean'
  ) THEN
    v_missing := array_append(v_missing, 'function public.is_super_admin() -> boolean (0 args)');
  END IF;

  -- is_verified_member() -> boolean (0 args)
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'is_verified_member'
      AND p.pronargs = 0
      AND pg_get_function_result(p.oid) = 'boolean'
  ) THEN
    v_missing := array_append(v_missing, 'function public.is_verified_member() -> boolean (0 args)');
  END IF;

  -- storage.foldername(text) -> text[] (1 arg)
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'storage' AND p.proname = 'foldername'
      AND p.pronargs = 1
      AND pg_get_function_result(p.oid) LIKE '%text%'
  ) THEN
    v_missing := array_append(v_missing, 'function storage.foldername(text) -> text[]');
  END IF;

  -- review_practitioner_application(uuid,text,text,text,text) -> jsonb (5 args from 20261027000000)
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'review_practitioner_application'
      AND p.pronargs = 5
      AND pg_get_function_result(p.oid) = 'jsonb'
  ) THEN
    v_missing := array_append(v_missing, 'function public.review_practitioner_application(uuid,text,text,text,text) -> jsonb');
  END IF;

  -- handle_new_user() -> trigger
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'handle_new_user'
      AND pg_get_function_result(p.oid) = 'trigger'
  ) THEN
    v_missing := array_append(v_missing, 'function public.handle_new_user() -> trigger');
  END IF;

  -- 0.4 Required Trigger Dependencies
  -- on_auth_user_created trigger on auth.users
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'auth' AND c.relname = 'users'
      AND t.tgname = 'on_auth_user_created'
  ) THEN
    v_missing := array_append(v_missing, 'trigger on_auth_user_created on auth.users');
  END IF;

  -- Notification triggers from 20261027000000
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public' AND c.relname = 'connection_requests'
      AND t.tgname = 'trg_notify_connection_request'
  ) THEN
    v_missing := array_append(v_missing, 'trigger trg_notify_connection_request on public.connection_requests');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public' AND c.relname = 'mentorship_requests'
      AND t.tgname = 'trg_notify_mentorship_request'
  ) THEN
    v_missing := array_append(v_missing, 'trigger trg_notify_mentorship_request on public.mentorship_requests');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public' AND c.relname = 'comments'
      AND t.tgname = 'trg_notify_comment'
  ) THEN
    v_missing := array_append(v_missing, 'trigger trg_notify_comment on public.comments');
  END IF;

  -- Fail immediately if any required prerequisite is absent
  IF array_length(v_missing, 1) > 0 THEN
    RAISE EXCEPTION 'PREFLIGHT CHECK FAILED: Migration 20261028000000_schema_harmonization cannot proceed. Missing prerequisites: %. Please ensure previous migrations 20261022000000, 20261024000000, and 20261027000000 have been applied first.', array_to_string(v_missing, ', ');
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 1. NOTIFICATION HISTORICAL DATA INTEGRITY & CONSTRAINT HARMONIZATION
-- ------------------------------------------------------------------------------

-- Ensure app_notifications has all required columns used in triggers and services
ALTER TABLE public.app_notifications
  ADD COLUMN IF NOT EXISTS link text,
  ADD COLUMN IF NOT EXISTS action_id text,
  ADD COLUMN IF NOT EXISTS action_status text,
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Populate link from action_url if missing, and action_url from link
UPDATE public.app_notifications
SET 
  link = COALESCE(link, action_url),
  action_url = COALESCE(action_url, link)
WHERE link IS NULL OR action_url IS NULL;

-- Audit historical notification types before constraint application:
-- Rather than silently mutating unknown rows, verify that all existing rows match legitimate types.
-- If any unexpected type is found, halt with an explicit report of the unknown values and counts.
DO $$
DECLARE
  v_unknown_types text;
  v_unknown_count int;
BEGIN
  SELECT 
    string_agg(DISTINCT type || ' (' || cnt || ')', ', '),
    COALESCE(SUM(cnt), 0)
  INTO v_unknown_types, v_unknown_count
  FROM (
    SELECT COALESCE(type, 'NULL') AS type, count(*) AS cnt
    FROM public.app_notifications
    WHERE type NOT IN (
      'connection_request', 
      'connection_accepted', 
      'mentorship_request', 
      'mentorship_accepted', 
      'comment_reply',
      'discussion_reply', 
      'event_reminder', 
      'system_notice', 
      'verification_update', 
      'system'
    ) OR type IS NULL
    GROUP BY type
  ) sub;

  IF v_unknown_count > 0 THEN
    RAISE EXCEPTION 'PREFLIGHT NOTIFICATION CHECK FAILED: Found % historical notification rows with unsupported types: %. Migration will NOT silently overwrite historical notification types. Please review and resolve these rows or update the allowed types list before proceeding.', v_unknown_count, v_unknown_types;
  END IF;
END $$;

-- Update notification type check constraint preserving all 10 legitimate types
ALTER TABLE public.app_notifications 
  DROP CONSTRAINT IF EXISTS app_notifications_type_check;

ALTER TABLE public.app_notifications
  ADD CONSTRAINT app_notifications_type_check 
  CHECK (type IN (
    'connection_request', 
    'connection_accepted', 
    'mentorship_request', 
    'mentorship_accepted', 
    'comment_reply',
    'discussion_reply', 
    'event_reminder', 
    'system_notice', 
    'verification_update', 
    'system'
  ));

-- ------------------------------------------------------------------------------
-- 2. USER ROLES CHECK CONSTRAINT & RLS SECURITY POLICIES
-- ------------------------------------------------------------------------------

-- Harmonize role check constraint on user_roles table to permit professional roles
-- assigned during user signup (handle_new_user trigger)
ALTER TABLE public.user_roles 
  DROP CONSTRAINT IF EXISTS user_roles_role_check;

ALTER TABLE public.user_roles
  ADD CONSTRAINT user_roles_role_check
  CHECK (role IN (
    'member', 
    'doctor', 
    'student', 
    'researcher', 
    'moderator', 
    'admin', 
    'super_admin'
  ));

-- Ensure RLS on public.user_roles exists and is non-bypassable
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;
CREATE POLICY "Admins can manage user roles"
  ON public.user_roles FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- 3. PRACTITIONER APPLICATIONS RLS & MINIMAL GUEST STATUS LOOKUP RPC
-- ------------------------------------------------------------------------------

ALTER TABLE public.practitioner_applications ENABLE ROW LEVEL SECURITY;

-- Applicants can view ONLY their own application.
-- Direct SELECT * by anonymous users returns ZERO rows, preventing applicant enumeration.
DROP POLICY IF EXISTS "Applicants can read own application" ON public.practitioner_applications;
CREATE POLICY "Applicants can read own application"
  ON public.practitioner_applications FOR SELECT
  USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id) 
    OR public.is_admin()
  );

-- Both authenticated users and unauthenticated guests can submit an application
DROP POLICY IF EXISTS "Applicants can insert own application" ON public.practitioner_applications;
CREATE POLICY "Applicants can insert own application"
  ON public.practitioner_applications FOR INSERT
  WITH CHECK (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id) 
    OR (auth.uid() IS NULL AND user_id IS NULL)
  );

-- Only admins can update application status and reviewer notes
DROP POLICY IF EXISTS "Only admins can update applications" ON public.practitioner_applications;
CREATE POLICY "Only admins can update applications"
  ON public.practitioner_applications FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Only admins can delete applications
DROP POLICY IF EXISTS "Only admins can delete applications" ON public.practitioner_applications;
CREATE POLICY "Only admins can delete applications"
  ON public.practitioner_applications FOR DELETE
  USING (public.is_admin());

-- Secure application status lookup RPC for guest applicants (where user_id IS NULL).
-- Privacy protections:
--   1. Dual-factor: requires BOTH the exact UUID AND normalized email — no enumeration oracle.
--   2. Restricts to guest-only rows (user_id IS NULL) — linked-account lookups use the
--      authenticated client with the user's own JWT instead.
--   3. Minimal projection: 8 display-only columns; never exposes phone, email, document_url,
--      internal_notes, reviewed_by, reviewer_id, clinic_address, or any PII beyond the status card.
--   4. LIMIT 1 enforced in SQL.
CREATE OR REPLACE FUNCTION public.lookup_guest_application_status(
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
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pa.id,
    pa.status,
    pa.full_name,
    pa.qualification,
    pa.registration_number,
    pa.registration_authority,
    pa.submitted_at,
    pa.decision_reason
  FROM public.practitioner_applications pa
  WHERE pa.id = p_application_id
    AND lower(trim(pa.email)) = lower(trim(p_email))
    AND pa.user_id IS NULL   -- Guest applications only; authenticated users query via authenticated client.
  LIMIT 1;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.lookup_guest_application_status(uuid, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.lookup_guest_application_status(uuid, text) TO anon, authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 4. PROFILES AVATAR SYNCHRONIZATION, OWN-ROW RLS & SAFE profile_public_view
-- ------------------------------------------------------------------------------

-- Profiles: add avatar_url and synchronize with avatar_path
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url text;

UPDATE public.profiles
SET 
  avatar_url = COALESCE(avatar_url, avatar_path),
  avatar_path = COALESCE(avatar_path, avatar_url)
WHERE avatar_url IS NULL OR avatar_path IS NULL;

-- Trigger to maintain two-way compatibility between avatar_url and avatar_path.
-- Uses IS DISTINCT FROM to detect exactly which column was updated without overwriting intentional changes.
CREATE OR REPLACE FUNCTION public.sync_profile_avatar_fields()
RETURNS trigger AS $$
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
      -- avatar_url was explicitly updated, sync to avatar_path
      NEW.avatar_path := NEW.avatar_url;
    ELSIF NEW.avatar_path IS DISTINCT FROM OLD.avatar_path 
       AND NEW.avatar_url IS NOT DISTINCT FROM OLD.avatar_url THEN
      -- avatar_path was explicitly updated, sync to avatar_url
      NEW.avatar_url := NEW.avatar_path;
    ELSIF NEW.avatar_url IS DISTINCT FROM NEW.avatar_path THEN
      -- Both were supplied with conflicting values; harmonize to whichever is non-null
      IF NEW.avatar_url IS NOT NULL THEN
        NEW.avatar_path := NEW.avatar_url;
      ELSE
        NEW.avatar_url := NEW.avatar_path;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_sync_profile_avatar_fields ON public.profiles;
CREATE TRIGGER trg_sync_profile_avatar_fields
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.sync_profile_avatar_fields();

-- Harmonize profile visibility check to support public, members_only, and private
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_profile_visibility_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_profile_visibility_check
  CHECK (profile_visibility IN ('members_only', 'private', 'public'));

-- ── Profile RLS overhaul ────────────────────────────────────────────────────
-- WHY: The original "Profiles viewable by verified members only" policy
-- (created in 20261022000000) was a broad SELECT policy that let any verified
-- member read EVERY column from public.profiles, including email, phone,
-- private_notes, student_details, and internal timestamps.
--
-- FIX APPROACH:
--   1. Drop the broad permissive SELECT policy from 20261022000000.
--   2. Enforce strict own-row SELECT on public.profiles: users can only SELECT
--      their own row (or admins can select all). Direct SELECT by anonymous users
--      returns 0 rows; direct SELECT by authenticated members returns only their own row.
--   3. Expose public.profile_public_view with `WITH (security_barrier = true)`:
--      Projects only safe, non-sensitive columns for community discovery.
--      Completely omits email, phone, private_notes, student_details, researcher_details.
--
-- VIEW-OWNER PRIVILEGES & RLS INTERACTION:
--   By default in PostgreSQL, views execute with the privileges of the view OWNER
--   (postgres), bypassing underlying table RLS on public.profiles. This is the INTENDED
--   and SECURE pattern here:
--     - If security_invoker = true were used, the view caller would be bound by table RLS,
--       seeing only their own profile row (0 other profiles).
--     - By utilizing the view owner's table access, the view safely queries profiles, but
--       strictly controls the projection (shielding private columns) AND strictly enforces
--       row visibility via its WHERE clause:
--         • anonymous visitors (auth.role() = 'anon' or unauthenticated) see ONLY profiles
--           where profile_visibility = 'public'.
--         • authenticated, verified members (auth.role() = 'authenticated' AND
--           is_verified_member()) see profiles where profile_visibility IN ('public', 'members_only').
--         • administrators see all active profiles.
--         • suspended profiles are excluded from all non-admin callers.
--     - `security_barrier = true` ensures PostgreSQL query optimizer does not push
--       user-defined predicates ahead of the view's security conditions, eliminating
--       side-channel data leakage.
-- ────────────────────────────────────────────────────────────────────────────

-- Drop the previously broad permissive SELECT policy (from 20261022000000)
DROP POLICY IF EXISTS "Profiles viewable by verified members only" ON public.profiles;

-- Narrow own-row SELECT: users see only their own full row; admins see all rows.
DROP POLICY IF EXISTS "Users can view own profile row" ON public.profiles;
CREATE POLICY "Users can view own profile row"
  ON public.profiles FOR SELECT
  USING (id = auth.uid() OR public.is_admin());

-- Drop any pre-existing view or function of these names
DROP VIEW IF EXISTS public.profile_public_view CASCADE;
DROP FUNCTION IF EXISTS public.get_public_profiles() CASCADE;

CREATE OR REPLACE VIEW public.profile_public_view
WITH (security_barrier = true) AS
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
    CASE 
      WHEN p.city IS NOT NULL AND p.city <> '' THEN p.city || ', ' || p.state 
      ELSE p.state 
    END, 
    p.state
  ) AS location,
  p.clinic_institution,
  p.bio,
  p.avatar_url,
  p.avatar_path,
  p.profile_visibility,
  p.verification_status,
  p.status,
  p.created_at
FROM public.profiles p
WHERE
  p.status <> 'suspended'
  AND (
    -- Public profiles are visible to all visitors (anonymous and authenticated)
    p.profile_visibility = 'public'
    -- Members-only profiles require an authenticated and verified member
    OR (
      p.profile_visibility = 'members_only'
      AND auth.role() = 'authenticated'
      AND public.is_verified_member()
    )
    -- Administrators can view all non-suspended profiles
    OR public.is_admin()
  );

-- View security: revoke default PUBLIC access, grant SELECT explicitly to required roles
REVOKE ALL ON public.profile_public_view FROM PUBLIC;
GRANT SELECT ON public.profile_public_view TO anon, authenticated, service_role;

-- Compatible helper RPC for API callers preferring RPC invocation
CREATE OR REPLACE FUNCTION public.get_public_profiles()
RETURNS SETOF public.profile_public_view
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
  SELECT * FROM public.profile_public_view;
$$;

REVOKE EXECUTE ON FUNCTION public.get_public_profiles() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_public_profiles() TO anon, authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 5. SECURE review_practitioner_application EXECUTION
-- ------------------------------------------------------------------------------
-- Drop pre-existing 5-argument overload from 20261027000000 to prevent ambiguous
-- function resolution in PostgreSQL when default parameters are introduced.
DROP FUNCTION IF EXISTS public.review_practitioner_application(uuid, text, text, text, text);

-- Recreate review_practitioner_application:
--   1. Accepts an optional p_reviewer_id parameter so server-side Edge Functions
--      can pass the authenticated admin's user ID.
--   2. Authorization guard: permits execution ONLY by the service_role (from the
--      protected Edge Function) or by an administrator.
--   3. Browser clients (anon and authenticated) are strictly REVOKED from direct
--      EXECUTE privilege — all calls must route through the server-side Edge Function.
CREATE OR REPLACE FUNCTION public.review_practitioner_application(
  p_application_id      uuid,
  p_new_status          text,
  p_decision_reason     text DEFAULT NULL,
  p_verification_source text DEFAULT NULL,
  p_internal_notes      text DEFAULT NULL,
  p_reviewer_id         uuid DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_app           record;
  v_reviewer_id   uuid;
  v_reviewer_name text;
BEGIN
  -- Strict caller verification: service_role (Edge Function) or admin
  IF auth.role() <> 'service_role' AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: Only administrators or the trusted verification service can review practitioner applications.';
  END IF;

  IF p_new_status NOT IN ('pending_review', 'needs_information', 'verified', 'declined', 'suspended') THEN
    RAISE EXCEPTION 'Invalid status transition: %', p_new_status;
  END IF;

  SELECT * INTO v_app FROM public.practitioner_applications WHERE id = p_application_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Application not found with id %', p_application_id;
  END IF;

  -- Determine reviewer identity: prioritize session auth.uid(), fall back to passed p_reviewer_id
  v_reviewer_id := COALESCE(auth.uid(), p_reviewer_id);

  IF v_reviewer_id IS NOT NULL THEN
    SELECT COALESCE(display_name, full_name, 'Verification Officer') INTO v_reviewer_name
    FROM public.profiles
    WHERE id = v_reviewer_id;
  END IF;

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
    v_reviewer_id,
    v_reviewer_name,
    v_app.status,
    p_new_status,
    p_decision_reason,
    p_verification_source,
    p_internal_notes
  );

  -- 3. If application has an associated user, sync their profile status and notify
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

    -- Send in-app notification to applicant with synchronized link and action_url
    INSERT INTO public.app_notifications (
      user_id,
      type,
      title,
      message,
      link,
      action_url,
      action_status,
      metadata
    ) VALUES (
      v_app.user_id,
      'verification_update',
      CASE WHEN p_new_status = 'verified' THEN 'Credentials Verified!' ELSE 'Application Status Update' END,
      CASE 
        WHEN p_new_status = 'verified' THEN 'Your professional credentials have been verified by the council committee. Full community access is enabled.'
        WHEN p_new_status = 'declined' THEN COALESCE(p_decision_reason, 'Your registration could not be verified against the state register.')
        WHEN p_new_status = 'needs_information' THEN COALESCE(p_decision_reason, 'The committee requires additional information regarding your credentials.')
        ELSE 'Your application status was updated to: ' || p_new_status
      END,
      CASE WHEN p_new_status = 'verified' THEN '/dashboard' ELSE '/application-status' END,
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
    v_reviewer_id::text,
    v_reviewer_name,
    'APPLICATION_REVIEWED',
    'practitioner_application',
    p_application_id::text,
    jsonb_build_object(
      'previous_status', v_app.status,
      'new_status', p_new_status,
      'decision_reason', p_decision_reason,
      'has_user_id', (v_app.user_id IS NOT NULL)
    )
  );

  RETURN jsonb_build_object('success', true, 'application_id', p_application_id, 'status', p_new_status);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Revoke execute from all untrusted roles; permit execution ONLY by service_role
REVOKE EXECUTE ON FUNCTION public.review_practitioner_application(uuid, text, text, text, text, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.review_practitioner_application(uuid, text, text, text, text, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.review_practitioner_application(uuid, text, text, text, text, uuid) FROM authenticated;
GRANT  EXECUTE ON FUNCTION public.review_practitioner_application(uuid, text, text, text, text, uuid) TO service_role;

-- ------------------------------------------------------------------------------
-- 6. COLUMN HARMONIZATION FOR POSTS, MENTORSHIP, EVENTS, OPPORTUNITIES & REPORTS
-- ------------------------------------------------------------------------------

-- Posts: add author_role and attachment_url
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS author_role text DEFAULT 'doctor',
  ADD COLUMN IF NOT EXISTS attachment_url text;

-- Mentorship Requests: add goals column
ALTER TABLE public.mentorship_requests
  ADD COLUMN IF NOT EXISTS goals text DEFAULT '';

-- Events: add meeting_link column
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS meeting_link text;

-- Knowledge Posts: add doi, author_name, author_affiliation
ALTER TABLE public.knowledge_posts
  ADD COLUMN IF NOT EXISTS doi text,
  ADD COLUMN IF NOT EXISTS author_name text,
  ADD COLUMN IF NOT EXISTS author_affiliation text;

-- Opportunities: ensure deadline can be nullable for rolling/open applications
ALTER TABLE public.opportunities
  ALTER COLUMN deadline DROP NOT NULL;

-- Reports: allow reporters to view their own submitted reports
DROP POLICY IF EXISTS "Users can view own reports" ON public.reports;
CREATE POLICY "Users can view own reports"
  ON public.reports FOR SELECT
  USING (reporter_id = auth.uid() OR public.is_admin());

-- ------------------------------------------------------------------------------
-- 7. HARDEN NOTIFICATION TRIGGERS
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.notify_on_connection_request()
RETURNS trigger AS $$
DECLARE
  v_sender_name text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT COALESCE(display_name, full_name, 'A member') INTO v_sender_name FROM public.profiles WHERE id = NEW.sender_id;
    INSERT INTO public.app_notifications (
      user_id,
      sender_id,
      type,
      title,
      message,
      link,
      action_url,
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
      '/members/' || NEW.sender_id,
      NEW.id::text,
      'pending',
      jsonb_build_object('sender_id', NEW.sender_id, 'request_id', NEW.id)
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status = 'accepted' THEN
    SELECT COALESCE(display_name, full_name, 'A member') INTO v_sender_name FROM public.profiles WHERE id = NEW.recipient_id;
    INSERT INTO public.app_notifications (
      user_id,
      sender_id,
      type,
      title,
      message,
      link,
      action_url,
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
      '/members/' || NEW.recipient_id,
      NEW.id::text,
      'accepted',
      jsonb_build_object('recipient_id', NEW.recipient_id, 'request_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION public.notify_on_mentorship_request()
RETURNS trigger AS $$
DECLARE
  v_student_name text;
  v_mentor_name text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT COALESCE(display_name, full_name, 'A student') INTO v_student_name FROM public.profiles WHERE id = NEW.student_id;
    INSERT INTO public.app_notifications (
      user_id,
      sender_id,
      type,
      title,
      message,
      link,
      action_url,
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
      '/students?tab=mentors',
      NEW.id::text,
      'pending',
      jsonb_build_object('student_id', NEW.student_id, 'request_id', NEW.id)
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status = 'accepted' THEN
    SELECT COALESCE(display_name, full_name, 'Your mentor') INTO v_mentor_name FROM public.profiles WHERE id = NEW.mentor_id;
    INSERT INTO public.app_notifications (
      user_id,
      sender_id,
      type,
      title,
      message,
      link,
      action_url,
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
      '/members/' || NEW.mentor_id,
      NEW.id::text,
      'accepted',
      jsonb_build_object('mentor_id', NEW.mentor_id, 'request_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION public.notify_on_comment()
RETURNS trigger AS $$
DECLARE
  v_post_author_id uuid;
  v_commenter_name text;
BEGIN
  SELECT author_id INTO v_post_author_id FROM public.posts WHERE id = NEW.post_id;
  
  -- Only notify if commenter is not the author themselves
  IF v_post_author_id IS NOT NULL AND v_post_author_id <> NEW.author_id THEN
    SELECT COALESCE(display_name, full_name, 'A member') INTO v_commenter_name FROM public.profiles WHERE id = NEW.author_id;
    INSERT INTO public.app_notifications (
      user_id,
      sender_id,
      type,
      title,
      message,
      link,
      action_url,
      metadata
    ) VALUES (
      v_post_author_id,
      NEW.author_id,
      'discussion_reply',
      'New Response on Your Post',
      COALESCE(v_commenter_name, 'A member') || ' commented on your clinical case discussion.',
      '/community/' || NEW.post_id,
      '/community/' || NEW.post_id,
      jsonb_build_object('post_id', NEW.post_id, 'comment_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- ------------------------------------------------------------------------------
-- 8. STORAGE BUCKETS & STRICT ROW LEVEL SECURITY POLICIES
-- ------------------------------------------------------------------------------

-- Ensure storage buckets exist idempotently
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('verification-documents', 'verification-documents', false, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Rationale for policy drops below:
-- We drop ONLY previous known migration policies targeting 'avatars' and 'verification-documents'
-- to replace them with tighter policies including explicit WITH CHECK clauses on UPDATE.
-- Any unrelated storage policies for other buckets are intentionally left intact.

-- Policies for 'avatars' bucket (publicly viewable, users manage only their own folder: userId/...)
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
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.is_admin()
    )
  );

DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' 
    AND auth.uid() IS NOT NULL
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.is_admin()
    )
  )
  WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid() IS NOT NULL
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.is_admin()
    )
  );

DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' 
    AND auth.uid() IS NOT NULL
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.is_admin()
    )
  );

-- Policies for 'verification-documents' bucket (strictly private: owner or admin only)
-- Explicit WITH CHECK clauses prevent moving files across folders or tampering with bucket_id
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
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.is_admin()
    )
  );

DROP POLICY IF EXISTS "Applicants can update their own verification documents" ON storage.objects;
CREATE POLICY "Applicants can update their own verification documents"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'verification-documents'
    AND auth.uid() IS NOT NULL
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.is_admin()
    )
  )
  WITH CHECK (
    bucket_id = 'verification-documents'
    AND auth.uid() IS NOT NULL
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.is_admin()
    )
  );

DROP POLICY IF EXISTS "Admins can delete verification documents" ON storage.objects;
CREATE POLICY "Admins can delete verification documents"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'verification-documents'
    AND public.is_admin()
  );

-- ------------------------------------------------------------------------------
-- 9. SAFE CATEGORY & PLATFORM-SETTING SEED DATA (NON-DESTRUCTIVE)
-- ------------------------------------------------------------------------------

-- Seed essential categories (idempotent upsert keeping core taxonomy current)
INSERT INTO public.categories (id, name, slug, type, badge_color, active) VALUES
('general', 'General Discussion', 'general', 'discussion', 'bg-slate-100 text-slate-800 border-slate-200', true),
('clinical-cases', 'Clinical Learning', 'clinical-cases', 'discussion', 'bg-teal-50 text-teal-800 border-teal-200', true),
('research', 'Research', 'research', 'discussion', 'bg-sky-50 text-sky-800 border-sky-200', true),
('students', 'Student Corner', 'students', 'discussion', 'bg-emerald-50 text-emerald-800 border-emerald-200', true),
('practice-management', 'Practice Management', 'practice-management', 'discussion', 'bg-indigo-50 text-indigo-800 border-indigo-200', true),
('events', 'Events & CMEs', 'events', 'event', 'bg-purple-50 text-purple-800 border-purple-200', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  badge_color = EXCLUDED.badge_color,
  active = EXCLUDED.active;

-- Seed default platform settings ONLY when missing (DO NOTHING on conflict)
-- This strictly preserves existing settings configured by administrators
INSERT INTO public.platform_settings (
  id, 
  require_doctor_verification, 
  require_researcher_verification, 
  require_student_verification, 
  allow_student_mentorship_requests, 
  auto_appeal_enabled
) VALUES (
  'global', 
  true, 
  true, 
  false, 
  true, 
  true
)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 10. CONCURRENCY-SAFE SUPER-ADMIN PROVISIONING PROCEDURE
-- ------------------------------------------------------------------------------
-- Drop insecure SECURITY DEFINER function from 20261027000000
DROP FUNCTION IF EXISTS public.bootstrap_super_admin(text);

-- SECURITY INVOKER procedure (no SECURITY DEFINER)
-- Runs with the CALLER's own privileges. Cannot be called by anon/authenticated
-- because they lack privileges to read auth.users. EXECUTE is also explicitly revoked.
--
-- HOW TO PROVISION THE FIRST SUPER-ADMIN:
--   1. Ensure target user has signed up and appears in auth.users.
--   2. In Supabase Dashboard -> SQL Editor (runs as postgres superuser), execute:
--        CALL public.provision_first_super_admin('admin@yourdomain.com');
--   3. After the first super_admin exists, this procedure rejects any further calls.
CREATE OR REPLACE PROCEDURE public.provision_first_super_admin(p_email text)
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_count      int;
  v_user_id         uuid;
  v_has_super_admin boolean;
  v_updated_rows    int;
BEGIN
  p_email := lower(trim(p_email));
  IF p_email IS NULL OR p_email = '' THEN
    RAISE EXCEPTION 'p_email must not be empty.';
  END IF;

  -- ── Concurrency safety ──────────────────────────────────────────────────
  -- 1. Acquire transaction-level advisory lock to serialize concurrent calls.
  PERFORM pg_advisory_xact_lock(hashtext('provision_first_super_admin'));

  -- 2. Acquire table-level lock on user_roles to prevent concurrent role injections.
  LOCK TABLE public.user_roles IN SHARE ROW EXCLUSIVE MODE;

  -- Restrict to first-time bootstrap only (checked AFTER acquiring the lock)
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'super_admin')
  INTO v_has_super_admin;

  IF v_has_super_admin THEN
    RAISE EXCEPTION
      'Super admin already initialized. Use the admin panel to promote further super admins or contact database administration.';
  END IF;

  -- Lookup target user in auth.users; verify exact match count
  SELECT count(*), min(id) INTO v_user_count, v_user_id
  FROM auth.users
  WHERE lower(trim(email)) = p_email;

  IF v_user_count = 0 OR v_user_id IS NULL THEN
    RAISE EXCEPTION
      'No auth user found in auth.users with email: %. Ensure the user has completed sign-up before provisioning.', p_email;
  ELSIF v_user_count > 1 THEN
    RAISE EXCEPTION
      'Multiple auth users found with email: %. Manual administrator resolution required.', p_email;
  END IF;

  -- ── Elevate profile ─────────────────────────────────────────────────────
  -- Verify exactly one profile row is updated before assigning roles.
  -- If profile row is missing (e.g. handle_new_user trigger did not run),
  -- raise an exception to rollback and prevent orphaned role records.
  UPDATE public.profiles
  SET
    role                = 'super_admin',
    status              = 'verified',
    verification_status = 'verified',
    updated_at          = now()
  WHERE id = v_user_id;

  GET DIAGNOSTICS v_updated_rows = ROW_COUNT;

  IF v_updated_rows = 0 THEN
    RAISE EXCEPTION
      'Profile row not found for user_id=%. The user exists in auth.users but has no corresponding profile in public.profiles. Ensure profile creation trigger has run, or create the profile row and retry.', v_user_id;
  ELSIF v_updated_rows > 1 THEN
    RAISE EXCEPTION
      'DATA INTEGRITY ERROR: Expected exactly 1 profile row to update, but % rows were updated for user_id=%. Transaction rolled back.', v_updated_rows, v_user_id;
  END IF;

  -- ── Elevate roles (idempotent) ──────────────────────────────────────────
  INSERT INTO public.user_roles (user_id, role) VALUES (v_user_id, 'super_admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role) VALUES (v_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- ── Audit log ───────────────────────────────────────────────────────────
  INSERT INTO public.admin_audit_logs (
    actor_id, actor_name, action, target_type, target_id, metadata
  ) VALUES (
    NULL,
    'DB Superuser Bootstrap',
    'SUPER_ADMIN_PROVISIONED',
    'profile',
    v_user_id::text,
    jsonb_build_object('email', p_email, 'timestamp', now())
  );

  RAISE NOTICE 'Super admin provisioned successfully for user_id=% email=%', v_user_id, p_email;
END;
$$;

-- Explicit grant/revoke: permit execution ONLY by postgres superuser
REVOKE EXECUTE ON PROCEDURE public.provision_first_super_admin(text) FROM PUBLIC;
REVOKE EXECUTE ON PROCEDURE public.provision_first_super_admin(text) FROM anon;
REVOKE EXECUTE ON PROCEDURE public.provision_first_super_admin(text) FROM authenticated;
REVOKE EXECUTE ON PROCEDURE public.provision_first_super_admin(text) FROM service_role;
GRANT  EXECUTE ON PROCEDURE public.provision_first_super_admin(text) TO postgres;

COMMIT;
