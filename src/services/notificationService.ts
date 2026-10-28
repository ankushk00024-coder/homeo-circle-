import { supabase, isSupabaseConfigured, getRequiredSupabase } from './supabaseClient';
import { AppNotification } from '../types';

export const notificationService = {
  /**
   * Fetches real-time in-app notifications for the authenticated user.
   * RLS strictly ensures users can only read their own notifications.
   */
  async getNotifications(userId: string): Promise<AppNotification[]> {
    if (!isSupabaseConfigured || !supabase || !userId) return [];

    const { data, error } = await supabase
      .from('app_notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      user_id: row.user_id,
      type: row.type,
      title: row.title,
      message: row.message,
      link: row.link || row.action_url,
      is_read: Boolean(row.is_read),
      action_id: row.action_id,
      action_status: row.action_status,
      metadata: row.metadata || {},
      created_at: new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }));
  },

  /**
   * Marks a specific notification as read.
   */
  async markNotificationRead(id: string): Promise<void> {
    const client = getRequiredSupabase();
    const { error } = await client
      .from('app_notifications')
      .update({ is_read: true })
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Marks all unread notifications for a user as read.
   */
  async markAllNotificationsRead(userId: string): Promise<void> {
    const client = getRequiredSupabase();
    const { error } = await client
      .from('app_notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
  },

  /**
   * Dispatches a database-backed notification.
   */
  async createNotification(data: Partial<AppNotification>): Promise<AppNotification> {
    const client = getRequiredSupabase();

    if (!data.user_id) throw new Error('user_id is required to create a notification.');

    const payload = {
      user_id: data.user_id,
      type: data.type || 'system_notice',
      title: data.title || 'Notification',
      message: data.message || '',
      link: data.link || data.action_url || null,
      action_url: data.action_url || data.link || null,
      action_id: data.action_id || null,
      action_status: data.action_status || null,
      is_read: false,
      metadata: data.metadata || {}
    };

    const { data: row, error } = await client
      .from('app_notifications')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;

    return {
      id: row.id,
      user_id: row.user_id,
      type: row.type,
      title: row.title,
      message: row.message,
      link: row.link || row.action_url,
      action_url: row.action_url || row.link,
      is_read: row.is_read,
      action_id: row.action_id,
      action_status: row.action_status,
      metadata: row.metadata,
      created_at: row.created_at
    };
  }
};
