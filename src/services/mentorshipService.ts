import { supabase, isSupabaseConfigured, getRequiredSupabase } from './supabaseClient';
import { MentorshipRequest } from '../types';

export const mentorshipService = {
  /**
   * Fetches mentorship requests involving the given user (as student or mentor).
   */
  async getMentorshipRequests(userId?: string): Promise<MentorshipRequest[]> {
    if (!isSupabaseConfigured || !supabase) return [];

    let query = supabase
      .from('mentorship_requests')
      .select(`
        *,
        student:profiles!student_id(id, display_name, full_name, avatar_url, clinic_institution, student_details),
        mentor:profiles!mentor_id(id, display_name, full_name, avatar_url, specialization)
      `)
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.or(`student_id.eq.${userId},mentor_id.eq.${userId}`);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching mentorship requests:', error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      student_id: row.student_id,
      student_name: row.student?.display_name || row.student?.full_name || 'Student',
      student_avatar: row.student?.avatar_url || row.student?.avatar_path,
      student_institution: row.student?.student_details?.institution || row.student?.clinic_institution || 'Homoeopathic Medical College',
      student_course_year: row.student?.student_details?.course_year || 'Final Year BHMS',
      mentor_id: row.mentor_id,
      mentor_name: row.mentor?.display_name || row.mentor?.full_name || 'Doctor',
      mentor_avatar: row.mentor?.avatar_url || row.mentor?.avatar_path,
      mentor_specialization: row.mentor?.specialization || 'Clinical Practice',
      message: row.message,
      goals: row.goals || '',
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at
    }));
  },

  /**
   * Sends a structured clinical case and posology mentorship request from a student to a verified doctor.
   * DB trigger automatically delivers an in-app notification to the mentor.
   */
  async sendMentorshipRequest(data: Partial<MentorshipRequest>): Promise<MentorshipRequest> {
    const client = getRequiredSupabase();

    if (!data.student_id || !data.mentor_id) {
      throw new Error('Student ID and Mentor ID are required.');
    }
    if (data.student_id === data.mentor_id) {
      throw new Error('Self-mentorship requests are invalid.');
    }

    const payload = {
      student_id: data.student_id,
      mentor_id: data.mentor_id,
      message: data.message?.trim() || '',
      goals: data.goals?.trim() || '',
      status: 'pending'
    };

    const { data: row, error } = await client
      .from('mentorship_requests')
      .insert([payload])
      .select(`
        *,
        student:profiles!student_id(id, display_name, full_name, avatar_url, clinic_institution, student_details),
        mentor:profiles!mentor_id(id, display_name, full_name, avatar_url, specialization)
      `)
      .single();

    if (error) throw error;

    return {
      id: row.id,
      student_id: row.student_id,
      student_name: data.student_name || row.student?.display_name || 'Student',
      student_avatar: data.student_avatar || row.student?.avatar_url || row.student?.avatar_path,
      student_institution: data.student_institution || row.student?.clinic_institution,
      student_course_year: data.student_course_year,
      mentor_id: row.mentor_id,
      mentor_name: data.mentor_name || row.mentor?.display_name || 'Doctor',
      mentor_avatar: data.mentor_avatar || row.mentor?.avatar_url || row.mentor?.avatar_path,
      mentor_specialization: data.mentor_specialization || row.mentor?.specialization,
      message: row.message,
      goals: row.goals,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  },

  /**
   * Mentors accept or decline incoming mentorship requests.
   */
  async respondMentorshipRequest(
    requestId: string,
    status: 'accepted' | 'declined'
  ): Promise<MentorshipRequest> {
    const client = getRequiredSupabase();

    const { data: row, error } = await client
      .from('mentorship_requests')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId)
      .select(`
        *,
        student:profiles!student_id(id, display_name, full_name, avatar_url, clinic_institution, student_details),
        mentor:profiles!mentor_id(id, display_name, full_name, avatar_url, specialization)
      `)
      .single();

    if (error) throw error;

    return {
      id: row.id,
      student_id: row.student_id,
      student_name: row.student?.display_name || row.student?.full_name || 'Student',
      student_avatar: row.student?.avatar_url || row.student?.avatar_path,
      student_institution: row.student?.student_details?.institution || row.student?.clinic_institution,
      student_course_year: row.student?.student_details?.course_year,
      mentor_id: row.mentor_id,
      mentor_name: row.mentor?.display_name || row.mentor?.full_name || 'Doctor',
      mentor_avatar: row.mentor?.avatar_url || row.mentor?.avatar_path,
      mentor_specialization: row.mentor?.specialization,
      message: row.message,
      goals: row.goals,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }
};
