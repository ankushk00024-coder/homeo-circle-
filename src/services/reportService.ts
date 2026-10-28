import { supabase, isSupabaseConfigured, getRequiredSupabase } from './supabaseClient';
import { Report } from '../types';

export const reportService = {
  /**
   * Submits a content safety / DISHA compliance report.
   */
  async submitReport(reportData: Partial<Report>): Promise<Report> {
    const client = getRequiredSupabase();

    const payload = {
      reporter_id: reportData.reporter_id,
      reporter_name: reportData.reporter_name,
      target_type: reportData.target_type || 'post',
      target_id: reportData.target_id,
      target_title: reportData.target_title,
      reason: reportData.reason || 'patient_privacy',
      note: reportData.note?.trim() || null,
      status: 'open'
    };

    const { data, error } = await client
      .from('reports')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Fetches content reports. Protected by RLS (only administrators and reporters).
   */
  async getReports(): Promise<Report[]> {
    if (!isSupabaseConfigured || !supabase) return [];

    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching reports:', error);
      return [];
    }
    return data || [];
  },

  /**
   * Updates report status with resolution note. Authorized to admins.
   */
  async updateReportStatus(
    reportId: string,
    status: 'resolved' | 'dismissed',
    resolutionNote: string
  ): Promise<void> {
    const client = getRequiredSupabase();

    const { error } = await client
      .from('reports')
      .update({
        status,
        resolution_note: resolutionNote,
        resolved_at: new Date().toISOString()
      })
      .eq('id', reportId);

    if (error) throw error;
  },

  /**
   * Alias for updateReportStatus.
   */
  async resolveReport(
    reportId: string,
    resolutionNote: string,
    newStatus: 'resolved' | 'dismissed'
  ): Promise<void> {
    return this.updateReportStatus(reportId, newStatus, resolutionNote);
  }
};
