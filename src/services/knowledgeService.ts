import { supabase, isSupabaseConfigured, getRequiredSupabase } from './supabaseClient';
import { KnowledgePost } from '../types';

export const knowledgeService = {
  /**
   * Fetches published peer-reviewed research papers and evidence summaries.
   */
  async getKnowledgePosts(): Promise<KnowledgePost[]> {
    if (!isSupabaseConfigured || !supabase) return [];

    const { data, error } = await supabase
      .from('knowledge_posts')
      .select('*')
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    if (error) {
      console.error('Error fetching knowledge posts:', error);
      return [];
    }
    return data || [];
  },

  /**
   * Creates a new research record. Authorized to researchers and admins.
   */
  async createKnowledgePost(postData: Partial<KnowledgePost>): Promise<KnowledgePost> {
    const client = getRequiredSupabase();

    const payload = {
      title: postData.title?.trim() || '',
      journal: postData.journal?.trim() || 'Peer-Reviewed Journal',
      summary: postData.summary?.trim() || '',
      limitations: postData.limitations?.trim() || 'Methodological constraints and sample size detailed in study text.',
      source_url: postData.source_url?.trim() || 'https://pubmed.ncbi.nlm.nih.gov',
      content_type: postData.content_type || 'Clinical Trial',
      doi: postData.doi?.trim() || null,
      author_name: postData.author_name?.trim() || null,
      author_affiliation: postData.author_affiliation?.trim() || null,
      status: 'published',
      published_at: postData.published_at || new Date().toISOString().split('T')[0]
    };

    const { data, error } = await client
      .from('knowledge_posts')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Updates an existing knowledge post.
   */
  async updateKnowledgePost(id: string, updates: Partial<KnowledgePost>): Promise<KnowledgePost> {
    const client = getRequiredSupabase();

    const { data, error } = await client
      .from('knowledge_posts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
