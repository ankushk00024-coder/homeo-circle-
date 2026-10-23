export type UserRole = 'public' | 'applicant' | 'member' | 'moderator' | 'admin' | 'super_admin';

export type ApplicationStatus = 
  | 'draft' 
  | 'submitted' 
  | 'pending_review' 
  | 'needs_information' 
  | 'verified' 
  | 'declined' 
  | 'suspended';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  display_name: string;
  avatar_url?: string;
  role: UserRole;
  status: ApplicationStatus;
  qualification: string; // e.g. "BHMS", "MD (Hom)"
  experience_years: number;
  registration_number?: string;
  registration_authority?: string;
  state: string;
  clinic_institution?: string;
  specialization?: string;
  bio?: string;
  interests?: string[];
  profile_visibility?: 'members_only' | 'private';
  created_at: string;
  updated_at: string;
}

export interface PractitionerApplication {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  qualification: string;
  registration_number: string;
  registration_authority: string;
  state: string;
  clinic_institution?: string;
  experience_years: number;
  specialization?: string;
  consent_at: string;
  status: ApplicationStatus;
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  decision_reason?: string;
  verification_source?: string;
  verification_checked_at?: string;
  internal_notes?: string;
  document_url?: string;
}

export interface Post {
  id: string;
  author_id: string;
  author_name: string;
  author_avatar?: string;
  author_qualification?: string;
  author_experience?: string;
  author_role: UserRole;
  title: string;
  body: string;
  category_id: string;
  category_name: string;
  category_badge_color: string;
  source_url?: string;
  status: 'published' | 'hidden' | 'removed';
  likes_count: number;
  comments_count: number;
  is_liked?: boolean;
  is_saved?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  author_name: string;
  author_avatar?: string;
  author_qualification?: string;
  body: string;
  status: 'published' | 'hidden' | 'removed';
  created_at: string;
}

export interface Event {
  id: string;
  title: string;
  summary: string;
  organizer: string;
  speaker: string;
  speaker_title?: string;
  date_badge_day: string;
  date_badge_month: string;
  time_display: string;
  start_at: string;
  end_at?: string;
  format: 'Webinar' | 'Conference' | 'Workshop' | 'Study Circle' | 'State Chapter CME';
  location: string;
  registration_url: string;
  source_url?: string;
  status: 'published' | 'draft' | 'archived';
  attendees_count: number;
  image_url?: string;
  created_by?: string;
}

export interface Opportunity {
  id: string;
  title: string;
  organization: string;
  type: 'Job' | 'Internship' | 'Research' | 'Collaboration';
  description: string;
  eligibility: string;
  location: string;
  mode: 'On-site' | 'Remote' | 'Hybrid';
  timing: 'Full-time' | 'Part-time' | 'Contract';
  deadline: string;
  source_url?: string;
  application_url: string;
  status: 'published' | 'draft' | 'expired';
  posted_time_ago: string;
  created_by?: string;
}

export interface KnowledgePost {
  id: string;
  title: string;
  summary: string;
  source_url: string;
  journal: string;
  content_type: 'Systematic Review' | 'Clinical Trial' | 'Observational Study' | 'Materia Medica Analysis' | 'Regulatory Update';
  limitations: string;
  status: 'published' | 'draft' | 'archived';
  published_at: string;
  created_by?: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  reporter_name?: string;
  target_type: 'post' | 'comment' | 'member';
  target_id: string;
  target_title: string;
  reason: 'patient_privacy' | 'misleading_clinical_claim' | 'unsolicited_promotion' | 'harassment' | 'unverified_credentials';
  note?: string;
  status: 'open' | 'under_review' | 'resolved' | 'dismissed';
  created_at: string;
  resolution_note?: string;
  resolved_at?: string;
}

export interface AuditLog {
  id: string;
  actor_id: string;
  actor_name: string;
  action: string;
  target_type: string;
  target_id: string;
  metadata: Record<string, any>;
  created_at: string;
}
