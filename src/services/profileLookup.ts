import { SupabaseClient } from '@supabase/supabase-js';

/** Public-safe profile fields used to label connections, mentorships, etc. */
export interface ProfileSummary {
  id: string;
  display_name?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  avatar_path?: string | null;
  role?: string | null;
  qualification?: string | null;
  specialization?: string | null;
  clinic_institution?: string | null;
  state?: string | null;
  student_details?: { institution?: string; course_year?: string } | null;
}

/**
 * Loads display details for a set of member ids in one query.
 *
 * Reads profile_public_view (the profiles table itself only exposes your own
 * row under RLS), so names and photos of other members resolve correctly.
 * Members who hid their profile are simply absent from the map.
 */
export async function fetchProfileSummaries(
  client: SupabaseClient,
  ids: (string | null | undefined)[]
): Promise<Map<string, ProfileSummary>> {
  const unique = [...new Set(ids.filter((id): id is string => Boolean(id)))];
  const map = new Map<string, ProfileSummary>();
  if (unique.length === 0) return map;

  const { data, error } = await client
    .from('profile_public_view')
    .select('id, display_name, full_name, avatar_url, avatar_path, role, qualification, specialization, clinic_institution, state, student_details')
    .in('id', unique);

  if (error) {
    console.error('Could not load member names:', error.message);
    return map;
  }
  for (const row of (data || []) as ProfileSummary[]) map.set(row.id, row);
  return map;
}

export const nameOf = (p: ProfileSummary | undefined, fallback: string) =>
  p?.display_name || p?.full_name || fallback;

export const avatarOf = (p: ProfileSummary | undefined) => p?.avatar_url || p?.avatar_path || undefined;
