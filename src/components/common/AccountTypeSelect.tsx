import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Stethoscope, GraduationCap, Microscope, Loader2, Check, ArrowRight, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../feedback/ToastProvider';
import { dataService } from '../../lib/supabase';
import { AccountType, PractitionerApplication } from '../../types';

export const ACCOUNT_TYPE_OPTIONS: { value: AccountType; label: string; hint: string; icon: React.ElementType }[] = [
  { value: 'doctor', label: 'Doctor / Practitioner', hint: 'BHMS, MD (Hom), DHMS — registered clinicians', icon: Stethoscope },
  { value: 'student', label: 'Student / Intern', hint: 'BHMS students and clinical interns', icon: GraduationCap },
  { value: 'researcher', label: 'Researcher / Educator', hint: 'Faculty, investigators and scholars', icon: Microscope },
];

const ADMIN_ROLES = ['admin', 'super_admin', 'moderator'];
const OPEN_STATUSES = ['pending_review', 'submitted', 'needs_information', 'pending'];

/** Current account type of a profile (null = not chosen yet). */
export const accountTypeOf = (role?: string | null, accountType?: string | null): AccountType | null => {
  if (accountType === 'doctor' || accountType === 'student' || accountType === 'researcher') return accountType;
  if (role === 'doctor' || role === 'student' || role === 'researcher') return role;
  return null;
};

export const labelOf = (type?: string | null) => ACCOUNT_TYPE_OPTIONS.find((o) => o.value === type)?.label || 'Member';

/**
 * The signed-in member's latest verification application while it is still
 * open (awaiting review or more information); null otherwise.
 */
export const useOpenApplication = () => {
  const { currentUser } = useAuth();
  const [app, setApp] = useState<PractitionerApplication | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!currentUser?.id) { setLoading(false); return; }
    dataService
      .getMyApplication(currentUser.id)
      .then((a) => { if (active) setApp(a && OPEN_STATUSES.includes(a.status) ? a : null); })
      .catch(() => { if (active) setApp(null); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [currentUser?.id]);

  return { app, loading };
};

/** Shown instead of the picker while an application is being reviewed. */
export const ApplicationUnderReview: React.FC<{ app: PractitionerApplication }> = ({ app }) => (
  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
    <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-50 text-amber-800 ring-1 ring-amber-200 text-sm font-semibold">
      <Clock className="w-4 h-4" />
      {app.status === 'needs_information' ? 'More information needed' : `${labelOf(app.role_applied)} application under review`}
    </span>
    <Link
      to="/application-status"
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-teal hover:underline"
    >
      View status <ArrowRight className="w-4 h-4" />
    </Link>
  </div>
);

interface AccountTypeSelectProps {
  /** compact = single row for banners; full = labelled block for settings. */
  variant?: 'compact' | 'full';
}

/**
 * Lets a member choose Doctor / Student / Researcher. Members continue to the
 * verification form for that type; the type is set on their profile once an
 * admin verifies the application. Admin accounts set the label directly.
 */
export const AccountTypeSelect: React.FC<AccountTypeSelectProps> = ({ variant = 'full' }) => {
  const { currentUser, updateCurrentUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { app: openApp, loading: appLoading } = useOpenApplication();
  const current = accountTypeOf(currentUser?.role, currentUser?.account_type);
  const [value, setValue] = useState<AccountType | ''>(current ?? '');
  const [saving, setSaving] = useState(false);

  if (!currentUser) return null;
  const isStaff = ADMIN_ROLES.includes(currentUser.role);

  if (!isStaff && openApp) return <ApplicationUnderReview app={openApp} />;

  const changed = value !== '' && value !== current;

  const proceed = async () => {
    if (!changed || !value) return;
    if (!isStaff) {
      navigate(`/apply?role=${value}`);
      return;
    }
    // Staff keep their admin role; only the account type label changes.
    setSaving(true);
    try {
      await updateCurrentUser({ account_type: value });
      toast.success(`Account type set to ${labelOf(value)}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update your account type.');
    } finally {
      setSaving(false);
    }
  };

  const selectEl = (
    <select
      id={`account-type-${variant}`}
      value={value}
      onChange={(e) => setValue(e.target.value as AccountType)}
      disabled={appLoading}
      className="w-full sm:w-auto min-w-[230px] px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-white text-brand-navy focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none transition"
    >
      {current === null && <option value="" disabled>Select your account type…</option>}
      {ACCOUNT_TYPE_OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );

  const button = (
    <button
      type="button"
      onClick={proceed}
      disabled={!changed || saving}
      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand-teal text-white text-sm font-semibold shadow-sm transition hover:bg-brand-teal-hover active:scale-[.98] disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : isStaff ? <Check className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
      {saving ? 'Saving…' : isStaff ? 'Save' : 'Continue'}
    </button>
  );

  if (variant === 'compact') {
    return (
      <div className="flex flex-col sm:flex-row gap-2">
        <label htmlFor="account-type-compact" className="sr-only">Account type</label>
        {selectEl}
        {button}
      </div>
    );
  }

  const selected = ACCOUNT_TYPE_OPTIONS.find((o) => o.value === value);
  return (
    <div className="space-y-3">
      <label htmlFor="account-type-full" className="block text-sm font-semibold text-brand-navy">
        Account type
      </label>
      <div className="flex flex-col sm:flex-row gap-2">
        {selectEl}
        {button}
      </div>
      {selected && (
        <p className="flex items-center gap-2 text-xs text-slate-500">
          <selected.icon className="w-4 h-4 text-brand-teal" /> {selected.hint}
        </p>
      )}
      {changed && !isStaff && (
        <p className="text-xs text-teal-800 bg-teal-50 ring-1 ring-teal-200 rounded-lg px-3 py-2">
          Next you'll fill a short form for verification. Your profile shows as {selected?.label} once an admin approves it.
        </p>
      )}
    </div>
  );
};
