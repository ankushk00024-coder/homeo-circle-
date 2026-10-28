-- ==============================================================================
-- Homeo Circle — OPTIONAL Local Development Seed Data
-- CAUTION: DO NOT RUN THIS SCRIPT IN A PRODUCTION ENVIRONMENT!
-- This script contains sample dummy entities for local frontend verification only.
-- Real practitioners must register and undergo verification through official state gazettes.
-- ==============================================================================

-- Sample Public Event
INSERT INTO public.events (
  id,
  title,
  summary,
  organizer,
  speaker,
  speaker_title,
  date_badge_day,
  date_badge_month,
  time_display,
  start_at,
  format,
  location,
  registration_url,
  status,
  attendees_count
) VALUES (
  'e0000000-0000-0000-0000-000000000001',
  'Clinical Posology & Potency Selection in Chronic Pathologies',
  'Detailed exploration of minimum dose, repetition criteria, and potencies according to Organon 6th Edition.',
  'Homeo Circle Academic Council',
  'Dr. Sanjeev Bannerjee',
  'MD (Hom), Senior Consultant',
  '15',
  'NOV',
  '06:30 PM - 08:30 PM IST',
  now() + interval '18 days',
  'Webinar',
  'Live Stream (Member CME Portal)',
  'https://homeocircle.in/events',
  'published',
  42
) ON CONFLICT (id) DO NOTHING;

-- Sample Opportunity
INSERT INTO public.opportunities (
  id,
  title,
  organization,
  type,
  mode,
  location,
  timing,
  eligibility,
  deadline,
  description,
  application_url,
  status
) VALUES (
  'o0000000-0000-0000-0000-000000000001',
  'Clinical Research Fellowship in High-Dilution Pharmacology',
  'Central Council Research Affiliate, New Delhi',
  'Research',
  'Hybrid',
  'New Delhi, India',
  'Full-time',
  'MD (Hom) / Post-Graduate Scholars with research methodology background',
  '2026-12-15',
  'Join an observational and in-vitro study evaluating nanoparticle dynamics in serial ultramolecular dynamizations.',
  'https://homeocircle.in/opportunities',
  'published'
) ON CONFLICT (id) DO NOTHING;

-- Sample Knowledge Post
INSERT INTO public.knowledge_posts (
  id,
  title,
  journal,
  summary,
  limitations,
  source_url,
  content_type,
  status
) VALUES (
  'k0000000-0000-0000-0000-000000000001',
  'Individualized Homoeopathic Medicine in Chronic Dermatitis: A Double-Blind Placebo-Controlled Trial',
  'International Journal of High Dilution Research',
  'Multi-center randomized trial showing statistically significant improvement in SCORAD indices with constitutional simillimum.',
  'Single geographic cohort, requires replication across diverse pediatric subsets.',
  'https://pubmed.ncbi.nlm.nih.gov',
  'Clinical Trial',
  'published'
) ON CONFLICT (id) DO NOTHING;
