import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { BrandLogo } from '../common/BrandLogo';
import { Avatar } from '../common/Avatar';
import { useAuth } from '../../context/AuthContext';
import { dataService } from '../../lib/supabase';
import { 
  LayoutDashboard, 
  FileCheck2, 
  Users, 
  GraduationCap,
  FlaskConical,
  MessageSquare, 
  Flag,
  Calendar, 
  Briefcase, 
  BookOpen,
  Tag,
  Bell,
  Settings, 
  History,
  ArrowLeft, 
  LogOut,
  Menu,
  X
} from 'lucide-react';

export const AdminSidebar: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [openReportsCount, setOpenReportsCount] = useState<number>(0);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);

  // Close mobile drawer when route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Fetch real count badges from existing backend
  useEffect(() => {
    let isMounted = true;

    dataService.getApplications()
      .then(apps => {
        if (!isMounted) return;
        const count = apps.filter(a => a.status === 'pending_review' || a.status === 'submitted').length;
        setPendingCount(count);
      })
      .catch(err => console.warn('Could not load application badge:', err));

    dataService.getReports()
      .then(reports => {
        if (!isMounted) return;
        const count = reports.filter(r => r.status === 'open' || r.status === 'under_review').length;
        setOpenReportsCount(count);
      })
      .catch(err => console.warn('Could not load report badge:', err));

    return () => {
      isMounted = false;
    };
  }, []);

  const navItems = [
    { label: 'Overview', path: '/admin', icon: LayoutDashboard, exact: true },
    { label: 'Practitioner Verification', path: '/admin/applications', icon: FileCheck2, badge: pendingCount },
    { label: 'Members', path: '/admin/members', icon: Users },
    { label: 'Students', path: '/admin/students', icon: GraduationCap },
    { label: 'Researchers', path: '/admin/researchers', icon: FlaskConical },
    { label: 'Community Posts', path: '/admin/posts', icon: MessageSquare },
    { label: 'Comments & Reports', path: '/admin/reports', icon: Flag, badge: openReportsCount },
    { label: 'Events & CMEs', path: '/admin/events', icon: Calendar },
    { label: 'Opportunities', path: '/admin/opportunities', icon: Briefcase },
    { label: 'Knowledge Resources', path: '/admin/knowledge', icon: BookOpen },
    { label: 'Categories', path: '/admin/categories', icon: Tag },
    { label: 'Notifications', path: '/admin/notifications', icon: Bell },
    { label: 'Platform Settings', path: '/admin/settings', icon: Settings },
    { label: 'Audit Logs', path: '/admin/audit-logs', icon: History },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-brand-navy text-slate-200">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
        <BrandLogo theme="dark" size="md" />
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          aria-label="Close admin menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Admin Profile Card */}
      <div className="p-3 mx-4 mt-3 bg-slate-800/60 rounded-xl border border-slate-700/60 flex items-center gap-3">
        <Avatar
          name={currentUser?.full_name || 'Admin'}
          src={currentUser?.avatar_url}
          size="sm"
          verified={false}
        />
        <div className="overflow-hidden flex-1 min-w-0">
          <p className="text-xs font-semibold text-white truncate">{currentUser?.full_name || 'Administrator'}</p>
          <p className="text-[10px] text-slate-400 truncate">{currentUser?.email || 'admin@homeocircle.in'}</p>
          <span className="inline-block mt-0.5 text-[9px] uppercase tracking-wider font-semibold text-teal-300 bg-teal-950 px-1.5 py-0.5 rounded border border-teal-800">
            {currentUser?.role === 'super_admin' ? 'Super Admin' : 'Admin Console'}
          </span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.exact}
            className={({ isActive }) =>
              `flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${
                isActive
                  ? 'bg-teal-700 text-white font-semibold shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`
            }
          >
            <div className="flex items-center gap-2.5 truncate">
              <item.icon className="w-4 h-4 flex-shrink-0 text-slate-400 group-hover:text-white" />
              <span className="truncate">{item.label}</span>
            </div>
            {typeof item.badge === 'number' && item.badge > 0 && (
              <span className="ml-2 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer Navigation */}
      <div className="p-3 border-t border-slate-800 space-y-1.5 bg-slate-900/50">
        <Link
          to="/dashboard"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-slate-400" />
          <span>Return to Member View</span>
        </Link>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition text-left"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top Header */}
      <div className="md:hidden bg-brand-navy text-white px-4 py-3 flex items-center justify-between border-b border-slate-800 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 transition"
            aria-label="Open admin menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <BrandLogo theme="dark" size="sm" />
        </div>
        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <Link
              to="/admin/applications"
              className="text-[10px] font-bold bg-rose-600 text-white px-2 py-0.5 rounded-full"
            >
              {pendingCount} Pending
            </Link>
          )}
          <Avatar
            name={currentUser?.full_name || 'Admin'}
            src={currentUser?.avatar_url}
            size="xs"
            verified={false}
          />
        </div>
      </div>

      {/* Mobile Slide-out Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div 
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-72 max-w-[85vw] h-full shadow-2xl flex-shrink-0 z-10 animate-slide-in-left">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Desktop Sticky Sidebar */}
      <aside className="hidden md:flex w-64 h-screen sticky top-0 border-r border-slate-800 flex-shrink-0">
        {sidebarContent}
      </aside>
    </>
  );
};
