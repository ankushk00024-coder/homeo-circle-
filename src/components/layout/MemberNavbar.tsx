import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BrandLogo } from '../common/BrandLogo';
import { Avatar } from '../common/Avatar';
import { useAuth } from '../../context/AuthContext';
import { dataService } from '../../lib/supabase';
import { AppNotification } from '../../types';
import { 
  Search, 
  Bell, 
  ChevronDown, 
  User, 
  Settings, 
  Shield, 
  LogOut, 
  Check, 
  UserCheck, 
  GraduationCap, 
  CheckCheck
} from 'lucide-react';

export const MemberNavbar: React.FC = () => {
  const { currentUser, logout, isAdmin, role } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const location = useLocation();
  const navigate = useNavigate();

  const loadNotifications = async () => {
    if (currentUser?.id) {
      const list = await dataService.getNotifications(currentUser.id);
      setNotifications(list);
    }
  };

  useEffect(() => {
    loadNotifications();
    // Poll gently; a 5s interval hammered the API for every open tab.
    const interval = setInterval(() => { loadNotifications().catch(() => undefined); }, 30000);
    return () => clearInterval(interval);
  }, [currentUser?.id]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleMarkAllRead = async () => {
    if (currentUser?.id) {
      await dataService.markAllNotificationsRead(currentUser.id);
      await loadNotifications();
    }
  };

  const handleAcceptConnection = async (e: React.MouseEvent, notif: AppNotification) => {
    e.stopPropagation();
    if (!currentUser || !notif.action_id) return;
    await dataService.respondConnectionRequest(notif.action_id, 'accepted', currentUser);
    await loadNotifications();
  };

  const handleDeclineConnection = async (e: React.MouseEvent, notif: AppNotification) => {
    e.stopPropagation();
    if (!currentUser || !notif.action_id) return;
    await dataService.respondConnectionRequest(notif.action_id, 'declined', currentUser);
    await loadNotifications();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/community?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const navLinks = [
    { label: 'Community', path: '/community' },
    { label: 'Student Corner', path: '/students' },
    { label: 'Events', path: '/events' },
    { label: 'Opportunities', path: '/opportunities' },
    { label: 'Research', path: '/knowledge' },
  ];

  const isActive = (path: string) => location.pathname.startsWith(path);

  const getRoleBadge = () => {
    if (role === 'student') return 'Student Member';
    if (role === 'researcher') return 'Researcher & Educator';
    if (role === 'super_admin' || role === 'admin') return 'Administrator';
    return currentUser?.qualification || 'Verified Doctor';
  };

  return (
    <header
      className={`sticky top-0 z-40 backdrop-blur-md border-b transition-all duration-300 ${
        scrolled ? 'bg-white/85 border-brand-border shadow-card' : 'bg-brand-paper/80 border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Left: Brand Logo & Desktop Navigation */}
          <div className="flex items-center gap-6 xl:gap-8 flex-shrink-0">
            <BrandLogo size="md" />

            <nav className="hidden lg:flex items-center gap-5 xl:gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`relative py-1 text-sm font-medium transition after:absolute after:left-0 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-brand-teal after:transition-all after:duration-300 ${
                    isActive(link.path)
                      ? 'text-brand-teal font-semibold after:w-full'
                      : 'text-brand-muted hover:text-brand-navy after:w-0 hover:after:w-full'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Center: Search input */}
          <div className="hidden sm:flex flex-1 max-w-xs md:max-w-sm lg:max-w-md mx-2">
            <form onSubmit={handleSearch} className="w-full relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search discussions, members, or research..."
                className="w-full pl-9 pr-4 py-1.5 text-xs sm:text-sm bg-brand-ice/60 border border-brand-border rounded-full focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal text-brand-navy placeholder:text-brand-muted/70 transition"
              />
              <Search className="w-4 h-4 text-brand-muted absolute left-3 top-2.5 pointer-events-none" />
            </form>
          </div>

          {/* Right: Notifications & Profile Dropdown */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            
            {/* Notification Bell with Dropdown */}
            <div className="relative">
              <button
                onClick={() => { setNotifOpen(!notifOpen); setDropdownOpen(false); }}
                className="p-2 rounded-full text-brand-muted hover:text-brand-navy hover:bg-brand-ice/70 relative transition"
                aria-label="Notifications"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex">
                    <span className="absolute inset-0 rounded-full bg-brand-teal animate-ping opacity-50" />
                    <span className="relative min-w-[18px] h-[18px] px-1 rounded-full bg-brand-teal text-white text-[11px] font-bold flex items-center justify-center ring-2 ring-white shadow-2xs">
                      {unreadCount}
                    </span>
                  </span>
                )}
              </button>

              {/* Notification Popover */}
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-slide-down">
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-brand-navy">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-teal-50 text-teal-800 text-[11px] font-bold border border-teal-200">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>Mark all read</span>
                      </button>
                    )}
                  </div>

                  {/* Notification List */}
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.slice(0, 8).map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => {
                            dataService.markNotificationRead(notif.id);
                            if (notif.link) {
                              navigate(notif.link);
                              setNotifOpen(false);
                            }
                          }}
                          className={`p-3.5 hover:bg-slate-50 transition cursor-pointer text-xs ${
                            !notif.is_read ? 'bg-teal-50/40' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-bold text-brand-navy text-[12px] leading-snug">
                              {notif.title}
                            </h4>
                            <span className="text-[11px] text-slate-400 flex-shrink-0">
                              {notif.created_at}
                            </span>
                          </div>
                          <p className="text-slate-600 mt-0.5 leading-relaxed text-[13px]">
                            {notif.message}
                          </p>

                          {/* Direct Connection Action Buttons */}
                          {notif.type === 'connection_request' && notif.action_id && (
                            <div className="mt-2.5 flex items-center gap-2">
                              {notif.action_status === 'accepted' ? (
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
                                  <Check className="w-3 h-3" />
                                  <span>Connected</span>
                                </span>
                              ) : notif.action_status === 'declined' ? (
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                                  <span>Declined</span>
                                </span>
                              ) : (
                                <>
                                  <button
                                    onClick={(e) => handleAcceptConnection(e, notif)}
                                    className="px-3 py-1 bg-brand-teal hover:bg-teal-700 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1 shadow-2xs"
                                  >
                                    <Check className="w-3 h-3" />
                                    <span>Accept</span>
                                  </button>
                                  <button
                                    onClick={(e) => handleDeclineConnection(e, notif)}
                                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition"
                                  >
                                    <span>Decline</span>
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {/* Email notice footer */}
                  <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/80 text-[11px] text-slate-500 flex items-center justify-between">
                    <span>In-app notifications active</span>
                    <span className="text-slate-400">Email alerts: Requires SMTP setup</span>
                  </div>
                </div>
              )}
            </div>

            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={() => { setDropdownOpen(!dropdownOpen); setNotifOpen(false); }}
                className="flex items-center gap-2.5 pl-1.5 pr-2.5 py-1 rounded-full hover:bg-brand-ice/60 border border-transparent hover:border-brand-border/60 transition"
              >
                <Avatar
                  name={currentUser?.display_name || currentUser?.full_name || 'Member'}
                  src={currentUser?.avatar_url}
                  size="sm"
                  verified={currentUser?.status === 'verified'}
                />

                <div className="hidden md:flex flex-col text-left">
                  <span className="text-sm font-semibold text-brand-navy leading-none">
                    {currentUser?.display_name || 'Member'}
                  </span>
                  <span className="text-xs text-brand-teal font-medium leading-tight">
                    {getRoleBadge()}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-brand-muted hidden sm:block" />
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-slide-down"
                  onClick={() => setDropdownOpen(false)}
                >
                  <div className="px-4 py-2.5 border-b border-slate-100">
                    <p className="text-xs font-bold text-brand-navy">{currentUser?.full_name}</p>
                    <p className="text-xs text-slate-500 truncate">{currentUser?.email}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[11px] font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 capitalize">
                        {role} • {currentUser?.status}
                      </span>
                    </div>
                  </div>

                  <Link
                    to="/dashboard"
                    className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-teal-700"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    <span>My Dashboard</span>
                  </Link>

                  <Link
                    to="/profile"
                    className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-teal-700"
                  >
                    <UserCheck className="w-4 h-4 text-slate-400" />
                    <span>Edit Profile & Credentials</span>
                  </Link>

                  <Link
                    to="/students"
                    className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-teal-700"
                  >
                    <GraduationCap className="w-4 h-4 text-slate-400" />
                    <span>Student Corner & Mentors</span>
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
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50/60 hover:bg-indigo-100/70"
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
