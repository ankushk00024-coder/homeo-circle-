import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  MessageSquare, 
  Users, 
  Calendar, 
  Briefcase, 
  Settings, 
  ShieldCheck,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const MemberSidebar: React.FC = () => {
  const { role } = useAuth();

  const primaryNav = [
    { label: 'Home', path: '/dashboard', icon: Home },
    { label: 'Discussions', path: '/community', icon: MessageSquare },
    { label: 'My Network', path: '/members', icon: Users },
    { label: 'Student Corner', path: '/students', icon: GraduationCap },
    { label: 'Events & CMEs', path: '/events', icon: Calendar },
    { label: 'Opportunities', path: '/opportunities', icon: Briefcase },
    { label: 'Account Settings', path: '/settings', icon: Settings },
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

        {/* Verification Trust Badge */}
        <div className="p-4 bg-gradient-to-br from-teal-50 to-slate-50 rounded-2xl border border-teal-100/70 text-xs text-slate-600 space-y-2 shadow-2xs">
          <div className="flex items-center gap-1.5 text-teal-800 font-semibold">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>Unified Professional Network</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Connecting registered doctors, researchers, and students across India.
          </p>
        </div>

      </div>
    </aside>
  );
};
