import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Send, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { complianceService, Grievance, GrievanceCategory } from '../../services/complianceService';
import { normalizeUrl } from '../../lib/safeUrl';
import { OPERATOR, op } from '../../legal/config';

const CATEGORIES: { value: GrievanceCategory; label: string }[] = [
  { value: 'grievance', label: 'General complaint' },
  { value: 'content', label: 'Report content or a member' },
  { value: 'privacy', label: 'Privacy or personal data' },
  { value: 'copyright', label: 'Copyright (takedown notice)' },
  { value: 'verification', label: 'Verification decision' },
  { value: 'appeal', label: 'Appeal a decision' },
  { value: 'account', label: 'My account' },
  { value: 'other', label: 'Something else' },
];

const input = 'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20';

export const ContactPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [params] = useSearchParams();
  const initialCat = CATEGORIES.some((c) => c.value === params.get('type')) ? (params.get('type') as GrievanceCategory) : 'grievance';
  const [category, setCategory] = useState<GrievanceCategory>(initialCat);
  const [name, setName] = useState(currentUser?.display_name || currentUser?.full_name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [subject, setSubject] = useState('');
  const [details, setDetails] = useState('');
  const [url, setUrl] = useState(params.get('url') || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [mine, setMine] = useState<Grievance[]>([]);

  useEffect(() => {
    if (currentUser) { setName((v) => v || currentUser.display_name || currentUser.full_name || ''); setEmail((v) => v || currentUser.email || ''); }
    complianceService.myGrievances().then(setMine).catch(() => setMine([]));
  }, [currentUser, sent]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError('Please enter your name.');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Please enter a valid email so we can reply.');
    if (!subject.trim()) return setError('Please add a short subject.');
    if (details.trim().length < 10) return setError('Please describe the issue (at least a sentence).');
    const link = normalizeUrl(url);
    if (url.trim() && !link) return setError('The link must be a web address (https://…).');
    setBusy(true);
    try {
      await complianceService.submitGrievance({ name: name.trim(), email: email.trim(), category, subject: subject.trim(), details: details.trim(), related_url: link || undefined });
      setSent(true); setSubject(''); setDetails(''); setUrl('');
    } catch (err) {
      setError((err as Error).message || 'Could not send. Please try again.');
    } finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:py-14">
      <h1 className="font-serif text-3xl font-bold text-brand-navy">Contact & complaints</h1>
      <p className="mt-2 text-sm text-slate-600">
        Use this form for complaints, privacy questions, copyright notices and appeals. Read how we handle them in the{' '}
        <Link to="/grievance-policy" className="text-teal-700 underline">Grievance & Complaint Policy</Link>.
        {' '}Grievance Officer: {op(OPERATOR.grievanceOfficerName)} ({op(OPERATOR.grievanceOfficerEmail)}).
      </p>
      {currentUser && <p className="mt-2 text-sm text-slate-600">Signed-in members can also make privacy requests from <Link to="/profile#privacy" className="text-teal-700 underline">Edit Profile → Privacy & your data</Link>.</p>}

      {sent && (
        <div role="status" className="mt-6 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> Thank you — your message was received. We will reply to {email || 'your email'}{currentUser ? ' and update you in your notifications' : ''}.
        </div>
      )}

      <form onSubmit={submit} noValidate className="mt-6 space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-card sm:p-6">
        <label className="block"><span className="mb-1.5 block text-sm font-semibold text-slate-700">What is it about?</span>
          <select className={input} value={category} onChange={(e) => setCategory(e.target.value as GrievanceCategory)}>
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block"><span className="mb-1.5 block text-sm font-semibold text-slate-700">Your name</span><input className={input} value={name} maxLength={120} onChange={(e) => setName(e.target.value)} /></label>
          <label className="block"><span className="mb-1.5 block text-sm font-semibold text-slate-700">Your email</span><input type="email" className={input} value={email} maxLength={254} onChange={(e) => setEmail(e.target.value)} /></label>
        </div>
        <label className="block"><span className="mb-1.5 block text-sm font-semibold text-slate-700">Subject</span><input className={input} value={subject} maxLength={200} onChange={(e) => setSubject(e.target.value)} /></label>
        <label className="block"><span className="mb-1.5 block text-sm font-semibold text-slate-700">Details</span>
          <textarea className={`${input} min-h-[9rem]`} value={details} maxLength={5000} onChange={(e) => setDetails(e.target.value)}
            placeholder={category === 'copyright' ? 'Identify your work, the content you believe infringes it, and confirm the information is accurate.' : 'Tell us what happened. Please do not include patient details.'} />
        </label>
        <label className="block"><span className="mb-1.5 block text-sm font-semibold text-slate-700">Link to the page <span className="font-normal text-slate-400">(optional)</span></span><input className={input} value={url} maxLength={2048} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.homeoindia.org/…" /></label>
        {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">{error}</p>}
        <p className="text-xs text-slate-500">We use these details only to handle your message, as described in the <Link to="/privacy" className="underline">Privacy Policy</Link>.</p>
        <div className="flex justify-end">
          <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send
          </button>
        </div>
      </form>

      {mine.length > 0 && (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-bold text-brand-navy">Your messages</h2>
          <ul className="mt-3 divide-y divide-slate-100 text-sm">
            {mine.map((g) => (
              <li key={g.id} className="py-3">
                <div className="flex flex-wrap items-center gap-2"><span className="font-semibold text-brand-navy">{g.subject}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold capitalize text-slate-600">{g.status.replace('_', ' ')}</span></div>
                <p className="text-xs text-slate-400">{new Date(g.created_at).toLocaleString('en-IN')}</p>
                {g.resolution && <p className="mt-1 text-slate-600">{g.resolution}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
