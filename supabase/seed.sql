-- Categories seed
INSERT INTO public.categories (id, name, slug, type, badge_color) VALUES
('clinical-cases', 'Clinical Case', 'clinical-cases', 'discussion', 'bg-teal-50 text-teal-700 border-teal-200'),
('research', 'Research', 'research', 'discussion', 'bg-sky-50 text-sky-700 border-sky-200'),
('practice-management', 'Practice Management', 'practice-management', 'discussion', 'bg-indigo-50 text-indigo-700 border-indigo-200'),
('events', 'Events & CMEs', 'events', 'event', 'bg-purple-50 text-purple-700 border-purple-200')
ON CONFLICT (id) DO NOTHING;
