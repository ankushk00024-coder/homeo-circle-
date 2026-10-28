import React, { useState, useEffect } from 'react';
import { dataService } from '../../lib/supabase';
import { Report } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { 
  Flag, 
  Search, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw, 
  X
} from 'lucide-react';

const ITEMS_PER_PAGE = 10;

const REASON_LABELS: Record<string, { label: string; badge: string }> = {
  patient_privacy: { label: 'Patient Privacy Breach', badge: 'bg-rose-50 text-rose-700 border-rose-200' },
  misleading_clinical_claim: { label: 'Misleading Claim', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  unsolicited_promotion: { label: 'Unsolicited Promotion', badge: 'bg-purple-50 text-purple-700 border-purple-200' },
  harassment: { label: 'Harassment / Abuse', badge: 'bg-rose-50 text-rose-700 border-rose-200' },
  unverified_credentials: { label: 'Unverified Practice Claim', badge: 'bg-sky-50 text-sky-700 border-sky-200' }
};

export const AdminReports: React.FC = () => {
  const { currentUser } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Resolution modal state
  const [resolutionModal, setResolutionModal] = useState<{
    open: boolean;
    report: Report;
    newStatus: 'resolved' | 'dismissed';
    note: string;
  } | null>(null);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadReports = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const data = await dataService.getReports();
      setReports(data);
    } catch (err: any) {
      console.error('Failed to load reports:', err);
      setFeedback({
        type: 'error',
        message: err?.message || 'Could not load user moderation reports.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const openResolution = (report: Report, status: 'resolved' | 'dismissed') => {
    const defaultNote = status === 'resolved' 
      ? 'Content inspected; guideline violation addressed and appropriate actions recorded.' 
      : 'Report evaluated and dismissed. Content complies with community guidelines.';
    setResolutionModal({
      open: true,
      report,
      newStatus: status,
      note: defaultNote
    });
  };

  const executeResolution = async () => {
    if (!resolutionModal) return;
    const { report, newStatus, note } = resolutionModal;
    setResolutionModal(null);

    const actorId = currentUser?.id || 'admin';
    const actorName = currentUser?.display_name || currentUser?.full_name || 'Administrator';

    try {
      await dataService.updateReportStatus(report.id, newStatus, note);
      await dataService.addAuditLog({
        actor_id: actorId,
        actor_name: actorName,
        action: `REPORT_${newStatus.toUpperCase()}`,
        target_type: 'report',
        target_id: report.id,
        metadata: {
          target_id: report.target_id,
          target_type: report.target_type,
          target_title: report.target_title,
          resolution_note: note
        }
      });

      setFeedback({
        type: 'success',
        message: `Report marked as ${newStatus}.`
      });

      await loadReports();
    } catch (err: any) {
      console.error('Failed to resolve report:', err);
      setFeedback({
        type: 'error',
        message: err?.message || 'Could not update report resolution.'
      });
    }
  };

  const filteredReports = reports.filter(r => {
    if (statusFilter !== 'all') {
      if (statusFilter === 'open' && r.status !== 'open' && r.status !== 'under_review') return false;
      if (statusFilter === 'resolved' && r.status !== 'resolved') return false;
      if (statusFilter === 'dismissed' && r.status !== 'dismissed') return false;
    }
    if (typeFilter !== 'all' && r.target_type !== typeFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (r.target_title || '').toLowerCase().includes(q);
      const matchReporter = (r.reporter_name || '').toLowerCase().includes(q);
      const matchReason = (r.reason || '').toLowerCase().includes(q);
      const matchNote = (r.note || '').toLowerCase().includes(q);
      if (!matchTitle && !matchReporter && !matchReason && !matchNote) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filteredReports.length / ITEMS_PER_PAGE) || 1;
  const paginatedReports = filteredReports.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-serif font-bold text-brand-navy">
              Comments & User Reports
            </h1>
            <span className="text-[11px] font-semibold text-rose-800 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
              Safety & Ethics Queue
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Review member-submitted reports on clinical confidentiality breaches, harassment, and unverified medical claims.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadReports}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-teal-600' : 'text-slate-500'}`} />
            <span>Refresh</span>
          </button>
          <span className="text-xs text-slate-500">
            Total Reports: <strong className="text-brand-navy">{filteredReports.length}</strong>
          </span>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div className={`p-4 rounded-xl border text-xs flex items-center justify-between ${
          feedback.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
            : 'bg-rose-50 border-rose-200 text-rose-900'
        }`}>
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filters & Search */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search reports by title, reporter, violation reason, or notes..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200 text-xs">
            {[
              { id: 'all', label: 'All Status' },
              { id: 'open', label: 'Open / Pending' },
              { id: 'resolved', label: 'Resolved' },
              { id: 'dismissed', label: 'Dismissed' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setStatusFilter(tab.id);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition ${
                  statusFilter === tab.id
                    ? 'bg-white text-brand-navy shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200 text-xs">
            {[
              { id: 'all', label: 'All Targets' },
              { id: 'post', label: 'Posts' },
              { id: 'comment', label: 'Comments' },
              { id: 'member', label: 'Members' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setTypeFilter(tab.id);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                  typeFilter === tab.id
                    ? 'bg-white text-brand-navy font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-400">Loading reports queue...</div>
        ) : filteredReports.length === 0 ? (
          <div className="py-20 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">No open moderation reports</p>
            <p className="text-xs text-slate-500">The moderation queue is currently clear.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Reported Content / Target</th>
                  <th className="py-3 px-4">Violation Category</th>
                  <th className="py-3 px-4">Reporter & Details</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Resolution Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedReports.map((report) => {
                  const reasonInfo = REASON_LABELS[report.reason] || { label: report.reason, badge: 'bg-slate-100 text-slate-700 border-slate-200' };
                  return (
                    <tr key={report.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4 max-w-sm">
                        <div className="flex items-center gap-2 mb-0.5">
                          {report.target_type === 'post' ? (
                            <span className="text-[10px] font-bold text-sky-800 bg-sky-50 px-1.5 rounded uppercase">Post</span>
                          ) : report.target_type === 'comment' ? (
                            <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-1.5 rounded uppercase">Comment</span>
                          ) : (
                            <span className="text-[10px] font-bold text-indigo-800 bg-indigo-50 px-1.5 rounded uppercase">Member</span>
                          )}
                          <span className="font-bold text-brand-navy truncate">{report.target_title || `ID: ${report.target_id.slice(0, 8)}`}</span>
                        </div>
                        {report.note && (
                          <p className="text-[11px] text-slate-500 line-clamp-1 italic">
                            "{report.note}"
                          </p>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border ${reasonInfo.badge}`}>
                          {reasonInfo.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        <div className="font-medium">{report.reporter_name || 'Anonymous Member'}</div>
                        <div className="text-[10px] text-slate-400 font-mono">ID: {report.reporter_id?.slice(0, 8) || 'N/A'}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {report.created_at ? new Date(report.created_at).toLocaleDateString() : 'Recent'}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          report.status === 'resolved'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : report.status === 'dismissed'
                            ? 'bg-slate-100 text-slate-600 border border-slate-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {report.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {report.status === 'open' || report.status === 'under_review' ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => openResolution(report, 'resolved')}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-semibold border border-emerald-200 transition"
                            >
                              Resolve
                            </button>
                            <button
                              onClick={() => openResolution(report, 'dismissed')}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
                            >
                              Dismiss
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            {report.resolved_at ? new Date(report.resolved_at).toLocaleDateString() : 'Closed'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {filteredReports.length > ITEMS_PER_PAGE && (
          <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <div>
              Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredReports.length)} of {filteredReports.length} reports
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-semibold text-brand-navy">
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Resolution Modal */}
      {resolutionModal && resolutionModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                resolutionModal.newStatus === 'resolved' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'
              }`}>
                {resolutionModal.newStatus === 'resolved' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-base font-bold text-brand-navy">
                  {resolutionModal.newStatus === 'resolved' ? 'Resolve Safety Report' : 'Dismiss Report'}
                </h3>
                <p className="text-xs text-slate-500">Audited moderation closure</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
              <div><strong>Target:</strong> {resolutionModal.report.target_title || resolutionModal.report.target_id}</div>
              <div><strong>Reason:</strong> {resolutionModal.report.reason}</div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Resolution Note (Recorded in Audit Ledger) *
              </label>
              <textarea
                rows={3}
                value={resolutionModal.note}
                onChange={(e) => setResolutionModal({ ...resolutionModal, note: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setResolutionModal(null)}
                className="px-4 py-2 border border-slate-200 text-xs font-semibold text-slate-600 rounded-xl hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeResolution}
                className={`px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-xs transition ${
                  resolutionModal.newStatus === 'resolved' ? 'bg-teal-700 hover:bg-teal-800' : 'bg-slate-700 hover:bg-slate-800'
                }`}
              >
                Confirm Resolution
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
