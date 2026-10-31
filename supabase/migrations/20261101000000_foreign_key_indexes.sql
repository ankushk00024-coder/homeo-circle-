-- ==============================================================================
-- Homeo Circle India — Indexes for foreign keys used in everyday queries
-- Migration: 20261101000000_foreign_key_indexes.sql
-- Supabase's performance advisor flagged these foreign keys as unindexed.
-- Adding indexes changes no data. Idempotent.
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_comments_post_id               ON public.comments (post_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id             ON public.comments (author_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_comment_id     ON public.comments (parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_posts_author_id                ON public.posts (author_id);
CREATE INDEX IF NOT EXISTS idx_posts_category_id              ON public.posts (category_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id             ON public.post_likes (user_id);
CREATE INDEX IF NOT EXISTS idx_post_bookmarks_post_id         ON public.post_bookmarks (post_id);
CREATE INDEX IF NOT EXISTS idx_applications_user_id           ON public.practitioner_applications (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_sender_id        ON public.app_notifications (sender_id);
CREATE INDEX IF NOT EXISTS idx_verification_reviews_app_id    ON public.verification_reviews (application_id);
CREATE INDEX IF NOT EXISTS idx_verification_reviews_reviewer  ON public.verification_reviews (reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter_id            ON public.reports (reporter_id);
CREATE INDEX IF NOT EXISTS idx_mentorship_requests_student_id ON public.mentorship_requests (student_id);
CREATE INDEX IF NOT EXISTS idx_events_created_by              ON public.events (created_by);
CREATE INDEX IF NOT EXISTS idx_knowledge_posts_created_by     ON public.knowledge_posts (created_by);
CREATE INDEX IF NOT EXISTS idx_opportunities_created_by       ON public.opportunities (created_by);
