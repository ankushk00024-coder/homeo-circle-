import React, { useState, useEffect } from 'react';
import { dataService } from '../../lib/supabase';
import { PractitionerApplication, ApplicationStatus, VerificationReview } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { 
  Search, 
  Filter, 
  CheckCircle2, 
  ExternalLink,
  ShieldCheck,
  Copy,
  Check,
  X,
  FileText,
  ChevronLeft,
  ChevronRight,
  History,
  Lock,
  AlertTriangle,
  RefreshCw,
  Eye
} from 'lucide-react';

const ITEMS_PER_PAGE = 10;

export const AdminApplications: React.FC = () => {
  const { currentUser } = useAuth();
  const [applications, setApplications] = useState<PractitionerApplication[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApp, setSelectedApp] = useState<PractitionerApplication | null>(null);
  const [reviewsHistory, setReviewsHistory] = useState<VerificationReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Verification decision form state
  const [verificationSource, setVerificationSource] = useState('NCH Central Register / State Gazette');
  const [decisionReason, setDecisionReason] = useState('Registration number and degree verified against official council gazette.');
  const [internalNotes, setInternalNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedReg, setCopiedReg] = useState(false);

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    status: ApplicationStatus;
    title: string;
    description: string;
  } | null>(null);

  // Status feedback banners
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string; details?: string } | null>(null);

  const loadApplications = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const data = await dataService.getApplications();
      setApplications(data);
    } catch (err: any) {
      console.error('Failed to load applications:', err);
      setFeedback({
        type: 'error',
        message: 'Could not load practitioner applications queue.',
        details: err?.message || 'Check database connectivity or administrator role permissions.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  // When an application is selected, load its decision history
  const handleSelectApplication = async (app: PractitionerApplication) => {
    setSelectedApp(app);
    setInternalNotes('');
    setFeedback(null);
    if (app.status === 'verified') {
      setDecisionReason('Credentials confirmed in good standing against statutory register.');
    } else {
      setDecisionReason('Registration number and degree verified against official council gazette.');
    }

    setLoadingReviews(true);
    try {
      const reviews = await dataService.getVerificationReviews(app.id);
      setReviewsHistory(reviews);
    } catch (err) {
      console.warn('Could not load reviews history:', err);
      setReviewsHistory([]);
    } finally {
      setLoadingReviews(false);
    }
  };

  const initiateDecision = (status: ApplicationStatus) => {
    if (!selectedApp) return;

    let title = 'Confirm Verification Decision';
    let description = `Are you sure you want to change status to "${status.replace('_', ' ')}"?`;

    if (status === 'verified') {
      title = 'Approve Practitioner Application?';
      description = `This will officially grant ${selectedApp.full_name} the "Verified Practitioner" credential badge and member directory listing.`;
    } else if (status === 'declined' || status === 'rejected') {
      title = 'Decline Practitioner Application?';
      description = `The applicant will receive your decision reason. Internal reviewer notes will remain strictly private.`;
    } else if (status === 'needs_information') {
      title = 'Request Additional Information?';
      description = `The applicant will be requested to upload clearer certificates or updated council details.`;
    }

    setConfirmModal({
      open: true,
      status,
      title,
      description
    });
  };

  const executeDecision = async () => {
    if (!selectedApp || !confirmModal) return;
    const targetStatus = confirmModal.status;
    setConfirmModal(null);
    setIsProcessing(true);
    setFeedback(null);

    try {
      const reviewerName = currentUser?.display_name || currentUser?.full_name || 'Administrator';
      await dataService.updateApplicationStatus(
        selectedApp.id,
        targetStatus,
        reviewerName,
        decisionReason,
        verificationSource,
        internalNotes
      );

      setFeedback({
        type: 'success',
        message: `Decision recorded successfully. Application status is now "${targetStatus.replace('_', ' ')}".`
      });

      await loadApplications();
      setSelectedApp(null);
    } catch (err: any) {
      console.error('Decision execution error:', err);
      setFeedback({
        type: 'error',
        message: `Failed to record decision for ${selectedApp.full_name}.`,
        details: err?.message || 'Check if Edge Function review-application is deployed and caller holds admin role.'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const copyRegistrationNumber = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopiedReg(true);
    setTimeout(() => setCopiedReg(false), 2000);
  };

  const filteredApps = applications.filter(app => {
    const matchesStatus = 
      filterStatus === 'all' ? true :
      filterStatus === 'pending' ? (app.status === 'pending_review' || app.status === 'submitted') :
      filterStatus === 'needs_info' ? app.status === 'needs_information' :
      filterStatus === 'verified' ? app.status === 'verified' :
      filterStatus === 'rejected' ? (app.status === 'declined' || app.status === 'rejected') : true;

    const matchesSearch = !searchQuery || 
      app.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.registration_number ? app.registration_number.toLowerCase().includes(searchQuery.toLowerCase()) : false) ||
      (app.state ? app.state.toLowerCase().includes(searchQuery.toLowerCase()) : false) ||
      (app.email ? app.email.toLowerCase().includes(searchQuery.toLowerCase()) : false);

    return matchesStatus && matchesSearch;
  });

  const totalPages = Math.ceil(filteredApps.length / ITEMS_PER_PAGE) || 1;
  const paginatedApps = filteredApps.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-serif font-bold text-brand-navy">
              Practitioner Verification
            </h1>
            <span className="text-[11px] font-semibold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
              Statutory Gazette Audit
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Review applicant credentials against State Homoeopathic Councils & National Commission for Homoeopathy (NCH) register.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadApplications}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-teal-600' : 'text-slate-500'}`} />
            <span>Refresh</span>
          </button>
          <span className="text-xs text-slate-500">
            Total Queue: <strong className="text-brand-navy">{filteredApps.length}</strong>
          </span>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div className={`p-4 rounded-xl border text-xs flex items-start gap-3 ${
          feedback.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
            : 'bg-rose-50 border-rose-200 text-rose-900'
        }`}>
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          )}
          <div className="space-y-0.5">
            <p className="font-semibold">{feedback.message}</p>
            {feedback.details && <p className="font-mono text-[11px] opacity-90">{feedback.details}</p>}
          </div>
          <button onClick={() => setFeedback(null)} className="ml-auto text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by practitioner name, registration number, state, or email..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Status:
          </span>
          <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200 text-xs">
            {[
              { id: 'all', label: 'All' },
              { id: 'pending', label: 'Pending Review' },
              { id: 'needs_info', label: 'Needs Info' },
              { id: 'verified', label: 'Verified' },
              { id: 'rejected', label: 'Declined' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setFilterStatus(tab.id);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                  filterStatus === tab.id
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

      {/* Applications Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-400">Loading applications...</div>
        ) : filteredApps.length === 0 ? (
          <div className="py-20 text-center space-y-2">
            <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">No applications found</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No verification submissions match your current search query or filter criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Applicant</th>
                  <th className="py-3 px-4">Role Applied</th>
                  <th className="py-3 px-4">Degree & Experience</th>
                  <th className="py-3 px-4">Registration ID</th>
                  <th className="py-3 px-4">Statutory Authority</th>
                  <th className="py-3 px-4">Submitted</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedApps.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-semibold text-brand-navy">
                      <div>{app.full_name}</div>
                      <div className="text-[11px] text-slate-400 font-normal">{app.email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="capitalize font-medium text-slate-700">{app.role_applied || 'Doctor'}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      <div>{app.qualification || 'BHMS'}</div>
                      <div className="text-[11px] text-slate-400">{app.experience_years} years practice</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-teal-900">
                      {app.registration_number || 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div>{app.registration_authority || 'State Homoeopathic Council'}</div>
                      <div className="text-[11px] text-slate-400">{app.state}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      {app.submitted_at ? new Date(app.submitted_at).toLocaleDateString() : 'Recent'}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        app.status === 'verified'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : app.status === 'rejected' || app.status === 'declined'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : app.status === 'needs_information'
                          ? 'bg-sky-50 text-sky-700 border border-sky-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {app.status === 'verified' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                        {app.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleSelectApplication(app)}
                        className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-lg text-xs font-semibold border border-teal-200 transition inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect & Review</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {filteredApps.length > ITEMS_PER_PAGE && (
          <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <div>
              Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredApps.length)} of {filteredApps.length} applications
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

      {/* Application Detail & Decision Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-teal-700" />
                <h3 className="text-base font-bold text-brand-navy">
                  Audit Practitioner Registration Record
                </h3>
              </div>
              <button 
                onClick={() => setSelectedApp(null)} 
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Applicant Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] block font-semibold uppercase">Applicant Name</span>
                <span className="font-bold text-brand-navy text-sm">{selectedApp.full_name}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block font-semibold uppercase">Degree / Qualification</span>
                <span className="font-bold text-slate-800">{selectedApp.qualification} ({selectedApp.experience_years} yrs exp)</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block font-semibold uppercase">Role Applied</span>
                <span className="font-bold text-teal-800 capitalize">{selectedApp.role_applied || 'Doctor'}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block font-semibold uppercase">Email</span>
                <span className="text-slate-700 truncate block">{selectedApp.email}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block font-semibold uppercase">Phone</span>
                <span className="text-slate-700">{selectedApp.phone || 'Not provided'}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block font-semibold uppercase">Clinic / Hospital</span>
                <span className="text-slate-700">{selectedApp.clinic_institution || 'Independent Clinic'}</span>
              </div>
            </div>

            {/* Registration Key Inspection Box */}
            <div className="p-4 bg-teal-50/60 rounded-xl border border-teal-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-teal-900 uppercase tracking-wide">
                  Official Statutory Identifier
                </span>
                <button
                  onClick={() => copyRegistrationNumber(selectedApp.registration_number || '')}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-800 hover:text-teal-950"
                >
                  {copiedReg ? <Check className="w-3.5 h-3.5 text-teal-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedReg ? 'Copied' : 'Copy Reg ID'}</span>
                </button>
              </div>

              <div className="text-xl font-mono font-bold text-teal-950">
                {selectedApp.registration_number || 'REGISTRATION PENDING'}
              </div>

              <p className="text-xs text-teal-800">
                Registering Council: <strong>{selectedApp.registration_authority || 'State Homoeopathic Council'}</strong> ({selectedApp.state})
              </p>
            </div>

            {/* Supporting Verification Document (Signed URL access) */}
            {selectedApp.document_url && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-semibold text-brand-navy block">Registration Certificate / Degree</span>
                    <span className="text-[10px] text-slate-500 font-mono truncate max-w-sm block">
                      {selectedApp.document_url}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const signedUrl = await dataService.getPrivateDocumentSignedUrl(selectedApp.document_url!);
                      window.open(signedUrl, '_blank', 'noopener,noreferrer');
                    } catch (err: any) {
                      alert(err.message || 'Failed to generate secure signed URL for verification document.');
                    }
                  }}
                  className="px-3.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-lg font-semibold border border-teal-200 flex items-center gap-1.5 transition text-xs flex-shrink-0"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Inspect Document (Secure URL)</span>
                </button>
              </div>
            )}

            {/* Decision History (verification_reviews) */}
            <div className="space-y-2">
              <span className="font-bold text-brand-navy block uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-slate-400" />
                Previous Verification Decision History
              </span>
              {loadingReviews ? (
                <div className="text-xs text-slate-400 py-2">Loading decision trail...</div>
              ) : reviewsHistory.length === 0 ? (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
                  No prior reviews recorded for this application.
                </div>
              ) : (
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {reviewsHistory.map((rev) => (
                    <div key={rev.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-brand-navy">{rev.reviewer_name}</span>
                        <span className="text-[10px] text-slate-400">{new Date(rev.created_at).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold text-teal-800 bg-teal-100 px-1.5 rounded">
                          {rev.new_status.replace('_', ' ')}
                        </span>
                        <span className="text-slate-600 text-[11px] truncate">{rev.decision_reason}</span>
                      </div>
                      {rev.internal_notes && (
                        <div className="text-[10px] text-slate-500 font-mono bg-slate-100/70 p-1.5 rounded border border-slate-200/50">
                          Note: {rev.internal_notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Decision Inputs */}
            <div className="space-y-3 text-xs pt-2 border-t border-slate-100">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Verification Source / Record Consulted *
                </label>
                <input
                  type="text"
                  value={verificationSource}
                  onChange={(e) => setVerificationSource(e.target.value)}
                  placeholder="e.g. Maharashtra Council of Homoeopathy Gazette 2024 / NCH Central Register"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Decision Reason (Sent to applicant in notification) *
                </label>
                <textarea
                  rows={2}
                  value={decisionReason}
                  onChange={(e) => setDecisionReason(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    Internal Reviewer Notes
                  </label>
                  <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                    Confidential — Never exposed to applicant
                  </span>
                </div>
                <textarea
                  rows={2}
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="Private internal notes for other reviewers or future audit..."
                  className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 bg-slate-50/50 font-mono text-[11px]"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedApp(null)}
                className="px-4 py-2 border border-slate-200 text-xs font-semibold text-slate-600 rounded-xl hover:bg-slate-50 transition"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => initiateDecision('declined')}
                  className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold transition"
                >
                  Decline
                </button>

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => initiateDecision('needs_information')}
                  className="px-3.5 py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-xl text-xs font-semibold transition"
                >
                  Request Info
                </button>

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => initiateDecision('verified')}
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isProcessing ? 'Recording Decision...' : 'Approve & Issue Badge'}</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal && confirmModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-brand-navy">{confirmModal.title}</h3>
                <p className="text-xs text-slate-500">Action confirmation</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {confirmModal.description}
            </p>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-700 space-y-1">
              <div><strong>Applicant:</strong> {selectedApp?.full_name}</div>
              <div><strong>New Status:</strong> <span className="uppercase font-bold text-teal-800">{confirmModal.status.replace('_', ' ')}</span></div>
              <div><strong>Reason:</strong> {decisionReason}</div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 border border-slate-200 text-xs font-semibold text-slate-600 rounded-xl hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeDecision}
                className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold shadow-xs transition"
              >
                Confirm & Record
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
