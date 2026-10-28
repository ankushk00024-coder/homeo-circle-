import { supabase, isSupabaseConfigured, getRequiredSupabase } from './supabaseClient';
import { UserProfile } from '../types';

const SAFE_PUBLIC_COLUMNS = 'id, full_name, display_name, avatar_url, avatar_path, role, status, verification_status, qualification, experience_years, specialization, state, city, clinic_institution, bio, interests, created_at, updated_at';

export const profileService = {
  /**
   * Fetches an individual member profile by ID.
   */
  async getProfile(userId: string): Promise<UserProfile | null> {
    if (!isSupabaseConfigured || !supabase) return null;
    // Attempt to fetch from profiles (succeeds for own profile or admin)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (!error && data) {
      return data;
    }

    // Fall back to safe public view for viewing other members' community profiles
    const { data: publicData, error: publicError } = await supabase
      .from('profile_public_view')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (publicError) {
      // If view does not exist on live DB, attempt safe projected select on profiles
      if (publicError.code === 'PGRST205' || publicError.code === '42P01') {
        const { data: fallbackData } = await supabase
          .from('profiles')
          .select(SAFE_PUBLIC_COLUMNS)
          .eq('id', userId)
          .maybeSingle();
        return (fallbackData as unknown as UserProfile) || null;
      }
      console.error('Error fetching profile from public view:', publicError);
      return null;
    }
    return (publicData as unknown as UserProfile) || null;
  },

  /**
   * Fetches active members with optional searching and multi-facet filtering.
   * RLS automatically enforces that private profiles are shielded.
   */
  async getMembers(
    search = '', 
    stateFilter = 'All', 
    specFilter = 'All', 
    roleFilter = 'All'
  ): Promise<UserProfile[]> {
    if (!isSupabaseConfigured || !supabase) {
      return [];
    }

    const buildQuery = (source: string, columns = '*') => {
      let q = supabase!.from(source).select(columns);
      q = q.neq('status', 'suspended');

      if (search.trim()) {
        const term = `%${search.trim()}%`;
        q = q.or(`display_name.ilike.${term},full_name.ilike.${term},specialization.ilike.${term},qualification.ilike.${term},city.ilike.${term},state.ilike.${term}`);
      }

      if (stateFilter && stateFilter !== 'All') {
        q = q.eq('state', stateFilter);
      }

      if (specFilter && specFilter !== 'All') {
        q = q.ilike('specialization', `%${specFilter}%`);
      }

      if (roleFilter && roleFilter !== 'All') {
        q = q.ilike('role', roleFilter.toLowerCase());
      }

      return q.order('created_at', { ascending: false }).limit(100);
    };

    let { data, error } = await buildQuery('profile_public_view');

    // If profile_public_view relation does not exist on live DB, fall back to profiles table
    if (error && (error.code === 'PGRST205' || error.code === '42P01')) {
      const fallback = await buildQuery('profiles', SAFE_PUBLIC_COLUMNS);
      data = fallback.data;
      error = fallback.error;
    }

    if (error) {
      console.error('Error fetching members:', error);
      return [];
    }
    return (data as unknown as UserProfile[]) || [];
  },

  /**
   * Updates permitted fields of a user's own profile.
   * Privilege escalation prevention trigger in DB prevents regular users from tampering with role/status.
   */
  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const client = getRequiredSupabase();

    // Whitelist non-privileged fields for client-side profile mutation
    const safePayload: Record<string, any> = {
      display_name: updates.display_name,
      qualification: updates.qualification,
      specialization: updates.specialization,
      clinic_institution: updates.clinic_institution,
      bio: updates.bio,
      experience_years: updates.experience_years,
      interests: updates.interests,
      city: updates.city,
      state: updates.state,
      profile_visibility: updates.profile_visibility,
      social_links: updates.social_links,
      privacy_settings: updates.privacy_settings,
      student_details: updates.student_details,
      researcher_details: updates.researcher_details,
      mentorship_available: updates.mentorship_available,
      avatar_url: updates.avatar_url || (updates as any).avatar_path,
      avatar_path: (updates as any).avatar_path || updates.avatar_url,
      updated_at: new Date().toISOString()
    };

    // Remove undefined values
    Object.keys(safePayload).forEach(key => {
      if (safePayload[key] === undefined) {
        delete safePayload[key];
      }
    });

    const { data, error } = await client
      .from('profiles')
      .update(safePayload)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Discovers eligible clinical mentors for students.
   * Returns registered doctors, researchers, and educators who are active and not suspended.
   */
  async getEligibleMentors(): Promise<UserProfile[]> {
    if (!isSupabaseConfigured || !supabase) return [];

    let { data, error } = await supabase
      .from('profile_public_view')
      .select('*')
      .in('role', ['doctor', 'researcher', 'member', 'admin', 'super_admin'])
      .neq('status', 'suspended')
      .order('experience_years', { ascending: false })
      .limit(60);

    if (error && (error.code === 'PGRST205' || error.code === '42P01')) {
      const fallback = await supabase
        .from('profiles')
        .select(SAFE_PUBLIC_COLUMNS)
        .in('role', ['doctor', 'researcher', 'member', 'admin', 'super_admin'])
        .neq('status', 'suspended')
        .order('experience_years', { ascending: false })
        .limit(60);
      data = fallback.data;
      error = fallback.error;
    }

    if (error) {
      console.error('Error fetching eligible mentors:', error);
      return [];
    }
    return (data as unknown as UserProfile[]) || [];
  }
};
