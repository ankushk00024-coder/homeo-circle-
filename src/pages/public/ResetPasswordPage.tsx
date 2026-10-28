import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Key, CheckCircle2, AlertCircle } from 'lucide-react';
import { BrandLogo } from '../../components/common/BrandLogo';
import { useAuth } from '../../context/AuthContext';

// Landing page for the Supabase password-recovery email link. Supabase signs
// the user in with a recovery session when they open the link, so all that
// is left is to set the new password.
export const ResetPasswordPage: React.FC = () => {
  const { updatePassword, isAuthenticated, authLoading } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError('Use at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('The two passwords do not match.');
      return;
    }
    setError(null);
    setSaving(true);
    const result = await updatePassword(password);
    setSaving(false);
    if (!result.success) {
      setError(result.error || 'Could not update your password.');
      return;
    }
    setDone(true);
    setTimeout(() => navigate('/dashboard', { replace: true }), 1500);
  };

  const inputClass =
    'w-full pl-9 pr-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none';

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-6 animate-fade-up">
        <div className="text-center space-y-2">
          <BrandLogo size="lg" className="justify-center mb-2" />
          <h1 className="text-3xl font-serif font-bold text-brand-navy">Set a new password</h1>
          <p className="text-sm text-brand-muted">Choose a password you don't use anywhere else.</p>
        </div>

        <div className="bg-white rounded-2xl p-8 ring-1 ring-brand-border/80 shadow-card space-y-5">
          {!authLoading && !isAuthenticated && !done ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-slate-600">
                This reset link is invalid or has expired. Request a new one from the sign-in page.
              </p>
              <Link to="/login" className="btn-primary justify-center w-full">Back to sign in</Link>
            </div>
          ) : done ? (
            <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl flex items-start gap-2.5 text-teal-800 text-sm animate-scale-in">
              <CheckCircle2 className="w-5 h-5 text-teal-600 flex-shrink-0" />
              <span>Password updated. Taking you to your dashboard…</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-800 text-sm animate-fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
              <label className="block">
                <span className="block text-xs font-semibold text-slate-700 mb-1">New password</span>
                <span className="relative block">
                  <input type="password" required autoComplete="new-password" value={password}
                    onChange={(e) => setPassword(e.target.value)} className={inputClass} />
                  <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                </span>
              </label>
              <label className="block">
                <span className="block text-xs font-semibold text-slate-700 mb-1">Confirm new password</span>
                <span className="relative block">
                  <input type="password" required autoComplete="new-password" value={confirm}
                    onChange={(e) => setConfirm(e.target.value)} className={inputClass} />
                  <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                </span>
              </label>
              <button type="submit" disabled={saving || authLoading} className="btn-primary w-full justify-center disabled:opacity-50">
                {saving ? 'Saving…' : 'Update password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
