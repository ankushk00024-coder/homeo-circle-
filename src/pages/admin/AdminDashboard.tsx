import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dataService } from '../../lib/supabase';
import { PractitionerApplication } from '../../types';
import { Avatar } from '../../components/common/Avatar';
import { 
  Users, 
  FileCheck2, 
  MessageSquare, 
  Calendar, 
  ArrowRight, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalMembers: 248,
    pendingApplications: 12,
    totalDiscussions: 36,
    upcomingEvents: 15,
    openReports: 1
  });
  const [recentApplications, setRecentApplications] = useState<PractitionerApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      dataService.getDashboardStats(),
      dataService.getApplications()
    ]).then(([statsData, apps]) => {
      setStats(statsData);
      setRecentApplications(apps.slice(0, 5));
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-8">
      {/* Header matching Reference Bottom Right */}
      <div>
        <h1 className="text-2xl font-serif font-bold text-brand-navy">
          Dashboard
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Overview of your community
        </p>
      </div>

      {/* 4 Metric Cards matching Reference Image Bottom Right */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Members */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-2xl sm:text-3xl font-bold font-serif text-brand-navy">
              {stats.totalMembers}
            </div>
            <div className="text-xs font-medium text-slate-500 mt-1">
              Total Members
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center flex-shrink-0">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Pending Applications */}
        <Link 
          to="/admin/applications"
          className="bg-white rounded-2xl p-5 border border-amber-200 shadow-xs hover:border-amber-300 transition flex items-center justify-between group"
        >
          <div>
            <div className="text-2xl sm:text-3xl font-bold font-serif text-amber-600">
              {stats.pendingApplications}
            </div>
            <div className="text-xs font-medium text-slate-500 mt-1 group-hover:text-amber-800">
              Pending Applications
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
            <FileCheck2 className="w-5 h-5" />
          </div>
        </Link>

        {/* Discussions */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-2xl sm:text-3xl font-bold font-serif text-brand-navy">
              {stats.totalDiscussions}
            </div>
            <div className="text-xs font-medium text-slate-500 mt-1">
              Discussions (20d)
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center flex-shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-2xl sm:text-3xl font-bold font-serif text-brand-navy">
              {stats.upcomingEvents}
            </div>
            <div className="text-xs font-medium text-slate-500 mt-1">
              Upcoming Events
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center flex-shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Recent Applications Card matching Reference Bottom Right */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-brand-navy">
              Recent Applications
            </h2>
            <p className="text-xs text-slate-500">
              Practitioners queued for statutory state council verification.
            </p>
          </div>
          <Link
            to="/admin/applications"
            className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1"
          >
            <span>View all</span>
            <span>&rarr;</span>
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {recentApplications.map((app) => (
            <div
              key={app.id}
              className="py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50 px-2 rounded-xl transition"
            >
              <div className="flex items-center gap-3">
                <Avatar name={app.full_name} size="sm" />
                <div>
                  <h4 className="text-xs font-bold text-brand-navy">
                    {app.full_name}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {app.qualification} • {app.state} • <span className="font-mono text-slate-400">{app.registration_number}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400 hidden sm:inline">
                  {app.submitted_at}
                </span>

                <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full capitalize ${
                  app.status === 'verified'
                    ? 'bg-teal-50 text-teal-700 border border-teal-200'
                    : app.status === 'declined'
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  {app.status.replace('_', ' ')}
                </span>

                <Link
                  to="/admin/applications"
                  className="px-3 py-1 bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-800 rounded-lg text-xs font-semibold transition"
                >
                  Review
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Admin Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/admin/events"
          className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-card hover:border-teal-300 transition space-y-2 group"
        >
          <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
            <Calendar className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-bold text-brand-navy group-hover:text-teal-800 transition">
            Publish New Webinar or CME
          </h3>
          <p className="text-xs text-slate-500">Add upcoming online study circles or state chapter conferences.</p>
        </Link>

        <Link
          to="/admin/opportunities"
          className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-card hover:border-teal-300 transition space-y-2 group"
        >
          <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center font-bold">
            <Users className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-bold text-brand-navy group-hover:text-teal-800 transition">
            Post Career Opportunity
          </h3>
          <p className="text-xs text-slate-500">List hospital OPD openings, academic fellowships, and research grants.</p>
        </Link>

        <Link
          to="/admin/content"
          className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-card hover:border-teal-300 transition space-y-2 group"
        >
          <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-bold text-brand-navy group-hover:text-teal-800 transition">
            Moderation & Reports Queue
          </h3>
          <p className="text-xs text-slate-500">Inspect flagged case discussions and enforce patient confidentiality.</p>
        </Link>
      </div>

    </div>
  );
};
