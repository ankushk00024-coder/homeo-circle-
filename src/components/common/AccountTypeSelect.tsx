import React, { useState } from 'react';
import { Stethoscope, GraduationCap, Microscope, Loader2, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../feedback/ToastProvider';
import { AccountType } from '../../types';

const OPTIONS: { value: AccountType; label: string; hint: string; icon: React.ElementType }[] = [
  { value: 'doctor', label: 'Doctor / Practitioner', hint: 'BHMS, MD (Hom), DHMS — registered clinicians', icon: Stethoscope },
  { value: 'student', label: 'Student / Intern', hint: 'BHMS students and clinical interns', icon: GraduationCap },
  { value: 'researcher', label: 'Researcher / Educator', hint: 'Faculty, investigators and scholars', icon: Microscope },
];

const ADMIN_ROLES = ['admin', 'super_admin', 'moderator'];

/** Current account type of a profile (null = not chosen yet). */
export const accountTypeOf = (role?: string | null, accountType?: string | null): AccountType | null => {
  if (accountType === 'doctor' || accountType === 'student' || accountType === 'researcher') return accountType;
  if (role === 'doctor' || role === 'student' || role === 'researcher') return role;
  return null;
};

interface AccountTypeSelectProps {
  /** compact = single row for banners; full = labelled block for settings. */
  variant?: 'compact' | 'full';
  onSaved?: (type: AccountType) => void;
}

/**
 * Lets a signed-in member choose Doctor / Student / Researcher.
 * The database keeps role and account_type in sync, refuses admin roles, and
 * resets the verification badge when the type changes (students are
 * auto-verified; doctors and researchers can apply for verification).
 */
export const AccountTypeSelect: React.FC<AccountTypeSelectProps> = ({ variant = 'full', onSaved }) => {
  const { currentUser, updateCurrentUser } = useAuth();
  const toast = useToast();
  const current = accountTypeOf(currentUser?.role, currentUser?.account_type);
  const [value, setValue] = useState<AccountType | ''>(current ?? '');
  const [saving, setSaving] = useState(false);

  if (!currentUser) return null;
  const isStaff = ADMIN_ROLES.includes(currentUser.role);
  const changed = value !== '' && value !== current;

  const save = async () => {
    if (!changed || !value) return;
    setSaving(true);
    try {
      // Staff keep their admin role; only the account type label changes.
      await updateCurrentUser(isStaff ? { account_type: value } : { account_type: value, role: value });
      toast.success(`Account type set to ${OPTIONS.find((o) => o.value === value)?.label}.`);
      onSaved?.(value);
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
      className="w-full sm:w-auto min-w-[230px] px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-white text-brand-navy focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none transition"
    >
      {current === null && <option value="" disabled>Select your account type…</option>}
      {OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );

  const button = (
    <button
      type="button"
      onClick={save}
      disabled={!changed || saving}
      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand-teal text-white text-sm font-semibold shadow-sm transition hover:bg-brand-teal-hover active:scale-[.98] disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
      {saving ? 'Saving…' : 'Save'}
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

  const selected = OPTIONS.find((o) => o.value === value);
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
      {changed && current !== null && value !== 'student' && (
        <p className="text-xs text-amber-700 bg-amber-50 ring-1 ring-amber-200 rounded-lg px-3 py-2">
          Changing your account type resets your verification badge. You keep full access to the community.
        </p>
      )}
    </div>
  );
};
