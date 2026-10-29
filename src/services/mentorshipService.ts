import { supabase, isSupabaseConfigured, getRequiredSupabase } from './supabaseClient';
import { MentorshipRequest } from '../types';
import { fetchProfileSummaries, nameOf, avatarOf, ProfileSummary } from './profileLookup';

/** Maps a mentorship_requests row plus looked-up member details to the UI shape. */
const toMentorship = (row: any, people: Map<string, ProfileSummary>): MentorshipRequest => {
  const student = people.get(row.student_id);
  const mentor = people.get(row.mentor_id);
  return {
    id: row.id,
    student_id: row.student_id,
    student_name: nameOf(student, 'Student'),
    student_avatar: avatarOf(student),
    student_institution: student?.student_details?.institution || student?.clinic_institution || 'Homoeopathic Medical College',
    student_course_year: student?.student_details?.course_year || 'BHMS',
    mentor_id: row.mentor_id,
    mentor_name: nameOf(mentor, 'Doctor'),
    mentor_avatar: avatarOf(mentor),
    mentor_specialization: mentor?.specialization || 'Clinical Practice',
    message: row.message,
    goals: row.goals || '',
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
};

export const mentorshipService = {
  /**
   * Fetches mentorship requests where the user is the student or the mentor.
   */
  async getMentorshipRequests(userId?: string): Promise<MentorshipRequest[]> {
    if (!isSupabaseConfigured || !supabase) return [];

    let query = supabase
      .from('mentorship_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.or(`student_id.eq.${userId},mentor_id.eq.${userId}`);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching mentorship requests:', error);
      return [];
    }

    const rows = data || [];
    const people = await fetchProfileSummaries(supabase, rows.flatMap((r: any) => [r.student_id, r.mentor_id]));
    return rows.map((row: any) => toMentorship(row, people));
  },

  /**
   * Sends a mentorship request. The mentor is notified by a database trigger.
   */
  async sendMentorshipRequest(data: Partial<MentorshipRequest>): Promise<MentorshipRequest> {
    const client = getRequiredSupabase();

    if (!data.student_id || !data.mentor_id) {
      throw new Error('Student ID and Mentor ID are required.');
    }
    if (data.student_id === data.mentor_id) {
      throw new Error('You cannot request mentorship from yourself.');
    }

    const { data: row, error } = await client
      .from('mentorship_requests')
      .insert([{
        student_id: data.student_id,
        mentor_id: data.mentor_id,
        message: data.message?.trim() || '',
        goals: data.goals?.trim() || '',
        status: 'pending'
      }])
      .select('*')
      .single();

    if (error) throw error;

    const people = await fetchProfileSummaries(client, [row.student_id, row.mentor_id]);
    const mapped = toMentorship(row, people);
    return {
      ...mapped,
      student_name: data.student_name || mapped.student_name,
      student_avatar: data.student_avatar || mapped.student_avatar,
      student_institution: data.student_institution || mapped.student_institution,
      student_course_year: data.student_course_year || mapped.student_course_year,
      mentor_name: data.mentor_name || mapped.mentor_name,
      mentor_avatar: data.mentor_avatar || mapped.mentor_avatar,
      mentor_specialization: data.mentor_specialization || mapped.mentor_specialization
    };
  },

  /**
   * Mentor accepts or declines a request.
   */
  async respondMentorshipRequest(
    requestId: string,
    status: 'accepted' | 'declined'
  ): Promise<MentorshipRequest> {
    const client = getRequiredSupabase();

    const { data: row, error } = await client
      .from('mentorship_requests')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', requestId)
      .select('*')
      .single();

    if (error) throw error;

    const people = await fetchProfileSummaries(client, [row.student_id, row.mentor_id]);
    return toMentorship(row, people);
  }
};
