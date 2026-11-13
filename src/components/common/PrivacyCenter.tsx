import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Loader2, Download } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { complianceService, ConsentRow, PrivacyRequest, PrivacyRequestType } from '../../services/complianceService';
import { supabase } from '../../lib/supabase';
import { useToast } from '../feedback/ToastProvider';

const TYPES: { value: PrivacyRequestType; label: string; hint: string }[] = [
  { value: 'access', label: 'Get a copy / summary of my data', hint: 'We send you a summary of the personal data we hold and how it is used.' },
  { value: 'correction', label: 'Correct my data', hint: 'Most details can be edited above. Use this for anything you cannot edit.' },
  { value: 'erasure', label: 'Delete my account and data', hint: 'We erase or anonymise your data, except what the law requires us to keep.' },
  { value: 'withdraw_consent', label: 'Withdraw consent', hint: 'Tell us which processing you no longer agree to.' },
  { value: 'nomination', label: 'Nominate someone', hint: 'Name a person who may exercise your rights if you die or become unable to.' },
  { value: 'other', label: 'Something else', hint: 'Any other privacy question.' },
];

/** Edit Profile → Privacy & your data. */
export const PrivacyCenter: React.FC = () => {
  const { currentUser } = useAuth();
  const toast = useToast();
  const [consents, setConsents] = useState<ConsentRow[]>([]);
  const [requests, setRequests] = useState<PrivacyRequest[]>([]);
  const [type, setType] = useState<PrivacyRequestType>('access');
  const [details, setDetails] = useState('');
  const [confirmErase, setConfirmErase] = useState(false);
  const [busy, setBusy] = useState(false);
  const [savingMarketing, setSavingMarketing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [c, r] = await Promise.all([complianceService.myConsents(), complianceService.myPrivacyRequests()]);
      setConsents(c); setRequests(r);
    } catch { /* offline or demo mode */ }
  }, []);
  useEffect(() => { load(); }, [load]);

  const marketing = consents.find((c) => c.consent_type === 'marketing')?.granted === true;

  const toggleMarketing = async () => {
    setSavingMarketing(true);
    try {
      await complianceService.recordConsent([{ consent_type: 'marketing', granted: !marketing, source: 'profile' }]);
      toast.success(!marketing ? 'You will receive Homeo India updates by email.' : 'You will no longer receive update emails.');
      await load();
    } catch (e) { toast.error((e as Error).message); } finally { setSavingMarketing(false); }
  };

  const downloadMyData = async () => {
    if (!supabase || !currentUser) return;
    const [profile, posts, comments, apps, consentsRows] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', currentUser.id).maybeSingle(),
      supabase.from('posts').select('id,title,body,created_at,status').eq('author_id', currentUser.id),
      supabase.from('comments').select('id,post_id,body,created_at').eq('author_id', currentUser.id),
      supabase.from('practitioner_applications').select('id,role_applied,status,submitted_at,full_name,email,phone,qualification,registration_number,registration_authority,state,city,institution,course_year,internship_details,graduation_year,academic_role,decision_reason').eq('user_id', currentUser.id),
      supabase.from('consent_records').select('consent_type,policy_version,granted,created_at').eq('user_id', currentUser.id),
    ]);
    const blob = new Blob([JSON.stringify({
      exported_at: new Date().toISOString(),
      profile: profile.data, posts: posts.data, comments: comments.data, applications: apps.data, consents: consentsRows.data, privacy_requests: requests,
    }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'homeo-india-my-data.json';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (type === 'erasure' && !confirmErase) { toast.error('Please tick the box to confirm you want your account deleted.'); return; }
    setBusy(true);
    try {
      await complianceService.submitPrivacyRequest(type, details);
      toast.success('Request received. We will update you in your notifications.');
      setDetails(''); setConfirmErase(false);
      await load();
    } catch (err) { toast.error((err as Error).message || 'Could not send the request.'); } finally { setBusy(false); }
  };

  const hint = TYPES.find((t) => t.value === type)?.hint;

  return (
    <div id="privacy" className="scroll-mt-24 bg-white rounded-2xl p-6 border border-slate-200 shadow-card space-y-5">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-teal-700" />
        <h2 className="text-sm font-bold text-brand-navy">Privacy & your data</h2>
      </div>
      <p className="text-xs text-slate-600">Your rights are explained in the <Link to="/privacy#rights" className="text-teal-700 underline">Privacy Policy</Link>.</p>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-3.5 text-xs">
        <div>
          <p className="font-semibold text-brand-navy">Update emails</p>
          <p className="text-slate-500">Optional emails about events and new features.</p>
        </div>
        <button type="button" onClick={toggleMarketing} disabled={savingMarketing}
          className={`rounded-lg px-3 py-1.5 font-semibold ring-1 ${marketing ? 'bg-teal-700 text-white ring-teal-700' : 'bg-white text-slate-600 ring-slate-200'}`}>
          {savingMarketing ? 'Saving…' : marketing ? 'On — turn off' : 'Off — turn on'}
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-3.5 text-xs">
        <div>
          <p className="font-semibold text-brand-navy">Download my data</p>
          <p className="text-slate-500">Your profile, posts, comments, applications and consents as a file.</p>
        </div>
        <button type="button" onClick={downloadMyData} className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100">
          <Download className="h-3.5 w-3.5" /> Download
        </button>
      </div>

      <form onSubmit={submit} className="space-y-3 text-xs">
        <p className="font-semibold text-brand-navy">Make a request</p>
        <select value={type} onChange={(e) => setType(e.target.value as PrivacyRequestType)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2">
          {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        {hint && <p className="text-slate-500">{hint}</p>}
        <textarea value={details} onChange={(e) => setDetails(e.target.value)} maxLength={3000} rows={3}
          placeholder="Anything we should know (optional)" className="w-full rounded-xl border border-slate-200 p-2.5" />
        {type === 'erasure' && (
          <label className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-800">
            <input type="checkbox" checked={confirmErase} onChange={(e) => setConfirmErase(e.target.checked)} className="mt-0.5 rounded text-rose-600" />
            I want my Homeo India account and personal data deleted. I understand this cannot be undone and that records the law requires are kept.
          </label>
        )}
        <button type="submit" disabled={busy} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 font-semibold text-white ${type === 'erasure' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-teal-700 hover:bg-teal-800'} disabled:opacity-60`}>
          {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Send request
        </button>
      </form>

      {requests.length > 0 && (
        <div className="space-y-2 text-xs">
          <p className="font-semibold text-brand-navy">Your requests</p>
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
            {requests.map((r) => (
              <li key={r.id} className="p-3">
                <span className="font-semibold">{TYPES.find((t) => t.value === r.request_type)?.label}</span>
                <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 capitalize text-slate-600">{r.status.replace('_', ' ')}</span>
                <span className="ml-2 text-slate-400">{new Date(r.created_at).toLocaleDateString('en-IN')}</span>
                {r.response && <p className="mt-1 text-slate-600">{r.response}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
