import { supabase, isSupabaseConfigured, getRequiredSupabase } from './supabaseClient';
import { Post, UserProfile } from '../types';

export const postService = {
  /**
   * Fetches posts with category filtering, sorting, and user-specific like/save states.
   * RLS ensures only published posts are visible to verified members.
   */
  async getPosts(
    categoryFilter?: string, 
    sort: 'latest' | 'discussed' | 'liked' = 'latest',
    currentUserId?: string
  ): Promise<Post[]> {
    if (!isSupabaseConfigured || !supabase) {
      return [];
    }

    let query = supabase.from('posts').select('*');

    if (categoryFilter && categoryFilter !== 'all' && categoryFilter !== 'saved') {
      query = query.eq('category_id', categoryFilter);
    }

    if (sort === 'discussed') {
      query = query.order('comments_count', { ascending: false });
    } else if (sort === 'liked') {
      query = query.order('likes_count', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    query = query.limit(100);

    const { data: posts, error } = await query;
    if (error) {
      console.error('Error fetching posts from Supabase:', error);
      return [];
    }

    if (!posts || posts.length === 0) return [];

    // If current user is logged in, resolve is_liked and is_saved states
    if (currentUserId) {
      const postIds = posts.map(p => p.id);
      const [likesRes, bookmarksRes] = await Promise.all([
        supabase.from('post_likes').select('post_id').eq('user_id', currentUserId).in('post_id', postIds),
        supabase.from('post_bookmarks').select('post_id').eq('user_id', currentUserId).in('post_id', postIds)
      ]);

      const likedSet = new Set((likesRes.data || []).map(l => l.post_id));
      const savedSet = new Set((bookmarksRes.data || []).map(b => b.post_id));

      return posts.map(p => ({
        ...p,
        is_liked: likedSet.has(p.id),
        is_saved: savedSet.has(p.id)
      }));
    }

    return posts;
  },

  /**
   * Fetches a single post by ID with like/save status.
   */
  async getPostById(postId: string, currentUserId?: string): Promise<Post | null> {
    if (!isSupabaseConfigured || !supabase) return null;

    const { data: post, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', postId)
      .maybeSingle();

    if (error || !post) return null;

    if (currentUserId) {
      const [likeCheck, bookmarkCheck] = await Promise.all([
        supabase.from('post_likes').select('id').eq('post_id', postId).eq('user_id', currentUserId).maybeSingle(),
        supabase.from('post_bookmarks').select('id').eq('post_id', postId).eq('user_id', currentUserId).maybeSingle()
      ]);

      return {
        ...post,
        is_liked: Boolean(likeCheck.data),
        is_saved: Boolean(bookmarkCheck.data)
      };
    }

    return post;
  },

  /**
   * Creates a discussion post associated with the real author.
   * RLS requires the author_id to match auth.uid().
   */
  async createPost(postData: Partial<Post>, author: UserProfile): Promise<Post> {
    const client = getRequiredSupabase();

    const categoryNames: Record<string, string> = {
      'clinical-cases': 'Clinical Learning',
      'research': 'Research',
      'general': 'General Discussion',
      'students': 'Student Corner',
      'practice-management': 'Practice Management',
      'events': 'Events'
    };

    const categoryColors: Record<string, string> = {
      'clinical-cases': 'bg-teal-50 text-teal-800 border-teal-200',
      'research': 'bg-sky-50 text-sky-800 border-sky-200',
      'general': 'bg-slate-100 text-slate-800 border-slate-200',
      'students': 'bg-emerald-50 text-emerald-800 border-emerald-200',
      'practice-management': 'bg-indigo-50 text-indigo-800 border-indigo-200',
      'events': 'bg-purple-50 text-purple-800 border-purple-200'
    };

    const catId = postData.category_id || 'clinical-cases';

    const payload = {
      author_id: author.id,
      author_name: author.display_name || author.full_name,
      author_avatar: author.avatar_url || author.avatar_path || null,
      author_qualification: author.qualification && author.qualification !== 'Not specified' ? author.qualification : null,
      author_experience: author.experience_years ? `${author.experience_years} years experience` : null,
      // Verified type (doctor / student / researcher), else the plain role.
      author_role: author.account_type || author.role || 'member',
      title: postData.title?.trim() || '',
      body: postData.body?.trim() || '',
      category_id: catId,
      category_name: categoryNames[catId] || 'Clinical Learning',
      category_badge_color: categoryColors[catId] || 'bg-teal-50 text-teal-800 border-teal-200',
      source_url: postData.source_url?.trim() || null,
      attachment_url: postData.attachment_url?.trim() || null,
      status: 'published',
      likes_count: 0,
      comments_count: 0
    };

    const { data, error } = await client
      .from('posts')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Updates an existing post owned by the caller or admin.
   */
  async updatePost(postId: string, updates: Partial<Post>): Promise<Post> {
    const client = getRequiredSupabase();

    const payload: Record<string, any> = {
      updated_at: new Date().toISOString()
    };
    if (updates.title !== undefined) payload.title = updates.title.trim();
    if (updates.body !== undefined) payload.body = updates.body.trim();
    if (updates.category_id !== undefined) payload.category_id = updates.category_id;
    if (updates.source_url !== undefined) payload.source_url = updates.source_url;
    if (updates.status !== undefined) payload.status = updates.status;

    const { data, error } = await client
      .from('posts')
      .update(payload)
      .eq('id', postId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Deletes a post owned by the caller or admin.
   */
  async deletePost(postId: string): Promise<void> {
    const client = getRequiredSupabase();
    const { error } = await client.from('posts').delete().eq('id', postId);
    if (error) throw error;
  },

  /**
   * Toggles like state on a post using real database records in public.post_likes.
   * Returns the updated total like count.
   */
  async toggleLikePost(postId: string, userId: string): Promise<number> {
    const client = getRequiredSupabase();

    // Check if like exists
    const { data: existing } = await client
      .from('post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .maybeSingle();

    const { error } = existing
      ? await client.from('post_likes').delete().eq('id', existing.id)
      : await client.from('post_likes').insert([{ post_id: postId, user_id: userId }]);
    if (error) throw error;

    // Read real updated count from database
    const { count } = await client
      .from('post_likes')
      .select('id', { count: 'exact', head: true })
      .eq('post_id', postId);

    return count ?? 0;
  },

  /**
   * Toggles bookmark state for a post in public.post_bookmarks.
   */
  async toggleBookmarkPost(postId: string, userId: string): Promise<boolean> {
    const client = getRequiredSupabase();

    const { data: existing } = await client
      .from('post_bookmarks')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .maybeSingle();

    const { error } = existing
      ? await client.from('post_bookmarks').delete().eq('id', existing.id)
      : await client.from('post_bookmarks').insert([{ post_id: postId, user_id: userId }]);
    if (error) throw error;
    return !existing;
  },

  /**
   * Fetches saved post IDs for the user.
   */
  async getSavedPostIds(userId: string): Promise<string[]> {
    if (!isSupabaseConfigured || !supabase || !userId) return [];

    const { data, error } = await supabase
      .from('post_bookmarks')
      .select('post_id')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching bookmarks:', error);
      return [];
    }
    return (data || []).map(b => b.post_id);
  }
};
