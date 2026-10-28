import React, { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { BrandLogo } from '../common/BrandLogo';
import { Avatar } from '../common/Avatar';
import { useAuth } from '../../context/AuthContext';
import { dataService } from '../../lib/supabase';
import { 
  LayoutDashboard, 
  FileCheck2, 
  Users, 
  MessageSquare, 
  Calendar, 
  Briefcase, 
  BookOpen,
  Flag, 
  History,
  Settings, 
  ArrowLeft, 
  LogOut,
  Menu,
  X
} from 'lucide-react';

export const AdminSidebar: React.FC = () => {
  const { currentUser, logout, role } = useAuth();
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    dataService.getApplications().then(apps => {
      const count = apps.filter(a => a.status === 'pending_review' || a.status === 'submitted').length;
      setPendingCount(count);
    }).catch(() => setPendingCount(0));
  }, []);

  const navItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard, exact: true },
    { label: 'Applications', path: '/admin/applications', icon: FileCheck2, badge: pendingCount },
    { label: 'Members', path: '/admin/members', icon: Users },
    { label: 'Discussions', path: '/admin/content', icon: MessageSquare },
    { label: 'Events', path: '/admin/events', icon: Calendar },
    { label: 'Opportunities', path: '/admin/opportunities', icon: Briefcase },
    { label: 'Knowledge Base', path: '/admin/knowledge', icon: BookOpen },
    { label: 'Reports & Moderation', path: '/admin/reports', icon: Flag },
    { label: 'Audit Logs', path: '/admin/audit-logs', icon: History },
    { label: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  return (
    <>
    {/* Mobile top bar (the sidebar becomes a slide-in drawer below md) */}
    <div className="md:hidden sticky top-0 z-40 flex items-center justify-between px-4 h-14 bg-brand-navy border-b border-slate-800">
      <BrandLogo theme="dark" size="sm" />
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="p-2 rounded-lg text-slate-200 hover:bg-slate-800 transition"
        aria-label="Open admin menu"
        aria-expanded={mobileOpen}
      >
        <Menu className="w-5 h-5" />
      </button>
    </div>

    {mobileOpen && (
      <div
        className="md:hidden fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-xs animate-fade-in"
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />
    )}

    <aside
      className={`fixed inset-y-0 left-0 z-50 w-72 md:w-64 md:sticky md:top-0 md:h-screen overflow-y-auto bg-brand-navy text-slate-200 flex flex-col border-r border-slate-800 flex-shrink-0 transition-transform duration-300 ease-out md:translate-x-0 ${
        mobileOpen ? 'translate-x-0 shadow-elevated' : '-translate-x-full'
      }`}
    >
      <button
        type="button"
        onClick={() => setMobileOpen(false)}
        className="md:hidden absolute top-4 right-4 p-2 rounded-lg text-slate-300 hover:bg-slate-800 transition"
        aria-label="Close admin menu"
      >
        <X className="w-5 h-5" />
      </button>
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800/80">
        <BrandLogo theme="dark" size="md" />
      </div>

      {/* Admin Profile Card */}
      <div className="p-3.5 mx-4 mt-4 bg-slate-800/50 rounded-xl border border-slate-700/60 flex items-center gap-3">
        <Avatar
          name={currentUser?.full_name || 'Admin'}
          src={currentUser?.avatar_url}
          size="md"
          verified={false}
        />
        <div className="overflow-hidden">
          <p className="text-xs font-semibold text-white truncate">{currentUser?.full_name || 'Administrator'}</p>
          <p className="text-xs text-slate-400 truncate">{currentUser?.email || 'admin@homeocircle.in'}</p>
          <span className="inline-block mt-0.5 text-[10px] uppercase tracking-wider font-semibold text-brand-teal bg-teal-950 px-1.5 py-0.5 rounded border border-teal-800">
            {role === 'super_admin' ? 'Super Admin' : 'Admin'}
          </span>
        </div>
      </div>

      {/* Admin Nav */}
      <nav className="flex-1 px-4 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.exact}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition duration-200 ${
                isActive
                  ? 'bg-teal-700 text-white font-semibold shadow-glow'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white hover:translate-x-0.5'
              }`
            }
          >
            <div className="flex items-center gap-3">
              <item.icon className="w-4 h-4 text-slate-400 group-hover:text-white" />
              <span>{item.label}</span>
            </div>
            {typeof item.badge === 'number' && item.badge > 0 && (
              <span className="bg-rose-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer Navigation */}
      <div className="p-4 border-t border-slate-800 space-y-2">
        <Link
          to="/dashboard"
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Member View</span>
        </Link>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition text-left"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
    </>
  );
};
