import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dataService } from '../../lib/supabase';
import { Post, Event, Opportunity } from '../../types';
import { Avatar } from '../../components/common/Avatar';
import { 
  ShieldCheck, 
  MessageSquare, 
  Calendar, 
  Briefcase, 
  Users, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Sparkles,
  ExternalLink
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [recentOpportunities, setRecentOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      dataService.getPosts(),
      dataService.getEvents(),
      dataService.getOpportunities()
    ]).then(([posts, events, opps]) => {
      setRecentPosts(posts.slice(0, 3));
      setUpcomingEvents(events.slice(0, 2));
      setRecentOpportunities(opps.slice(0, 2));
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#0F1E36] to-[#162A45] rounded-3xl p-6 sm:p-8 text-white shadow-card relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-950/80 border border-teal-700/60 text-teal-300 text-[11px] font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
            <span>Verified Homoeopathic Practitioner</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight">
            Welcome back, {currentUser?.display_name || 'Doctor'}
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Connect with verified peers across India, contribute to clinical case discussions, and discover continuing medical education webinars.
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
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
              <span>Browse Peer Directory</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Onboarding / Verification Checklist */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-600" />
            <h3 className="text-xs font-bold text-brand-navy uppercase tracking-wider">
              Practitioner Onboarding Guide
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
            2 of 3 Completed
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 bg-teal-50/50 rounded-xl border border-teal-100 flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0" />
            <span className="text-xs text-slate-700 font-medium">Statutory Council Verified</span>
          </div>
          <div className="p-3 bg-teal-50/50 rounded-xl border border-teal-100 flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0" />
            <span className="text-xs text-slate-700 font-medium">Review Community & DISHA Rules</span>
          </div>
          <Link
            to="/profile"
            className="p-3 bg-white hover:bg-slate-50 rounded-xl border border-dashed border-teal-400 flex items-center justify-between text-xs font-semibold text-teal-800 transition"
          >
            <span>Complete Bio & Specialty</span>
            <span>&rarr;</span>
          </Link>
        </div>
      </div>

      {/* 2 Column Layout: Recent Discussions + Upcoming Events/Opportunities */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Recent Discussions (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-teal-700" />
              <h2 className="text-base font-bold text-brand-navy">Recent Clinical Discussions</h2>
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
                    <span className="text-[11px] text-slate-400">• {post.author_qualification}</span>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${post.category_badge_color}`}>
                    {post.category_name}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-800 group-hover:text-teal-800 transition">
                  {post.title}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {post.body}
                </p>

                <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
                  <span>{post.likes_count} likes</span>
                  <span>{post.comments_count} replies</span>
                  <span>{post.created_at}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Right Column: Events & Opportunities (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Upcoming Events */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-teal-700" />
                <h2 className="text-base font-bold text-brand-navy">Upcoming Events</h2>
              </div>
              <Link to="/events" className="text-xs font-semibold text-teal-700 hover:text-teal-800">
                View all &rarr;
              </Link>
            </div>

            <div className="space-y-2.5">
              {upcomingEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-xs flex items-center gap-3.5"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#0F1E36] text-white flex flex-col items-center justify-center flex-shrink-0 text-center">
                    <span className="text-sm font-bold leading-none">{evt.date_badge_day}</span>
                    <span className="text-[9px] uppercase tracking-wider font-semibold text-teal-300">{evt.date_badge_month}</span>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wide block">
                      {evt.format}
                    </span>
                    <h4 className="text-xs font-bold text-brand-navy truncate">
                      {evt.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 truncate">{evt.time_display}</p>
                  </div>
                  <Link
                    to="/events"
                    className="px-3 py-1.5 rounded-lg bg-teal-50 text-teal-800 hover:bg-teal-100 text-xs font-semibold transition"
                  >
                    Details
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Clinical Opportunities */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-teal-700" />
                <h2 className="text-base font-bold text-brand-navy">Career & Grants</h2>
              </div>
              <Link to="/opportunities" className="text-xs font-semibold text-teal-700 hover:text-teal-800">
                View all &rarr;
              </Link>
            </div>

            <div className="space-y-2.5">
              {recentOpportunities.map((opp) => (
                <div
                  key={opp.id}
                  className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-brand-navy">{opp.title}</span>
                    <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                      {opp.type}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">{opp.organization} • {opp.location}</p>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>{opp.timing}</span>
                    <span>Deadline: {opp.deadline}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
