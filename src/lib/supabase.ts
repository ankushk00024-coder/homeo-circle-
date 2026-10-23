import { createClient } from '@supabase/supabase-js';
import { 
  UserProfile, 
  Post, 
  Comment, 
  Event, 
  Opportunity, 
  KnowledgePost, 
  PractitionerApplication, 
  Report, 
  AuditLog,
  ApplicationStatus
} from '../types';
import { 
  initialMembers, 
  initialPosts, 
  initialEvents, 
  initialOpportunities, 
  initialKnowledgePosts, 
  initialApplications, 
  initialAuditLogs 
} from './mockData';

// Supabase environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('http') && 
  !supabaseUrl.includes('placeholder') &&
  !supabaseUrl.includes('your-supabase-url')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Local storage keys for resilient mock/offline state
const STORAGE_KEYS = {
  POSTS: 'homeocircle_posts',
  MEMBERS: 'homeocircle_members',
  EVENTS: 'homeocircle_events',
  OPPORTUNITIES: 'homeocircle_opportunities',
  KNOWLEDGE: 'homeocircle_knowledge',
  APPLICATIONS: 'homeocircle_applications',
  COMMENTS: 'homeocircle_comments',
  REPORTS: 'homeocircle_reports',
  AUDIT_LOGS: 'homeocircle_audit_logs',
};

// Helper to get from local storage or fallback
function getLocal<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(item);
  } catch (e) {
    return fallback;
  }
}

function setLocal<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Failed to set localStorage', e);
  }
}

// Unified Data Service that connects to Supabase when available or manages realistic local state
export const dataService = {
  // Posts
  async getPosts(categoryFilter?: string): Promise<Post[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase.from('posts').select('*').order('created_at', { ascending: false });
        if (categoryFilter && categoryFilter !== 'all') {
          query = query.eq('category_id', categoryFilter);
        }
        const { data, error } = await query;
        if (!error && data && data.length > 0) return data;
      } catch (err) {
        console.warn('Supabase query error, falling back to local data', err);
      }
    }
    const posts = getLocal<Post[]>(STORAGE_KEYS.POSTS, initialPosts);
    if (categoryFilter && categoryFilter !== 'all') {
      return posts.filter(p => p.category_id === categoryFilter || p.category_name.toLowerCase().includes(categoryFilter.toLowerCase()));
    }
    return posts;
  },

  async createPost(newPostData: Partial<Post>): Promise<Post> {
    const newPost: Post = {
      id: 'post-' + Date.now(),
      author_id: newPostData.author_id || 'user-ananya',
      author_name: newPostData.author_name || 'Dr. Ananya',
      author_avatar: newPostData.author_avatar || 'https://images.unsplash.com/photo-1594824813633-4f24f8087569?w=150&auto=format&fit=crop&q=80',
      author_qualification: newPostData.author_qualification || 'MD (Hom)',
      author_experience: newPostData.author_experience || '10 years experience',
      author_role: 'member',
      title: newPostData.title || '',
      body: newPostData.body || '',
      category_id: newPostData.category_id || 'clinical-cases',
      category_name: newPostData.category_name || 'Clinical Case',
      category_badge_color: newPostData.category_badge_color || 'bg-teal-50 text-teal-700 border-teal-200',
      source_url: newPostData.source_url,
      status: 'published',
      likes_count: 0,
      comments_count: 0,
      created_at: 'Just now'
    };

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('posts').insert([newPost]);
      } catch (e) {
        console.error('Supabase insert failed', e);
      }
    }

    const posts = getLocal<Post[]>(STORAGE_KEYS.POSTS, initialPosts);
    const updated = [newPost, ...posts];
    setLocal(STORAGE_KEYS.POSTS, updated);
    return newPost;
  },

  async toggleLikePost(postId: string): Promise<number> {
    const posts = getLocal<Post[]>(STORAGE_KEYS.POSTS, initialPosts);
    let newLikes = 0;
    const updated = posts.map(p => {
      if (p.id === postId) {
        const isLiked = !p.is_liked;
        newLikes = isLiked ? p.likes_count + 1 : Math.max(0, p.likes_count - 1);
        return { ...p, is_liked: isLiked, likes_count: newLikes };
      }
      return p;
    });
    setLocal(STORAGE_KEYS.POSTS, updated);
    return newLikes;
  },

  // Comments
  async getComments(postId: string): Promise<Comment[]> {
    const comments = getLocal<Comment[]>(STORAGE_KEYS.COMMENTS, [
      {
        id: 'comm-1',
        post_id: 'post-1',
        author_id: 'user-arjun',
        author_name: 'Dr. Arjun Nair',
        author_avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
        author_qualification: 'MD (Hom)',
        body: 'Very thorough observation, Dr. Mehta. In high humidity coastal regions, did you notice modalities worsening after sunset?',
        status: 'published',
        created_at: '2 hours ago'
      },
      {
        id: 'comm-2',
        post_id: 'post-1',
        author_id: 'user-mehta',
        author_name: 'Dr. R. Mehta',
        author_avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&auto=format&fit=crop&q=80',
        author_qualification: 'MD (Hom)',
        body: 'Yes indeed, Arjun. The evening aggravation was distinctly responsive when moving to the 1M dilution under strict observation.',
        status: 'published',
        created_at: '1 hour ago'
      }
    ]);
    return comments.filter(c => c.post_id === postId);
  },

  async addComment(postId: string, author: UserProfile, body: string): Promise<Comment> {
    const newComment: Comment = {
      id: 'comm-' + Date.now(),
      post_id: postId,
      author_id: author.id,
      author_name: author.display_name || author.full_name,
      author_avatar: author.avatar_url,
      author_qualification: author.qualification,
      body,
      status: 'published',
      created_at: 'Just now'
    };

    const comments = getLocal<Comment[]>(STORAGE_KEYS.COMMENTS, []);
    setLocal(STORAGE_KEYS.COMMENTS, [...comments, newComment]);

    // update comments_count on post
    const posts = getLocal<Post[]>(STORAGE_KEYS.POSTS, initialPosts);
    const updatedPosts = posts.map(p => p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p);
    setLocal(STORAGE_KEYS.POSTS, updatedPosts);

    return newComment;
  },

  // Members
  async getMembers(searchQuery = '', stateFilter = '', specializationFilter = ''): Promise<UserProfile[]> {
    const members = getLocal<UserProfile[]>(STORAGE_KEYS.MEMBERS, initialMembers);
    return members.filter(m => {
      const matchesSearch = !searchQuery || 
        m.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.specialization?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.clinic_institution?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.state.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesState = !stateFilter || stateFilter === 'All' || m.state === stateFilter;
      const matchesSpec = !specializationFilter || specializationFilter === 'All' || m.specialization === specializationFilter;

      return matchesSearch && matchesState && matchesSpec;
    });
  },

  async getMemberById(id: string): Promise<UserProfile | null> {
    const members = getLocal<UserProfile[]>(STORAGE_KEYS.MEMBERS, initialMembers);
    return members.find(m => m.id === id) || null;
  },

  // Events
  async getEvents(formatFilter?: string): Promise<Event[]> {
    const events = getLocal<Event[]>(STORAGE_KEYS.EVENTS, initialEvents);
    if (!formatFilter || formatFilter === 'All') return events;
    return events.filter(e => e.format.toLowerCase() === formatFilter.toLowerCase() || e.format.includes(formatFilter));
  },

  async createEvent(eventData: Partial<Event>): Promise<Event> {
    const newEvent: Event = {
      id: 'event-' + Date.now(),
      title: eventData.title || 'Untitled Event',
      summary: eventData.summary || '',
      organizer: eventData.organizer || 'Homeo Circle',
      speaker: eventData.speaker || 'Guest Speaker',
      speaker_title: eventData.speaker_title || 'Homeopathic Consultant',
      date_badge_day: eventData.date_badge_day || '20',
      date_badge_month: eventData.date_badge_month || 'NOV',
      time_display: eventData.time_display || 'Online • 6:00 PM IST',
      start_at: eventData.start_at || new Date().toISOString(),
      format: eventData.format || 'Webinar',
      location: eventData.location || 'Online',
      registration_url: eventData.registration_url || 'https://homeocircle.in',
      source_url: eventData.source_url,
      status: 'published',
      attendees_count: 0,
      image_url: eventData.image_url || 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&auto=format&fit=crop&q=80'
    };
    const events = getLocal<Event[]>(STORAGE_KEYS.EVENTS, initialEvents);
    setLocal(STORAGE_KEYS.EVENTS, [newEvent, ...events]);
    return newEvent;
  },

  // Opportunities
  async getOpportunities(typeFilter?: string): Promise<Opportunity[]> {
    const opps = getLocal<Opportunity[]>(STORAGE_KEYS.OPPORTUNITIES, initialOpportunities);
    if (!typeFilter || typeFilter === 'All') return opps;
    return opps.filter(o => o.type.toLowerCase() === typeFilter.toLowerCase());
  },

  async createOpportunity(oppData: Partial<Opportunity>): Promise<Opportunity> {
    const newOpp: Opportunity = {
      id: 'opp-' + Date.now(),
      title: oppData.title || '',
      organization: oppData.organization || '',
      type: oppData.type || 'Job',
      description: oppData.description || '',
      eligibility: oppData.eligibility || 'Registered Homoeopath',
      location: oppData.location || 'India',
      mode: oppData.mode || 'On-site',
      timing: oppData.timing || 'Full-time',
      deadline: oppData.deadline || '2026-12-31',
      source_url: oppData.source_url,
      application_url: oppData.application_url || 'https://homeocircle.in',
      status: 'published',
      posted_time_ago: 'Just now'
    };
    const opps = getLocal<Opportunity[]>(STORAGE_KEYS.OPPORTUNITIES, initialOpportunities);
    setLocal(STORAGE_KEYS.OPPORTUNITIES, [newOpp, ...opps]);
    return newOpp;
  },

  // Knowledge Posts
  async getKnowledgePosts(): Promise<KnowledgePost[]> {
    return getLocal<KnowledgePost[]>(STORAGE_KEYS.KNOWLEDGE, initialKnowledgePosts);
  },

  async createKnowledgePost(data: Partial<KnowledgePost>): Promise<KnowledgePost> {
    const post: KnowledgePost = {
      id: 'know-' + Date.now(),
      title: data.title || '',
      summary: data.summary || '',
      source_url: data.source_url || '',
      journal: data.journal || '',
      content_type: data.content_type || 'Clinical Trial',
      limitations: data.limitations || 'Preliminary data; limitations apply.',
      status: 'published',
      published_at: new Date().toISOString().split('T')[0]
    };
    const current = getLocal<KnowledgePost[]>(STORAGE_KEYS.KNOWLEDGE, initialKnowledgePosts);
    setLocal(STORAGE_KEYS.KNOWLEDGE, [post, ...current]);
    return post;
  },

  // Applications
  async getApplications(): Promise<PractitionerApplication[]> {
    return getLocal<PractitionerApplication[]>(STORAGE_KEYS.APPLICATIONS, initialApplications);
  },

  async submitApplication(appData: Omit<PractitionerApplication, 'id' | 'status' | 'submitted_at'>): Promise<PractitionerApplication> {
    const newApp: PractitionerApplication = {
      ...appData,
      id: 'app-' + Date.now(),
      status: 'pending_review',
      submitted_at: 'Just now',
      internal_notes: 'Application received. Queued for official state/national council verification.'
    };
    const apps = getLocal<PractitionerApplication[]>(STORAGE_KEYS.APPLICATIONS, initialApplications);
    setLocal(STORAGE_KEYS.APPLICATIONS, [newApp, ...apps]);

    // Also record audit log
    await this.addAuditLog({
      actor_id: appData.user_id,
      actor_name: appData.full_name,
      action: 'APPLICATION_SUBMITTED',
      target_type: 'practitioner_application',
      target_id: newApp.id,
      metadata: { registration_number: appData.registration_number, state: appData.state }
    });

    return newApp;
  },

  async updateApplicationStatus(
    appId: string, 
    status: ApplicationStatus, 
    reviewerName: string,
    decisionReason: string,
    verificationSource: string
  ): Promise<PractitionerApplication | null> {
    const apps = getLocal<PractitionerApplication[]>(STORAGE_KEYS.APPLICATIONS, initialApplications);
    let updatedApp: PractitionerApplication | null = null;

    const updated = apps.map(app => {
      if (app.id === appId) {
        updatedApp = {
          ...app,
          status,
          reviewed_at: new Date().toISOString(),
          reviewed_by: reviewerName,
          decision_reason: decisionReason,
          verification_source: verificationSource,
          verification_checked_at: new Date().toISOString(),
          internal_notes: `Status changed to ${status}. Reason: ${decisionReason}. Verified against: ${verificationSource}`
        };
        return updatedApp;
      }
      return app;
    });

    setLocal(STORAGE_KEYS.APPLICATIONS, updated);

    // If approved, create/update member profile
    if (status === 'verified' && updatedApp) {
      const members = getLocal<UserProfile[]>(STORAGE_KEYS.MEMBERS, initialMembers);
      const targetApp = updatedApp as PractitionerApplication;
      const existingIdx = members.findIndex(m => m.id === targetApp.user_id);
      
      const newMemberProfile: UserProfile = {
        id: targetApp.user_id,
        email: targetApp.email,
        full_name: targetApp.full_name,
        display_name: targetApp.full_name,
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        role: 'member',
        status: 'verified',
        qualification: targetApp.qualification,
        experience_years: targetApp.experience_years || 5,
        registration_number: targetApp.registration_number,
        registration_authority: targetApp.registration_authority,
        state: targetApp.state,
        clinic_institution: targetApp.clinic_institution || 'Homoeopathy Clinical Center',
        specialization: targetApp.specialization || 'General Homoeopathy',
        bio: 'Verified practitioner registered with ' + targetApp.registration_authority,
        interests: ['Clinical Cases', 'Materia Medica'],
        profile_visibility: 'members_only',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (existingIdx >= 0) {
        members[existingIdx] = { ...members[existingIdx], status: 'verified', role: 'member' };
      } else {
        members.push(newMemberProfile);
      }
      setLocal(STORAGE_KEYS.MEMBERS, members);
    }

    // Log administrative action
    await this.addAuditLog({
      actor_id: 'user-admin',
      actor_name: reviewerName,
      action: `APPLICATION_${status.toUpperCase()}`,
      target_type: 'practitioner_application',
      target_id: appId,
      metadata: { status, reason: decisionReason, source: verificationSource }
    });

    return updatedApp;
  },

  // Reports
  async getReports(): Promise<Report[]> {
    return getLocal<Report[]>(STORAGE_KEYS.REPORTS, [
      {
        id: 'rep-1',
        reporter_id: 'user-ananya',
        reporter_name: 'Dr. Ananya',
        target_type: 'post',
        target_id: 'post-99',
        target_title: 'Unverified commercial miracle cure claim',
        reason: 'misleading_clinical_claim',
        note: 'Violates section 7.4 of community rules regarding therapeutic guarantees.',
        status: 'open',
        created_at: '1 day ago'
      }
    ]);
  },

  async submitReport(reportData: Omit<Report, 'id' | 'status' | 'created_at'>): Promise<Report> {
    const newReport: Report = {
      ...reportData,
      id: 'rep-' + Date.now(),
      status: 'open',
      created_at: 'Just now'
    };
    const current = getLocal<Report[]>(STORAGE_KEYS.REPORTS, []);
    setLocal(STORAGE_KEYS.REPORTS, [newReport, ...current]);
    return newReport;
  },

  async updateReportStatus(reportId: string, status: 'resolved' | 'dismissed', note: string): Promise<void> {
    const reports = getLocal<Report[]>(STORAGE_KEYS.REPORTS, []);
    const updated = reports.map(r => r.id === reportId ? { ...r, status, resolution_note: note, resolved_at: new Date().toISOString() } : r);
    setLocal(STORAGE_KEYS.REPORTS, updated);
  },

  // Audit Logs
  async getAuditLogs(): Promise<AuditLog[]> {
    return getLocal<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, initialAuditLogs);
  },

  async addAuditLog(log: Omit<AuditLog, 'id' | 'created_at'>): Promise<void> {
    const newLog: AuditLog = {
      ...log,
      id: 'log-' + Date.now(),
      created_at: new Date().toISOString()
    };
    const logs = getLocal<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, initialAuditLogs);
    setLocal(STORAGE_KEYS.AUDIT_LOGS, [newLog, ...logs]);
  },

  // Dashboard Overview Counts (Live data from store)
  async getDashboardStats() {
    const members = getLocal<UserProfile[]>(STORAGE_KEYS.MEMBERS, initialMembers);
    const apps = getLocal<PractitionerApplication[]>(STORAGE_KEYS.APPLICATIONS, initialApplications);
    const posts = getLocal<Post[]>(STORAGE_KEYS.POSTS, initialPosts);
    const events = getLocal<Event[]>(STORAGE_KEYS.EVENTS, initialEvents);
    const reports = getLocal<Report[]>(STORAGE_KEYS.REPORTS, []);

    const pendingCount = apps.filter(a => a.status === 'pending_review' || a.status === 'submitted').length;
    const verifiedMembersCount = members.filter(m => m.status === 'verified').length;
    const openReportsCount = reports.filter(r => r.status === 'open' || r.status === 'under_review').length;

    return {
      totalMembers: verifiedMembersCount,
      pendingApplications: pendingCount,
      totalDiscussions: posts.length,
      upcomingEvents: events.length,
      openReports: openReportsCount
    };
  }
};
