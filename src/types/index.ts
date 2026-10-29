export type UserRole = 
  | 'public' 
  | 'applicant' 
  | 'member' 
  | 'doctor' 
  | 'student' 
  | 'researcher' 
  | 'moderator' 
  | 'admin' 
  | 'super_admin';

export type AccountType = 'doctor' | 'student' | 'researcher';

export type ApplicationStatus = 
  | 'draft' 
  | 'submitted' 
  | 'pending'  // profile awaiting verification (profiles.status)
  | 'pending_review' 
  | 'needs_information' 
  | 'verified' 
  | 'declined' 
  | 'rejected'
  | 'suspended';

export interface SocialLinks {
  linkedin?: string;
  website?: string;
  orcid?: string;
  whatsapp?: string;
}

export interface PrivacySettings {
  show_email: boolean;
  show_phone: boolean;
  show_experience?: boolean;
  show_location?: boolean;
  profile_visibility?: 'members_only' | 'private' | 'public';
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  display_name: string;
  avatar_url?: string;
  avatar_path?: string;
  role: UserRole;
  account_type?: AccountType;
  status: ApplicationStatus;
  verification_status?: 'pending' | 'verified' | 'rejected' | ApplicationStatus;
  qualification: string; // e.g. "BHMS", "MD (Hom)", "Undergraduate BHMS"
  experience_years: number;
  phone?: string;
  registration_number?: string;
  registration_authority?: string;
  state: string;
  city?: string;
  clinic_institution?: string;
  specialization?: string;
  bio?: string;
  interests?: string[];
  
  // Student-specific fields
  institution?: string;
  course_year?: string; // e.g. "3rd Year BHMS", "Intern"
  mentorship_needs?: string[]; // e.g. ["Case Taking", "Repertory", "Clinical Practice"]
  student_details?: {
    institution?: string;
    course_year?: string;
    mentorship_needs?: string[];
  };
  
  // Researcher/Educator-specific fields
  research_interests?: string;
  publications?: string;
  teaching_interests?: string;
  webinar_interest?: boolean;
  orcid_id?: string;
  researcher_details?: {
    academic_affiliation?: string;
    research_interests?: string[];
    publications_count?: number;
  };
  
  // Mentorship offering (for doctors/educators)
  mentorship_available?: boolean;
  
  // Settings & Links
  social_links?: SocialLinks;
  privacy_settings?: PrivacySettings;
  profile_visibility?: 'members_only' | 'private' | 'public';
  created_at: string;
  updated_at: string;
}

export interface PractitionerApplication {
  id: string;
  user_id?: string | null;
  full_name: string;
  email: string;
  phone: string;
  role_applied: AccountType; // 'doctor' | 'student' | 'researcher'
  qualification: string;
  registration_number?: string;
  registration_authority?: string;
  state: string;
  city?: string;
  clinic_institution?: string;
  experience_years?: number;
  specialization?: string;
  institution?: string;
  course_year?: string;
  mentorship_needs?: string[];
  research_interests?: string;
  publications?: string;
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

export interface VerificationReview {
  id: string;
  application_id: string;
  reviewer_id?: string;
  reviewer_name: string;
  previous_status?: string;
  new_status: string;
  decision_reason?: string;
  verification_source?: string;
  internal_notes?: string;
  created_at: string;
}

export interface PostLike {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

export type ConnectionStatus = 'pending' | 'accepted' | 'declined';

export interface ConnectionRequest {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar?: string;
  sender_role: UserRole;
  sender_qualification?: string;
  sender_location?: string;
  recipient_id: string;
  recipient_name: string;
  recipient_avatar?: string;
  recipient_role: UserRole;
  status: ConnectionStatus;
  /** Optional note from the sender (max 300 characters). */
  message?: string;
  created_at: string;
  updated_at: string;
}

export interface MentorshipRequest {
  id: string;
  student_id: string;
  student_name: string;
  student_avatar?: string;
  student_institution?: string;
  student_course_year?: string;
  mentor_id: string;
  mentor_name: string;
  mentor_avatar?: string;
  mentor_specialization?: string;
  message: string;
  goals: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  updated_at: string;
}

export type NotificationType = 
  | 'connection_request' 
  | 'connection_accepted' 
  | 'mentorship_request' 
  | 'mentorship_accepted' 
  | 'comment_reply' 
  | 'discussion_reply'
  | 'event_reminder' 
  | 'verification_update' 
  | 'system'
  | 'system_notice';

export interface AppNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
  action_url?: string;
  is_read: boolean;
  action_id?: string; // e.g. connection_request_id or mentorship_request_id
  action_status?: 'pending' | 'accepted' | 'declined';
  metadata?: Record<string, any>;
  created_at: string;
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
  attachment_url?: string;
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
  parent_comment_id?: string;
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
  status: 'published' | 'draft' | 'archived' | 'cancelled';
  attendees_count: number;
  image_url?: string;
  meeting_link?: string;
  created_by?: string;
}

export interface EventRegistration {
  id: string;
  event_id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  status: 'registered' | 'cancelled';
  registered_at: string;
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
  status: 'published' | 'draft' | 'expired' | 'pending_approval';
  posted_time_ago: string;
  created_by?: string;
}

export interface KnowledgePost {
  id: string;
  title: string;
  summary: string;
  source_url: string;
  journal: string;
  content_type: 'Systematic Review' | 'Clinical Trial' | 'Observational Study' | 'Materia Medica Analysis' | 'Regulatory Update' | 'Educational Resource';
  limitations: string;
  status: 'published' | 'draft' | 'archived';
  published_at: string;
  created_by?: string;
  author_name?: string;
  author_affiliation?: string;
  doi?: string;
  is_saved?: boolean;
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

export interface PlatformSettings {
  require_doctor_verification: boolean;
  require_researcher_verification: boolean;
  require_student_verification: boolean;
  allow_student_mentorship_requests?: boolean;
  enable_email_notifications?: boolean;
  auto_appeals_enabled?: boolean;
  auto_appeal_enabled?: boolean;
  announcement_banner?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  type: 'discussion' | 'event' | 'resource' | 'general';
  badge_color: string;
  active: boolean;
  created_at?: string;
}

export interface MetricItem {
  value: number | null;
  isAvailable: boolean;
  error?: string;
}

export interface AdminOverviewStats {
  totalMembers: MetricItem;
  doctorsCount: MetricItem;
  studentsCount: MetricItem;
  researchersCount: MetricItem;
  pendingApplications: MetricItem;
  verifiedPractitioners: MetricItem;
  rejectedApplications: MetricItem;
  communityPosts: MetricItem;
  openReports: MetricItem;
  upcomingEvents: MetricItem;
}
