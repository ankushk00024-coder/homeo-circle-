import { getRequiredSupabase, isSupabaseConfigured, supabase } from './supabaseClient';

export type PrivacyRequestType = 'access' | 'correction' | 'erasure' | 'withdraw_consent' | 'nomination' | 'other';
export type GrievanceCategory = 'grievance' | 'privacy' | 'copyright' | 'content' | 'account' | 'appeal' | 'verification' | 'other';

export interface PrivacyRequest {
  id: string; user_id: string; request_type: PrivacyRequestType; details?: string; status: string;
  response?: string; created_at: string; updated_at: string; completed_at?: string;
}
export interface Grievance {
  id: string; user_id?: string; name: string; email: string; category: GrievanceCategory; subject: string; details: string;
  related_url?: string; status: string; resolution?: string; created_at: string; acknowledged_at?: string; resolved_at?: string;
}
export interface ConsentRow { consent_type: string; policy_version: string | null; granted: boolean; created_at: string }
export interface StaffRow { user_id: string; name: string; email: string; role: string; added_at: string }

/** Consent, privacy requests, complaints and staff roles. */
export const complianceService = {
  async myConsents(): Promise<ConsentRow[]> {
    if (!isSupabaseConfigured || !supabase) return [];
    const { data, error } = await supabase.rpc('my_consents');
    if (error) throw error;
    return (data as ConsentRow[]) || [];
  },
  async recordConsent(rows: { consent_type: string; policy_version?: string | null; granted: boolean; source?: string }[]) {
    const client = getRequiredSupabase();
    const { data: { user } } = await client.auth.getUser();
    if (!user) throw new Error('Please sign in again.');
    const { error } = await client.from('consent_records').insert(rows.map((r) => ({ ...r, user_id: user.id })));
    if (error) throw error;
  },

  async myPrivacyRequests(): Promise<PrivacyRequest[]> {
    const { data, error } = await getRequiredSupabase().from('privacy_requests').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },
  async submitPrivacyRequest(request_type: PrivacyRequestType, details: string) {
    const client = getRequiredSupabase();
    const { data: { user } } = await client.auth.getUser();
    if (!user) throw new Error('Please sign in again.');
    const { error } = await client.from('privacy_requests').insert({ user_id: user.id, request_type, details: details.trim() || null });
    if (error) throw error;
  },
  async allPrivacyRequests(): Promise<(PrivacyRequest & { member?: string })[]> {
    const client = getRequiredSupabase();
    const { data, error } = await client.from('privacy_requests').select('*').order('created_at', { ascending: false }).limit(200);
    if (error) throw error;
    return data || [];
  },
  async updatePrivacyRequest(id: string, status: string, response: string) {
    const { error } = await getRequiredSupabase().from('privacy_requests').update({ status, response: response.trim() || null }).eq('id', id);
    if (error) throw error;
  },
  /** Anonymises a member and deletes their stored files through the Storage API. */
  async eraseMember(userId: string, requestId?: string): Promise<{ filesRemoved: number; filesFailed: number }> {
    const client = getRequiredSupabase();
    const { data, error } = await client.rpc('anonymise_member', { p_user_id: userId, p_request_id: requestId || null });
    if (error) throw error;
    const files: string[] = (data as { files?: string[] })?.files || [];
    let removed = 0, failed = 0;
    for (const f of files) {
      const slash = f.indexOf('/');
      const { error: e } = await client.storage.from(f.slice(0, slash)).remove([f.slice(slash + 1)]);
      if (e) failed++; else removed++;
    }
    return { filesRemoved: removed, filesFailed: failed };
  },

  async submitGrievance(g: { name: string; email: string; category: GrievanceCategory; subject: string; details: string; related_url?: string }) {
    const client = getRequiredSupabase();
    const { data: { session } } = await client.auth.getSession();
    // No .select(): guests cannot read complaints back.
    const { error } = await client.from('grievances').insert({ ...g, related_url: g.related_url || null, user_id: session?.user.id ?? null });
    if (error) throw error;
  },
  async myGrievances(): Promise<Grievance[]> {
    if (!isSupabaseConfigured || !supabase) return [];
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return [];
    const { data, error } = await supabase.from('grievances').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false });
    if (error) return [];
    return data || [];
  },
  async allGrievances(): Promise<Grievance[]> {
    const { data, error } = await getRequiredSupabase().from('grievances').select('*').order('created_at', { ascending: false }).limit(300);
    if (error) throw error;
    return data || [];
  },
  async updateGrievance(id: string, status: string, resolution: string) {
    const { error } = await getRequiredSupabase().from('grievances').update({ status, resolution: resolution.trim() || null }).eq('id', id);
    if (error) throw error;
  },

  async listStaff(): Promise<StaffRow[]> {
    const { data, error } = await getRequiredSupabase().rpc('list_staff');
    if (error) throw error;
    return (data as StaffRow[]) || [];
  },
  async setStaffRole(email: string, role: string, grant: boolean) {
    const { error } = await getRequiredSupabase().rpc('set_staff_role', { p_email: email.trim(), p_role: role, p_grant: grant });
    if (error) throw error;
  },
  async setRegistrationStatus(userId: string, status: string, source?: string, validUntil?: string, note?: string) {
    const { error } = await getRequiredSupabase().rpc('set_registration_status', {
      p_user_id: userId, p_status: status, p_source: source || null, p_valid_until: validUntil || null, p_note: note || null,
    });
    if (error) throw error;
  },
};
