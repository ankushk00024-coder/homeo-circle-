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
  ApplicationStatus,
  ConnectionRequest,
  MentorshipRequest,
  AppNotification,
  EventRegistration,
  PlatformSettings
} from '../types';
import { 
  initialMembers, 
  initialPosts, 
  initialEvents, 
  initialOpportunities, 
  initialKnowledgePosts, 
  initialApplications, 
  initialAuditLogs,
  initialConnections,
  initialMentorshipRequests,
  initialNotifications,
  initialEventRegistrations,
  initialPlatformSettings
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

// Demo mode: no backend configured, so the app runs entirely on mock data in
// localStorage. When Supabase IS configured, every live call below surfaces its
// errors and never falls back to mock data.
export const isDemoMode = !isSupabaseConfigured;

type QueryResult<T> = { data: T | null; error: { message: string } | null };

// Throws on a Supabase error; an empty result stays empty (never mock data).
function unwrap<T>(result: QueryResult<T>, empty: T): T {
  if (result.error) throw new Error(result.error.message);
  return result.data ?? empty;
}

function unwrapOne<T>(result: QueryResult<T>): T {
  if (result.error) throw new Error(result.error.message);
  if (result.data == null) throw new Error('No record was returned.');
  return result.data;
}

function check(result: { error: { message: string } | null }): void {
  if (result.error) throw new Error(result.error.message);
}

// Strips characters that would break a PostgREST or() filter string.
function sanitizeSearch(value: string): string {
  return value.replace(/[,()%*\\]/g, ' ').trim();
}

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
  CONNECTIONS: 'homeocircle_connections',
  MENTORSHIP: 'homeocircle_mentorship',
  NOTIFICATIONS: 'homeocircle_notifications',
  EVENT_REGISTRATIONS: 'homeocircle_event_registrations',
  BOOKMARKS: 'homeocircle_bookmarks',
  SETTINGS: 'homeocircle_settings'
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
  // ─── POSTS ─────────────────────────────────────────────────────────────
  async getPosts(categoryFilter?: string, sort: 'latest' | 'discussed' | 'liked' = 'latest'): Promise<Post[]> {
    if (supabase) {
      let query = supabase.from('posts').select('*');
      if (categoryFilter && categoryFilter !== 'all') {
        query = query.eq('category_id', categoryFilter);
      }
      if (sort === 'discussed') {
        query = query.order('comments_count', { ascending: false });
      } else if (sort === 'liked') {
        query = query.order('likes_count', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }
      return unwrap(await query, [] as Post[]);
    }
    let posts = getLocal<Post[]>(STORAGE_KEYS.POSTS, initialPosts);
    if (categoryFilter && categoryFilter !== 'all') {
      posts = posts.filter(p => p.category_id === categoryFilter || p.category_name.toLowerCase().includes(categoryFilter.toLowerCase()));
    }
    if (sort === 'discussed') {
      posts = [...posts].sort((a, b) => b.comments_count - a.comments_count);
    } else if (sort === 'liked') {
      posts = [...posts].sort((a, b) => b.likes_count - a.likes_count);
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
      author_role: newPostData.author_role || 'doctor',
      title: newPostData.title || '',
      body: newPostData.body || '',
      category_id: newPostData.category_id || 'clinical-cases',
      category_name: newPostData.category_name || 'Clinical Learning',
      category_badge_color: newPostData.category_badge_color || 'bg-teal-50 text-teal-700 border-teal-200',
      source_url: newPostData.source_url,
      attachment_url: newPostData.attachment_url,
      status: 'published',
      likes_count: 0,
      comments_count: 0,
      created_at: 'Just now'
    };

    if (supabase) {
      // The database generates id/created_at and owns the counters.
      const { id: _id, created_at: _createdAt, likes_count: _likes, comments_count: _comments, is_liked: _isLiked, ...row } = newPost;
      return unwrapOne(await supabase.from('posts').insert([row]).select().single());
    }

    const posts = getLocal<Post[]>(STORAGE_KEYS.POSTS, initialPosts);
    const updated = [newPost, ...posts];
    setLocal(STORAGE_KEYS.POSTS, updated);
    return newPost;
  },

  async updatePost(id: string, updates: Partial<Post>): Promise<Post> {
    if (supabase) {
      return unwrapOne(await supabase.from('posts').update(updates).eq('id', id).select().single());
    }
    const posts = getLocal<Post[]>(STORAGE_KEYS.POSTS, initialPosts);
    let updatedItem: Post | null = null;
    const updated = posts.map(p => {
      if (p.id === id) {
        updatedItem = { ...p, ...updates, updated_at: 'Just now' };
        return updatedItem;
      }
      return p;
    });
    setLocal(STORAGE_KEYS.POSTS, updated);
    return updatedItem || posts[0];
  },

  async deletePost(id: string): Promise<void> {
    if (supabase) {
      check(await supabase.from('posts').delete().eq('id', id));
      return;
    }
    const posts = getLocal<Post[]>(STORAGE_KEYS.POSTS, initialPosts);
    const updated = posts.filter(p => p.id !== id);
    setLocal(STORAGE_KEYS.POSTS, updated);
  },

  async toggleLikePost(postId: string): Promise<number> {
    if (supabase) {
      // Per-user likes are not modelled in the schema yet; this only adjusts the counter.
      const current = unwrapOne<{ likes_count: number | null }>(await supabase.from('posts').select('likes_count').eq('id', postId).single());
      const next = (current.likes_count ?? 0) + 1;
      check(await supabase.from('posts').update({ likes_count: next }).eq('id', postId));
      return next;
    }
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

  async toggleBookmarkPost(postId: string, userId: string): Promise<boolean> {
    const key = `${STORAGE_KEYS.BOOKMARKS}_${userId}`;
    const bookmarks = getLocal<string[]>(key, ['post-2']);
    let isSaved = false;
    let updated: string[];
    if (bookmarks.includes(postId)) {
      updated = bookmarks.filter(id => id !== postId);
      isSaved = false;
    } else {
      updated = [...bookmarks, postId];
      isSaved = true;
    }
    setLocal(key, updated);
    return isSaved;
  },

  async getSavedPostIds(userId: string): Promise<string[]> {
    const key = `${STORAGE_KEYS.BOOKMARKS}_${userId}`;
    return getLocal<string[]>(key, ['post-2']);
  },

  // ─── COMMENTS ──────────────────────────────────────────────────────────
  async getComments(postId: string): Promise<Comment[]> {
    if (supabase) {
      return unwrap(
        await supabase.from('comments').select('*').eq('post_id', postId).order('created_at', { ascending: true }),
        [] as Comment[]
      );
    }
    const allComments = getLocal<Comment[]>(STORAGE_KEYS.COMMENTS, [
      {
        id: 'comm-1',
        post_id: 'post-1',
        author_id: 'user-arjun',
        author_name: 'Dr. Arjun Nair',
        author_avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
        author_qualification: 'MD (Hom)',
        body: 'Excellent observation on Allium Cepa. Have you evaluated Arsenicum Album 200C in patients where nocturnal burning modalities predominate?',
        status: 'published',
        created_at: '2 hours ago'
      },
      {
        id: 'comm-2',
        post_id: 'post-1',
        author_id: 'user-ananya',
        author_name: 'Dr. Ananya Sharma',
        author_avatar: 'https://images.unsplash.com/photo-1594824813633-4f24f8087569?w=150&auto=format&fit=crop&q=80',
        author_qualification: 'MD (Hom)',
        body: 'Concur with Dr. Arjun. We noticed Sabadilla 30C specifically works when violent paroxysmal sneezing starts immediately on stepping outdoors.',
        status: 'published',
        created_at: '1 hour ago'
      }
    ]);
    return allComments.filter(c => c.post_id === postId);
  },

  async addComment(postId: string, user: UserProfile, body: string, parentCommentId?: string): Promise<Comment> {
    const newComment: Comment = {
      id: 'comm-' + Date.now(),
      post_id: postId,
      author_id: user.id,
      author_name: user.display_name || user.full_name,
      author_avatar: user.avatar_url,
      author_qualification: user.qualification || 'Doctor',
      parent_comment_id: parentCommentId,
      body,
      status: 'published',
      created_at: 'Just now'
    };

    if (supabase) {
      const { id: _id, created_at: _createdAt, ...row } = newComment;
      return unwrapOne(await supabase.from('comments').insert([row]).select().single());
    }

    const allComments = getLocal<Comment[]>(STORAGE_KEYS.COMMENTS, []);
    setLocal(STORAGE_KEYS.COMMENTS, [...allComments, newComment]);

    // Increment post comment count
    const posts = getLocal<Post[]>(STORAGE_KEYS.POSTS, initialPosts);
    const updatedPosts = posts.map(p => p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p);
    setLocal(STORAGE_KEYS.POSTS, updatedPosts);

    return newComment;
  },

  async deleteComment(commentId: string): Promise<void> {
    const allComments = getLocal<Comment[]>(STORAGE_KEYS.COMMENTS, []);
    const updated = allComments.filter(c => c.id !== commentId);
    setLocal(STORAGE_KEYS.COMMENTS, updated);
  },

  // ─── MEMBERS & DIRECTORY ───────────────────────────────────────────────
  async getMembers(search = '', stateFilter = 'All', specFilter = 'All', roleFilter = 'All'): Promise<UserProfile[]> {
    if (supabase) {
      // Other members are read from the column-restricted profile_public_view
      // (see docs/backend). The profiles table itself only returns your own row.
      let query = supabase.from('profile_public_view').select('*');
      if (stateFilter !== 'All') query = query.ilike('location', `%${sanitizeSearch(stateFilter)}%`);
      if (specFilter !== 'All') query = query.ilike('specialization', `%${sanitizeSearch(specFilter)}%`);
      if (roleFilter !== 'All') query = query.eq('role', roleFilter.toLowerCase());
      const term = sanitizeSearch(search);
      if (term) {
        query = query.or(
          `display_name.ilike.%${term}%,full_name.ilike.%${term}%,specialization.ilike.%${term}%,location.ilike.%${term}%`
        );
      }
      return unwrap(await query, [] as UserProfile[]);
    }
    const stored = getLocal<UserProfile[]>(STORAGE_KEYS.MEMBERS, initialMembers);
    const storedIds = new Set(stored.map(m => m.id));
    const members = [...stored, ...initialMembers.filter(m => !storedIds.has(m.id))];
    if (members.length !== stored.length) {
      setLocal(STORAGE_KEYS.MEMBERS, members);
    }
    return members.filter(m => {
      const matchesSearch = !search || 
        m.full_name.toLowerCase().includes(search.toLowerCase()) ||
        m.display_name.toLowerCase().includes(search.toLowerCase()) ||
        (m.specialization && m.specialization.toLowerCase().includes(search.toLowerCase())) ||
        (m.state && m.state.toLowerCase().includes(search.toLowerCase())) ||
        (m.city && m.city.toLowerCase().includes(search.toLowerCase())) ||
        (m.institution && m.institution.toLowerCase().includes(search.toLowerCase())) ||
        (m.interests && m.interests.some(i => i.toLowerCase().includes(search.toLowerCase())));
      
      const matchesState = stateFilter === 'All' || m.state === stateFilter;
      const matchesSpec = specFilter === 'All' || (m.specialization && m.specialization.toLowerCase().includes(specFilter.toLowerCase()));
      const matchesRole = roleFilter === 'All' || 
        m.role === roleFilter.toLowerCase() || 
        m.account_type === roleFilter.toLowerCase() ||
        (roleFilter === 'Doctor' && (m.role === 'doctor' || m.role === 'member')) ||
        (roleFilter === 'Student' && m.role === 'student') ||
        (roleFilter === 'Researcher' && m.role === 'researcher');
      
      return matchesSearch && matchesState && matchesSpec && matchesRole;
    });
  },

  async getMemberById(id: string): Promise<UserProfile | null> {
    if (supabase) {
      return unwrap(await supabase.from('profile_public_view').select('*').eq('id', id).maybeSingle(), null);
    }
    const members = getLocal<UserProfile[]>(STORAGE_KEYS.MEMBERS, initialMembers);
    return members.find(m => m.id === id) || null;
  },

  async updateMemberProfile(id: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    if (supabase) {
      return unwrapOne(await supabase.from('profiles').update(updates).eq('id', id).select().single());
    }
    const members = getLocal<UserProfile[]>(STORAGE_KEYS.MEMBERS, initialMembers);
    let updatedProfile: UserProfile | null = null;
    const updated = members.map(m => {
      if (m.id === id) {
        updatedProfile = { ...m, ...updates, updated_at: new Date().toISOString() };
        return updatedProfile;
      }
      return m;
    });
    setLocal(STORAGE_KEYS.MEMBERS, updated);
    return updatedProfile || members[0];
  },

  // ─── CONNECTION REQUESTS (MY NETWORK) ──────────────────────────────────
  async getConnectionRequests(userId?: string): Promise<ConnectionRequest[]> {
    const all = getLocal<ConnectionRequest[]>(STORAGE_KEYS.CONNECTIONS, initialConnections);
    if (!userId) return all;
    return all.filter(c => c.sender_id === userId || c.recipient_id === userId);
  },

  async sendConnectionRequest(sender: UserProfile, recipient: UserProfile): Promise<ConnectionRequest> {
    if (sender.id === recipient.id) {
      throw new Error('You cannot send a connection request to yourself.');
    }
    const all = getLocal<ConnectionRequest[]>(STORAGE_KEYS.CONNECTIONS, initialConnections);
    
    // Check duplicate
    const existing = all.find(c => 
      (c.sender_id === sender.id && c.recipient_id === recipient.id) ||
      (c.sender_id === recipient.id && c.recipient_id === sender.id)
    );
    if (existing) {
      if (existing.status === 'accepted') throw new Error('You are already connected with this member.');
      if (existing.status === 'pending') throw new Error('A connection request is already pending between you and this member.');
    }

    const newConn: ConnectionRequest = {
      id: 'conn-' + Date.now(),
      sender_id: sender.id,
      sender_name: sender.display_name || sender.full_name,
      sender_avatar: sender.avatar_url,
      sender_role: sender.role,
      sender_qualification: sender.qualification,
      recipient_id: recipient.id,
      recipient_name: recipient.display_name || recipient.full_name,
      recipient_avatar: recipient.avatar_url,
      recipient_role: recipient.role,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const updated = [newConn, ...all];
    setLocal(STORAGE_KEYS.CONNECTIONS, updated);

    // Create real in-app notification for the recipient
    await this.createNotification({
      user_id: recipient.id,
      title: 'New Connection Request',
      message: `${sender.display_name || sender.full_name} (${sender.qualification || 'Member'}) has sent you a connection request.`,
      type: 'connection_request',
      link: '/members?tab=network',
      action_id: newConn.id,
      action_status: 'pending'
    });

    if (supabase) {
      // Notifications for the recipient are created by a database trigger.
      check(await supabase.from('connection_requests').insert([
        { sender_id: sender.id, recipient_id: recipient.id, status: 'pending' }
      ]));
    }

    return newConn;
  },

  async respondConnectionRequest(requestId: string, status: 'accepted' | 'declined', responder: UserProfile): Promise<ConnectionRequest> {
    const all = getLocal<ConnectionRequest[]>(STORAGE_KEYS.CONNECTIONS, initialConnections);
    let targetConn: ConnectionRequest | null = null;

    const updated = all.map(c => {
      if (c.id === requestId) {
        targetConn = { ...c, status, updated_at: new Date().toISOString() };
        return targetConn;
      }
      return c;
    });
    setLocal(STORAGE_KEYS.CONNECTIONS, updated);

    if (targetConn && status === 'accepted') {
      const conn = targetConn as ConnectionRequest;
      // Notify the original sender
      await this.createNotification({
        user_id: conn.sender_id,
        title: 'Connection Accepted',
        message: `${responder.display_name || responder.full_name} accepted your connection request. You can now view their direct profile details.`,
        type: 'connection_accepted',
        link: `/members/${responder.id}`
      });
    }

    // Update notification status if exists
    const notifs = getLocal<AppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, initialNotifications);
    const updatedNotifs = notifs.map(n => {
      if (n.action_id === requestId) {
        return { ...n, action_status: status, is_read: true };
      }
      return n;
    });
    setLocal(STORAGE_KEYS.NOTIFICATIONS, updatedNotifs);

    if (supabase) {
      check(await supabase.from('connection_requests').update({ status, updated_at: new Date().toISOString() }).eq('id', requestId));
    }

    return targetConn || all[0];
  },

  async cancelConnectionRequest(requestId: string): Promise<void> {
    const all = getLocal<ConnectionRequest[]>(STORAGE_KEYS.CONNECTIONS, initialConnections);
    const updated = all.filter(c => c.id !== requestId);
    setLocal(STORAGE_KEYS.CONNECTIONS, updated);
  },

  async removeConnection(userId1: string, userId2: string): Promise<void> {
    const all = getLocal<ConnectionRequest[]>(STORAGE_KEYS.CONNECTIONS, initialConnections);
    const updated = all.filter(c => 
      !( (c.sender_id === userId1 && c.recipient_id === userId2) ||
         (c.sender_id === userId2 && c.recipient_id === userId1) )
    );
    setLocal(STORAGE_KEYS.CONNECTIONS, updated);
  },

  // ─── MENTORSHIP WORKFLOW (STUDENT SECTION) ─────────────────────────────
  async getMentorshipRequests(userId?: string): Promise<MentorshipRequest[]> {
    const all = getLocal<MentorshipRequest[]>(STORAGE_KEYS.MENTORSHIP, initialMentorshipRequests);
    if (!userId) return all;
    return all.filter(m => m.student_id === userId || m.mentor_id === userId);
  },

  async sendMentorshipRequest(data: Partial<MentorshipRequest>): Promise<MentorshipRequest> {
    const all = getLocal<MentorshipRequest[]>(STORAGE_KEYS.MENTORSHIP, initialMentorshipRequests);
    const newReq: MentorshipRequest = {
      id: 'mentor-req-' + Date.now(),
      student_id: data.student_id || '',
      student_name: data.student_name || '',
      student_avatar: data.student_avatar,
      student_institution: data.student_institution || 'BHMS Medical College',
      student_course_year: data.student_course_year || 'Final Year BHMS',
      mentor_id: data.mentor_id || '',
      mentor_name: data.mentor_name || '',
      mentor_avatar: data.mentor_avatar,
      mentor_specialization: data.mentor_specialization || 'Clinical Practice',
      message: data.message || '',
      goals: data.goals || '',
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const updated = [newReq, ...all];
    setLocal(STORAGE_KEYS.MENTORSHIP, updated);

    // Create real in-app notification for the mentor
    await this.createNotification({
      user_id: newReq.mentor_id,
      title: 'New Student Mentorship Request',
      message: `${newReq.student_name} (${newReq.student_course_year}) has requested your mentorship guidance in ${newReq.mentor_specialization}.`,
      type: 'mentorship_request',
      link: '/students',
      action_id: newReq.id,
      action_status: 'pending'
    });

    return newReq;
  },

  async respondMentorshipRequest(requestId: string, status: 'accepted' | 'declined'): Promise<MentorshipRequest> {
    const all = getLocal<MentorshipRequest[]>(STORAGE_KEYS.MENTORSHIP, initialMentorshipRequests);
    let targetReq: MentorshipRequest | null = null;
    const updated = all.map(r => {
      if (r.id === requestId) {
        targetReq = { ...r, status, updated_at: new Date().toISOString() };
        return targetReq;
      }
      return r;
    });
    setLocal(STORAGE_KEYS.MENTORSHIP, updated);

    if (targetReq && status === 'accepted') {
      const req = targetReq as MentorshipRequest;
      await this.createNotification({
        user_id: req.student_id,
        title: 'Mentorship Request Accepted!',
        message: `${req.mentor_name} accepted your mentorship request. Check your Student Dashboard to collaborate.`,
        type: 'mentorship_accepted',
        link: '/students'
      });
    }

    return targetReq || all[0];
  },

  // ─── IN-APP NOTIFICATIONS ──────────────────────────────────────────────
  async getNotifications(userId: string): Promise<AppNotification[]> {
    const all = getLocal<AppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, initialNotifications);
    return all.filter(n => n.user_id === userId || !n.user_id);
  },

  async markNotificationRead(id: string): Promise<void> {
    const all = getLocal<AppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, initialNotifications);
    const updated = all.map(n => n.id === id ? { ...n, is_read: true } : n);
    setLocal(STORAGE_KEYS.NOTIFICATIONS, updated);
  },

  async markAllNotificationsRead(userId: string): Promise<void> {
    const all = getLocal<AppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, initialNotifications);
    const updated = all.map(n => n.user_id === userId ? { ...n, is_read: true } : n);
    setLocal(STORAGE_KEYS.NOTIFICATIONS, updated);
  },

  async createNotification(data: Partial<AppNotification>): Promise<AppNotification> {
    const all = getLocal<AppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, initialNotifications);
    const newNotif: AppNotification = {
      id: 'notif-' + Date.now(),
      user_id: data.user_id || 'user-ananya',
      title: data.title || 'Notification',
      message: data.message || '',
      type: data.type || 'system',
      link: data.link || '/dashboard',
      is_read: false,
      action_id: data.action_id,
      action_status: data.action_status,
      created_at: 'Just now'
    };
    setLocal(STORAGE_KEYS.NOTIFICATIONS, [newNotif, ...all]);
    return newNotif;
  },

  // ─── EVENTS & WEBINARS ─────────────────────────────────────────────────
  async getEvents(formatFilter?: string): Promise<Event[]> {
    if (supabase) {
      let query = supabase.from('events').select('*').order('start_at', { ascending: true });
      if (formatFilter && formatFilter !== 'All') {
        query = query.ilike('format', `%${sanitizeSearch(formatFilter)}%`);
      }
      return unwrap(await query, [] as Event[]);
    }
    const events = getLocal<Event[]>(STORAGE_KEYS.EVENTS, initialEvents);
    if (!formatFilter || formatFilter === 'All') return events;
    return events.filter(e => e.format.toLowerCase().includes(formatFilter.toLowerCase()));
  },

  async createEvent(eventData: Partial<Event>): Promise<Event> {
    const newEvent: Event = {
      id: 'event-' + Date.now(),
      title: eventData.title || '',
      summary: eventData.summary || '',
      organizer: eventData.organizer || 'Homeo Circle Clinical Council',
      speaker: eventData.speaker || 'Clinical Faculty',
      speaker_title: eventData.speaker_title,
      date_badge_day: eventData.date_badge_day || '15',
      date_badge_month: eventData.date_badge_month || 'MAR',
      time_display: eventData.time_display || 'Online • 6:00 PM IST',
      start_at: eventData.start_at || new Date().toISOString(),
      format: eventData.format || 'Webinar',
      location: eventData.location || 'Online via Secure Room',
      registration_url: eventData.registration_url || 'https://homeocircle.in/events',
      status: 'published',
      attendees_count: 0,
      image_url: eventData.image_url || '/images/events-cme.svg',
      meeting_link: eventData.meeting_link
    };
    const events = getLocal<Event[]>(STORAGE_KEYS.EVENTS, initialEvents);
    setLocal(STORAGE_KEYS.EVENTS, [newEvent, ...events]);
    return newEvent;
  },

  async updateEvent(id: string, updates: Partial<Event>): Promise<Event> {
    const events = getLocal<Event[]>(STORAGE_KEYS.EVENTS, initialEvents);
    let updatedItem: Event | null = null;
    const updated = events.map(e => {
      if (e.id === id) {
        updatedItem = { ...e, ...updates };
        return updatedItem;
      }
      return e;
    });
    setLocal(STORAGE_KEYS.EVENTS, updated);
    return updatedItem || events[0];
  },

  async registerForEvent(eventId: string, user: UserProfile): Promise<EventRegistration> {
    const registrations = getLocal<EventRegistration[]>(STORAGE_KEYS.EVENT_REGISTRATIONS, initialEventRegistrations);
    const existing = registrations.find(r => r.event_id === eventId && r.user_id === user.id);
    if (existing && existing.status === 'registered') {
      return existing;
    }

    const newReg: EventRegistration = {
      id: 'reg-' + Date.now(),
      event_id: eventId,
      user_id: user.id,
      user_name: user.display_name || user.full_name,
      user_email: user.email,
      status: 'registered',
      registered_at: new Date().toISOString()
    };

    const updated = [newReg, ...registrations.filter(r => !(r.event_id === eventId && r.user_id === user.id))];
    setLocal(STORAGE_KEYS.EVENT_REGISTRATIONS, updated);

    // Increment event attendee count
    const events = getLocal<Event[]>(STORAGE_KEYS.EVENTS, initialEvents);
    const updatedEvents = events.map(e => e.id === eventId ? { ...e, attendees_count: e.attendees_count + 1 } : e);
    setLocal(STORAGE_KEYS.EVENTS, updatedEvents);

    // Create notification
    await this.createNotification({
      user_id: user.id,
      title: 'Webinar Registration Confirmed',
      message: `You are registered for: ${events.find(e => e.id === eventId)?.title || 'Webinar'}. Meeting link saved to your My Events tab.`,
      type: 'event_reminder',
      link: '/events?tab=my-events'
    });

    return newReg;
  },

  async cancelEventRegistration(eventId: string, userId: string): Promise<void> {
    const registrations = getLocal<EventRegistration[]>(STORAGE_KEYS.EVENT_REGISTRATIONS, initialEventRegistrations);
    const updated = registrations.filter(r => !(r.event_id === eventId && r.user_id === userId));
    setLocal(STORAGE_KEYS.EVENT_REGISTRATIONS, updated);

    const events = getLocal<Event[]>(STORAGE_KEYS.EVENTS, initialEvents);
    const updatedEvents = events.map(e => e.id === eventId ? { ...e, attendees_count: Math.max(0, e.attendees_count - 1) } : e);
    setLocal(STORAGE_KEYS.EVENTS, updatedEvents);
  },

  async getUserEventRegistrations(userId: string): Promise<EventRegistration[]> {
    const registrations = getLocal<EventRegistration[]>(STORAGE_KEYS.EVENT_REGISTRATIONS, initialEventRegistrations);
    return registrations.filter(r => r.user_id === userId && r.status === 'registered');
  },

  // ─── KNOWLEDGE & RESEARCH ──────────────────────────────────────────────
  async getKnowledgePosts(): Promise<KnowledgePost[]> {
    if (supabase) {
      return unwrap(
        await supabase.from('knowledge_posts').select('*').order('published_at', { ascending: false }),
        [] as KnowledgePost[]
      );
    }
    return getLocal<KnowledgePost[]>(STORAGE_KEYS.KNOWLEDGE, initialKnowledgePosts);
  },

  async createKnowledgePost(postData: Partial<KnowledgePost>): Promise<KnowledgePost> {
    const newPost: KnowledgePost = {
      id: 'know-' + Date.now(),
      title: postData.title || '',
      summary: postData.summary || '',
      source_url: postData.source_url || '',
      journal: postData.journal || 'Peer Review Journal',
      content_type: postData.content_type || 'Clinical Trial',
      limitations: postData.limitations || 'Study limitations documented as per editorial policy.',
      status: 'published',
      published_at: new Date().toISOString().split('T')[0],
      doi: postData.doi,
      author_name: postData.author_name,
      author_affiliation: postData.author_affiliation
    };
    const all = getLocal<KnowledgePost[]>(STORAGE_KEYS.KNOWLEDGE, initialKnowledgePosts);
    setLocal(STORAGE_KEYS.KNOWLEDGE, [newPost, ...all]);
    return newPost;
  },

  async updateKnowledgePost(id: string, updates: Partial<KnowledgePost>): Promise<KnowledgePost> {
    const all = getLocal<KnowledgePost[]>(STORAGE_KEYS.KNOWLEDGE, initialKnowledgePosts);
    let updatedItem: KnowledgePost | null = null;
    const updated = all.map(p => {
      if (p.id === id) {
        updatedItem = { ...p, ...updates };
        return updatedItem;
      }
      return p;
    });
    setLocal(STORAGE_KEYS.KNOWLEDGE, updated);
    return updatedItem || all[0];
  },

  // ─── OPPORTUNITIES ─────────────────────────────────────────────────────
  async getOpportunities(typeFilter?: string): Promise<Opportunity[]> {
    if (supabase) {
      let query = supabase.from('opportunities').select('*').order('created_at', { ascending: false });
      if (typeFilter && typeFilter !== 'All') {
        query = query.ilike('type', `%${sanitizeSearch(typeFilter)}%`);
      }
      return unwrap(await query, [] as Opportunity[]);
    }
    const opps = getLocal<Opportunity[]>(STORAGE_KEYS.OPPORTUNITIES, initialOpportunities);
    if (!typeFilter || typeFilter === 'All') return opps;
    return opps.filter(o => o.type.toLowerCase().includes(typeFilter.toLowerCase()));
  },

  async createOpportunity(oppData: Partial<Opportunity>): Promise<Opportunity> {
    const newOpp: Opportunity = {
      id: 'opp-' + Date.now(),
      title: oppData.title || '',
      organization: oppData.organization || 'Homeopathic Health Center',
      type: oppData.type || 'Job',
      description: oppData.description || '',
      eligibility: oppData.eligibility || 'BHMS / MD (Hom)',
      location: oppData.location || 'India',
      mode: oppData.mode || 'On-site',
      timing: oppData.timing || 'Full-time',
      deadline: oppData.deadline || '2026-12-31',
      source_url: oppData.source_url,
      application_url: oppData.application_url || 'https://homeocircle.in/apply',
      status: 'published',
      posted_time_ago: 'Just now'
    };
    const opps = getLocal<Opportunity[]>(STORAGE_KEYS.OPPORTUNITIES, initialOpportunities);
    setLocal(STORAGE_KEYS.OPPORTUNITIES, [newOpp, ...opps]);
    return newOpp;
  },

  async updateOpportunity(id: string, updates: Partial<Opportunity>): Promise<Opportunity> {
    const opps = getLocal<Opportunity[]>(STORAGE_KEYS.OPPORTUNITIES, initialOpportunities);
    let updatedItem: Opportunity | null = null;
    const updated = opps.map(o => {
      if (o.id === id) {
        updatedItem = { ...o, ...updates };
        return updatedItem;
      }
      return o;
    });
    setLocal(STORAGE_KEYS.OPPORTUNITIES, updated);
    return updatedItem || opps[0];
  },

  // ─── PRACTITIONER & ONBOARDING APPLICATIONS ───────────────────────────
  async getApplications(): Promise<PractitionerApplication[]> {
    if (supabase) {
      return unwrap(
        await supabase.from('practitioner_applications').select('*').order('submitted_at', { ascending: false }),
        [] as PractitionerApplication[]
      );
    }
    return getLocal<PractitionerApplication[]>(STORAGE_KEYS.APPLICATIONS, initialApplications);
  },

  async submitApplication(appData: Partial<PractitionerApplication>): Promise<PractitionerApplication> {
    const settings = await this.getPlatformSettings();
    const roleApplied = appData.role_applied || 'doctor';
    
    // Check if this role requires manual verification
    let initialStatus: ApplicationStatus = 'pending_review';
    if (roleApplied === 'student' && !settings.require_student_verification) {
      initialStatus = 'verified';
    } else if (roleApplied === 'doctor' && !settings.require_doctor_verification) {
      initialStatus = 'verified';
    } else if (roleApplied === 'researcher' && !settings.require_researcher_verification) {
      initialStatus = 'verified';
    }

    const newApp: PractitionerApplication = {
      id: 'app-' + Date.now(),
      user_id: appData.user_id || 'user-' + Date.now(),
      full_name: appData.full_name || '',
      email: appData.email || '',
      phone: appData.phone || '',
      role_applied: roleApplied,
      qualification: appData.qualification || 'BHMS',
      registration_number: appData.registration_number || '',
      registration_authority: appData.registration_authority || 'State Council',
      state: appData.state || 'Maharashtra',
      city: appData.city,
      clinic_institution: appData.clinic_institution,
      experience_years: appData.experience_years || 0,
      specialization: appData.specialization || 'Clinical Practice',
      institution: appData.institution,
      course_year: appData.course_year,
      mentorship_needs: appData.mentorship_needs,
      research_interests: appData.research_interests,
      publications: appData.publications,
      consent_at: new Date().toISOString(),
      status: initialStatus,
      submitted_at: 'Just now',
      document_url: appData.document_url,
      internal_notes: 'Application registered through unified onboarding.'
    };

    if (supabase) {
      // Status, review fields and ids are owned by the database (RLS blocks
      // clients from pre-setting a decision). user_id must be the signed-in
      // user's id, or omitted for guest applications.
      const { data: auth } = await supabase.auth.getUser();
      const {
        id: _id, status: _status, submitted_at: _submittedAt, internal_notes: _notes,
        consent_at: _consentAt, user_id: _userId, ...row
      } = newApp;
      return unwrapOne(
        await supabase
          .from('practitioner_applications')
          .insert([{ ...row, user_id: auth.user?.id ?? null }])
          .select()
          .single()
      );
    }

    const apps = getLocal<PractitionerApplication[]>(STORAGE_KEYS.APPLICATIONS, initialApplications);
    setLocal(STORAGE_KEYS.APPLICATIONS, [newApp, ...apps]);

    // Also register member profile
    const members = getLocal<UserProfile[]>(STORAGE_KEYS.MEMBERS, initialMembers);
    const newMember: UserProfile = {
      id: newApp.user_id,
      email: newApp.email,
      full_name: newApp.full_name,
      display_name: newApp.full_name.startsWith('Dr.') ? newApp.full_name : (newApp.role_applied === 'doctor' ? `Dr. ${newApp.full_name}` : newApp.full_name),
      role: newApp.role_applied,
      account_type: newApp.role_applied,
      status: initialStatus,
      qualification: newApp.qualification,
      experience_years: newApp.experience_years || 0,
      phone: newApp.phone,
      registration_number: newApp.registration_number,
      registration_authority: newApp.registration_authority,
      state: newApp.state,
      city: newApp.city,
      clinic_institution: newApp.clinic_institution,
      specialization: newApp.specialization,
      institution: newApp.institution,
      course_year: newApp.course_year,
      mentorship_needs: newApp.mentorship_needs,
      research_interests: newApp.research_interests,
      publications: newApp.publications,
      bio: `${newApp.qualification} • ${newApp.role_applied === 'student' ? newApp.institution : newApp.specialization}`,
      interests: newApp.mentorship_needs || ['Clinical Case Studies', 'Materia Medica'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setLocal(STORAGE_KEYS.MEMBERS, [newMember, ...members]);

    return newApp;
  },

  async updateApplicationStatus(
    appId: string, 
    status: ApplicationStatus, 
    reviewerName: string, 
    decisionReason?: string, 
    verificationSource?: string,
    internalNotes?: string
  ): Promise<PractitionerApplication> {
    if (supabase) {
      // Reviews go through the review-practitioner-application Edge Function,
      // which checks the caller's admin role server-side and then calls the
      // service-role-only RPC. The service-role key never reaches the browser.
      const { error } = await supabase.functions.invoke('review-practitioner-application', {
        body: {
          application_id: appId,
          new_status: status,
          decision_reason: decisionReason || null,
          verification_source: verificationSource || null,
          internal_notes: internalNotes || null,
        },
      });
      if (error) throw new Error(error.message || 'The review could not be saved.');
      return unwrapOne(await supabase.from('practitioner_applications').select('*').eq('id', appId).single());
    }

    const apps = getLocal<PractitionerApplication[]>(STORAGE_KEYS.APPLICATIONS, initialApplications);
    let updatedApp: PractitionerApplication | null = null;
    const updated = apps.map(a => {
      if (a.id === appId) {
        updatedApp = {
          ...a,
          status,
          reviewed_at: new Date().toISOString(),
          reviewed_by: reviewerName,
          decision_reason: decisionReason,
          verification_source: verificationSource
        };
        return updatedApp;
      }
      return a;
    });
    setLocal(STORAGE_KEYS.APPLICATIONS, updated);

    // Sync member status
    if (updatedApp) {
      const app = updatedApp as PractitionerApplication;
      const members = getLocal<UserProfile[]>(STORAGE_KEYS.MEMBERS, initialMembers);
      const updatedMembers = members.map(m => {
        if (m.id === app.user_id || m.email === app.email) {
          return { ...m, status };
        }
        return m;
      });
      setLocal(STORAGE_KEYS.MEMBERS, updatedMembers);

      // Notify the applicant
      await this.createNotification({
        user_id: app.user_id,
        title: status === 'verified' ? 'Credentials Verified!' : 'Application Status Update',
        message: status === 'verified'
          ? 'Your professional credentials have been verified by the council committee. Full community access is enabled.'
          : `Your application status was updated to ${status}. ${decisionReason || ''}`,
        type: 'verification_update',
        link: status === 'verified' ? '/dashboard' : '/application-status'
      });
    }

    // Add audit log
    await this.addAuditLog({
      actor_id: reviewerName,
      actor_name: reviewerName,
      action: `APPLICATION_${status.toUpperCase()}`,
      target_type: 'practitioner_application',
      target_id: appId,
      metadata: { status, reviewer: reviewerName, reason: decisionReason }
    });

    return updatedApp || apps[0];
  },

  // ─── PLATFORM SETTINGS ─────────────────────────────────────────────────
  async getPlatformSettings(): Promise<PlatformSettings> {
    return getLocal<PlatformSettings>(STORAGE_KEYS.SETTINGS, initialPlatformSettings);
  },

  async updatePlatformSettings(settings: Partial<PlatformSettings>): Promise<PlatformSettings> {
    const current = getLocal<PlatformSettings>(STORAGE_KEYS.SETTINGS, initialPlatformSettings);
    const updated = { ...current, ...settings };
    setLocal(STORAGE_KEYS.SETTINGS, updated);
    return updated;
  },

  // ─── REPORTS & AUDIT LOGS ──────────────────────────────────────────────
  async submitReport(reportData: Partial<Report>): Promise<Report> {
    const newReport: Report = {
      id: 'rep-' + Date.now(),
      reporter_id: reportData.reporter_id || 'user-unknown',
      reporter_name: reportData.reporter_name || 'Anonymous',
      target_type: reportData.target_type || 'post',
      target_id: reportData.target_id || '',
      target_title: reportData.target_title || '',
      reason: reportData.reason || 'patient_privacy',
      note: reportData.note,
      status: 'open',
      created_at: 'Just now'
    };
    const reports = getLocal<Report[]>(STORAGE_KEYS.REPORTS, []);
    setLocal(STORAGE_KEYS.REPORTS, [newReport, ...reports]);
    return newReport;
  },

  async getReports(): Promise<Report[]> {
    return getLocal<Report[]>(STORAGE_KEYS.REPORTS, [
      {
        id: 'rep-1',
        reporter_id: 'user-priya',
        reporter_name: 'Dr. Priya Sharma',
        target_type: 'post',
        target_id: 'post-1',
        target_title: 'Managing seasonal allergies with homeopathy',
        reason: 'patient_privacy',
        note: 'Review patient age de-identification.',
        status: 'open',
        created_at: '1 day ago'
      }
    ]);
  },

  async resolveReport(reportId: string, resolutionNote: string, newStatus: 'resolved' | 'dismissed'): Promise<void> {
    const reports = await this.getReports();
    const updated = reports.map(r => r.id === reportId ? { ...r, status: newStatus, resolution_note: resolutionNote, resolved_at: new Date().toISOString() } : r);
    setLocal(STORAGE_KEYS.REPORTS, updated);
  },

  async updateReportStatus(reportId: string, status: 'resolved' | 'dismissed', resolutionNote: string): Promise<void> {
    return this.resolveReport(reportId, resolutionNote, status);
  },

  async getDashboardStats(): Promise<{
    totalMembers: number;
    pendingApplications: number;
    totalDiscussions: number;
    upcomingEvents: number;
    openReports: number;
  }> {
    const [members, apps, posts, events, reports] = await Promise.all([
      this.getMembers(),
      this.getApplications(),
      this.getPosts(),
      this.getEvents(),
      this.getReports()
    ]);
    return {
      totalMembers: members.length,
      pendingApplications: apps.filter(a => a.status === 'pending_review' || a.status === 'submitted').length,
      totalDiscussions: posts.length,
      upcomingEvents: events.length,
      openReports: reports.filter(r => r.status === 'open').length
    };
  },

  async getAuditLogs(): Promise<AuditLog[]> {
    return getLocal<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, initialAuditLogs);
  },

  async addAuditLog(log: Omit<AuditLog, 'id' | 'created_at'>): Promise<AuditLog> {
    const newLog: AuditLog = {
      id: 'log-' + Date.now(),
      ...log,
      created_at: new Date().toISOString()
    };
    const logs = getLocal<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, initialAuditLogs);
    setLocal(STORAGE_KEYS.AUDIT_LOGS, [newLog, ...logs]);
    return newLog;
  }
};
