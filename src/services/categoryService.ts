import { supabase, isSupabaseConfigured, getRequiredSupabase } from './supabaseClient';
import { Category } from '../types';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'general', name: 'General Discussion', slug: 'general', type: 'discussion', badge_color: 'bg-slate-100 text-slate-800 border-slate-200', active: true },
  { id: 'clinical-cases', name: 'Clinical Learning', slug: 'clinical-cases', type: 'discussion', badge_color: 'bg-teal-50 text-teal-800 border-teal-200', active: true },
  { id: 'research', name: 'Research', slug: 'research', type: 'discussion', badge_color: 'bg-sky-50 text-sky-800 border-sky-200', active: true },
  { id: 'students', name: 'Student Corner', slug: 'students', type: 'discussion', badge_color: 'bg-emerald-50 text-emerald-800 border-emerald-200', active: true },
  { id: 'practice-management', name: 'Practice Management', slug: 'practice-management', type: 'discussion', badge_color: 'bg-indigo-50 text-indigo-800 border-indigo-200', active: true },
  { id: 'events', name: 'Events & CMEs', slug: 'events', type: 'event', badge_color: 'bg-purple-50 text-purple-800 border-purple-200', active: true },
];

export const categoryService = {
  /**
   * Fetches all taxonomy categories from public.categories.
   */
  async getCategories(): Promise<Category[]> {
    if (!isSupabaseConfigured || !supabase) {
      return DEFAULT_CATEGORIES;
    }

    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.warn('Error fetching categories from database, falling back to defaults:', error);
        return DEFAULT_CATEGORIES;
      }

      if (!data || data.length === 0) {
        return DEFAULT_CATEGORIES;
      }

      return data;
    } catch (err) {
      console.error('Failed to query categories:', err);
      return DEFAULT_CATEGORIES;
    }
  },

  /**
   * Creates a new category. RLS requires admin role.
   */
  async createCategory(cat: Omit<Category, 'created_at'>): Promise<Category> {
    const client = getRequiredSupabase();

    const payload = {
      id: cat.id.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-'),
      name: cat.name.trim(),
      slug: cat.slug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-'),
      type: cat.type || 'discussion',
      badge_color: cat.badge_color || 'bg-slate-100 text-slate-800 border-slate-200',
      active: cat.active ?? true,
    };

    const { data, error } = await client
      .from('categories')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Updates an existing category. RLS requires admin role.
   */
  async updateCategory(id: string, updates: Partial<Category>): Promise<Category> {
    const client = getRequiredSupabase();

    const payload: Record<string, any> = {};
    if (updates.name !== undefined) payload.name = updates.name.trim();
    if (updates.slug !== undefined) payload.slug = updates.slug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    if (updates.type !== undefined) payload.type = updates.type;
    if (updates.badge_color !== undefined) payload.badge_color = updates.badge_color;
    if (updates.active !== undefined) payload.active = updates.active;

    const { data, error } = await client
      .from('categories')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Deletes a category. RLS requires admin role.
   */
  async deleteCategory(id: string): Promise<void> {
    const client = getRequiredSupabase();
    const { error } = await client
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
