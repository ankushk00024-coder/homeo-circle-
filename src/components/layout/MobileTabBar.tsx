import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, MessageSquare, Users, GraduationCap, Calendar } from 'lucide-react';

const tabs = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/community', label: 'Discuss', icon: MessageSquare },
  { to: '/members', label: 'Doctors', icon: Users },
  { to: '/students', label: 'Students', icon: GraduationCap },
  { to: '/events', label: 'Events', icon: Calendar },
];

/** Bottom navigation for phones, where the member sidebar is hidden. */
export const MobileTabBar: React.FC = () => (
  <nav
    aria-label="Primary"
    className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/90 backdrop-blur-md border-t border-brand-border pb-[env(safe-area-inset-bottom)]"
  >
    <ul className="grid grid-cols-5">
      {tabs.map(({ to, label, icon: Icon }) => (
        <li key={to}>
          <NavLink
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 py-2 text-xs font-semibold transition-colors ${
                isActive ? 'text-brand-teal' : 'text-slate-500 hover:text-brand-navy'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`flex items-center justify-center w-11 h-7 rounded-full transition-all duration-300 ${
                    isActive ? 'bg-teal-50 scale-110' : ''
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </span>
                {label}
              </>
            )}
          </NavLink>
        </li>
      ))}
    </ul>
  </nav>
);
