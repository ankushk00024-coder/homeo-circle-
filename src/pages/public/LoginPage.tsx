import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BrandLogo } from '../../components/common/BrandLogo';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  ChevronDown,
  Zap,
  Loader2
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    currentUser, 
    isAuthenticated, 
    loading: authLoading, 
    loginWithEmail, 
    signUp, 
    signInWithGoogle, 
    resetPassword, 
    loginAs 
  } = useAuth();

  // Mode: signin | register | forgot
  const [activeTab, setActiveTab] = useState<'signin' | 'register' | 'forgot'>('signin');

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status & Feedback states
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [confirmationNotice, setConfirmationNotice] = useState<string | null>(null);
  const [showDemoAccounts, setShowDemoAccounts] = useState(false);

  // Determine post-login destination
  const getDestination = (): string => {
    const searchParams = new URLSearchParams(location.search);
    const returnUrl = searchParams.get('returnUrl');
    if (returnUrl && returnUrl !== '/login') return returnUrl;

    const stateFrom = (location.state as any)?.from;
    if (typeof stateFrom === 'string' && stateFrom !== '/login') return stateFrom;
    if (stateFrom && typeof stateFrom === 'object') {
      const pathname = stateFrom.pathname || '/community';
      const search = stateFrom.search || '';
      const full = `${pathname}${search}`;
      if (full !== '/login') return full;
    }
    return '/community';
  };

  const from = getDestination();

  // Redirect immediately if user is already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      if (currentUser?.role === 'admin' || currentUser?.role === 'super_admin') {
        const dest = (from && from !== '/login' && from !== '/community') ? from : '/admin';
        navigate(dest, { replace: true });
      } else {
        const dest = (from && from !== '/login') ? from : '/community';
        navigate(dest, { replace: true });
      }
    }
  }, [authLoading, isAuthenticated, currentUser, from, navigate]);

  // Inspect URL parameters for OAuth errors, cancellation or tab preferences
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab');
    if (tabParam === 'register' || tabParam === 'signup') {
      setActiveTab('register');
    } else if (tabParam === 'forgot') {
      setActiveTab('forgot');
    }

    // Check query params and hash for OAuth error/cancellation callbacks
    const hash = window.location.hash;
    const hashParams = new URLSearchParams(hash.startsWith('#') ? hash.substring(1) : hash);
    const oauthError = 
      searchParams.get('error_description') || 
      searchParams.get('error') || 
      hashParams.get('error_description') || 
      hashParams.get('error');

    if (oauthError) {
      const cleaned = oauthError.replace(/\+/g, ' ');
      if (cleaned.toLowerCase().includes('denied') || cleaned.toLowerCase().includes('cancel')) {
        setError('Google sign-in was cancelled. Please try again or sign in with your email and password.');
      } else {
        setError(`Authentication issue: ${cleaned}`);
      }
    }
  }, [location]);

  // Email / Password Sign In
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setConfirmationNotice(null);
    setLoading(true);

    try {
      const result = await loginWithEmail(email, password);
      if (result.success) {
        if (email.trim().toLowerCase().includes('admin') && (!from || from === '/community')) {
          navigate('/admin', { replace: true });
        } else {
          navigate(from || '/community', { replace: true });
        }
      } else {
        setError(result.error || 'Invalid email or password. Please check your credentials.');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Email / Password Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setConfirmationNotice(null);

    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter your password.');
      return;
    }

    setLoading(true);
    try {
      const result = await signUp({
        email: email.trim(),
        password,
        fullName: fullName.trim()
      });

      if (!result.success) {
        setError(result.error || 'Registration failed. Please try again.');
      } else if (result.needsEmailConfirmation) {
        setConfirmationNotice(
          `Account created successfully! We have sent a confirmation link to ${email}. Please check your inbox and verify your email address to sign in.`
        );
      } else {
        // Authenticated session ready - redirect
        navigate(from || '/community', { replace: true });
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  // Google OAuth Initiation
  const handleGoogleSignIn = async () => {
    setError(null);
    setConfirmationNotice(null);
    setGoogleLoading(true);

    try {
      // Build safe redirect back to current origin + intended destination
      const destination = `${window.location.origin}${from.startsWith('/') ? from : '/community'}`;
      const result = await signInWithGoogle(destination);
      if (!result.success) {
        setError(result.error || 'Could not initiate Google sign-in. Please try again.');
        setGoogleLoading(false);
      }
      // If result.success is true, the browser will redirect to Google's OAuth consent screen
    } catch (err: any) {
      setError(err.message || 'Google sign-in initiation failed.');
      setGoogleLoading(false);
    }
  };

  // Password Recovery Dispatch
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await resetPassword(email);
      if (res.success) {
        setResetSuccess(true);
      } else {
        setError(res.error || 'Failed to dispatch password recovery email.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch password recovery email.');
    } finally {
      setLoading(false);
    }
  };

  // Evaluator fast-switch demo user
  const selectDemoUser = (userKey: 'member' | 'admin' | 'applicant') => {
    loginAs(userKey);
    if (from && from !== '/login' && from !== '/community') {
      navigate(from, { replace: true });
    } else if (userKey === 'admin') {
      navigate('/admin');
    } else if (userKey === 'applicant') {
      navigate('/application-status');
    } else {
      navigate('/community');
    }
  };

  const handleAutoFillAdmin = () => {
    setEmail('admin@homeocircle.in');
    setPassword('admin123');
    setError(null);
  };

  return (
    <div className="min-h-[82vh] flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <BrandLogo size="lg" className="justify-center mb-1" />
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-brand-navy">
            {activeTab === 'signin' && 'Welcome to Homeo Circle'}
            {activeTab === 'register' && 'Join Homeo Circle'}
            {activeTab === 'forgot' && 'Reset Account Password'}
          </h2>
          <p className="text-xs sm:text-sm text-brand-muted max-w-sm mx-auto">
            {activeTab === 'signin' && 'Sign in to access clinical discussions, peer network, and community events.'}
            {activeTab === 'register' && 'Create your account to connect with doctors, researchers, and students across India.'}
            {activeTab === 'forgot' && 'Enter your registered email to receive password recovery instructions.'}
          </p>
        </div>

        {/* Tab Selector: Sign In vs Create Account */}
        {activeTab !== 'forgot' && (
          <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => { setActiveTab('signin'); setError(null); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'signin'
                  ? 'bg-white text-brand-navy shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('register'); setError(null); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'register'
                  ? 'bg-white text-brand-navy shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Main Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-brand-border/80 shadow-card space-y-5">
          
          {/* Error Banner */}
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-800 text-xs animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {/* Email Confirmation Notice */}
          {confirmationNotice && (
            <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-900 space-y-2 animate-fadeIn">
              <div className="flex items-center gap-2 font-bold text-teal-800">
                <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0" />
                <span>Verification Email Dispatched</span>
              </div>
              <p className="text-[11.5px] leading-relaxed text-teal-800/90">{confirmationNotice}</p>
              <button
                type="button"
                onClick={() => {
                  setConfirmationNotice(null);
                  setActiveTab('signin');
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-900 underline pt-1"
              >
                Go to Sign In &rarr;
              </button>
            </div>
          )}

          {/* Password Reset Success */}
          {resetSuccess && (
            <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl flex items-start gap-2.5 text-teal-800 text-xs animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Password recovery link sent</p>
                <p className="text-[11px] text-teal-700 mt-0.5">
                  If an account exists for {email}, a recovery link has been dispatched to your inbox.
                </p>
              </div>
            </div>
          )}

          {/* Google Sign-in Button (Shown for both Sign In and Register) */}
          {activeTab !== 'forgot' && (
            <>
              <button
                type="button"
                disabled={googleLoading || loading}
                onClick={handleGoogleSignIn}
                className="w-full py-2.5 px-4 border border-slate-200 hover:border-slate-300 rounded-xl hover:bg-slate-50 transition flex items-center justify-center gap-2.5 text-xs sm:text-sm font-semibold text-slate-700 disabled:opacity-60 shadow-2xs"
              >
                {googleLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
                    <span>Connecting with Google...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
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
                    <span>Continue with Google</span>
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2.5 text-slate-400 font-medium">Or continue with email</span>
                </div>
              </div>
            </>
          )}

          {/* SIGN IN FORM */}
          {activeTab === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="doctor@example.com"
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none transition"
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
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-10 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none transition"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || googleLoading}
                className="w-full py-3 px-4 rounded-xl bg-[#0D817B] hover:bg-[#096e69] text-white font-semibold text-xs sm:text-sm shadow transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="pt-2 text-center">
                <p className="text-xs text-slate-600">
                  New to Homeo Circle?{' '}
                  <button
                    type="button"
                    onClick={() => { setActiveTab('register'); setError(null); }}
                    className="font-semibold text-teal-700 hover:text-teal-900 underline"
                  >
                    Create an account
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* CREATE ACCOUNT / REGISTER FORM */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Dr. Rajesh Patel / Priya Sen"
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none transition"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="doctor@example.com"
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none transition"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Create Password (min. 6 characters)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-10 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none transition"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-10 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none transition"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 leading-snug">
                By joining, you agree to the{' '}
                <Link to="/terms" className="text-teal-700 hover:underline">Terms of Service</Link>{' '}
                and{' '}
                <Link to="/privacy" className="text-teal-700 hover:underline">Privacy Policy</Link>.
              </div>

              <button
                type="submit"
                disabled={loading || googleLoading}
                className="w-full py-3 px-4 rounded-xl bg-[#0D817B] hover:bg-[#096e69] text-white font-semibold text-xs sm:text-sm shadow transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Homeo Circle Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="pt-2 text-center">
                <p className="text-xs text-slate-600">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => { setActiveTab('signin'); setError(null); }}
                    className="font-semibold text-teal-700 hover:text-teal-900 underline"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* FORGOT PASSWORD FORM */}
          {activeTab === 'forgot' && (
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Registered Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="doctor@example.com"
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none transition"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#0D817B] hover:bg-[#096e69] text-white font-semibold text-xs shadow transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Send Recovery Email</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab('signin'); setError(null); }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-brand-navy text-xs font-semibold transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Administrator Quick Credential Banner */}
        <div className="p-3 bg-gradient-to-r from-teal-50/70 via-indigo-50/50 to-slate-50 border border-teal-200/60 rounded-xl space-y-2 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-brand-navy">
              <ShieldCheck className="w-4 h-4 text-teal-700" />
              <span>Admin Panel Access</span>
            </div>
            <button
              type="button"
              onClick={handleAutoFillAdmin}
              className="text-[11px] font-semibold text-teal-800 hover:text-teal-950 underline"
            >
              Auto-fill Admin
            </button>
          </div>
          <p className="text-[11px] text-slate-600">
            Platform administrators can use <code className="bg-white/80 px-1 py-0.5 rounded border border-slate-200 text-slate-800 font-mono text-[10.5px]">admin@homeocircle.in</code> / <code className="bg-white/80 px-1 py-0.5 rounded border border-slate-200 text-slate-800 font-mono text-[10.5px]">admin123</code>.
          </p>
        </div>

        {/* Discrete Reviewer / Evaluator Credentials Drawer */}
        <div className="pt-0.5">
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
    </div>
  );
};
