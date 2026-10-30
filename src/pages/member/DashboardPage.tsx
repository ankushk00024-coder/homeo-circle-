import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dataService } from '../../lib/supabase';
import { Post, Event, ConnectionRequest, EventRegistration } from '../../types';
import { Avatar } from '../../components/common/Avatar';
import { 
  ShieldCheck, 
  ShieldAlert,
  Clock,
  MessageSquare, 
  Calendar, 
  Briefcase, 
  Users, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles,
  GraduationCap,
  Microscope,
  Stethoscope,
  Bookmark,
  UserCheck,
  Check,
  X,
  BookOpen,
  Bell,
  HeartHandshake
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { currentUser, isDoctor, isStudent, isResearcher, isAdmin } = useAuth();
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [pendingRequests, setPendingRequests] = useState<ConnectionRequest[]>([]);
  const [registeredEvents, setRegisteredEvents] = useState<Event[]>([]);
  const [savedPostIds, setSavedPostIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadData = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const [posts, events, conns, regs, saved] = await Promise.all([
        dataService.getPosts(),
        dataService.getEvents(),
        dataService.getConnectionRequests(),
        dataService.getUserEventRegistrations(currentUser.id),
        dataService.getSavedPostIds(currentUser.id)
      ]);

      setRecentPosts(posts.slice(0, 4));
      setUpcomingEvents(events.slice(0, 3));
      setPendingRequests(conns.filter(c => c.recipient_id === currentUser.id && c.status === 'pending'));
      
      const regEventIds = new Set(regs.map((r: EventRegistration) => r.event_id));
      setRegisteredEvents(events.filter(e => regEventIds.has(e.id)));
      setSavedPostIds(saved);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const handleRespondRequest = async (requestId: string, status: 'accepted' | 'declined') => {
    if (!currentUser) return;
    try {
      await dataService.respondConnectionRequest(requestId, status, currentUser);
      setActionSuccess(status === 'accepted' ? 'Connection accepted! They are now in your network.' : 'Connection request declined.');
      setTimeout(() => setActionSuccess(null), 4000);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  // Determine Verification Badge and Text
  const verificationStatus = currentUser?.verification_status || (currentUser?.status === 'verified' ? 'verified' : 'pending');
  
  return (
    <div className="space-y-8">
      {actionSuccess && (
        <div className="p-3 bg-teal-50 border border-teal-200 text-teal-800 rounded-xl text-xs flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-teal-600 hover:text-teal-900">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Welcome Banner - Role Customized */}
      <div className="bg-gradient-to-r from-[#0F1E36] via-[#152844] to-[#0D4B57] rounded-3xl p-6 sm:p-8 text-white shadow-card relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {isDoctor && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-950/80 border border-teal-600/60 text-teal-300 text-xs font-semibold">
                <Stethoscope className="w-3.5 h-3.5 text-teal-400" />
                <span>Doctor / Registered Practitioner</span>
              </span>
            )}
            {isStudent && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950/80 border border-blue-600/60 text-blue-300 text-xs font-semibold">
                <GraduationCap className="w-3.5 h-3.5 text-blue-400" />
                <span>Homoeopathic Student Member</span>
              </span>
            )}
            {isResearcher && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950/80 border border-purple-600/60 text-purple-300 text-xs font-semibold">
                <Microscope className="w-3.5 h-3.5 text-purple-400" />
                <span>Researcher & Academic Educator</span>
              </span>
            )}
            {isAdmin && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-600/60 text-amber-300 text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Super Administrator</span>
              </span>
            )}

            {/* Verification Status Pill */}
            {verificationStatus === 'verified' ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-900/60 border border-emerald-500/50 text-emerald-300 text-[11px] font-bold">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>Verified</span>
              </span>
            ) : verificationStatus === 'pending' ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-900/60 border border-amber-500/50 text-amber-300 text-[11px] font-bold">
                <Clock className="w-3 h-3 text-amber-400" />
                <span>Verification Pending</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-900/60 border border-rose-500/50 text-rose-300 text-[11px] font-bold">
                <ShieldAlert className="w-3 h-3 text-rose-400" />
                <span>Needs Correction</span>
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight">
            Welcome back, {currentUser?.display_name || 'Colleague'}
          </h1>


          <div className="pt-2 flex flex-wrap gap-3">
            {isStudent ? (
              <>
                <Link
                  to="/students"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs shadow transition"
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Open Student Corner</span>
                </Link>
                <Link
                  to="/members"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs border border-white/20 transition"
                >
                  <HeartHandshake className="w-3.5 h-3.5" />
                  <span>Discover Mentors</span>
                </Link>
              </>
            ) : isResearcher ? (
              <>
                <Link
                  to="/knowledge"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs shadow transition"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Research Library</span>
                </Link>
                <Link
                  to="/community"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs border border-white/20 transition"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Research Discussions</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/community"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs shadow transition"
                >
                  <span>Explore Discussions</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  to="/members"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs border border-white/20 transition"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Doctors</span>
                </Link>
              </>
            )}
            {isAdmin && (
              <Link
                to="/admin"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shadow transition"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin Console</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Pending Connection Requests (If Any) */}
      {pendingRequests.length > 0 && (
        <div className="bg-teal-50/70 border border-teal-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-teal-800" />
              <h3 className="text-xs font-bold text-teal-950 uppercase tracking-wider">
                Pending Connection Requests ({pendingRequests.length})
              </h3>
            </div>
            <Link to="/members" className="text-xs font-semibold text-teal-800 hover:underline">
              Manage in My Network &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingRequests.map((req) => (
              <div key={req.id} className="bg-white p-3.5 rounded-xl border border-teal-100 shadow-xs flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <Avatar name={req.sender_name} src={req.sender_avatar} size="sm" />
                  <div className="min-w-0">
                    <Link to={`/members/${req.sender_id}`} className="text-xs font-bold text-slate-900 hover:text-teal-700 truncate block">{req.sender_name}</Link>
                    <p className="text-xs text-slate-500 truncate">
                      {[req.sender_role === 'student' ? 'Student' : req.sender_role === 'researcher' ? 'Researcher' : req.sender_role === 'doctor' ? 'Doctor' : null, req.sender_qualification, req.sender_location]
                        .filter((x) => x && x !== 'Not specified')
                        .join(' • ')}
                    </p>
                    <span className="text-[11px] text-slate-400">
                      {new Date(req.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    {req.message && (
                      <p className="mt-1.5 text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 whitespace-pre-line break-words">
                        “{req.message}”
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => handleRespondRequest(req.id, 'accepted')}
                    className="p-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-medium transition"
                    title="Accept connection"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleRespondRequest(req.id, 'declined')}
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-medium transition"
                    title="Decline request"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Recent Community Posts (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-teal-700" />
              <h2 className="text-base font-bold text-brand-navy">
                {isStudent ? 'Curated Student & Clinical Discussions' : 'Recent Community Discussions'}
              </h2>
            </div>
            <Link to="/community" className="text-xs font-semibold text-teal-700 hover:text-teal-800">
              View all &rarr;
            </Link>
          </div>

          <div className="space-y-3">
            {recentPosts.map((post) => (
              <Link
                key={post.id}
                to={`/community/${post.id}`}
                className="block bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:shadow-card hover:border-teal-300 transition space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar
                      name={post.author_name}
                      src={post.author_avatar}
                      size="xs"
                    />
                    <span className="text-xs font-semibold text-brand-navy">{post.author_name}</span>
                    <span className="text-xs text-slate-400">• {post.author_qualification}</span>
                  </div>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${post.category_badge_color}`}>
                    {post.category_name}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-800 group-hover:text-teal-800 transition">
                  {post.title}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {post.body}
                </p>

                <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                  <span>{post.likes_count} likes</span>
                  <span>{post.comments_count} replies</span>
                  <span>{post.created_at}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Right Column: Events (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Registered / Upcoming Events */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-teal-700" />
                <h2 className="text-base font-bold text-brand-navy">
                  {registeredEvents.length > 0 ? 'My Events & Upcoming' : 'Upcoming Webinars & Events'}
                </h2>
              </div>
              <Link to="/events" className="text-xs font-semibold text-teal-700 hover:text-teal-800">
                View all &rarr;
              </Link>
            </div>

            <div className="space-y-2.5">
              {upcomingEvents.map((evt) => {
                const isRegistered = registeredEvents.some(r => r.id === evt.id);
                return (
                  <div
                    key={evt.id}
                    className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-xs flex items-center gap-3.5"
                  >
                    <div className="w-12 h-12 rounded-xl bg-[#0F1E36] text-white flex flex-col items-center justify-center flex-shrink-0 text-center">
                      <span className="text-sm font-bold leading-none">{evt.date_badge_day}</span>
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-teal-300">{evt.date_badge_month}</span>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wide">
                          {evt.format}
                        </span>
                        {isRegistered && (
                          <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                            Registered
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-brand-navy truncate">
                        {evt.title}
                      </h4>
                      <p className="text-xs text-slate-500 truncate">{evt.time_display}</p>
                    </div>
                    <Link
                      to="/events"
                      className="px-3 py-1.5 rounded-lg bg-teal-50 text-teal-800 hover:bg-teal-100 text-xs font-semibold transition"
                    >
                      View
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>


        </div>

      </div>
    </div>
  );
};
