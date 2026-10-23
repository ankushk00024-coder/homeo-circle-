import React, { useState, useEffect } from 'react';
import { dataService } from '../../lib/supabase';
import { PractitionerApplication, ApplicationStatus } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { 
  FileCheck2, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Clock, 
  ExternalLink,
  ShieldCheck,
  Copy,
  Check,
  X,
  FileText
} from 'lucide-react';

export const AdminApplications: React.FC = () => {
  const { currentUser } = useAuth();
  const [applications, setApplications] = useState<PractitionerApplication[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApp, setSelectedApp] = useState<PractitionerApplication | null>(null);
  const [loading, setLoading] = useState(true);

  // Verification decision form state
  const [verificationSource, setVerificationSource] = useState('NCH Central Register / State Gazette');
  const [decisionReason, setDecisionReason] = useState('Registration number and degree verified against official council gazette.');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedReg, setCopiedReg] = useState(false);

  const loadApplications = async () => {
    setLoading(true);
    const data = await dataService.getApplications();
    setApplications(data);
    setLoading(false);
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const handleDecision = async (status: ApplicationStatus) => {
    if (!selectedApp) return;
    setIsProcessing(true);

    try {
      await dataService.updateApplicationStatus(
        selectedApp.id,
        status,
        currentUser?.display_name || 'Dr. Sanjeev Bannerjee',
        decisionReason,
        verificationSource
      );
      await loadApplications();
      setSelectedApp(null);
    } catch (err) {
      console.error(err);
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
    const matchesStatus = filterStatus === 'all' || app.status === filterStatus;
    const matchesSearch = !searchQuery || 
      app.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.registration_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-brand-navy">
            Practitioner Verification Queue
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit applicant credentials against official State Councils & Central Register for Homoeopathy.
          </p>
        </div>

        <span className="text-xs text-slate-500">
          Total Queue: <strong className="text-brand-navy">{filteredApps.length}</strong> applications
        </span>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by practitioner name, registration number, or state..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {['all', 'pending_review', 'needs_information', 'verified', 'declined'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition ${
                filterStatus === st
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Applications Table */}
      {loading ? (
        <div className="bg-white rounded-2xl p-12 text-center text-xs text-slate-500">
          Loading verification queue...
        </div>
      ) : filteredApps.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-2">
          <FileCheck2 className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-brand-navy">No applications in this category</h3>
          <p className="text-xs text-slate-500">All queued applications have been processed.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Applicant</th>
                  <th className="py-3 px-4">Degree</th>
                  <th className="py-3 px-4">Registration No.</th>
                  <th className="py-3 px-4">State & Authority</th>
                  <th className="py-3 px-4">Submitted</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredApps.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-brand-navy">{app.full_name}</div>
                      <div className="text-[11px] text-slate-400">{app.email}</div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      {app.qualification}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        {app.registration_number}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{app.state}</div>
                      <div className="text-[10px] text-slate-500 max-w-[200px] truncate">{app.registration_authority}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {app.submitted_at}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                        app.status === 'verified'
                          ? 'bg-teal-50 text-teal-700 border border-teal-200'
                          : app.status === 'declined'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : app.status === 'needs_information'
                          ? 'bg-sky-50 text-sky-700 border border-sky-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {app.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedApp(app);
                          setDecisionReason(
                            app.status === 'verified' 
                              ? 'Credentials verified against official gazette.' 
                              : 'Registration details checked against statutory register.'
                          );
                        }}
                        className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-lg text-xs font-semibold border border-teal-200 transition"
                      >
                        Inspect & Audit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Application Inspection & Verification Decision Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-teal-700" />
                <h3 className="text-base font-bold text-brand-navy">
                  Audit Practitioner Registration Record
                </h3>
              </div>
              <button onClick={() => setSelectedApp(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Applicant Summary */}
            <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] block font-semibold uppercase">Practitioner Legal Name</span>
                <span className="font-bold text-brand-navy text-sm">{selectedApp.full_name}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block font-semibold uppercase">Degree / Qualification</span>
                <span className="font-bold text-slate-800">{selectedApp.qualification} ({selectedApp.experience_years} yrs exp)</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block font-semibold uppercase">Email & Phone</span>
                <span className="text-slate-700">{selectedApp.email} • {selectedApp.phone}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block font-semibold uppercase">Clinic / Affiliation</span>
                <span className="text-slate-700">{selectedApp.clinic_institution || 'Independent'}</span>
              </div>
            </div>

            {/* Registration Key Inspection Box */}
            <div className="p-4 bg-teal-50/60 rounded-xl border border-teal-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-teal-900 uppercase tracking-wide">
                  Official Registration Identifier
                </span>
                <button
                  onClick={() => copyRegistrationNumber(selectedApp.registration_number)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-800 hover:text-teal-950"
                >
                  {copiedReg ? <Check className="w-3.5 h-3.5 text-teal-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedReg ? 'Copied' : 'Copy Reg No'}</span>
                </button>
              </div>

              <div className="text-lg font-mono font-bold text-teal-950">
                {selectedApp.registration_number}
              </div>

              <p className="text-xs text-teal-800">
                Statutory Register: <strong>{selectedApp.registration_authority}</strong> ({selectedApp.state})
              </p>
            </div>

            {/* Official Register Check Checklist */}
            <div className="space-y-2 text-xs">
              <span className="font-bold text-brand-navy block uppercase text-[10px] tracking-wider">
                Statutory Review Checklist
              </span>
              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5 text-slate-700">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  <span>Applicant holds a recognized qualification under NCH Act, 2020 schedule.</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  <span>Registration number checked on official state council online portal / gazette.</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  <span>No recorded suspension or disciplinary sanctions against license.</span>
                </div>
              </div>
            </div>

            {/* Decision Input Fields */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Verification Source / Record Link Consulted *
                </label>
                <input
                  type="text"
                  value={verificationSource}
                  onChange={(e) => setVerificationSource(e.target.value)}
                  placeholder="e.g. Maharashtra Council of Homoeopathy Gazette 2024 / NCH Central Register"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Decision Notes / Reason Recorded in Audit Log *
                </label>
                <textarea
                  rows={2}
                  value={decisionReason}
                  onChange={(e) => setDecisionReason(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl outline-none"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedApp(null)}
                className="px-4 py-2 border border-slate-200 text-xs font-semibold text-slate-600 rounded-xl hover:bg-slate-50"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleDecision('declined')}
                  className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold transition"
                >
                  Decline
                </button>

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleDecision('needs_information')}
                  className="px-3.5 py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-xl text-xs font-semibold transition"
                >
                  Request Clarification
                </button>

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleDecision('verified')}
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold shadow transition flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isProcessing ? 'Recording Decision...' : 'Approve & Issue Verified Badge'}</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
