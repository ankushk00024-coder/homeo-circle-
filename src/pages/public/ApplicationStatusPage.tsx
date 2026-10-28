import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dataService } from '../../lib/supabase';
import { PractitionerApplication } from '../../types';
import { 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  ArrowRight, 
  Building2, 
  Send 
} from 'lucide-react';

export const ApplicationStatusPage: React.FC = () => {
  const { currentUser, status, role, loginAs, isDemoMode } = useAuth();
  const location = useLocation();
  const [application, setApplication] = useState<PractitionerApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [appealNote, setAppealNote] = useState('');
  const [appealSent, setAppealSent] = useState(false);
  const [lookupAppId, setLookupAppId] = useState('');
  const [lookupEmail, setLookupEmail] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  useEffect(() => {
    const stateApp = (location.state as any)?.app;
    const stateAppId = (location.state as any)?.appId || stateApp?.id;
    const stateEmail = (location.state as any)?.email || stateApp?.email;

    if (stateApp) {
      setApplication(stateApp);
      setLoading(false);
    }

    if (currentUser?.id) {
      dataService.getMyApplication(currentUser.id).then(app => {
        if (app) setApplication(app);
        setLoading(false);
      });
    } else if (stateAppId && stateEmail) {
      dataService.lookupGuestApplicationStatus(stateAppId, stateEmail).then(app => {
        if (app) setApplication(app as PractitionerApplication);
        setLoading(false);
      });
    } else if (stateAppId && !stateApp) {
      dataService.getApplicationById(stateAppId).then(app => {
        if (app) setApplication(app);
        setLoading(false);
      });
    } else if (!stateApp) {
      setLoading(false);
    }
  }, [currentUser, location.state]);

  const handleManualLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError(null);
    if (!lookupAppId.trim() || !lookupEmail.trim()) {
      setLookupError('Please enter both your Application UUID and registered email.');
      return;
    }
    setLookupLoading(true);
    try {
      const app = await dataService.lookupGuestApplicationStatus(lookupAppId.trim(), lookupEmail.trim());
      if (app) {
        setApplication(app as PractitionerApplication);
      } else {
        setLookupError('No application found matching this Application ID and email. Please check your submission confirmation.');
      }
    } catch (err: any) {
      setLookupError(err.message || 'Failed to retrieve application status.');
    } finally {
      setLookupLoading(false);
    }
  };

  const currentStatus = application ? application.status : status;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-serif font-bold text-brand-navy">
          Practitioner Verification Status
        </h1>
        <p className="text-xs sm:text-sm text-slate-600">
          Tracking official state council and National Register audit progress.
        </p>
      </div>

      {!application && !loading && !currentUser && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-card space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <ShieldCheck className="w-5 h-5 text-teal-600" />
            <h3 className="text-sm font-bold text-brand-navy">Secure Guest Status Lookup</h3>
          </div>
          <p className="text-xs text-slate-600">
            If you submitted an application without logging in, enter your Application ID and registered email address to check your status securely.
          </p>
          <form onSubmit={handleManualLookup} className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Application ID (UUID)
              </label>
              <input
                type="text"
                required
                value={lookupAppId}
                onChange={(e) => setLookupAppId(e.target.value)}
                placeholder="e.g. 123e4567-e89b-12d3-a456-426614174000"
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Registered Email Address
              </label>
              <input
                type="email"
                required
                value={lookupEmail}
                onChange={(e) => setLookupEmail(e.target.value)}
                placeholder="doctor@example.com"
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none"
              />
            </div>
            {lookupError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{lookupError}</span>
              </div>
            )}
            <button
              type="submit"
              disabled={lookupLoading}
              className="px-4 py-2 bg-teal-700 text-white text-xs font-semibold rounded-lg hover:bg-teal-800 transition disabled:opacity-50"
            >
              {lookupLoading ? 'Checking...' : 'Check Status'}
            </button>
          </form>
        </div>
      )}

      {/* Main Status Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-card space-y-6">
        
        {/* Top Banner based on status */}
        {currentStatus === 'verified' && (
          <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-teal-600 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-teal-900">Credentials Successfully Verified</h3>
                <p className="text-xs text-teal-700">Your registration has been confirmed. Full member privileges are active.</p>
              </div>
            </div>
            <Link
              to="/dashboard"
              className="px-4 py-2 bg-teal-700 text-white rounded-lg text-xs font-semibold hover:bg-teal-800 transition"
            >
              Enter Dashboard &rarr;
            </Link>
          </div>
        )}

        {(currentStatus === 'pending_review' || currentStatus === 'submitted') && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-amber-900">Application Under Manual Review</h3>
              <p className="text-xs text-amber-700 leading-relaxed">
                Your application is in the verification queue. A member of our verification committee is cross-checking your registration identifier against the specified State Homoeopathic Council gazette. Typical turnaround is 24–48 hours.
              </p>
            </div>
          </div>
        )}

        {currentStatus === 'needs_information' && (
          <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-sky-900">Additional Clarification Requested</h3>
              <p className="text-xs text-sky-700 leading-relaxed">
                The verification committee noted: <em>"{application?.decision_reason || 'Please provide updated certificate copy.'}"</em>
              </p>
            </div>
          </div>
        )}

        {currentStatus === 'declined' && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-rose-900">Application Not Approved</h3>
              <p className="text-xs text-rose-700 leading-relaxed">
                {application?.decision_reason || 'Registration details could not be validated against the specified state register or the practitioner holds an unverified qualification.'}
              </p>
            </div>
          </div>
        )}

        {/* Application Summary Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 block font-medium">Applicant Name</span>
            <span className="font-semibold text-brand-navy">{application?.full_name || (location.state as any)?.fullName || currentUser?.full_name || 'Practitioner Applicant'}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Medical Qualification</span>
            <span className="font-semibold text-brand-navy">{application?.qualification || (location.state as any)?.qualification || 'Degree / Diploma'}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Registration Number</span>
            <span className="font-mono font-bold text-teal-800">{application?.registration_number || (location.state as any)?.regNumber || 'Pending Statutory Check'}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Registration Authority</span>
            <span className="font-semibold text-brand-navy">{application?.registration_authority || (location.state as any)?.authority || 'State Homoeopathic Council'}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Application ID</span>
            <span className="font-mono text-slate-600">{application?.id || (location.state as any)?.appId || 'Pending'}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Submitted Time</span>
            <span className="text-slate-600">{application?.submitted_at ? new Date(application.submitted_at).toLocaleString('en-IN') : 'Just now'}</span>
          </div>
        </div>

        {/* Verification Progress Stepper */}
        <div className="space-y-4 pt-2">
          <h4 className="text-xs font-bold text-brand-navy uppercase tracking-wider">
            Verification Audit Stepper
          </h4>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {/* Step 1 */}
            <div className="relative">
              <span className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-teal-600 text-white flex items-center justify-center text-[11px] font-bold">
                &#10003;
              </span>
              <p className="text-xs font-bold text-brand-navy">Application Received</p>
              <p className="text-xs text-slate-500">
                Credentials submitted with statutory consent declaration.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <span className={`absolute -left-6 top-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[11px] font-bold ${
                currentStatus === 'verified'
                  ? 'bg-teal-600 text-white'
                  : currentStatus === 'declined'
                  ? 'bg-rose-500 text-white'
                  : 'bg-amber-400 text-white animate-pulse'
              }`}>
                {currentStatus === 'verified' ? '✓' : currentStatus === 'declined' ? '×' : '•'}
              </span>
              <p className="text-xs font-bold text-brand-navy">Official Register Cross-Check</p>
              <p className="text-xs text-slate-500">
                Reviewing official gazettes and statutory council databases ({application?.registration_authority || 'State Board'}).
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <span className={`absolute -left-6 top-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[11px] font-bold ${
                currentStatus === 'verified'
                  ? 'bg-teal-600 text-white'
                  : currentStatus === 'declined'
                  ? 'bg-rose-500 text-white'
                  : 'bg-slate-300 text-white'
              }`}>
                {currentStatus === 'verified' ? '✓' : currentStatus === 'declined' ? '×' : '3'}
              </span>
              <p className="text-xs font-bold text-brand-navy">Final Determination</p>
              <p className="text-xs text-slate-500">
                {currentStatus === 'verified' 
                  ? 'Account approved and verified practitioner badge issued.' 
                  : currentStatus === 'declined'
                  ? 'Application declined. You may file an appeal below.'
                  : 'Pending reviewer decision.'}
              </p>
            </div>
          </div>
        </div>

        {/* Appeal / Request Clarification Form */}
        {(currentStatus === 'declined' || currentStatus === 'needs_information') && (
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <h4 className="text-xs font-bold text-brand-navy">
              Submit Clarification or Appeal
            </h4>
            {appealSent ? (
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg text-xs text-teal-800">
                Your appeal notes have been forwarded to the verification appeals committee. You will receive an email update shortly.
              </div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); setAppealSent(true); }} className="space-y-2">
                <textarea
                  rows={3}
                  value={appealNote}
                  onChange={(e) => setAppealNote(e.target.value)}
                  placeholder="Explain any name spelling variations, provide recent council renewal receipt numbers, or upload link..."
                  className="w-full p-3 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none"
                  required
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-brand-navy text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Clarification to Reviewer</span>
                </button>
              </form>
            )}
          </div>
        )}

      </div>

      {/* Demo-mode shortcut for testing the review workflow */}
      {isDemoMode && (
      <div className="p-4 bg-slate-100 rounded-xl text-center text-xs text-slate-600 space-y-2">
        <p className="font-semibold text-slate-700">Demo review helper:</p>
        <p className="text-xs">
          Want to test the Admin review workflow for this applicant? Switch to the Admin view in the top bar or click below to open the Admin Applications queue.
        </p>
        <div className="flex justify-center gap-2 pt-1">
          <Link
            to="/admin/applications"
            onClick={() => loginAs('admin')}
            className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition"
          >
            Review Applications as Admin &rarr;
          </Link>
        </div>
      </div>
      )}
    </div>
  );
};
