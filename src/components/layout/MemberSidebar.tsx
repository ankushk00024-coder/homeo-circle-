import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { 
  Home,
  LayoutDashboard,
  MessageSquare, 
  Users, 
  Calendar, 
  Settings, 
  ShieldCheck,
  GraduationCap,
  BookOpen,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const MemberSidebar: React.FC = () => {
  const { isAuthenticated } = useAuth();

  const primaryNav = [
    { label: 'Home', path: '/', icon: Home },
    ...(isAuthenticated ? [{ label: 'My Dashboard', path: '/dashboard', icon: LayoutDashboard }] : []),
    { label: 'Discussions', path: '/community', icon: MessageSquare },
    { label: 'Doctors', path: '/members', icon: Users },
    { label: 'Student Corner', path: '/students', icon: GraduationCap },
    { label: 'Events & CMEs', path: '/events', icon: Calendar },
    { label: 'Research', path: '/knowledge', icon: BookOpen },
    ...(isAuthenticated ? [{ label: 'Account Settings', path: '/settings', icon: Settings }] : []),
  ];

  return (
    <aside className="w-64 flex-shrink-0 hidden md:block">
      <div className="sticky top-20 space-y-6 pr-4">
        
        {/* Primary Navigation */}
        <nav className="space-y-1">
          {primaryNav.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                  isActive
                    ? 'bg-teal-50 text-teal-800 font-semibold shadow-2xs border border-teal-100'
                    : 'text-slate-600 hover:text-brand-navy hover:bg-slate-100/70'
                }`
              }
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Join CTA for unauthenticated visitors OR Trust Badge for members */}
        {!isAuthenticated ? (
          <div className="p-4 bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl border border-teal-200/80 text-xs text-slate-700 space-y-2.5 shadow-2xs">
            <div className="flex items-center gap-1.5 text-teal-900 font-bold">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>Join Homeo Circle</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Connect with clinical mentors, discuss cases, and register for accredited events.
            </p>
            <div className="flex flex-col gap-1.5 pt-1">
              <Link 
                to="/login" 
                className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-[#0D817B] text-white rounded-xl text-xs font-semibold hover:bg-[#0a6b66] transition shadow-2xs"
              >
                <span>Join Homeo Circle</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link 
                to="/login" 
                className="w-full text-center py-1.5 px-3 text-slate-600 hover:text-brand-navy text-xs font-medium"
              >
                Sign in
              </Link>
            </div>
          </div>
        ) : null}

      </div>
    </aside>
  );
};
