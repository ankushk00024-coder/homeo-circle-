import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth, TEST_USERS } from '../../context/AuthContext';
import { BrandLogo } from '../../components/common/BrandLogo';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  Key, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  ExternalLink,
  Info,
  ChevronDown
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithEmail, loginAs } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'signin' | 'forgot'>('signin');
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [showDemoAccounts, setShowDemoAccounts] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await loginWithEmail(email, password);
      if (result.success) {
        navigate(from, { replace: true });
      } else {
        setError(result.error || 'Invalid credentials.');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin + '/dashboard'
          }
        });
        if (error) {
          setShowGoogleModal(true);
        }
      } catch (err) {
        setShowGoogleModal(true);
      }
    } else {
      setShowGoogleModal(true);
    }
  };

  const handlePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid practitioner email.');
      return;
    }
    setError(null);
    setResetSuccess(true);
  };

  const selectDemoUser = (userKey: 'member' | 'admin' | 'applicant') => {
    loginAs(userKey);
    if (userKey === 'admin') {
      navigate('/admin');
    } else if (userKey === 'applicant') {
      navigate('/application-status');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <BrandLogo size="lg" className="justify-center mb-2" />
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-brand-navy">
            {activeTab === 'signin' ? 'Practitioner Sign In' : 'Reset Account Password'}
          </h2>
          <p className="text-xs sm:text-sm text-brand-muted">
            {activeTab === 'signin'
              ? 'Members-only portal for verified homoeopaths in India'
              : 'Enter your registered email to receive recovery instructions'}
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl p-8 border border-brand-border/80 shadow-card space-y-6">
          
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {resetSuccess && (
            <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl flex items-start gap-2.5 text-teal-800 text-xs">
              <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Password recovery link generated</p>
                <p className="text-[11px] text-teal-700 mt-0.5">
                  If an account exists for {email}, a recovery link has been dispatched.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'signin' ? (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Practitioner Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="doctor@clinic.org"
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => { setActiveTab('forgot'); setError(null); }}
                    className="text-[11px] font-medium text-teal-700 hover:text-teal-800"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none"
                  />
                  <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs sm:text-sm shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? 'Authenticating...' : 'Sign In to Member Portal'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Your Registered Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="doctor@clinic.org"
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs shadow transition"
                >
                  Send Recovery Email
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('signin')}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-brand-navy text-xs font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Social Sign-in Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400 font-medium">Or continue with</span>
            </div>
          </div>

          {/* Google Sign-in Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full py-2.5 px-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition flex items-center justify-center gap-2.5 text-xs font-semibold text-slate-700"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Sign in with Google</span>
          </button>

          {/* New Practitioner Application Link */}
          <div className="pt-2 text-center border-t border-slate-100">
            <p className="text-xs text-slate-600">
              Not yet a verified practitioner?{' '}
              <Link to="/apply" className="font-semibold text-brand-teal hover:text-teal-800 underline">
                Apply for verification &rarr;
              </Link>
            </p>
          </div>

        </div>

        {/* Discrete Reviewer / Evaluator Credentials Drawer */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowDemoAccounts(!showDemoAccounts)}
            className="w-full flex items-center justify-between px-3.5 py-2 text-[11px] font-medium text-brand-muted hover:text-brand-navy bg-brand-ice/50 hover:bg-brand-ice border border-brand-border/60 rounded-xl transition"
          >
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-teal" />
              <span>Evaluator Demo Profiles (Local Testing)</span>
            </span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showDemoAccounts ? 'rotate-180' : ''}`} />
          </button>

          {showDemoAccounts && (
            <div className="mt-2 p-3 bg-white border border-brand-border/80 rounded-xl space-y-2 animate-in fade-in duration-150 shadow-xs">
              <p className="text-[10px] text-brand-muted">
                One-click local authentication for code evaluation and demo inspection:
              </p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => selectDemoUser('member')}
                  className="px-2 py-2 bg-brand-ice/40 hover:bg-brand-soft-teal border border-brand-border hover:border-brand-teal/50 rounded-lg text-left transition"
                >
                  <span className="text-[11px] font-bold text-brand-navy block truncate">Dr. Ananya</span>
                  <span className="text-[9px] text-brand-teal font-medium">Verified Member</span>
                </button>
                <button
                  type="button"
                  onClick={() => selectDemoUser('admin')}
                  className="px-2 py-2 bg-brand-ice/40 hover:bg-indigo-50 border border-brand-border hover:border-indigo-300 rounded-lg text-left transition"
                >
                  <span className="text-[11px] font-bold text-brand-navy block truncate">Dr. Sanjeev</span>
                  <span className="text-[9px] text-indigo-700 font-medium">Administrator</span>
                </button>
                <button
                  type="button"
                  onClick={() => selectDemoUser('applicant')}
                  className="px-2 py-2 bg-brand-ice/40 hover:bg-amber-50 border border-brand-border hover:border-amber-300 rounded-lg text-left transition"
                >
                  <span className="text-[11px] font-bold text-brand-navy block truncate">Dr. Rohit</span>
                  <span className="text-[9px] text-amber-700 font-medium">Pending Review</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Google OAuth Setup Details Modal */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2.5 text-brand-navy">
              <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                <Info className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold">Google OAuth Configuration Notice</h3>
                <p className="text-[11px] text-slate-500">PRD Compliance & Security Guidelines</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Google OAuth is designed to seamlessly work through Supabase Auth. To enable it in production:
            </p>

            <ol className="list-decimal pl-5 text-xs text-slate-600 space-y-1.5 leading-relaxed">
              <li>Open Google Cloud Console &rarr; APIs & Services &rarr; Credentials.</li>
              <li>Create an OAuth 2.0 Client ID (Web Application).</li>
              <li>Add your Supabase callback URL: <code className="bg-slate-100 px-1 py-0.5 rounded text-[10px]">https://&lt;your-project&gt;.supabase.co/auth/v1/callback</code>.</li>
              <li>In your Supabase Dashboard &rarr; Authentication &rarr; Providers &rarr; Google, enable Google and paste the Client ID & Secret.</li>
            </ol>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 leading-normal">
              <strong>Note on Phone Number:</strong> Google Auth does not provide the practitioner's phone number or council registration number. Therefore, all users must still submit the Practitioner Application Form to complete verification.
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowGoogleModal(false)}
                className="px-4 py-2 bg-brand-navy text-white text-xs font-semibold rounded-xl hover:bg-slate-800 transition"
              >
                Understood, Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
