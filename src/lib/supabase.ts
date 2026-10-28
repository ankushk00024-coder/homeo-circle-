/**
 * ==============================================================================
 * Homeo Circle — Centralized Data Access Layer
 * Integrates directly with Supabase PostgreSQL, Auth, and Storage.
 * ==============================================================================
 */

import { 
  supabase, 
  isSupabaseConfigured, 
  BackendConfigError, 
  getRequiredSupabase 
} from '../services/supabaseClient';

import {
  authService,
  profileService,
  applicationService,
  postService,
  commentService,
  connectionService,
  mentorshipService,
  notificationService,
  eventService,
  opportunityService,
  knowledgeService,
  reportService,
  adminService,
  storageService,
  categoryService
} from '../services';

import { 
  UserProfile, 
  UserRole,
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
  PlatformSettings,
  Category,
  MetricItem,
  AdminOverviewStats,
  VerificationReview
} from '../types';

// Re-export core clients and typed services
export { 
  supabase, 
  isSupabaseConfigured, 
  BackendConfigError, 
  getRequiredSupabase,
  authService,
  profileService,
  applicationService,
  postService,
  commentService,
  connectionService,
  mentorshipService,
  notificationService,
  eventService,
  opportunityService,
  knowledgeService,
  reportService,
  adminService,
  storageService,
  categoryService
};

/**
 * Unified data access interface maintaining 100% compatibility with all existing
 * page components, while executing real Supabase database operations, RLS checks, and triggers.
 */
export const dataService = {
  // ─── POSTS & DISCUSSIONS ───────────────────────────────────────────────────
  async getPosts(
    categoryFilter?: string, 
    sort: 'latest' | 'discussed' | 'liked' = 'latest',
    currentUserId?: string
  ): Promise<Post[]> {
    if (!isSupabaseConfigured || !supabase) return [];
    
    // Resolve current user if not explicitly provided
    let uid = currentUserId;
    if (!uid) {
      const session = (await supabase.auth.getSession()).data.session;
      uid = session?.user?.id;
    }

    return postService.getPosts(categoryFilter, sort, uid);
  },

  async getPostById(postId: string, currentUserId?: string): Promise<Post | null> {
    return postService.getPostById(postId, currentUserId);
  },

  async createPost(newPostData: Partial<Post>, author?: UserProfile): Promise<Post> {
    const client = getRequiredSupabase();

    let resolvedAuthor = author;
    if (!resolvedAuthor) {
      const user = (await client.auth.getUser()).data.user;
      if (user) {
        resolvedAuthor = await profileService.getProfile(user.id) || {
          id: user.id,
          email: user.email || '',
          full_name: newPostData.author_name || 'Member',
          display_name: newPostData.author_name || 'Member',
          role: (newPostData.author_role || 'doctor') as any,
          status: 'verified',
          qualification: newPostData.author_qualification || 'BHMS',
          experience_years: 5,
          state: 'Maharashtra',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      } else {
        throw new Error('You must be signed in to publish a clinical discussion.');
      }
    }

    return postService.createPost(newPostData, resolvedAuthor);
  },

  async updatePost(id: string, updates: Partial<Post>): Promise<Post> {
    return postService.updatePost(id, updates);
  },

  async deletePost(id: string): Promise<void> {
    return postService.deletePost(id);
  },

  async toggleLikePost(postId: string, userId?: string): Promise<number> {
    const client = getRequiredSupabase();
    let uid = userId;
    if (!uid) {
      const user = (await client.auth.getUser()).data.user;
      if (!user) throw new Error('You must be signed in to like discussions.');
      uid = user.id;
    }
    return postService.toggleLikePost(postId, uid);
  },

  async toggleBookmarkPost(postId: string, userId: string): Promise<boolean> {
    return postService.toggleBookmarkPost(postId, userId);
  },

  async getSavedPostIds(userId: string): Promise<string[]> {
    return postService.getSavedPostIds(userId);
  },

  // ─── COMMENTS ─────────────────────────────────────────────────────────────
  async getComments(postId: string): Promise<Comment[]> {
    return commentService.getComments(postId);
  },

  async addComment(
    postId: string, 
    user: UserProfile, 
    body: string, 
    parentCommentId?: string
  ): Promise<Comment> {
    return commentService.addComment(postId, user, body, parentCommentId);
  },

  async deleteComment(commentId: string): Promise<void> {
    return commentService.deleteComment(commentId);
  },

  // ─── MEMBERS & DIRECTORY ──────────────────────────────────────────────────
  async getMembers(
    search = '', 
    stateFilter = 'All', 
    specFilter = 'All', 
    roleFilter = 'All'
  ): Promise<UserProfile[]> {
    return profileService.getMembers(search, stateFilter, specFilter, roleFilter);
  },

  async getMemberById(id: string): Promise<UserProfile | null> {
    return profileService.getProfile(id);
  },

  async updateMemberProfile(id: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    return profileService.updateProfile(id, updates);
  },

  async getEligibleMentors(): Promise<UserProfile[]> {
    return profileService.getEligibleMentors();
  },

  // ─── CONNECTIONS & NETWORKING ─────────────────────────────────────────────
  async getConnectionRequests(userId?: string): Promise<ConnectionRequest[]> {
    return connectionService.getConnectionRequests(userId);
  },

  async sendConnectionRequest(sender: UserProfile, recipient: UserProfile): Promise<ConnectionRequest> {
    return connectionService.sendConnectionRequest(sender, recipient);
  },

  async respondConnectionRequest(
    requestId: string, 
    status: 'accepted' | 'declined', 
    responder: UserProfile
  ): Promise<ConnectionRequest> {
    return connectionService.respondConnectionRequest(requestId, status, responder);
  },

  async cancelConnectionRequest(requestId: string): Promise<void> {
    return connectionService.cancelConnectionRequest(requestId);
  },

  async removeConnection(userId1: string, userId2: string): Promise<void> {
    return connectionService.removeConnection(userId1, userId2);
  },

  // ─── CLINICAL MENTORSHIP ──────────────────────────────────────────────────
  async getMentorshipRequests(userId?: string): Promise<MentorshipRequest[]> {
    return mentorshipService.getMentorshipRequests(userId);
  },

  async sendMentorshipRequest(data: Partial<MentorshipRequest>): Promise<MentorshipRequest> {
    return mentorshipService.sendMentorshipRequest(data);
  },

  async respondMentorshipRequest(requestId: string, status: 'accepted' | 'declined'): Promise<MentorshipRequest> {
    return mentorshipService.respondMentorshipRequest(requestId, status);
  },

  // ─── IN-APP NOTIFICATIONS ─────────────────────────────────────────────────
  async getNotifications(userId: string): Promise<AppNotification[]> {
    return notificationService.getNotifications(userId);
  },

  async markNotificationRead(id: string): Promise<void> {
    return notificationService.markNotificationRead(id);
  },

  async markAllNotificationsRead(userId: string): Promise<void> {
    return notificationService.markAllNotificationsRead(userId);
  },

  async createNotification(data: Partial<AppNotification>): Promise<AppNotification> {
    return notificationService.createNotification(data);
  },

  // ─── EVENTS & CMES ────────────────────────────────────────────────────────
  async getEvents(formatFilter?: string): Promise<Event[]> {
    return eventService.getEvents(formatFilter);
  },

  async createEvent(eventData: Partial<Event>): Promise<Event> {
    return eventService.createEvent(eventData);
  },

  async updateEvent(id: string, updates: Partial<Event>): Promise<Event> {
    return eventService.updateEvent(id, updates);
  },

  async registerForEvent(eventId: string, user: UserProfile): Promise<EventRegistration> {
    return eventService.registerForEvent(eventId, user);
  },

  async cancelEventRegistration(eventId: string, userId: string): Promise<void> {
    return eventService.cancelEventRegistration(eventId, userId);
  },

  async getUserEventRegistrations(userId: string): Promise<EventRegistration[]> {
    return eventService.getUserEventRegistrations(userId);
  },

  // ─── RESEARCH & KNOWLEDGE ─────────────────────────────────────────────────
  async getKnowledgePosts(): Promise<KnowledgePost[]> {
    return knowledgeService.getKnowledgePosts();
  },

  async createKnowledgePost(postData: Partial<KnowledgePost>): Promise<KnowledgePost> {
    return knowledgeService.createKnowledgePost(postData);
  },

  async updateKnowledgePost(id: string, updates: Partial<KnowledgePost>): Promise<KnowledgePost> {
    return knowledgeService.updateKnowledgePost(id, updates);
  },

  // ─── OPPORTUNITIES & INTERNSHIPS ──────────────────────────────────────────
  async getOpportunities(typeFilter?: string): Promise<Opportunity[]> {
    return opportunityService.getOpportunities(typeFilter);
  },

  async createOpportunity(oppData: Partial<Opportunity>): Promise<Opportunity> {
    return opportunityService.createOpportunity(oppData);
  },

  async updateOpportunity(id: string, updates: Partial<Opportunity>): Promise<Opportunity> {
    return opportunityService.updateOpportunity(id, updates);
  },

  // ─── PRACTITIONER APPLICATIONS & VERIFICATION ─────────────────────────────
  async getApplications(): Promise<PractitionerApplication[]> {
    return applicationService.getApplications();
  },

  async getMyApplication(userId: string): Promise<PractitionerApplication | null> {
    return applicationService.getMyApplication(userId);
  },

  async getApplicationById(appId: string): Promise<PractitionerApplication | null> {
    return applicationService.getApplicationById(appId);
  },

  async lookupGuestApplicationStatus(appId: string, email: string): Promise<Partial<PractitionerApplication> | null> {
    return applicationService.lookupGuestApplicationStatus(appId, email);
  },

  async submitApplication(appData: Partial<PractitionerApplication>): Promise<PractitionerApplication> {
    return applicationService.submitApplication(appData);
  },

  async updateApplicationStatus(
    appId: string, 
    status: ApplicationStatus, 
    reviewerName: string, 
    decisionReason?: string, 
    verificationSource?: string,
    internalNotes?: string
  ): Promise<PractitionerApplication> {
    return applicationService.reviewApplication(
      appId, 
      status, 
      reviewerName, 
      decisionReason, 
      verificationSource,
      internalNotes
    );
  },

  // ─── PLATFORM SETTINGS ────────────────────────────────────────────────────
  async getPlatformSettings(): Promise<PlatformSettings> {
    return adminService.getPlatformSettings();
  },

  async updatePlatformSettings(settings: Partial<PlatformSettings>): Promise<PlatformSettings> {
    return adminService.updatePlatformSettings(settings);
  },

  // ─── CONTENT REPORTS & MODERATION ─────────────────────────────────────────
  async submitReport(reportData: Partial<Report>): Promise<Report> {
    return reportService.submitReport(reportData);
  },

  async getReports(): Promise<Report[]> {
    return reportService.getReports();
  },

  async resolveReport(reportId: string, resolutionNote: string, newStatus: 'resolved' | 'dismissed'): Promise<void> {
    return reportService.resolveReport(reportId, resolutionNote, newStatus);
  },

  async updateReportStatus(reportId: string, status: 'resolved' | 'dismissed', resolutionNote: string): Promise<void> {
    return reportService.updateReportStatus(reportId, status, resolutionNote);
  },

  // ─── ADMIN DASHBOARD & AUDIT LOGS ─────────────────────────────────────────
  async getDashboardStats(): Promise<{
    totalMembers: number;
    pendingApplications: number;
    totalDiscussions: number;
    upcomingEvents: number;
    openReports: number;
  }> {
    return adminService.getDashboardStats();
  },

  async getAuditLogs(): Promise<AuditLog[]> {
    return adminService.getAuditLogs();
  },

  async addAuditLog(log: Omit<AuditLog, 'id' | 'created_at'>): Promise<AuditLog> {
    return adminService.addAuditLog(log);
  },

  async updateUserRole(userId: string, newRole: UserRole, actorId: string, actorName: string): Promise<void> {
    return adminService.updateUserRole(userId, newRole, actorId, actorName);
  },

  async toggleMemberSuspension(memberId: string, suspend: boolean, actorId: string, actorName: string): Promise<void> {
    return adminService.toggleMemberSuspension(memberId, suspend, actorId, actorName);
  },

  // ─── TAXONOMY CATEGORIES ──────────────────────────────────────────────────
  async getCategories(): Promise<Category[]> {
    return categoryService.getCategories();
  },

  async createCategory(cat: Omit<Category, 'created_at'>): Promise<Category> {
    return categoryService.createCategory(cat);
  },

  async updateCategory(id: string, updates: Partial<Category>): Promise<Category> {
    return categoryService.updateCategory(id, updates);
  },

  async deleteCategory(id: string): Promise<void> {
    return categoryService.deleteCategory(id);
  },

  // ─── ADMIN NOTIFICATIONS & REVIEWS ─────────────────────────────────────────
  async getComprehensiveDashboardMetrics(): Promise<AdminOverviewStats> {
    return adminService.getComprehensiveDashboardMetrics();
  },

  async sendBroadcastNotification(params: {
    title: string;
    message: string;
    link?: string;
    type?: string;
    targetRole?: string;
    actorId: string;
    actorName: string;
  }): Promise<{ dispatchedCount: number }> {
    return adminService.sendBroadcastNotification(params);
  },

  async getVerificationReviews(applicationId: string): Promise<VerificationReview[]> {
    return applicationService.getVerificationReviews(applicationId);
  },


  // ─── SUPABASE STORAGE ─────────────────────────────────────────────────────
  async uploadAvatar(userId: string, file: File): Promise<{ path: string; publicUrl: string }> {
    return storageService.uploadAvatar(userId, file);
  },

  async uploadVerificationDocument(userId: string, file: File): Promise<{ path: string }> {
    return storageService.uploadVerificationDocument(userId, file);
  },

  async getPrivateDocumentSignedUrl(path: string, expiresInSeconds = 300): Promise<string> {
    return storageService.getPrivateDocumentSignedUrl(path, expiresInSeconds);
  }
};
