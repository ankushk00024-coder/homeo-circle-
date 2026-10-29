import { supabase, isSupabaseConfigured, getRequiredSupabase } from './supabaseClient';
import { ConnectionRequest, UserProfile } from '../types';
import { fetchProfileSummaries, nameOf, avatarOf, ProfileSummary } from './profileLookup';

/** Maps a connection_requests row plus looked-up member details to the UI shape. */
const toConnection = (row: any, people: Map<string, ProfileSummary>): ConnectionRequest => {
  const sender = people.get(row.sender_id);
  const recipient = people.get(row.recipient_id);
  return {
    id: row.id,
    sender_id: row.sender_id,
    sender_name: nameOf(sender, 'Member'),
    sender_avatar: avatarOf(sender),
    sender_role: (sender?.role || 'member') as ConnectionRequest['sender_role'],
    sender_qualification: sender?.qualification || undefined,
    sender_location: sender?.state || undefined,
    recipient_id: row.recipient_id,
    recipient_name: nameOf(recipient, 'Member'),
    recipient_avatar: avatarOf(recipient),
    recipient_role: (recipient?.role || 'member') as ConnectionRequest['recipient_role'],
    status: row.status,
    message: row.message || undefined,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
};

export const connectionService = {
  /**
   * Fetches connection requests the user sent or received.
   * RLS limits rows to requests involving the caller (or admins).
   */
  async getConnectionRequests(userId?: string): Promise<ConnectionRequest[]> {
    if (!isSupabaseConfigured || !supabase) return [];

    let query = supabase
      .from('connection_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.or(`sender_id.eq.${userId},recipient_id.eq.${userId}`);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching connection requests:', error);
      return [];
    }

    const rows = data || [];
    const people = await fetchProfileSummaries(supabase, rows.flatMap((r: any) => [r.sender_id, r.recipient_id]));
    return rows.map((row: any) => toConnection(row, people));
  },

  /**
   * Sends a connection request with an optional note (max 300 characters).
   * The recipient is notified by a database trigger.
   */
  async sendConnectionRequest(sender: UserProfile, recipient: UserProfile, message?: string): Promise<ConnectionRequest> {
    const client = getRequiredSupabase();

    if (sender.id === recipient.id) {
      throw new Error('You cannot send a connection request to yourself.');
    }

    const { data, error } = await client
      .from('connection_requests')
      .insert([{
        sender_id: sender.id,
        recipient_id: recipient.id,
        status: 'pending',
        message: message?.trim().slice(0, 300) || null
      }])
      .select('*')
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error(error.message.includes('already sent you')
          ? 'This member already sent you a request. Accept it in My Network.'
          : 'A connection request between you and this member already exists.');
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
      message: data.message || undefined,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  },

  /**
   * Accepts or declines a received request. The sender is notified by a trigger.
   */
  async respondConnectionRequest(
    requestId: string,
    status: 'accepted' | 'declined',
    responder: UserProfile
  ): Promise<ConnectionRequest> {
    const client = getRequiredSupabase();

    const { data, error } = await client
      .from('connection_requests')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', requestId)
      .select('*')
      .single();

    if (error) throw error;

    const people = await fetchProfileSummaries(client, [data.sender_id]);
    return {
      ...toConnection(data, people),
      recipient_name: responder.display_name || responder.full_name,
      recipient_avatar: responder.avatar_url || responder.avatar_path,
      recipient_role: responder.role
    };
  },

  /**
   * Withdraws a pending request.
   */
  async cancelConnectionRequest(requestId: string): Promise<void> {
    const client = getRequiredSupabase();
    const { error } = await client.from('connection_requests').delete().eq('id', requestId);
    if (error) throw error;
  },

  /**
   * Removes an existing connection between two members.
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
