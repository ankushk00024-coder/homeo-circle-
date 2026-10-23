import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  MessageSquare, 
  Users, 
  Calendar, 
  Briefcase, 
  Bookmark, 
  Mail, 
  Plus, 
  ShieldCheck,
  Stethoscope,
  Microscope,
  GraduationCap,
  MapPin
} from 'lucide-react';

export const MemberSidebar: React.FC = () => {
  const primaryNav = [
    { label: 'Home', path: '/dashboard', icon: Home },
    { label: 'Discussions', path: '/community', icon: MessageSquare },
    { label: 'My Network', path: '/members', icon: Users },
    { label: 'Events', path: '/events', icon: Calendar },
    { label: 'Opportunities', path: '/opportunities', icon: Briefcase },
    { label: 'Bookmarks', path: '/community?filter=saved', icon: Bookmark },
    { label: 'Messages', path: '/settings', icon: Mail },
  ];

  const groupCategories = [
    { label: 'General Discussion', id: 'general', icon: MessageSquare },
    { label: 'Clinical Cases', id: 'clinical-cases', icon: Stethoscope },
    { label: 'Research & Journals', id: 'research', icon: Microscope },
    { label: 'Student Corner', id: 'students', icon: GraduationCap },
    { label: 'State Chapters', id: 'chapters', icon: MapPin },
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
                    ? 'bg-teal-50 text-teal-800 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-brand-navy hover:bg-slate-100/70'
                }`
              }
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* MY GROUPS Section */}
        <div className="pt-2">
          <div className="flex items-center justify-between px-3.5 mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              MY GROUPS
            </span>
          </div>

          <div className="space-y-0.5">
            {groupCategories.map((group) => (
              <NavLink
                key={group.id}
                to={`/community?category=${group.id}`}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2 rounded-lg text-xs font-medium transition ${
                    isActive
                      ? 'text-teal-700 bg-teal-50/70 font-semibold'
                      : 'text-slate-600 hover:text-brand-navy hover:bg-slate-50'
                  }`
                }
              >
                <group.icon className="w-3.5 h-3.5 text-slate-400" />
                <span>{group.label}</span>
              </NavLink>
            ))}
          </div>

          <button
            onClick={() => alert('Community group creation is moderated by the state advisory council. To request a new state or specialty group, contact the administrator.')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-teal-700 hover:text-teal-800 transition mt-1"
          >
            <span>Create Group</span>
            <span>&rarr;</span>
          </button>
        </div>

        {/* Verification Trust Badge */}
        <div className="p-3.5 bg-gradient-to-br from-teal-50 to-slate-50 rounded-2xl border border-teal-100/70 text-xs text-slate-600 space-y-1.5">
          <div className="flex items-center gap-1.5 text-teal-800 font-semibold">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>Verified Peer Network</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            All profiles in this directory are verified against National & State Homoeopathy Registers.
          </p>
        </div>
      </div>
    </aside>
  );
};
