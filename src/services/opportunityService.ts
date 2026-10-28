import { supabase, isSupabaseConfigured, getRequiredSupabase } from './supabaseClient';
import { Opportunity } from '../types';

export const opportunityService = {
  /**
   * Fetches published opportunities with type filtering (Job, Internship, Research, Collaboration).
   */
  async getOpportunities(typeFilter?: string): Promise<Opportunity[]> {
    if (!isSupabaseConfigured || !supabase) return [];

    let query = supabase.from('opportunities').select('*');

    if (typeFilter && typeFilter !== 'All') {
      const singular = typeFilter.replace(/s$/, '');
      query = query.ilike('type', `%${singular}%`);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching opportunities:', error);
      return [];
    }

    return (data || []).map((row: any) => ({
      ...row,
      posted_time_ago: formatTimeAgo(row.created_at)
    }));
  },

  /**
   * Creates a new clinical opportunity, internship, or research call.
   */
  async createOpportunity(oppData: Partial<Opportunity>): Promise<Opportunity> {
    const client = getRequiredSupabase();

    const payload = {
      title: oppData.title?.trim() || '',
      organization: oppData.organization?.trim() || '',
      type: oppData.type || 'Internship',
      mode: oppData.mode || 'Hybrid',
      timing: oppData.timing || 'Full-time',
      location: oppData.location?.trim() || 'Pan-India',
      deadline: (oppData.deadline && !isNaN(Date.parse(oppData.deadline))) 
        ? oppData.deadline 
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      description: oppData.description?.trim() || '',
      application_url: oppData.application_url?.trim() || '/opportunities',
      source_url: oppData.source_url?.trim() || null,
      status: 'published'
    };

    const { data, error } = await client
      .from('opportunities')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;

    return {
      ...data,
      posted_time_ago: 'Just now'
    };
  },

  /**
   * Updates an existing opportunity.
   */
  async updateOpportunity(id: string, updates: Partial<Opportunity>): Promise<Opportunity> {
    const client = getRequiredSupabase();

    const { data, error } = await client
      .from('opportunities')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      posted_time_ago: formatTimeAgo(data.created_at)
    };
  }
};

function formatTimeAgo(dateString?: string): string {
  if (!dateString) return 'Recently';
  const diff = Date.now() - new Date(dateString).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}
