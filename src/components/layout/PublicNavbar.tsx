import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BrandLogo } from '../common/BrandLogo';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../common/Avatar';
import { Menu, X, ArrowRight, Search } from 'lucide-react';

export const PublicNavbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, isVerifiedMember, currentUser } = useAuth();
  const location = useLocation();

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Community', path: '/community' },
    { label: 'Events', path: '/events' },
    { label: 'Opportunities', path: '/opportunities' },
    { label: 'Research', path: '/knowledge' },
    { label: 'About', path: '/about' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#EAF3FA]/95 backdrop-blur-md border-b border-[#D4E4F0]/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[68px]">

          {/* Logo */}
          <div className="flex-shrink-0">
            <BrandLogo size="md" />
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-7">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`relative py-2 text-sm transition-colors ${
                  isActive(link.path)
                    ? 'text-[#0D817B] font-semibold'
                    : 'text-[#4A627A] hover:text-[#14243F] font-medium'
                }`}
              >
                <span>{link.label}</span>
                {isActive(link.path) && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#0D817B] rounded-full" />
                )}
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="hidden md:flex items-center gap-3">
            <button className="w-9 h-9 rounded-xl border border-[#D7E5F0] flex items-center justify-center text-[#5A6E85] hover:bg-[#EEF6FC] hover:text-[#14243F] transition" aria-label="Search">
              <Search className="w-4 h-4" />
            </button>

            {isAuthenticated ? (
              <Link
                to={isVerifiedMember ? '/dashboard' : '/application-status'}
                className="flex items-center gap-2.5 pl-2 pr-4 py-1.5 rounded-full bg-white border border-[#D7E5F0] hover:border-[#0D817B] shadow-sm transition"
              >
                <Avatar src={currentUser?.avatar_url} name={currentUser?.display_name || 'Doctor'} size="sm" verified={isVerifiedMember} />
                <span className="text-xs font-semibold text-[#14243F]">{currentUser?.display_name}</span>
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-[#4A627A] hover:text-[#14243F] px-3 py-2 transition">
                  Sign in
                </Link>
                <Link
                  to="/apply"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0D817B] hover:bg-[#0a6b66] text-white text-sm font-semibold shadow-sm transition"
                >
                  Apply for verification
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-[#5A6E85] hover:text-[#14243F] hover:bg-[#EEF6FC] focus:outline-none"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[#D7E5F0] bg-white px-4 pt-3 pb-6 space-y-3">
          <div className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2.5 rounded-xl text-sm font-medium ${
                  isActive(link.path)
                    ? 'bg-[#EEF6FC] text-[#0D817B] font-semibold'
                    : 'text-[#4A627A] hover:bg-[#FAFCFE]'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="pt-4 border-t border-[#D7E5F0]/60 flex flex-col gap-2.5">
            {isAuthenticated ? (
              <Link
                to={isVerifiedMember ? '/dashboard' : '/application-status'}
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center px-4 py-2.5 rounded-xl bg-[#14243F] text-white text-xs font-semibold"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center px-4 py-2.5 rounded-xl border border-[#D7E5F0] text-[#4A627A] text-xs font-semibold"
                >
                  Sign in
                </Link>
                <Link
                  to="/apply"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center px-4 py-2.5 rounded-xl bg-[#0D817B] text-white text-xs font-semibold"
                >
                  Apply for verification
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
