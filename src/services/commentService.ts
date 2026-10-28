import { supabase, isSupabaseConfigured, getRequiredSupabase } from './supabaseClient';
import { Comment, UserProfile } from '../types';

export const commentService = {
  /**
   * Fetches published comments for a given post.
   */
  async getComments(postId: string): Promise<Comment[]> {
    if (!isSupabaseConfigured || !supabase || !postId) return [];

    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .eq('status', 'published')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
      return [];
    }
    return data || [];
  },

  /**
   * Adds a new comment or reply to a post.
   * RLS requires author_id = auth.uid().
   * PostgreSQL trigger notifies the post author.
   */
  async addComment(
    postId: string,
    user: UserProfile,
    body: string,
    parentCommentId?: string
  ): Promise<Comment> {
    const client = getRequiredSupabase();

    const payload = {
      post_id: postId,
      author_id: user.id,
      author_name: user.display_name || user.full_name,
      author_avatar: user.avatar_url || user.avatar_path,
      author_qualification: user.qualification || 'BHMS',
      parent_comment_id: parentCommentId || null,
      body: body.trim(),
      status: 'published'
    };

    const { data, error } = await client
      .from('comments')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Deletes a comment owned by the caller or admin.
   */
  async deleteComment(commentId: string): Promise<void> {
    const client = getRequiredSupabase();
    const { error } = await client.from('comments').delete().eq('id', commentId);
    if (error) throw error;
  }
};
