import React from 'react';
import { Link, NavLink, Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { MessageSquare, BookOpen, CalendarDays, LogOut, ArrowLeft, Loader2, PenSquare, ShieldAlert, KeyRound, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { BrandLogo } from '../../components/common/BrandLogo';
import { supabase } from '../../lib/supabase';

const tabs = [
  { to: '/publish/discussions', label: 'Discussions', icon: MessageSquare },
  { to: '/publish/research', label: 'Research', icon: BookOpen },
  { to: '/publish/events', label: 'Events', icon: CalendarDays },
];

/**
 * Publishing panel: a separate, posting-only workspace. It shows no member
 * data, counts, approvals or settings — only forms to post and a list of
 * what this person posted.
 */
export const PublishLayout: React.FC = () => {
  const { currentUser, isAuthenticated, isPublisher, publisherAccess, isAdmin, loading, logout } = useAuth();
  const location = useLocation();
  const [checking, setChecking] = React.useState(true);

  // isPublisher is fetched just after sign-in; give it a moment.
  React.useEffect(() => {
    if (loading) return;
    const t = setTimeout(() => setChecking(false), isPublisher || isAdmin || publisherAccess !== 'none' ? 0 : 3500);
    return () => clearTimeout(t);
  }, [loading, isPublisher, isAdmin, publisherAccess]);

  if (loading || (checking && !isPublisher && !isAdmin && publisherAccess === 'none' && isAuthenticated)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-paper">
        <Loader2 className="h-7 w-7 animate-spin text-teal-600" />
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  if (!isAdmin && publisherAccess === 'password_required') return <PasswordGate />;
  if (!isPublisher && !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-paper p-4">
        <div className="w-full max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-card">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-100 bg-amber-50 text-amber-600">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-bold text-brand-navy">Publishing access needed</h1>
          <p className="text-sm text-slate-600">
            This panel is for Homeo India publishers. Ask an administrator to add your account
            ({currentUser?.email}) as a publisher.
          </p>
          <Link to="/community" className="inline-flex items-center gap-2 rounded-xl bg-brand-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">
            Go to the community
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-paper">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-4">
          <Link to="/publish" className="flex items-center gap-2.5">
            <BrandLogo size="sm" />
            <span className="hidden rounded-full bg-teal-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-teal-700 ring-1 ring-teal-100 sm:inline">
              Publishing
            </span>
          </Link>
          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <Link to="/community" className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-brand-navy">
              <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Community</span>
            </Link>
            <span className="hidden max-w-[12rem] truncate text-sm text-slate-500 md:inline">{currentUser?.display_name || currentUser?.full_name}</span>
            <button onClick={logout} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50">
              <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
        <nav className="mx-auto grid max-w-5xl grid-cols-4 gap-1 px-2 pb-2 sm:flex sm:px-4" aria-label="Publishing sections">
          <NavLink to="/publish" end
            className={({ isActive }) => `inline-flex flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-[11px] font-semibold transition sm:flex-row sm:gap-2 sm:px-3.5 sm:py-2 sm:text-sm ${isActive ? 'bg-brand-navy text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
            <PenSquare className="h-4 w-4" /> New post
          </NavLink>
          {tabs.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) => `inline-flex flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-[11px] font-semibold transition sm:flex-row sm:gap-2 sm:px-3.5 sm:py-2 sm:text-sm ${isActive ? 'bg-brand-navy text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
              <Icon className="h-4 w-4" /> {label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
};

export const PublishHome: React.FC = () => {
  const { currentUser } = useAuth();
  const first = (currentUser?.display_name || currentUser?.full_name || '').split(' ')[0];
  const cards = [
    { to: '/publish/discussions', title: 'Post a discussion', text: 'A case, question or update for the community feed. Add up to 4 photos.', icon: MessageSquare, tone: 'bg-teal-50 text-teal-700 ring-teal-100' },
    { to: '/publish/research', title: 'Post research', text: 'A paper or study with a summary, photos and the PDF.', icon: BookOpen, tone: 'bg-sky-50 text-sky-700 ring-sky-100' },
    { to: '/publish/events', title: 'Post an event', text: 'A webinar, CME, workshop or conference with date, time and link.', icon: CalendarDays, tone: 'bg-violet-50 text-violet-700 ring-violet-100' },
  ];
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-brand-navy">{first ? `Hi ${first},` : 'Hi,'} what would you like to post?</h1>
        <p className="mt-1 text-sm text-slate-500">Everything you post goes live on Homeo India straight away.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map(({ to, title, text, icon: Icon, tone }) => (
          <Link key={to} to={to}
            className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-card transition hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-card-hover">
            <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ring-1 ${tone}`}>
              <Icon className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-bold text-brand-navy group-hover:text-teal-700">{title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-500">{text}</p>
          </Link>
        ))}
      </div>
    </div>
  );
};

/**
 * Shown when a publisher signs in some other way (e.g. Google). Publishing
 * needs the account's email + password, so they can create a password here,
 * then sign in again with it.
 */
const PasswordGate: React.FC = () => {
  const { currentUser, logout, updatePassword } = useAuth();
  const navigate = useNavigate();
  const [pw, setPw] = React.useState('');
  const [pw2, setPw2] = React.useState('');
  const [show, setShow] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const goToSignIn = async (message?: string) => {
    const email = currentUser?.email;
    // Fully end this (Google) session before asking for the password.
    try { await supabase?.auth.signOut(); } catch { /* signed out locally below */ }
    logout();
    navigate('/login', { replace: true, state: { from: { pathname: '/publish' }, email, notice: message } });
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (pw.length < 8) return setError('Use at least 8 characters.');
    if (pw !== pw2) return setError('The two passwords do not match.');
    setBusy(true);
    const res = await updatePassword(pw);
    setBusy(false);
    if (!res.success) return setError(res.error || 'Could not save the password.');
    await goToSignIn('Password saved. Sign in with your email and new password to open the Publishing panel.');
  };

  const input = 'w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20';
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-paper p-4">
      <div className="w-full max-w-md space-y-5 rounded-2xl border border-slate-200 bg-white p-7 shadow-card">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-teal-100 bg-teal-50 text-teal-700">
          <KeyRound className="h-7 w-7" />
        </div>
        <div className="text-center">
          <h1 className="text-xl font-bold text-brand-navy">Sign in with your password</h1>
          <p className="mt-1.5 text-sm text-slate-600">
            The Publishing panel only opens when you sign in with your email and password.
            You signed in another way (for example with Google).
          </p>
        </div>
        <form onSubmit={save} noValidate className="space-y-3 rounded-xl bg-slate-50 p-4">
          <p className="text-sm font-semibold text-brand-navy">Create or change your password</p>
          <p className="text-xs text-slate-500">For {currentUser?.email}</p>
          <div className="relative">
            <input type={show ? 'text' : 'password'} className={input} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="New password (8+ characters)" autoComplete="new-password" />
            <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600" aria-label={show ? 'Hide password' : 'Show password'}>
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <input type={show ? 'text' : 'password'} className={input} value={pw2} onChange={(e) => setPw2(e.target.value)} placeholder="Type it again" autoComplete="new-password" />
          {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
          <button type="submit" disabled={busy} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-700 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Save password and sign in again
          </button>
        </form>
        <button type="button" onClick={() => { void goToSignIn(); }} className="w-full rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-brand-navy hover:bg-slate-50">
          I already have a password — sign in with it
        </button>
        <Link to="/community" className="block text-center text-sm text-slate-500 hover:text-brand-navy">Back to the community</Link>
      </div>
    </div>
  );
};
