import { getRequiredSupabase } from './supabaseClient';
import type { Event, KnowledgePost, Post } from '../types';

export interface PublisherRow {
  user_id: string;
  name: string;
  email: string;
  added_at: string;
}

/**
 * Publishing panel data. Publishers only ever load what they posted
 * themselves; the database enforces the same rule.
 */
export const publisherService = {
  async myDiscussions(userId: string): Promise<Post[]> {
    const { data, error } = await getRequiredSupabase()
      .from('posts')
      .select('*')
      .eq('author_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    return data || [];
  },

  async myResearch(userId: string): Promise<KnowledgePost[]> {
    const { data, error } = await getRequiredSupabase()
      .from('knowledge_posts')
      .select('*')
      .eq('created_by', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    return data || [];
  },

  async myEvents(userId: string): Promise<Event[]> {
    const { data, error } = await getRequiredSupabase()
      .from('events')
      .select('*')
      .eq('created_by', userId)
      .order('start_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    return data || [];
  },

  async deleteDiscussion(id: string): Promise<void> {
    const { error } = await getRequiredSupabase().from('posts').delete().eq('id', id);
    if (error) throw error;
  },

  async deleteResearch(id: string): Promise<void> {
    const { error } = await getRequiredSupabase().from('knowledge_posts').delete().eq('id', id);
    if (error) throw error;
  },

  async deleteEvent(id: string): Promise<void> {
    const { error } = await getRequiredSupabase().from('events').delete().eq('id', id);
    if (error) throw error;
  },

  // ── Admin tools ────────────────────────────────────────────────────────────
  async listPublishers(): Promise<PublisherRow[]> {
    const { data, error } = await getRequiredSupabase().rpc('list_publishers');
    if (error) throw error;
    return (data as PublisherRow[]) || [];
  },

  async addPublisher(email: string): Promise<PublisherRow | null> {
    const { data, error } = await getRequiredSupabase().rpc('add_publisher', { p_email: email.trim() });
    if (error) throw error;
    return ((data as PublisherRow[]) || [])[0] ?? null;
  },

  async removePublisher(userId: string): Promise<void> {
    const { error } = await getRequiredSupabase().rpc('remove_publisher', { p_user_id: userId });
    if (error) throw error;
  },
};
