import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dataService, isSupabaseConfigured } from '../../lib/supabase';
import { PractitionerApplication, AdminOverviewStats, MetricItem, AuditLog } from '../../types';
import { Avatar } from '../../components/common/Avatar';
import { 
  Users, 
  FileCheck2, 
  MessageSquare, 
  Calendar, 
  ArrowRight, 
  Clock, 
  CheckCircle2, 
  ShieldCheck,
  ChevronRight,
  GraduationCap,
  FlaskConical,
  XCircle,
  Flag,
  Tag,
  Bell,
  RefreshCw,
  Database,
  Lock
} from 'lucide-react';

interface MetricCardProps {
  title: string;
  metric: MetricItem | undefined;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: 'teal' | 'amber' | 'emerald' | 'rose' | 'sky' | 'indigo' | 'purple' | 'slate';
  linkTo?: string;
}

const COLOR_MAP = {
  teal: {
    bg: 'bg-teal-50',
    text: 'text-teal-700',
    border: 'hover:border-teal-300',
    badge: 'bg-teal-100 text-teal-800'
  },
  amber: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'hover:border-amber-300',
    badge: 'bg-amber-100 text-amber-800'
  },
  emerald: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'hover:border-emerald-300',
    badge: 'bg-emerald-100 text-emerald-800'
  },
  rose: {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'hover:border-rose-300',
    badge: 'bg-rose-100 text-rose-800'
  },
  sky: {
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    border: 'hover:border-sky-300',
    badge: 'bg-sky-100 text-sky-800'
  },
  indigo: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'hover:border-indigo-300',
    badge: 'bg-indigo-100 text-indigo-800'
  },
  purple: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'hover:border-purple-300',
    badge: 'bg-purple-100 text-purple-800'
  },
  slate: {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'hover:border-slate-300',
    badge: 'bg-slate-200 text-slate-800'
  }
};

const MetricCard: React.FC<MetricCardProps> = ({ title, metric, icon: Icon, accentColor, linkTo }) => {
  const styling = COLOR_MAP[accentColor];

  const content = (
    <div className={`bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs transition-all duration-200 ${styling.border} flex items-center justify-between group`}>
      <div className="min-w-0 pr-3">
        <div className="flex items-baseline gap-2">
          {metric?.isAvailable ? (
            <span className="text-2xl sm:text-3xl font-bold font-serif text-brand-navy tracking-tight">
              {metric.value?.toLocaleString() ?? 0}
            </span>
          ) : (
            <div className="flex items-center gap-1.5 py-1">
              <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200" title={metric?.error || 'Query permission restricted'}>
                Unavailable
              </span>
            </div>
          )}
        </div>
        <div className="text-xs font-medium text-slate-500 mt-1 truncate">
          {title}
        </div>
      </div>
      <div className={`w-11 h-11 rounded-xl ${styling.bg} ${styling.text} flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  );

  if (linkTo) {
    return <Link to={linkTo} className="block">{content}</Link>;
  }

  return content;
};

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminOverviewStats | null>(null);
  const [recentApplications, setRecentApplications] = useState<PractitionerApplication[]>([]);
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [comprehensiveStats, apps, logs] = await Promise.all([
        dataService.getComprehensiveDashboardMetrics(),
        dataService.getApplications().catch(() => []),
        dataService.getAuditLogs().catch(() => [])
      ]);

      setStats(comprehensiveStats);
      setRecentApplications(apps.slice(0, 5));
      setRecentLogs(logs.slice(0, 5));
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-brand-navy">
              Administration Overview
            </h1>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
              Live Backend
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Homeo Circle India clinical network and verification operations console.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-teal-600' : 'text-slate-500'}`} />
            <span>Refresh Data</span>
          </button>
          <Link
            to="/admin/applications"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-xs transition"
          >
            <span>Review Applications</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Backend Security & Connectivity Indicator */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center flex-shrink-0">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <p className="font-semibold text-slate-800">
              {isSupabaseConfigured ? 'Connected to Supabase PostgreSQL' : 'Demo Mode (Offline Fallback)'}
            </p>
            <p className="text-[11px] text-slate-500">
              {isSupabaseConfigured 
                ? 'Row Level Security active on all 19 schemas. Edge Function review-application enabled.' 
                : 'Configure VITE_SUPABASE_URL to bind to production database.'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 font-medium text-slate-600 text-[11px]">
            <Lock className="w-3 h-3 text-slate-400" />
            Service-Role Kept Server-Side
          </span>
        </div>
      </div>

      {/* Comprehensive 10 Real Metric Cards */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">
          Real Database Metrics
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {/* 1. Total Registered Members */}
          <MetricCard
            title="Total Members"
            metric={stats?.totalMembers}
            icon={Users}
            accentColor="teal"
            linkTo="/admin/members"
          />

          {/* 2. Doctors & Practitioners */}
          <MetricCard
            title="Doctors & Practitioners"
            metric={stats?.doctorsCount}
            icon={ShieldCheck}
            accentColor="emerald"
            linkTo="/admin/members"
          />

          {/* 3. Students */}
          <MetricCard
            title="Enrolled Students"
            metric={stats?.studentsCount}
            icon={GraduationCap}
            accentColor="indigo"
            linkTo="/admin/students"
          />

          {/* 4. Researchers */}
          <MetricCard
            title="Researchers"
            metric={stats?.researchersCount}
            icon={FlaskConical}
            accentColor="purple"
            linkTo="/admin/researchers"
          />

          {/* 5. Pending Applications */}
          <MetricCard
            title="Pending Applications"
            metric={stats?.pendingApplications}
            icon={FileCheck2}
            accentColor="amber"
            linkTo="/admin/applications"
          />

          {/* 6. Verified Practitioners */}
          <MetricCard
            title="Verified Practitioners"
            metric={stats?.verifiedPractitioners}
            icon={CheckCircle2}
            accentColor="emerald"
            linkTo="/admin/applications"
          />

          {/* 7. Rejected Applications */}
          <MetricCard
            title="Rejected Applications"
            metric={stats?.rejectedApplications}
            icon={XCircle}
            accentColor="rose"
            linkTo="/admin/applications"
          />

          {/* 8. Community Posts */}
          <MetricCard
            title="Community Posts"
            metric={stats?.communityPosts}
            icon={MessageSquare}
            accentColor="sky"
            linkTo="/admin/posts"
          />

          {/* 9. Open Reports */}
          <MetricCard
            title="Reports & Flags"
            metric={stats?.openReports}
            icon={Flag}
            accentColor="rose"
            linkTo="/admin/reports"
          />

          {/* 10. Upcoming Events */}
          <MetricCard
            title="Upcoming Events"
            metric={stats?.upcomingEvents}
            icon={Calendar}
            accentColor="teal"
            linkTo="/admin/events"
          />
        </div>
      </div>

      {/* Quick Admin Actions Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-brand-navy to-slate-900 rounded-2xl p-6 text-white shadow-md">
        <h3 className="text-sm font-bold uppercase tracking-wider text-teal-300 mb-2">
          Administrative Actions
        </h3>
        <p className="text-xs text-slate-300 max-w-2xl mb-4 leading-relaxed">
          Quickly navigate to verified workflow modules for practitioner onboarding, moderation, category management, and community announcements.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            to="/admin/applications"
            className="flex items-center gap-2.5 p-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 transition text-xs font-semibold"
          >
            <FileCheck2 className="w-4 h-4 text-teal-300" />
            <span>Verify Practitioners</span>
          </Link>
          <Link
            to="/admin/reports"
            className="flex items-center gap-2.5 p-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 transition text-xs font-semibold"
          >
            <Flag className="w-4 h-4 text-rose-300" />
            <span>Review Reports</span>
          </Link>
          <Link
            to="/admin/categories"
            className="flex items-center gap-2.5 p-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 transition text-xs font-semibold"
          >
            <Tag className="w-4 h-4 text-amber-300" />
            <span>Manage Categories</span>
          </Link>
          <Link
            to="/admin/notifications"
            className="flex items-center gap-2.5 p-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 transition text-xs font-semibold"
          >
            <Bell className="w-4 h-4 text-sky-300" />
            <span>Send Notification</span>
          </Link>
        </div>
      </div>

      {/* 2-Column Section: Recent Applications & Recent Audit Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Applications (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-serif font-bold text-brand-navy">
                Recent Practitioner Submissions
              </h3>
              <p className="text-xs text-slate-500">
                Latest credential validation requests requiring administrative decision.
              </p>
            </div>
            <Link
              to="/admin/applications"
              className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading applications...</div>
          ) : recentApplications.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No recent applications in queue.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentApplications.map((app) => (
                <div key={app.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={app.full_name} size="sm" verified={app.status === 'verified'} />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-brand-navy truncate">{app.full_name}</p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {app.qualification} • {app.registration_authority || app.state}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      app.status === 'verified'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : app.status === 'rejected' || app.status === 'declined'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {app.status.replace('_', ' ')}
                    </span>
                    <Link
                      to={`/admin/applications`}
                      className="p-1.5 text-slate-400 hover:text-teal-700 hover:bg-slate-50 rounded-lg transition"
                      title="Review details"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Audit Log Stream (1 col) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-serif font-bold text-brand-navy">
                Recent Audit Trail
              </h3>
              <p className="text-xs text-slate-500">Live administrative action ledger.</p>
            </div>
            <Link
              to="/admin/audit-logs"
              className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1"
            >
              <span>Logs</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading audit history...</div>
          ) : recentLogs.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No recent audit records found.
            </div>
          ) : (
            <div className="space-y-3">
              {recentLogs.map((log) => (
                <div key={log.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-brand-navy text-[11px] truncate">
                      {log.actor_name}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(log.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-teal-800 truncate">{log.action}</p>
                  <p className="text-[10px] text-slate-500 truncate mt-0.5">
                    Target: {log.target_type} ({log.target_id.slice(0, 8)}...)
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
