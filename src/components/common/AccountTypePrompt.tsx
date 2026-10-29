import React, { useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AccountTypeSelect, accountTypeOf } from './AccountTypeSelect';

/**
 * Shown at the top of member pages until the member picks Doctor / Student /
 * Researcher. Dismissible for the session; the choice also lives in Settings.
 */
export const AccountTypePrompt: React.FC = () => {
  const { currentUser, isAdmin } = useAuth();
  const [hidden, setHidden] = useState(() => {
    try {
      return sessionStorage.getItem('hc_account_type_prompt_hidden') === '1';
    } catch {
      return false;
    }
  });

  if (!currentUser || isAdmin || hidden) return null;
  if (accountTypeOf(currentUser.role, currentUser.account_type) !== null) return null;

  const dismiss = () => {
    setHidden(true);
    try {
      sessionStorage.setItem('hc_account_type_prompt_hidden', '1');
    } catch {
      /* storage unavailable: hide for this render only */
    }
  };

  return (
    <div className="relative mb-6 rounded-2xl bg-gradient-to-r from-teal-50 via-white to-sky-50 ring-1 ring-teal-200/70 p-5 shadow-card animate-fade-up">
      <button
        type="button"
        onClick={dismiss}
        className="absolute top-3 right-3 p-1 rounded-md text-slate-400 hover:text-slate-700 transition"
        aria-label="Hide this message"
      >
        <X className="w-4 h-4" />
      </button>
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="flex items-start gap-3 flex-1">
          <span className="w-10 h-10 rounded-xl bg-brand-teal text-white flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5" />
          </span>
          <div>
            <p className="font-semibold text-brand-navy">Welcome to Homeo Circle! What describes you best?</p>
            <p className="text-sm text-slate-600">
              Choose doctor, student or researcher to personalise your experience. You can change it anytime in Settings.
            </p>
          </div>
        </div>
        <AccountTypeSelect variant="compact" />
      </div>
    </div>
  );
};
