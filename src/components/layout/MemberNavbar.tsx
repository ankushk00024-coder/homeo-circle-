import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BrandLogo } from '../common/BrandLogo';
import { Avatar } from '../common/Avatar';
import { useAuth } from '../../context/AuthContext';
import { Search, Bell, ChevronDown, User, Settings, Shield, LogOut } from 'lucide-react';

export const MemberNavbar: React.FC = () => {
  const { currentUser, logout, isAdmin } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/community?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const navLinks = [
    { label: 'Community', path: '/community' },
    { label: 'Events', path: '/events' },
    { label: 'Opportunities', path: '/opportunities' },
    { label: 'Research', path: '/knowledge' },
  ];

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <header className="sticky top-0 z-40 bg-brand-paper/95 backdrop-blur-md border-b border-brand-border/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Left: Brand Logo */}
          <div className="flex items-center gap-8 flex-shrink-0">
            <BrandLogo size="md" />

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-sm font-medium transition ${
                    isActive(link.path)
                      ? 'text-brand-teal font-semibold'
                      : 'text-brand-muted hover:text-brand-navy'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Center: Search discussions/members input */}
          <div className="hidden sm:flex flex-1 max-w-md mx-4">
            <form onSubmit={handleSearch} className="w-full relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search discussions, clinical cases, or research..."
                className="w-full pl-9 pr-4 py-1.5 text-xs sm:text-sm bg-brand-ice/60 border border-brand-border rounded-full focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal text-brand-navy placeholder:text-brand-muted/70 transition"
              />
              <Search className="w-4 h-4 text-brand-muted absolute left-3 top-2.5 pointer-events-none" />
            </form>
          </div>

          {/* Right: Notifications & Profile Dropdown */}
          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <button
              className="p-2 rounded-full text-brand-muted hover:text-brand-navy hover:bg-brand-ice/70 relative transition"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="w-2 h-2 rounded-full bg-brand-teal absolute top-1.5 right-1.5 ring-2 ring-white"></span>
            </button>

            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2.5 pl-1.5 pr-2.5 py-1 rounded-full hover:bg-brand-ice/60 border border-transparent hover:border-brand-border/60 transition focus:outline-none"
              >
                <Avatar
                  name={currentUser?.display_name || currentUser?.full_name || 'Dr.'}
                  src={currentUser?.avatar_url}
                  size="sm"
                  verified={currentUser?.status === 'verified'}
                />

                <div className="hidden md:flex flex-col text-left">
                  <span className="text-sm font-semibold text-brand-navy leading-none">
                    {currentUser?.display_name || 'Dr. Practitioner'}
                  </span>
                  <span className="text-[11px] text-brand-teal font-medium leading-tight">
                    {currentUser?.qualification || 'Verified Member'}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-brand-muted hidden sm:block" />
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  onClick={() => setDropdownOpen(false)}
                >
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs font-semibold text-brand-navy">{currentUser?.full_name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{currentUser?.email}</p>
                    <p className="text-[10px] text-teal-700 font-medium mt-0.5">
                      Reg: {currentUser?.registration_number || 'NCH Verified'}
                    </p>
                  </div>

                  <Link
                    to="/profile"
                    className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-teal-700"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    <span>My Practitioner Profile</span>
                  </Link>

                  <Link
                    to="/settings"
                    className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-teal-700"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    <span>Account Settings</span>
                  </Link>

                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50/50 hover:bg-indigo-50"
                    >
                      <Shield className="w-4 h-4 text-indigo-600" />
                      <span>Admin Management</span>
                    </Link>
                  )}

                  <div className="border-t border-slate-100 my-1"></div>

                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 text-left"
                  >
                    <LogOut className="w-4 h-4 text-rose-400" />
                    <span>Sign out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
