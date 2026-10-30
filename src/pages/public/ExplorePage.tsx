import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  MessageSquare,
  GraduationCap,
  BookOpen,
  Calendar,
  Briefcase,
  Lock,
  MapPin,
  ArrowRight,
  ArrowUpRight,
  Users,
  Stethoscope,
  Microscope,
} from 'lucide-react';
import { dataService } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../../components/common/Avatar';
import { Reveal } from '../../components/motion/Reveal';
import { AnimatedWords } from '../../components/motion/AnimatedWords';
import { UserProfile } from '../../types';

type RoleFilter = 'all' | 'doctor' | 'student' | 'researcher';

const roleFilters: { id: RoleFilter; label: string; icon: React.ElementType }[] = [
  { id: 'all', label: 'Everyone', icon: Users },
  { id: 'doctor', label: 'Doctors', icon: Stethoscope },
  { id: 'student', label: 'Students', icon: GraduationCap },
  { id: 'researcher', label: 'Researchers', icon: Microscope },
];

const spaces = [
  {
    title: 'Clinical Discussions',
    desc: 'Share case observations, debate rubrics and learn from peers across India.',
    icon: MessageSquare,
    to: '/community',
    accent: 'from-teal-500/15 to-teal-500/0 text-teal-700',
  },
  {
    title: 'Student Corner',
    desc: 'Study notes, repertory aids, internships and mentorship from senior clinicians.',
    icon: GraduationCap,
    to: '/students',
    accent: 'from-emerald-500/15 to-emerald-500/0 text-emerald-700',
  },
  {
    title: 'Research Library',
    desc: 'Trials, reviews and evidence summaries with transparent limitations.',
    icon: BookOpen,
    to: '/knowledge',
    accent: 'from-sky-500/15 to-sky-500/0 text-sky-700',
  },
  {
    title: 'Events & CMEs',
    desc: 'Webinars, state chapter meets and accredited continuing education.',
    icon: Calendar,
    to: '/events',
    accent: 'from-indigo-500/15 to-indigo-500/0 text-indigo-700',
  },
];

const roleLabel = (role: string) => {
  if (role === 'student') return 'Student';
  if (role === 'researcher') return 'Researcher';
  return 'Doctor';
};

const roleBadge = (role: string) => {
  if (role === 'student') return 'bg-emerald-50 text-emerald-800 ring-emerald-200';
  if (role === 'researcher') return 'bg-sky-50 text-sky-800 ring-sky-200';
  return 'bg-teal-50 text-teal-800 ring-teal-200';
};

const placeOf = (m: UserProfile & { location?: string }) =>
  m.location || [m.city, m.state].filter(Boolean).join(', ');

export const ExplorePage: React.FC = () => {
  const { isAuthenticated: isMember } = useAuth();
  const [members, setMembers] = useState<(UserProfile & { location?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [role, setRole] = useState<RoleFilter>('all');

  useEffect(() => {
    let active = true;
    dataService
      .getMembers()
      .then((list) => {
        if (active) setMembers(list);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : 'Could not load members.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const { visible, locked } = useMemo(() => {
    const matchesRole = (m: UserProfile) =>
      role === 'all' || (m.account_type || m.role) === role;
    const term = query.trim().toLowerCase();
    const filtered = members.filter((m) => {
      if (!matchesRole(m)) return false;
      if (!term) return true;
      return [m.display_name, m.full_name, m.specialization, m.qualification, placeOf(m), m.institution]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term));
    });
    // Visitors only see profiles their owners made public; verified members see everyone.
    const canSee = (m: UserProfile) => isMember || m.profile_visibility === 'public';
    return {
      visible: filtered.filter(canSee),
      locked: filtered.filter((m) => !canSee(m) && m.profile_visibility !== 'private'),
    };
  }, [members, query, role, isMember]);

  return (
    <div className="bg-brand-paper overflow-x-clip">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#EAF4FA] via-[#E8F5F7] to-brand-paper">
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[50rem] h-[30rem] rounded-full bg-[#CFF1EC]/70 blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-12 text-center">
          <p className="eyebrow animate-fade-up">Explore the community</p>
          <h1 className="mt-5 font-serif font-bold text-brand-navy tracking-[-0.02em] leading-[1.02] text-[clamp(2.6rem,5.5vw,4.6rem)]">
            <AnimatedWords text="Find your" delay={100} />{' '}
            <span className="italic font-extrabold text-[#0E8A80]">
              <AnimatedWords text="people." delay={260} />
            </span>
          </h1>
          <p className="mt-4 text-lg text-[#3E4C5E] max-w-2xl mx-auto animate-fade-up [animation-delay:400ms]">
            Verified homeopaths, students and researchers from every corner of India. Search by name,
            speciality or city.
          </p>

          {/* Search + role filters */}
          <div className="mt-8 max-w-3xl mx-auto space-y-4 animate-fade-up [animation-delay:550ms]">
            <label className="relative block">
              <span className="sr-only">Search members</span>
              <Search className="w-5 h-5 text-brand-muted absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Try “dermatology”, “Bengaluru” or “BHMS”…"
                className="w-full rounded-2xl bg-white pl-14 pr-5 py-4 text-base text-brand-navy shadow-card ring-1 ring-[#DCE8F1] outline-none transition focus:ring-2 focus:ring-brand-teal/50"
              />
            </label>
            <div className="flex flex-wrap justify-center gap-2" role="tablist" aria-label="Filter by role">
              {roleFilters.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  role="tab"
                  aria-selected={role === f.id}
                  onClick={() => setRole(f.id)}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition duration-200 active:scale-[.97] ${
                    role === f.id
                      ? 'bg-brand-navy text-white shadow-card'
                      : 'bg-white/80 text-brand-navy ring-1 ring-[#DCE8F1] hover:ring-brand-teal/40'
                  }`}
                >
                  <f.icon className="w-4 h-4" />
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── People ─────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20" aria-live="polite">
        {error && (
          <div className="mb-6 rounded-2xl bg-rose-50 ring-1 ring-rose-200 p-4 text-sm text-rose-800">{error}</div>
        )}

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card-lift p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="skeleton w-14 h-14 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <div className="skeleton h-4 w-2/3" />
                    <div className="skeleton h-3 w-1/2" />
                  </div>
                </div>
                <div className="skeleton h-3 w-full" />
              </div>
            ))}
          </div>
        ) : visible.length === 0 && locked.length === 0 ? (
          <div className="text-center py-16 text-brand-muted">
            <Users className="w-10 h-10 mx-auto mb-3 text-brand-teal/60" />
            <p className="text-base">No members match that search yet.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-2xl font-serif font-bold text-brand-navy">Members</h2>
              {isMember && (
                <Link to="/members" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-teal hover:underline">
                  Open full directory <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {visible.map((m, i) => (
                <Reveal key={m.id} delay={(i % 6) * 70}>
                  <Link
                    to={`/members/${m.id}`}
                    className="card-lift group flex h-full flex-col gap-4 p-6"
                  >
                    <div className="flex items-center gap-4">
                      <div className="transition-transform duration-500 group-hover:rotate-[-6deg] group-hover:scale-105">
                        <Avatar src={m.avatar_url} name={m.display_name || m.full_name} size="lg" verified />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-brand-navy truncate">{m.display_name || m.full_name}</p>
                        <p className="text-sm text-brand-muted truncate">
                          {m.role === 'student' ? m.course_year || m.qualification : m.qualification}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ring-1 ${roleBadge(m.account_type || m.role)}`}>
                        {roleLabel(m.account_type || m.role)}
                      </span>
                      {m.specialization && (
                        <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-brand-ice text-brand-navy ring-1 ring-brand-border">
                          {m.specialization}
                        </span>
                      )}
                    </div>
                    {placeOf(m) && (
                      <p className="mt-auto flex items-center gap-1.5 text-sm text-brand-muted">
                        <MapPin className="w-4 h-4 text-brand-teal" /> {placeOf(m)}
                      </p>
                    )}
                  </Link>
                </Reveal>
              ))}

              {locked.map((m, i) => (
                <Reveal key={m.id} delay={((visible.length + i) % 6) * 70}>
                  <Link
                    to="/login"
                    state={{ from: { pathname: '/members' } }}
                    className="group relative flex h-full flex-col justify-between gap-4 overflow-hidden rounded-2xl bg-white/70 p-6 ring-1 ring-brand-border/70 transition duration-300 hover:-translate-y-1 hover:shadow-card"
                  >
                    <div className="flex items-center gap-4 blur-[3px] select-none" aria-hidden="true">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-200 to-sky-200" />
                      <div className="space-y-2">
                        <div className="h-4 w-32 rounded bg-slate-200" />
                        <div className="h-3 w-20 rounded bg-slate-200" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-brand-navy">
                        Verified {roleLabel(m.account_type || m.role).toLowerCase()}
                        {m.state ? ` · ${m.state}` : ''}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-teal">
                        <Lock className="w-3.5 h-3.5" /> Members only
                      </span>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
            {!isMember && locked.length > 0 && (
              <p className="mt-6 text-center text-sm text-brand-muted">
                {locked.length} more {locked.length === 1 ? 'member keeps their' : 'members keep their'} profile visible to verified members only.{' '}
                <Link to="/apply" className="font-semibold text-brand-teal hover:underline">Join the Circle</Link> to connect.
              </p>
            )}
          </>
        )}
      </section>

      {/* ── Spaces ─────────────────────────────────────────────────────── */}
      <section className="bg-white border-y border-brand-border/70 py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center max-w-2xl mx-auto">
            <p className="text-xs font-bold text-brand-teal tracking-[0.18em] uppercase">Inside the circle</p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-serif font-bold text-brand-navy">Spaces built for every stage</h2>
            <p className="mt-3 text-[15px] text-[#3E4C5E]">Members get full access to these spaces once their credentials are verified.</p>
          </Reveal>
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {spaces.map((space, i) => (
              <Reveal key={space.title} delay={i * 90} className={i === 0 ? 'lg:col-span-2' : ''}>
                <Link
                  to={space.to}
                  className="card-lift group relative flex h-full flex-col gap-3 overflow-hidden p-7"
                >
                  <div aria-hidden="true" className={`absolute inset-0 bg-gradient-to-br ${space.accent.split(' ').slice(0, 2).join(' ')} opacity-0 transition-opacity duration-500 group-hover:opacity-100`} />
                  <div className={`relative w-12 h-12 rounded-2xl bg-white ring-1 ring-brand-border flex items-center justify-center transition duration-300 group-hover:-rotate-6 group-hover:scale-110 ${space.accent.split(' ').slice(2).join(' ')}`}>
                    <space.icon className="w-6 h-6" />
                  </div>
                  <h3 className="relative text-xl font-serif font-bold text-brand-navy">{space.title}</h3>
                  <p className="relative text-sm text-[#425972] leading-relaxed">{space.desc}</p>
                  <span className="relative mt-auto inline-flex items-center gap-1.5 pt-2 text-sm font-semibold text-brand-teal">
                    {isMember ? 'Open' : 'Sign in to open'}
                    <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────────── */}
      <section className="py-20">
        <Reveal className="max-w-3xl mx-auto px-4 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-brand-navy">
            Every homeopath <span className="italic text-[#0E8A80]">needs a home.</span>
          </h2>
          <p className="text-lg text-[#3E4C5E]">Apply as a doctor, student or researcher. It takes about five minutes.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/apply"
              className="group inline-flex items-center gap-3 rounded-2xl bg-brand-navy px-8 py-4 text-base font-semibold text-white shadow-elevated transition duration-300 hover:-translate-y-0.5 hover:bg-[#1B3150] active:scale-[.98]"
            >
              Join the Circle <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link to="/login" className="btn-secondary !px-8 !py-4 !text-base">
              Sign in
            </Link>
          </div>
        </Reveal>
      </section>
    </div>
  );
};
