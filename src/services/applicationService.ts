import { supabase, isSupabaseConfigured, getRequiredSupabase } from './supabaseClient';
import { PractitionerApplication, ApplicationStatus, VerificationReview } from '../types';

export const applicationService = {
  /**
   * Submits a new practitioner or researcher verification application.
   */
  async submitApplication(appData: Partial<PractitionerApplication>): Promise<PractitionerApplication> {
    const client = getRequiredSupabase();

    const applicationId = appData.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : undefined);

    const payload = {
      ...(applicationId ? { id: applicationId } : {}),
      user_id: appData.user_id || null,
      full_name: appData.full_name,
      email: appData.email,
      phone: appData.phone,
      role_applied: appData.role_applied || 'doctor',
      qualification: appData.qualification,
      registration_number: appData.registration_number,
      registration_authority: appData.registration_authority,
      state: appData.state,
      city: appData.city,
      clinic_institution: appData.clinic_institution,
      experience_years: appData.experience_years || 0,
      specialization: appData.specialization,
      institution: appData.institution,
      course_year: appData.course_year,
      mentorship_needs: appData.mentorship_needs,
      research_interests: appData.research_interests,
      publications: appData.publications,
      consent_at: appData.consent_at || new Date().toISOString(),
      document_url: appData.document_url,
      status: 'pending_review'
    };

    if (!payload.user_id) {
      // Unauthenticated guest applicant: RLS allows INSERT (WITH CHECK user_id IS NULL),
      // but SELECT is restricted to owner or admin. Chaining .select() would fail with RLS error.
      // Therefore insert without .select() and return the constructed application object.
      const { error } = await client
        .from('practitioner_applications')
        .insert([payload]);

      if (error) throw error;
      return {
        ...payload,
        id: applicationId || 'submitted',
        submitted_at: new Date().toISOString()
      } as PractitionerApplication;
    }

    const { data, error } = await client
      .from('practitioner_applications')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Fetches applications for the reviewer queue.
   * RLS restricts ordinary members to only viewing their own application.
   */
  async getApplications(): Promise<PractitionerApplication[]> {
    if (!isSupabaseConfigured || !supabase) return [];

    const { data, error } = await supabase
      .from('practitioner_applications')
      .select('*')
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('Error fetching applications:', error);
      return [];
    }
    return data || [];
  },

  /**
   * Fetches the current user's specific application.
   */
  async getMyApplication(userId: string): Promise<PractitionerApplication | null> {
    if (!isSupabaseConfigured || !supabase) return null;

    const { data, error } = await supabase
      .from('practitioner_applications')
      .select('*')
      .eq('user_id', userId)
      .order('submitted_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching application status:', error);
      return null;
    }
    return data;
  },

  /**
   * Fetches an individual application by its ID (for authenticated owners or admins).
   */
  async getApplicationById(appId: string): Promise<PractitionerApplication | null> {
    if (!isSupabaseConfigured || !supabase || !appId) return null;

    const { data, error } = await supabase
      .from('practitioner_applications')
      .select('*')
      .eq('id', appId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching application by id:', error);
      return null;
    }
    return data;
  },

  /**
   * Securely looks up a guest practitioner application status by Application UUID and registered Email.
   * Calls the security-definer RPC `lookup_guest_application_status` to prevent data enumeration.
   */
  async lookupGuestApplicationStatus(appId: string, email: string): Promise<Partial<PractitionerApplication> | null> {
    if (!isSupabaseConfigured || !supabase || !appId || !email) return null;

    const { data, error } = await supabase.rpc('lookup_guest_application_status', {
      p_application_id: appId,
      p_email: email.trim().toLowerCase()
    });

    if (error) {
      console.error('Error looking up guest application status via RPC:', error);
      return null;
    }

    if (Array.isArray(data) && data.length > 0) {
      return data[0];
    }
    return null;
  },

  /**
   * Official administrative verification review determination.
   * Calls the secure database stored procedure `review_practitioner_application`.
   */
  async reviewApplication(
    appId: string,
    status: ApplicationStatus,
    reviewerName: string,
    decisionReason?: string,
    verificationSource?: string,
    internalNotes?: string
  ): Promise<PractitionerApplication> {
    const client = getRequiredSupabase();

    // Secure practitioner-review flow routed through protected server-side Edge Function.
    // If Edge Function is not deployed (returns 404 / NOT_FOUND), fallback to direct DB RPC
    let edgeSuccess = false;
    try {
      const { data: edgeData, error: edgeError } = await client.functions.invoke('review-application', {
        body: {
          application_id: appId,
          new_status: status,
          decision_reason: decisionReason || null,
          verification_source: verificationSource || null,
          internal_notes: internalNotes || null
        }
      });

      if (!edgeError && edgeData) {
        edgeSuccess = true;
      } else if (edgeError) {
        console.warn('Edge Function review-application invocation unsuccessful, falling back to direct review_practitioner_application RPC:', edgeError);
      }
    } catch (edgeCallErr) {
      console.warn('Edge Function invocation caught error, attempting DB RPC:', edgeCallErr);
    }

    if (!edgeSuccess) {
      // Direct call to stored procedure review_practitioner_application (protected by is_admin())
      const { error: rpcError } = await client.rpc('review_practitioner_application', {
        p_application_id: appId,
        p_new_status: status,
        p_decision_reason: decisionReason || null,
        p_verification_source: verificationSource || null,
        p_internal_notes: internalNotes || null
      });

      if (rpcError) {
        console.error('Direct review_practitioner_application RPC failed:', rpcError);
        throw rpcError;
      }
    }

    // Fetch the updated application row
    const { data, error } = await client
      .from('practitioner_applications')
      .select('*')
      .eq('id', appId)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Fetches the verification review log for an application.
   */
  async getVerificationReviews(applicationId: string): Promise<VerificationReview[]> {
    if (!isSupabaseConfigured || !supabase) return [];

    const { data, error } = await supabase
      .from('verification_reviews')
      .select('*')
      .eq('application_id', applicationId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching verification reviews:', error);
      return [];
    }
    return data || [];
  }
};
