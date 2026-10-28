-- ==============================================================================
-- Homeo Circle — Essential System Reference Data (Categories & System Settings)
-- Safe for production and staging instances
-- ==============================================================================

-- Discussion & Resource Categories
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

-- Default Platform Settings
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
