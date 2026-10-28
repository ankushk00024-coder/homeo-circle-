import { 
  UserProfile, 
  Post, 
  Event, 
  Opportunity, 
  KnowledgePost, 
  PractitionerApplication, 
  AuditLog,
  ConnectionRequest,
  MentorshipRequest,
  AppNotification,
  EventRegistration,
  PlatformSettings
} from '../types';

export const initialMembers: UserProfile[] = [
  // 1. Senior Doctor / Practitioner (Default member)
  {
    id: 'user-ananya',
    email: 'ananya@homeocircle.in',
    full_name: 'Dr. Ananya Sharma',
    display_name: 'Dr. Ananya',
    avatar_url: 'https://images.unsplash.com/photo-1594824813633-4f24f8087569?w=150&auto=format&fit=crop&q=80',
    role: 'doctor',
    account_type: 'doctor',
    status: 'verified',
    qualification: 'MD (Hom)',
    experience_years: 10,
    phone: '+91 98450 12891',
    registration_number: 'NCH/HOM/2014/0921',
    registration_authority: 'Karnataka Board of Homoeopathic System of Medicine',
    state: 'Karnataka',
    city: 'Bengaluru',
    clinic_institution: 'Samyak Homeopathy Center, Indiranagar',
    specialization: 'Autoimmune & Dermatology',
    bio: 'Senior consultant homoeopath focusing on integrative constitutional therapeutics in chronic autoimmune and dermatological disorders. Alumna of NIH Kolkata. Dedicated to mentoring young BHMS practitioners.',
    interests: ['Materia Medica', 'Autoimmune Disorders', 'Integrative Medicine', 'Clinical Research', 'Student Mentorship'],
    mentorship_available: true,
    social_links: {
      linkedin: 'https://linkedin.com/in/dr-ananya-sharma',
      website: 'https://samyakhomeopathy.in',
      whatsapp: '+919845012891'
    },
    privacy_settings: {
      show_email: true,
      show_phone: false,
      show_location: true,
      profile_visibility: 'members_only'
    },
    profile_visibility: 'public',
    created_at: '2025-01-15T10:00:00Z',
    updated_at: '2026-02-10T14:30:00Z'
  },

  // 2. Doctor / Practitioner
  {
    id: 'user-priya',
    email: 'dr.priya@clinic.org',
    full_name: 'Dr. Priya Sharma',
    display_name: 'Dr. Priya Sharma',
    avatar_url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80',
    role: 'doctor',
    account_type: 'doctor',
    status: 'verified',
    qualification: 'BHMS',
    experience_years: 10,
    phone: '+91 98220 89123',
    registration_number: 'MCH/2014/5431',
    registration_authority: 'Maharashtra Council of Homoeopathy, Mumbai',
    state: 'Maharashtra',
    city: 'Pune',
    clinic_institution: 'Priya Homoeo Clinic, Kothrud',
    specialization: 'Clinical Practice',
    bio: 'Practicing classical homeopathy with an emphasis on lifestyle integration and repertorization in chronic conditions.',
    interests: ['Classical Homeopathy', 'Chronic Care', 'Practice Management'],
    mentorship_available: true,
    social_links: {
      website: 'https://drpriyahomeo.com',
      linkedin: 'https://linkedin.com/in/drpriyasharma'
    },
    privacy_settings: {
      show_email: false,
      show_phone: false,
      show_location: true,
      profile_visibility: 'members_only'
    },
    profile_visibility: 'members_only',
    created_at: '2025-02-01T08:00:00Z',
    updated_at: '2026-01-20T11:00:00Z'
  },

  // 3. Researcher / Educator
  {
    id: 'user-arjun',
    email: 'arjun.nair@research.ac.in',
    full_name: 'Dr. Arjun Nair',
    display_name: 'Dr. Arjun Nair',
    avatar_url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
    role: 'researcher',
    account_type: 'researcher',
    status: 'verified',
    qualification: 'MD (Hom), Ph.D. Scholar',
    experience_years: 7,
    phone: '+91 94471 34902',
    registration_number: 'KAH/2017/6712',
    registration_authority: 'Karnataka Board of Homoeopathic System of Medicine',
    state: 'Karnataka',
    city: 'Bengaluru',
    clinic_institution: 'National Institute of Homoeopathy Extension Center',
    specialization: 'Research & Academia',
    bio: 'Assistant Professor & Clinical Investigator. Conducting research on ultra-high dilutions and evidence-based protocols in inflammatory conditions.',
    research_interests: 'High dilution nanomedicine, cytokine assays, clinical trial methodology',
    publications: 'Evaluation of Ultra-Dilute Phytomedicines in Cytokine Modulation (JoIM, 2025); Placebo-controlled trial in allergic rhinitis (IJHDR, 2024)',
    teaching_interests: 'Research Methodology, Organon of Medicine, Statistics for Homoeopaths',
    webinar_interest: true,
    orcid_id: '0000-0002-8921-4412',
    interests: ['Clinical Trials', 'Research & Academia', 'Pharmacology', 'Nano-medicine'],
    mentorship_available: true,
    social_links: {
      orcid: 'https://orcid.org/0000-0002-8921-4412',
      linkedin: 'https://linkedin.com/in/dr-arjun-nair'
    },
    privacy_settings: {
      show_email: true,
      show_phone: false,
      show_location: true,
      profile_visibility: 'members_only'
    },
    profile_visibility: 'public',
    created_at: '2025-02-05T09:30:00Z',
    updated_at: '2026-03-01T15:00:00Z'
  },

  // 4. Student Member
  {
    id: 'user-student-rahul',
    email: 'rahul.verma@nhmc.ac.in',
    full_name: 'Rahul Verma',
    display_name: 'Rahul Verma',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    role: 'student',
    account_type: 'student',
    status: 'verified',
    qualification: 'BHMS Candidate (Final Year)',
    experience_years: 0,
    phone: '+91 98112 55431',
    state: 'Delhi',
    city: 'New Delhi',
    institution: 'Nehru Homoeopathic Medical College & Hospital (NHMC), Delhi',
    course_year: 'Final Year BHMS (Batch 2022-26)',
    mentorship_needs: ['Acute Case Taking', 'Repertorization of Chronic Pathology', 'Clinical Practice Setup'],
    specialization: 'Student Clinical Observer',
    bio: 'Final year BHMS student passionate about Boenninghausen repertorial methodology and clinical case taking. Looking for mentorship in outpatient management and research methodology.',
    interests: ['Materia Medica Study', 'Boenninghausen Method', 'Clinical Cases', 'Student Mentorship'],
    social_links: {
      linkedin: 'https://linkedin.com/in/rahul-verma-homeo'
    },
    privacy_settings: {
      show_email: true,
      show_phone: false,
      show_location: true,
      profile_visibility: 'members_only'
    },
    profile_visibility: 'public',
    created_at: '2025-03-10T10:00:00Z',
    updated_at: '2026-03-15T12:00:00Z'
  },

  // 5. Doctor / Specialist
  {
    id: 'user-kavita',
    email: 'kavita.singh@delhihomeo.in',
    full_name: 'Dr. Kavita Singh',
    display_name: 'Dr. Kavita Singh',
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    role: 'doctor',
    account_type: 'doctor',
    status: 'verified',
    qualification: 'BHMS',
    experience_years: 6,
    phone: '+91 98104 22341',
    registration_number: 'DHB/2018/9832',
    registration_authority: 'Delhi Homoeopathic Board',
    state: 'Delhi',
    city: 'New Delhi',
    clinic_institution: 'Women Care Holistic Center, Greater Kailash',
    specialization: "Women's Health",
    bio: 'Dedicated practitioner specializing in PCOS, menopausal transition, and hormonal imbalances through individualized constitutional remedies.',
    interests: ["Women's Health", 'Hormonal Health', 'Materia Medica', 'Repertory'],
    mentorship_available: true,
    social_links: {
      linkedin: 'https://linkedin.com/in/dr-kavita-singh'
    },
    privacy_settings: {
      show_email: false,
      show_phone: false,
      show_location: true,
      profile_visibility: 'members_only'
    },
    profile_visibility: 'public',
    created_at: '2025-02-12T12:00:00Z',
    updated_at: '2026-03-10T10:00:00Z'
  },

  // 6. Doctor / Experienced Clinician
  {
    id: 'user-sameer',
    email: 'dr.sameer@upcare.in',
    full_name: 'Dr. Sameer Khan',
    display_name: 'Dr. Sameer Khan',
    avatar_url: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150&auto=format&fit=crop&q=80',
    role: 'doctor',
    account_type: 'doctor',
    status: 'verified',
    qualification: 'BHMS',
    experience_years: 12,
    registration_number: 'UPHM/2012/1189',
    registration_authority: 'Homoeopathic Medicine Board, Uttar Pradesh',
    state: 'Uttar Pradesh',
    city: 'Lucknow',
    clinic_institution: 'Avadh Homoeo Dispensary, Hazratganj',
    specialization: 'Chronic Disease',
    bio: 'Over a decade of clinical practice managing complex respiratory and metabolic disorders with classic Boenninghausen repertorial methodology.',
    interests: ['Chronic Disease', 'Boenninghausen Method', 'Repertory'],
    mentorship_available: true,
    profile_visibility: 'members_only',
    created_at: '2025-01-25T11:00:00Z',
    updated_at: '2026-02-18T16:00:00Z'
  },

  // 7. Doctor / Pediatrics
  {
    id: 'user-neha-patel',
    email: 'neha.patel@gujarathealth.in',
    full_name: 'Dr. Neha Patel',
    display_name: 'Dr. Neha Patel',
    avatar_url: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=150&auto=format&fit=crop&q=80',
    role: 'doctor',
    account_type: 'doctor',
    status: 'verified',
    qualification: 'MD (Hom)',
    experience_years: 7,
    registration_number: 'GCH/2017/4490',
    registration_authority: 'Council of Homoeopathic System of Medicine, Gujarat',
    state: 'Gujarat',
    city: 'Ahmedabad',
    clinic_institution: 'Little Steps Pediatric Homoeopathy, Navrangpura',
    specialization: 'Pediatrics',
    bio: 'Specialized focus on recurring childhood infections, constitutional prescribing in pediatric allergies, and gentle remedies.',
    interests: ['Pediatrics', 'Childhood Immunity', 'Constitutional Prescribing'],
    mentorship_available: true,
    profile_visibility: 'public',
    created_at: '2025-03-01T14:00:00Z',
    updated_at: '2026-03-12T09:00:00Z'
  },

  // 8. Doctor / Clinician
  {
    id: 'user-mehta',
    email: 'dr.rmehta@mumbaiclinic.in',
    full_name: 'Dr. R. Mehta',
    display_name: 'Dr. R. Mehta',
    avatar_url: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&auto=format&fit=crop&q=80',
    role: 'doctor',
    account_type: 'doctor',
    status: 'verified',
    qualification: 'MD (Hom)',
    experience_years: 8,
    registration_number: 'MCH/2016/8821',
    registration_authority: 'Maharashtra Council of Homoeopathy, Mumbai',
    state: 'Maharashtra',
    city: 'Mumbai',
    clinic_institution: 'Central Mumbai Homoeopathy Clinic, Dadar',
    specialization: 'Practice Management',
    bio: 'Clinician and digital health advocate. Mentoring young homoeopaths on modern ethical clinic setups and record keeping.',
    interests: ['Practice Management', 'Clinical Case Studies', 'Seasonal Allergies'],
    mentorship_available: true,
    profile_visibility: 'members_only',
    created_at: '2025-01-10T09:00:00Z',
    updated_at: '2026-02-28T12:00:00Z'
  },

  // 9. Administrator / Super Admin
  {
    id: 'user-admin',
    email: 'admin@homeocircle.in',
    full_name: 'Dr. Sanjeev Bannerjee',
    display_name: 'Administrator',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    role: 'super_admin',
    account_type: 'doctor',
    status: 'verified',
    qualification: 'MD (Hom)',
    experience_years: 18,
    registration_number: 'NCH/SUPER/2006/0012',
    registration_authority: 'National Commission for Homoeopathy',
    state: 'Delhi',
    city: 'New Delhi',
    clinic_institution: 'National Board Advisory Council',
    specialization: 'Community Administration',
    bio: 'Platform verification administrator and senior member of regulatory compliance committee. Oversights credential audits and clinical ethical standards.',
    interests: ['Regulatory Affairs', 'Continuing Medical Education', 'Standards of Practice'],
    profile_visibility: 'members_only',
    created_at: '2024-12-01T08:00:00Z',
    updated_at: '2026-01-01T10:00:00Z'
  }
];

export const initialPosts: Post[] = [
  {
    id: 'post-1',
    author_id: 'user-mehta',
    author_name: 'Dr. R. Mehta',
    author_avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&auto=format&fit=crop&q=80',
    author_qualification: 'MD (Hom)',
    author_experience: '8 years experience',
    author_role: 'doctor',
    title: 'Managing seasonal allergies with homeopathy: Clinical observation',
    body: 'Over the last spring season in Mumbai, we observed recurrent allergic rhinitis with marked paroxysmal sneezing and profuse bland lacrimation. In constitutional analysis, Natrum Mur and Allium Cepa in 200C potencies were studied alongside allergen avoidance protocols. Sharing case observations on symptom relief timelines (mean 7.2 days) and invite peer feedback on your repertorial strategies for high pollen count areas.\n\nNote: All cases were fully anonymized in compliance with DISHA & DPDP guidelines.',
    category_id: 'clinical-cases',
    category_name: 'Clinical Learning',
    category_badge_color: 'bg-teal-50 text-teal-700 border-teal-200',
    status: 'published',
    likes_count: 24,
    comments_count: 12,
    created_at: '3 hours ago'
  },
  {
    id: 'post-2',
    author_id: 'user-arjun',
    author_name: 'Dr. Arjun Nair',
    author_avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
    author_qualification: 'MD (Hom), Ph.D. Scholar',
    author_experience: 'Researcher & Educator',
    author_role: 'researcher',
    title: 'Latest research on homeopathy in autoimmune disorders: Trial protocol review',
    body: 'A recent multi-centric study published in the Journal of Integrative Medicine evaluates ultra-dilute remedies in modulating cytokine biomarkers in Hashimoto’s thyroiditis. The preliminary cohort (n=120) showed stabilized anti-TPO titers with adjuvant constitutional therapy. Noticeable limitations include the open-label nature of initial phases. Here is a summary with peer discussion points on methodology.',
    category_id: 'research',
    category_name: 'Research',
    category_badge_color: 'bg-sky-50 text-sky-700 border-sky-200',
    source_url: 'https://doi.org/10.1016/j.joim.2025.04.012',
    status: 'published',
    likes_count: 31,
    comments_count: 8,
    created_at: '5 hours ago'
  },
  {
    id: 'post-3',
    author_id: 'user-student-rahul',
    author_name: 'Rahul Verma',
    author_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    author_qualification: 'Final Year BHMS',
    author_experience: 'Nehru Homoeopathic Medical College',
    author_role: 'student',
    title: 'Student Corner: Differentiating Aphorisms 83–104 in acute vs chronic case taking',
    body: 'As part of our final year clinical internship preparation, our study group is analyzing Hahnemannian case taking principles under Organon §83–§104. How do experienced clinicians balance rapid recording in busy OPD settings with the detailed modalities required for Boenninghausen repertorization? We would love practical tips from senior practitioners.',
    category_id: 'students',
    category_name: 'Student Corner',
    category_badge_color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    status: 'published',
    likes_count: 18,
    comments_count: 7,
    created_at: '12 hours ago'
  },
  {
    id: 'post-4',
    author_id: 'user-ananya',
    author_name: 'Dr. Ananya Sharma',
    author_avatar: 'https://images.unsplash.com/photo-1594824813633-4f24f8087569?w=150&auto=format&fit=crop&q=80',
    author_qualification: 'MD (Hom)',
    author_experience: '10 years experience',
    author_role: 'doctor',
    title: 'Adhering to DISHA & Patient Privacy in Clinical Case Discussions',
    body: 'A gentle reminder to all members: in compliance with Indian Digital Information Security in Healthcare guidelines and our community rules, please ensure that no identifiable patient photos, real names, or Aadhaar/UHID references are ever posted in case presentations. Always anonymize demographics and focus purely on repertorial rubrics and posology.',
    category_id: 'practice-management',
    category_name: 'Practice Management',
    category_badge_color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    status: 'published',
    likes_count: 45,
    comments_count: 14,
    created_at: '1 day ago'
  },
  {
    id: 'post-5',
    author_id: 'user-priya',
    author_name: 'Dr. Priya Sharma',
    author_avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80',
    author_qualification: 'BHMS',
    author_experience: '10 years experience',
    author_role: 'doctor',
    title: 'General Discussion: Welcome to Homeo Circle National Network',
    body: 'Warm welcome to all doctors, educators, researchers, and students who have joined our verified community! Let us use this space for constructive medical exchange, clinical peer learning, and collaborative advancement of homeopathy in India.',
    category_id: 'general',
    category_name: 'General Discussion',
    category_badge_color: 'bg-slate-100 text-slate-700 border-slate-200',
    status: 'published',
    likes_count: 52,
    comments_count: 9,
    created_at: '2 days ago'
  }
];

export const initialConnections: ConnectionRequest[] = [
  {
    id: 'conn-1',
    sender_id: 'user-kavita',
    sender_name: 'Dr. Kavita Singh',
    sender_avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    sender_role: 'doctor',
    sender_qualification: 'BHMS',
    recipient_id: 'user-ananya',
    recipient_name: 'Dr. Ananya Sharma',
    recipient_avatar: 'https://images.unsplash.com/photo-1594824813633-4f24f8087569?w=150&auto=format&fit=crop&q=80',
    recipient_role: 'doctor',
    status: 'pending',
    created_at: '2026-10-24T18:30:00Z',
    updated_at: '2026-10-24T18:30:00Z'
  },
  {
    id: 'conn-2',
    sender_id: 'user-priya',
    sender_name: 'Dr. Priya Sharma',
    sender_avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80',
    sender_role: 'doctor',
    sender_qualification: 'BHMS',
    recipient_id: 'user-ananya',
    recipient_name: 'Dr. Ananya Sharma',
    recipient_avatar: 'https://images.unsplash.com/photo-1594824813633-4f24f8087569?w=150&auto=format&fit=crop&q=80',
    recipient_role: 'doctor',
    status: 'accepted',
    created_at: '2026-10-20T10:00:00Z',
    updated_at: '2026-10-21T14:00:00Z'
  },
  {
    id: 'conn-3',
    sender_id: 'user-student-rahul',
    sender_name: 'Rahul Verma',
    sender_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    sender_role: 'student',
    sender_qualification: 'BHMS Candidate',
    recipient_id: 'user-arjun',
    recipient_name: 'Dr. Arjun Nair',
    recipient_avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
    recipient_role: 'researcher',
    status: 'accepted',
    created_at: '2026-10-22T08:00:00Z',
    updated_at: '2026-10-22T16:00:00Z'
  }
];

export const initialMentorshipRequests: MentorshipRequest[] = [
  {
    id: 'mentor-req-1',
    student_id: 'user-student-rahul',
    student_name: 'Rahul Verma',
    student_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    student_institution: 'Nehru Homoeopathic Medical College, Delhi',
    student_course_year: 'Final Year BHMS',
    mentor_id: 'user-ananya',
    mentor_name: 'Dr. Ananya Sharma',
    mentor_avatar: 'https://images.unsplash.com/photo-1594824813633-4f24f8087569?w=150&auto=format&fit=crop&q=80',
    mentor_specialization: 'Autoimmune & Dermatology',
    message: 'Respected Dr. Ananya, I follow your clinical observations on autoimmune cases. I would be grateful for your guidance on rubric selection in chronic skin pathology during my internship.',
    goals: 'Learn clinical repertorization and posology in chronic autoimmune cases',
    status: 'pending',
    created_at: '2026-10-24T12:00:00Z',
    updated_at: '2026-10-24T12:00:00Z'
  }
];

export const initialNotifications: AppNotification[] = [
  {
    id: 'notif-1',
    user_id: 'user-ananya',
    title: 'New Connection Request',
    message: 'Dr. Kavita Singh has sent you a connection request.',
    type: 'connection_request',
    link: '/members?tab=network',
    is_read: false,
    action_id: 'conn-1',
    action_status: 'pending',
    created_at: '1 hour ago'
  },
  {
    id: 'notif-2',
    user_id: 'user-ananya',
    title: 'Student Mentorship Request',
    message: 'Rahul Verma (Final Year BHMS, NHMC Delhi) requested mentorship in Autoimmune Case Taking.',
    type: 'mentorship_request',
    link: '/students',
    is_read: false,
    action_id: 'mentor-req-1',
    action_status: 'pending',
    created_at: '4 hours ago'
  },
  {
    id: 'notif-3',
    user_id: 'user-ananya',
    title: 'New Comment on Discussion',
    message: 'Dr. Sameer Khan replied to your post on DISHA Patient Privacy.',
    type: 'comment_reply',
    link: '/community/post-4',
    is_read: true,
    created_at: '1 day ago'
  }
];

export const initialEventRegistrations: EventRegistration[] = [
  {
    id: 'reg-1',
    event_id: 'event-1',
    user_id: 'user-ananya',
    user_name: 'Dr. Ananya Sharma',
    user_email: 'ananya@homeocircle.in',
    status: 'registered',
    registered_at: '2026-10-20T11:00:00Z'
  }
];

export const initialEvents: Event[] = [
  {
    id: 'event-1',
    title: 'Research in Homeopathy: Latest Evidence & Methodology',
    summary: 'Join leading academic researchers as they dissect contemporary clinical trial designs, biomarker assessment in homeopathic research, and international publishing guidelines.',
    organizer: 'Council for Scientific Homeopathy',
    speaker: 'Dr. V. Menon',
    speaker_title: 'Director, Clinical Research Institute',
    date_badge_day: '19',
    date_badge_month: 'DEC',
    time_display: 'Online • 6:00 PM - 7:30 PM IST',
    start_at: '2026-12-19T18:00:00+05:30',
    format: 'Webinar',
    location: 'Online via Secure Zoom',
    registration_url: 'https://homeocircle.in/webinars/research-evidence-2026',
    source_url: 'https://nch.org.in/cme/2026/evidence-webinar',
    status: 'published',
    attendees_count: 184,
    image_url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&auto=format&fit=crop&q=80',
    meeting_link: 'https://meet.homeocircle.in/cme-research-19'
  },
  {
    id: 'event-2',
    title: 'State Chapter CME: Advanced Clinical Repertorization',
    summary: 'In-person continuing medical education session for registered practitioners in Telangana and Andhra Pradesh covering complex pathological prescribing.',
    organizer: 'Telangana State Homoeopathic Association',
    speaker: 'Dr. A. Bansal',
    speaker_title: 'Senior Fellow, National Academy of Homoeopathy',
    date_badge_day: '11',
    date_badge_month: 'JAN',
    time_display: 'Hyderabad, Telangana • 10:00 AM - 5:00 PM IST',
    start_at: '2027-01-11T10:00:00+05:30',
    format: 'State Chapter CME',
    location: 'Auditorium, Osmania Medical College Campus, Hyderabad',
    registration_url: 'https://homeocircle.in/cme/hyderabad-2027',
    source_url: 'https://telanganahomeoboard.org/cme-jan',
    status: 'published',
    attendees_count: 120,
    image_url: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'event-3',
    title: 'Materia Medica Study Circle: Comparative Analysis of Snake Venoms',
    summary: 'A structured peer study session analyzing Lachesis, Crotalus Horridus, Naja, and Elaps with clinical differentiation rubrics.',
    organizer: 'Homeo Circle Clinical Circle',
    speaker: 'Dr. P. Nair',
    speaker_title: 'Consultant Homoeopath, Kochi',
    date_badge_day: '26',
    date_badge_month: 'JAN',
    time_display: 'Online • 5:00 PM - 6:30 PM IST',
    start_at: '2027-01-26T17:00:00+05:30',
    format: 'Study Circle',
    location: 'Interactive Google Meet Room',
    registration_url: 'https://homeocircle.in/study/materia-medica-26',
    source_url: 'https://homeocircle.in/study-circle',
    status: 'published',
    attendees_count: 95,
    image_url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=600&auto=format&fit=crop&q=80',
    meeting_link: 'https://meet.google.com/homeo-study-circle'
  },
  {
    id: 'event-4',
    title: 'Student Webinar: Aphorism §83 to §104 Mastery & Case Taking',
    summary: 'A dedicated educational clinic for BHMS interns and final year students on taking acute and chronic case histories with Boenninghausen analysis.',
    organizer: 'Homeo Circle Academic Council',
    speaker: 'Dr. Ananya Sharma & Dr. Arjun Nair',
    speaker_title: 'Faculty & Clinical Investigators',
    date_badge_day: '05',
    date_badge_month: 'FEB',
    time_display: 'Online • 7:00 PM - 8:30 PM IST',
    start_at: '2027-02-05T19:00:00+05:30',
    format: 'Webinar',
    location: 'Online Webinar Room',
    registration_url: 'https://homeocircle.in/students/webinar-case-taking',
    source_url: 'https://homeocircle.in/students',
    status: 'published',
    attendees_count: 142,
    image_url: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&auto=format&fit=crop&q=80',
    meeting_link: 'https://meet.homeocircle.in/student-case-taking'
  }
];

export const initialOpportunities: Opportunity[] = [
  {
    id: 'opp-1',
    title: 'Research Associate — Clinical Pharmacology Unit',
    organization: 'Clinical Research Unit, Mumbai',
    type: 'Job',
    description: 'Inviting applications from MD (Hom) graduates for a multicenter observational registry on chronic dermatological conditions. Responsibilities include protocol adherence, case reporting forms, and statistical auditing.',
    eligibility: 'MD (Hom) with valid state/central registration and minimum 1 year clinical trial experience.',
    location: 'Mumbai, Maharashtra',
    mode: 'On-site',
    timing: 'Full-time',
    deadline: '2026-11-30',
    source_url: 'https://ccrhindia.nic.in/careers',
    application_url: 'https://homeocircle.in/apply/opp-1',
    status: 'published',
    posted_time_ago: '5 days ago'
  },
  {
    id: 'opp-2',
    title: 'Homeopath for Integrative Medicine Clinic',
    organization: 'Wellness & Integrative Health Center, New Delhi',
    type: 'Job',
    description: 'Leading integrative wellness center seeks a certified BHMS/MD homeopath to collaborate with Ayurvedic and allopathic physicians in managing metabolic syndrome and chronic pain.',
    eligibility: 'Registered practitioner with Delhi Homoeopathic Board; 5+ years experience.',
    location: 'South Extension, Delhi',
    mode: 'On-site',
    timing: 'Part-time',
    deadline: '2026-12-15',
    source_url: 'https://wellnessdelhi.org/openings',
    application_url: 'https://homeocircle.in/apply/opp-2',
    status: 'published',
    posted_time_ago: '1 week ago'
  },
  {
    id: 'opp-3',
    title: 'Student Internship — Clinical Repertory Registry',
    organization: 'Academic Institute of Homoeopathy, Kolkata',
    type: 'Internship',
    description: 'A paid 6-month clinical internship for final-year BHMS students or fresh interns to assist senior clinicians in digitalizing verified clinical rubrics and observational case outcomes.',
    eligibility: 'BHMS Final Year / Intern with recognized medical college ID.',
    location: 'Kolkata, West Bengal',
    mode: 'Hybrid',
    timing: 'Part-time',
    deadline: '2026-12-20',
    source_url: 'https://nih.nic.in/internships',
    application_url: 'https://homeocircle.in/apply/opp-3',
    status: 'published',
    posted_time_ago: '3 days ago'
  },
  {
    id: 'opp-4',
    title: 'Visiting Consultant — Chronic Care Division',
    organization: 'Healthcare Center, Hyderabad',
    type: 'Collaboration',
    description: 'Renowned hospital network seeks visiting homeopathic specialist for bi-weekly OPD consultations in lifestyle and chronic autoimmune disorders.',
    eligibility: 'MD (Hom) with 8+ years clinical standing and verified registration with Telangana Board.',
    location: 'Hyderabad, Telangana',
    mode: 'Remote',
    timing: 'Part-time',
    deadline: '2026-12-31',
    source_url: 'https://hyderabadhealth.in/consultants',
    application_url: 'https://homeocircle.in/apply/opp-4',
    status: 'published',
    posted_time_ago: '2 weeks ago'
  }
];

export const initialKnowledgePosts: KnowledgePost[] = [
  {
    id: 'know-1',
    title: 'Randomized Controlled Trial on Individualized Homeopathic Treatment in Allergic Rhinitis',
    summary: 'A double-blind, placebo-controlled trial evaluating 180 patients over 12 months. Significant improvement on TNSS score observed in intervention arm compared to placebo (p < 0.01).',
    source_url: 'https://pubmed.ncbi.nlm.nih.gov/3120192/',
    journal: 'International Journal of High Dilution Research',
    content_type: 'Clinical Trial',
    limitations: 'Single-center design; long-term follow-up beyond 12 months was not evaluated. Further multicentric replication needed before definitive clinical guidelines.',
    status: 'published',
    published_at: '2025-10-14',
    doi: '10.1016/j.ijhdr.2025.10.002',
    author_name: 'Dr. V. Menon et al.'
  },
  {
    id: 'know-2',
    title: 'Systematic Review of Observational Studies in Indian Homeopathic Hospitals',
    summary: 'Meta-analysis of 14 published hospital registry datasets assessing retention rates, remedy distributions, and documented adverse events in outpatient care.',
    source_url: 'https://ccrhindia.nic.in/publications/review-2025',
    journal: 'Indian Journal of Research in Homoeopathy',
    content_type: 'Systematic Review',
    limitations: 'Heterogeneity in electronic health records between state-level dispensaries. Lack of blinding inherent to observational registry data.',
    status: 'published',
    published_at: '2026-01-20',
    doi: '10.4103/ijrh.ijrh_42_25',
    author_name: 'Council for Scientific Homeopathy'
  },
  {
    id: 'know-3',
    title: 'Boenninghausen Concordance & Complementary Remedy Index: Study Resource',
    summary: 'A structured comparative reference chart correlating relationship of remedies, inimical pairings, and chronic follow-up remedies for clinical study.',
    source_url: 'https://homeocircle.in/resources/boenninghausen-concordance.pdf',
    journal: 'Homeo Circle Clinical Education Series',
    content_type: 'Educational Resource',
    limitations: 'Compiled from classic Materia Medica and Boenninghausen Therapeutic Pocket Book; intended as an educational rubric study guide rather than prescriptive dogma.',
    status: 'published',
    published_at: '2026-02-15',
    author_name: 'Clinical Education Working Group'
  }
];

export const initialApplications: PractitionerApplication[] = [
  {
    id: 'app-101',
    user_id: 'user-anjali',
    full_name: 'Dr. Anjali Verma',
    email: 'dr.anjali.verma@gmail.com',
    phone: '+91 98201 44521',
    role_applied: 'doctor',
    qualification: 'BHMS',
    registration_number: 'MAH/HOM/2018/4312',
    registration_authority: 'Maharashtra Council of Homoeopathy, Mumbai',
    state: 'Maharashtra',
    city: 'Navi Mumbai',
    clinic_institution: 'Verma Homoeo Clinic, Navi Mumbai',
    experience_years: 6,
    specialization: 'Pediatrics & Dermatology',
    consent_at: '2026-10-22T09:30:00Z',
    status: 'pending_review',
    submitted_at: '2 hours ago',
    internal_notes: 'State register match query initiated. Awaiting review against Maharashtra Council gazette.'
  },
  {
    id: 'app-102',
    user_id: 'user-rohit',
    full_name: 'Dr. Rohit Kumar',
    email: 'dr.rohit.kumar@delhihomeo.in',
    phone: '+91 98110 99231',
    role_applied: 'doctor',
    qualification: 'MD (Hom)',
    registration_number: 'DHB/2019/8821',
    registration_authority: 'Delhi Homoeopathic Board',
    state: 'Delhi',
    city: 'New Delhi',
    clinic_institution: 'Apex Healing Center, Dwarka',
    experience_years: 5,
    specialization: 'Lifestyle & Metabolic Disorders',
    consent_at: '2026-10-22T06:15:00Z',
    status: 'pending_review',
    submitted_at: '5 hours ago',
    internal_notes: 'Application received with state council registration ID.'
  },
  {
    id: 'app-103',
    user_id: 'user-sneha',
    full_name: 'Dr. Sneha Iyer',
    email: 'dr.sneha.iyer@keralahealth.org',
    phone: '+91 94470 12890',
    role_applied: 'doctor',
    qualification: 'BHMS',
    registration_number: 'KAH/2021/1042',
    registration_authority: 'Karnataka Board of Homoeopathic System of Medicine',
    state: 'Karnataka',
    city: 'Mangaluru',
    clinic_institution: 'City Health Clinic, Mangalore',
    experience_years: 3,
    specialization: 'General Classical Homoeopathy',
    consent_at: '2026-10-21T11:00:00Z',
    status: 'pending_review',
    submitted_at: '1 day ago',
    internal_notes: 'Documents submitted. Verification queue #3.'
  },
  {
    id: 'app-104',
    user_id: 'user-researcher-applicant',
    full_name: 'Dr. Somnath Banerjee',
    email: 's.banerjee@researchuniv.edu',
    phone: '+91 93301 22891',
    role_applied: 'researcher',
    qualification: 'MD (Hom), M.Sc. Clinical Pharmacology',
    state: 'West Bengal',
    city: 'Kolkata',
    clinic_institution: 'Faculty of Homoeopathy, WBUHS',
    specialization: 'Pharmacological Research',
    research_interests: 'High dilution pharmacodynamics, comparative clinical assays',
    publications: '3 indexed papers in Indian Journal of Research in Homoeopathy',
    consent_at: '2026-10-23T14:00:00Z',
    status: 'pending_review',
    submitted_at: '1 day ago',
    internal_notes: 'Academic affiliation documents submitted for verification.'
  }
];

export const initialAuditLogs: AuditLog[] = [
  {
    id: 'log-1',
    actor_id: 'user-admin',
    actor_name: 'Administrator',
    action: 'APPLICATION_APPROVED',
    target_type: 'practitioner_application',
    target_id: 'app-099',
    metadata: { applicant_name: 'Dr. Kavita Singh', reg_no: 'DHB/2018/9832', register: 'Delhi Homoeopathic Board' },
    created_at: '2026-10-21T16:45:00Z'
  },
  {
    id: 'log-2',
    actor_id: 'user-admin',
    actor_name: 'Administrator',
    action: 'EVENT_PUBLISHED',
    target_type: 'event',
    target_id: 'event-1',
    metadata: { title: 'Research in Homeopathy: Latest Evidence & Methodology' },
    created_at: '2026-10-20T10:15:00Z'
  }
];

export const initialPlatformSettings: PlatformSettings = {
  require_doctor_verification: true,
  require_researcher_verification: true,
  require_student_verification: false,
  enable_email_notifications: false,
  auto_appeals_enabled: true,
  announcement_banner: 'Welcome to Homeo Circle — India’s professional homeopathy community.'
};
