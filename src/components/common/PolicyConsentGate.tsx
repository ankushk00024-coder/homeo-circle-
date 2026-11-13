import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { complianceService } from '../../services/complianceService';
import { CURRENT_PRIVACY_VERSION, CURRENT_TERMS_VERSION } from '../../legal/config';

const LEGAL_PATHS = ['/privacy', '/terms', '/community-rules', '/verification-policy', '/copyright', '/clinical-disclaimer', '/grievance-policy', '/cookies', '/legal', '/contact'];

/**
 * Signed-in members must have accepted the current Terms and acknowledged the
 * current Privacy Policy (and confirmed they are 18+). Members who signed up
 * before these versions, or with Google, are asked once; the answer is stored
 * in consent_records with the version and a server timestamp.
 */
export const PolicyConsentGate: React.FC = () => {
  const { currentUser, isAuthenticated, isDemoMode, logout } = useAuth();
  const { pathname } = useLocation();
  const [needs, setNeeds] = useState<{ terms: boolean; privacy: boolean; age: boolean } | null>(null);
  const [age, setAge] = useState(false);
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setNeeds(null);
    if (!isAuthenticated || isDemoMode || !currentUser?.id) return;
    complianceService.myConsents().then((rows) => {
      if (!active) return;
      const latest = (t: string) => rows.find((r) => r.consent_type === t);
      const terms = latest('terms'), privacy = latest('privacy_notice'), adult = latest('age_18_plus');
      const n = {
        terms: !(terms?.granted && terms.policy_version === CURRENT_TERMS_VERSION),
        privacy: !(privacy?.granted && privacy.policy_version === CURRENT_PRIVACY_VERSION),
        age: !adult?.granted,
      };
      setNeeds(n.terms || n.privacy || n.age ? n : null);
    }).catch(() => { /* never lock members out on a network error */ });
    return () => { active = false; };
  }, [isAuthenticated, isDemoMode, currentUser?.id]);

  if (!needs || LEGAL_PATHS.includes(pathname)) return null;

  const accept = async () => {
    setError(null);
    if (needs.age && !age) return setError('Please confirm you are 18 or over.');
    if (!ok) return setError('Please tick the box to accept the updated documents.');
    setBusy(true);
    try {
      const rows: { consent_type: string; policy_version?: string | null; granted: boolean; source: string }[] = [];
      if (needs.terms) rows.push({ consent_type: 'terms', policy_version: CURRENT_TERMS_VERSION, granted: true, source: 'policy_update' });
      if (needs.privacy) rows.push({ consent_type: 'privacy_notice', policy_version: CURRENT_PRIVACY_VERSION, granted: true, source: 'policy_update' });
      if (needs.age) rows.push({ consent_type: 'age_18_plus', policy_version: null, granted: true, source: 'policy_update' });
      await complianceService.recordConsent(rows);
      setNeeds(null);
    } catch (e) {
      setError((e as Error).message || 'Could not save. Please try again.');
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="policy-gate-title">
      <div className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-700"><ShieldCheck className="h-6 w-6" /></div>
        <h2 id="policy-gate-title" className="text-lg font-bold text-brand-navy">We've updated our policies</h2>
        <p className="text-sm text-slate-600">
          Homeo India has new <Link to="/terms" target="_blank" className="text-teal-700 underline">Terms of Use</Link> and a new{' '}
          <Link to="/privacy" target="_blank" className="text-teal-700 underline">Privacy Policy</Link>, with separate rules for each membership category.
          Please review them to continue.
        </p>
        {needs.age && (
          <label className="flex items-start gap-2.5 text-sm text-slate-700">
            <input type="checkbox" checked={age} onChange={(e) => setAge(e.target.checked)} className="mt-0.5 rounded text-teal-600" />
            I am 18 years of age or older.
          </label>
        )}
        <label className="flex items-start gap-2.5 text-sm text-slate-700">
          <input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} className="mt-0.5 rounded text-teal-600" />
          I accept the Terms of Use (v{CURRENT_TERMS_VERSION}) and have read the Privacy Policy (v{CURRENT_PRIVACY_VERSION}).
        </label>
        {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={logout} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">Sign out</button>
          <button type="button" onClick={accept} disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Accept and continue
          </button>
        </div>
      </div>
    </div>
  );
};
