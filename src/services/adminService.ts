import { supabase, isSupabaseConfigured, getRequiredSupabase } from './supabaseClient';
import { AuditLog, PlatformSettings, UserRole } from '../types';

export const adminService = {
  /**
   * Calculates real dashboard metrics with individual availability tracking.
   * If a query fails or permissions are restricted, isAvailable is marked false
   * and error is preserved rather than returning a misleading zero.
   */
  async getComprehensiveDashboardMetrics(): Promise<import('../types').AdminOverviewStats> {
    const fallbackItem = (val: number | null = null, avail = false, err = 'Backend not configured'): import('../types').MetricItem => ({
      value: val,
      isAvailable: avail,
      error: err,
    });

    if (!isSupabaseConfigured || !supabase) {
      return {
        totalMembers: fallbackItem(null, false, 'Database not connected (Demo Mode)'),
        doctorsCount: fallbackItem(null, false, 'Database not connected (Demo Mode)'),
        studentsCount: fallbackItem(null, false, 'Database not connected (Demo Mode)'),
        researchersCount: fallbackItem(null, false, 'Database not connected (Demo Mode)'),
        pendingApplications: fallbackItem(null, false, 'Database not connected (Demo Mode)'),
        verifiedPractitioners: fallbackItem(null, false, 'Database not connected (Demo Mode)'),
        rejectedApplications: fallbackItem(null, false, 'Database not connected (Demo Mode)'),
        communityPosts: fallbackItem(null, false, 'Database not connected (Demo Mode)'),
        openReports: fallbackItem(null, false, 'Database not connected (Demo Mode)'),
        upcomingEvents: fallbackItem(null, false, 'Database not connected (Demo Mode)'),
      };
    }

    const wrapQuery = async (queryPromise: PromiseLike<any>): Promise<import('../types').MetricItem> => {
      try {
        const { count, error } = await queryPromise;
        if (error) {
          return { value: null, isAvailable: false, error: error.message };
        }
        return { value: count ?? 0, isAvailable: true };
      } catch (err: any) {
        return { value: null, isAvailable: false, error: err?.message || 'Query failed' };
      }
    };

    const nowIso = new Date().toISOString();

    const [
      totalMembers,
      doctorsCount,
      studentsCount,
      researchersCount,
      pendingApplications,
      verifiedPractitioners,
      rejectedApplications,
      communityPosts,
      openReports,
      upcomingEvents,
    ] = await Promise.all([
      wrapQuery(supabase.from('profiles').select('id', { count: 'exact', head: true })),
      wrapQuery(supabase.from('profiles').select('id', { count: 'exact', head: true }).in('role', ['doctor', 'member'])),
      wrapQuery(supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student')),
      wrapQuery(supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'researcher')),
      wrapQuery(supabase.from('practitioner_applications').select('id', { count: 'exact', head: true }).in('status', ['pending_review', 'submitted', 'needs_information'])),
      wrapQuery(supabase.from('practitioner_applications').select('id', { count: 'exact', head: true }).eq('status', 'verified')),
      wrapQuery(supabase.from('practitioner_applications').select('id', { count: 'exact', head: true }).in('status', ['declined', 'rejected'])),
      wrapQuery(supabase.from('posts').select('id', { count: 'exact', head: true })),
      wrapQuery(supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'open')),
      wrapQuery(supabase.from('events').select('id', { count: 'exact', head: true }).gte('date', nowIso)),
    ]);

    return {
      totalMembers,
      doctorsCount,
      studentsCount,
      researchersCount,
      pendingApplications,
      verifiedPractitioners,
      rejectedApplications,
      communityPosts,
      openReports,
      upcomingEvents,
    };
  },

  /**
   * Calculates dashboard summary statistics directly from live database counts.
   * Kept for backwards compatibility.
   */
  async getDashboardStats(): Promise<{
    totalMembers: number;
    pendingApplications: number;
    totalDiscussions: number;
    upcomingEvents: number;
    openReports: number;
  }> {
    if (!isSupabaseConfigured || !supabase) {
      return {
        totalMembers: 0,
        pendingApplications: 0,
        totalDiscussions: 0,
        upcomingEvents: 0,
        openReports: 0
      };
    }

    try {
      const [membersRes, appsRes, postsRes, eventsRes, reportsRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).neq('status', 'suspended'),
        supabase.from('practitioner_applications').select('id', { count: 'exact', head: true }).eq('status', 'pending_review'),
        supabase.from('posts').select('id', { count: 'exact', head: true }).eq('status', 'published'),
        supabase.from('events').select('id', { count: 'exact', head: true }).eq('status', 'published'),
        supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'open')
      ]);

      return {
        totalMembers: membersRes.count ?? 0,
        pendingApplications: appsRes.count ?? 0,
        totalDiscussions: postsRes.count ?? 0,
        upcomingEvents: eventsRes.count ?? 0,
        openReports: reportsRes.count ?? 0
      };
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      return {
        totalMembers: 0,
        pendingApplications: 0,
        totalDiscussions: 0,
        upcomingEvents: 0,
        openReports: 0
      };
    }
  },

  /**
   * Fetches administrative audit logs.
   * RLS strictly restricts this table to administrators.
   */
  async getAuditLogs(): Promise<AuditLog[]> {
    if (!isSupabaseConfigured || !supabase) return [];

    const { data, error } = await supabase
      .from('admin_audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching audit logs:', error);
      return [];
    }
    return data || [];
  },

  /**
   * Appends an immutable audit log entry.
   */
  async addAuditLog(log: Omit<AuditLog, 'id' | 'created_at'>): Promise<AuditLog> {
    const client = getRequiredSupabase();

    const payload = {
      actor_id: log.actor_id,
      actor_name: log.actor_name,
      action: log.action,
      target_type: log.target_type,
      target_id: log.target_id,
      metadata: log.metadata || {}
    };

    const { data, error } = await client
      .from('admin_audit_logs')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Fetches platform onboarding verification rules and settings.
   */
  async getPlatformSettings(): Promise<PlatformSettings> {
    if (!isSupabaseConfigured || !supabase) {
      return {
        require_doctor_verification: true,
        require_researcher_verification: true,
        require_student_verification: false,
        allow_student_mentorship_requests: true,
        auto_appeal_enabled: true
      };
    }

    const { data, error } = await supabase
      .from('platform_settings')
      .select('*')
      .eq('id', 'global')
      .maybeSingle();

    if (error || !data) {
      return {
        require_doctor_verification: true,
        require_researcher_verification: true,
        require_student_verification: false,
        allow_student_mentorship_requests: true,
        auto_appeal_enabled: true
      };
    }

    return data;
  },

  /**
   * Updates platform onboarding verification policies.
   */
  async updatePlatformSettings(settings: Partial<PlatformSettings>): Promise<PlatformSettings> {
    const client = getRequiredSupabase();

    const { data, error } = await client
      .from('platform_settings')
      .upsert({
        id: 'global',
        ...settings,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Promotes or changes a user's role.
   * Modifies both user_roles and profiles, and records an audit log.
   */
  async updateUserRole(
    userId: string,
    newRole: UserRole,
    actorId: string,
    actorName: string
  ): Promise<void> {
    const client = getRequiredSupabase();

    // 1. Update user_roles
    const { error: roleError } = await client
      .from('user_roles')
      .upsert({ user_id: userId, role: newRole });
    if (roleError) throw roleError;

    // 2. Update profiles
    const { error: profileError } = await client
      .from('profiles')
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq('id', userId);
    if (profileError) throw profileError;

    // 3. Add audit log
    await this.addAuditLog({
      actor_id: actorId,
      actor_name: actorName,
      action: 'MEMBER_ROLE_UPDATED',
      target_type: 'member',
      target_id: userId,
      metadata: { new_role: newRole }
    });
  },

  /**
   * Toggles member account suspension.
   */
  async toggleMemberSuspension(
    memberId: string,
    suspend: boolean,
    actorId: string,
    actorName: string
  ): Promise<void> {
    const client = getRequiredSupabase();

    const newStatus = suspend ? 'suspended' : 'verified';

    const { error } = await client
      .from('profiles')
      .update({
        status: newStatus,
        verification_status: suspend ? 'rejected' : 'verified',
        updated_at: new Date().toISOString()
      })
      .eq('id', memberId);

    if (error) throw error;

    await this.addAuditLog({
      actor_id: actorId,
      actor_name: actorName,
      action: suspend ? 'MEMBER_SUSPENDED' : 'MEMBER_REACTIVATED',
      target_type: 'member',
      target_id: memberId,
      metadata: { status: newStatus }
    });
  },

  /**
   * Broadcasts a notification to members matching an optional target role.
   */
  async sendBroadcastNotification(params: {
    title: string;
    message: string;
    link?: string;
    type?: string;
    targetRole?: string;
    actorId: string;
    actorName: string;
  }): Promise<{ dispatchedCount: number }> {
    const client = getRequiredSupabase();

    let query = client.from('profiles').select('id');
    if (params.targetRole && params.targetRole !== 'all') {
      query = query.eq('role', params.targetRole);
    }
    query = query.neq('status', 'suspended');

    const { data: recipients, error: recError } = await query;
    if (recError) throw recError;

    if (!recipients || recipients.length === 0) {
      return { dispatchedCount: 0 };
    }

    const notifications = recipients.map((r) => ({
      user_id: r.id,
      sender_id: params.actorId,
      type: params.type || 'system_notice',
      title: params.title.trim(),
      message: params.message.trim(),
      link: params.link?.trim() || null,
      action_url: params.link?.trim() || null,
      is_read: false,
      metadata: { broadcast: true, target_role: params.targetRole || 'all' },
    }));

    // Insert in batches of 100
    for (let i = 0; i < notifications.length; i += 100) {
      const batch = notifications.slice(i, i + 100);
      const { error: insertError } = await client
        .from('app_notifications')
        .insert(batch);
      if (insertError) throw insertError;
    }

    await this.addAuditLog({
      actor_id: params.actorId,
      actor_name: params.actorName,
      action: 'BROADCAST_NOTIFICATION_SENT',
      target_type: 'app_notifications',
      target_id: 'broadcast',
      metadata: {
        title: params.title,
        recipient_count: recipients.length,
        target_role: params.targetRole || 'all',
      },
    });

    return { dispatchedCount: recipients.length };
  }
};

