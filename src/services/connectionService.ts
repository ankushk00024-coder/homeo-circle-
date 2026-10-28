import { supabase, isSupabaseConfigured, getRequiredSupabase } from './supabaseClient';
import { ConnectionRequest, UserProfile } from '../types';

export const connectionService = {
  /**
   * Fetches incoming and outgoing connection requests for the user.
   * Joins sender and recipient profile metadata.
   */
  async getConnectionRequests(userId?: string): Promise<ConnectionRequest[]> {
    if (!isSupabaseConfigured || !supabase) return [];

    let query = supabase
      .from('connection_requests')
      .select(`
        *,
        sender:profiles!sender_id(id, display_name, full_name, avatar_url, role, qualification, state),
        recipient:profiles!recipient_id(id, display_name, full_name, avatar_url, role, qualification, state)
      `)
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.or(`sender_id.eq.${userId},recipient_id.eq.${userId}`);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching connection requests:', error);
      return [];
    }

    // Map into standard ConnectionRequest interface
    return (data || []).map((row: any) => ({
      id: row.id,
      sender_id: row.sender_id,
      sender_name: row.sender?.display_name || row.sender?.full_name || 'Member',
      sender_avatar: row.sender?.avatar_url || row.sender?.avatar_path,
      sender_role: row.sender?.role || 'member',
      sender_qualification: row.sender?.qualification,
      sender_location: row.sender?.state,
      recipient_id: row.recipient_id,
      recipient_name: row.recipient?.display_name || row.recipient?.full_name || 'Member',
      recipient_avatar: row.recipient?.avatar_url || row.recipient?.avatar_path,
      recipient_role: row.recipient?.role || 'member',
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at
    }));
  },

  /**
   * Dispatches a new connection request.
   * RLS and DB constraints prevent self-connect and duplicate pairs.
   * DB trigger automatically delivers an in-app notification to the recipient.
   */
  async sendConnectionRequest(sender: UserProfile, recipient: UserProfile): Promise<ConnectionRequest> {
    const client = getRequiredSupabase();

    if (sender.id === recipient.id) {
      throw new Error('Self-connection is not permitted.');
    }

    const { data, error } = await client
      .from('connection_requests')
      .insert([{
        sender_id: sender.id,
        recipient_id: recipient.id,
        status: 'pending'
      }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        throw new Error('A connection request between you and this member already exists.');
      }
      throw error;
    }

    return {
      id: data.id,
      sender_id: sender.id,
      sender_name: sender.display_name || sender.full_name,
      sender_avatar: sender.avatar_url,
      sender_role: sender.role,
      sender_qualification: sender.qualification,
      sender_location: sender.state,
      recipient_id: recipient.id,
      recipient_name: recipient.display_name || recipient.full_name,
      recipient_avatar: recipient.avatar_url,
      recipient_role: recipient.role,
      status: 'pending',
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  },

  /**
   * Accepts or declines an incoming connection request.
   * Trigger automatically notifies the sender upon acceptance.
   */
  async respondConnectionRequest(
    requestId: string,
    status: 'accepted' | 'declined',
    responder: UserProfile
  ): Promise<ConnectionRequest> {
    const client = getRequiredSupabase();

    const { data, error } = await client
      .from('connection_requests')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId)
      .select(`
        *,
        sender:profiles!sender_id(id, display_name, full_name, avatar_url, role, qualification, state),
        recipient:profiles!recipient_id(id, display_name, full_name, avatar_url, role, qualification, state)
      `)
      .single();

    if (error) throw error;

    return {
      id: data.id,
      sender_id: data.sender_id,
      sender_name: data.sender?.display_name || data.sender?.full_name || 'Member',
      sender_avatar: data.sender?.avatar_url || data.sender?.avatar_path,
      sender_role: data.sender?.role || 'member',
      sender_qualification: data.sender?.qualification,
      sender_location: data.sender?.state,
      recipient_id: data.recipient_id,
      recipient_name: responder.display_name || responder.full_name,
      recipient_avatar: responder.avatar_url || responder.avatar_path,
      recipient_role: responder.role,
      status: data.status,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  },

  /**
   * Cancels a pending connection request previously sent by the user.
   */
  async cancelConnectionRequest(requestId: string): Promise<void> {
    const client = getRequiredSupabase();
    const { error } = await client
      .from('connection_requests')
      .delete()
      .eq('id', requestId);

    if (error) throw error;
  },

  /**
   * Removes an existing mutual connection.
   */
  async removeConnection(userId1: string, userId2: string): Promise<void> {
    const client = getRequiredSupabase();
    const { error } = await client
      .from('connection_requests')
      .delete()
      .or(`and(sender_id.eq.${userId1},recipient_id.eq.${userId2}),and(sender_id.eq.${userId2},recipient_id.eq.${userId1})`);

    if (error) throw error;
  }
};
