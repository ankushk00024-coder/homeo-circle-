import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BrandLogo } from '../common/BrandLogo';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../common/Avatar';
import { Menu, X, ArrowRight } from 'lucide-react';

export const PublicNavbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, isVerifiedMember, currentUser } = useAuth();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Community', path: '/community' },
    { label: 'Student Corner', path: '/students' },
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
    <header
      className={`sticky top-0 z-40 backdrop-blur-md border-b transition-all duration-300 ${
        scrolled ? 'bg-white/85 border-brand-border shadow-card' : 'bg-brand-pale/80 border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`flex items-center justify-between transition-all duration-300 ${scrolled ? 'h-16' : 'h-[72px]'}`}>

          {/* Logo */}
          <div className="flex-shrink-0">
            <BrandLogo size="md" />
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-7">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`group relative py-2 text-sm transition-colors ${
                  isActive(link.path)
                    ? 'text-[#0D817B] font-semibold'
                    : 'text-[#4A627A] hover:text-[#14243F] font-medium'
                }`}
              >
                <span>{link.label}</span>
                <span
                  className={`absolute bottom-0 left-0 h-[2.5px] bg-brand-teal rounded-full transition-all duration-300 ${
                    isActive(link.path) ? 'w-full' : 'w-0 group-hover:w-full'
                  }`}
                />
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                to={isVerifiedMember ? '/dashboard' : '/application-status'}
                className="flex items-center gap-2.5 pl-2 pr-4 py-1.5 rounded-full bg-white border border-[#D7E5F0] hover:border-[#0D817B] shadow-sm transition"
              >
                <Avatar src={currentUser?.avatar_url} name={currentUser?.display_name || 'Member'} size="sm" verified={isVerifiedMember} />
                <span className="text-xs font-semibold text-[#14243F]">{currentUser?.display_name}</span>
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-[#4A627A] hover:text-[#14243F] px-3 py-2 transition">
                  Sign in
                </Link>
                <Link to="/apply" className="btn-primary group !px-4 !py-2.5">
                  Join Homeo Circle
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-[#5A6E85] hover:text-[#14243F] hover:bg-[#EEF6FC]"
              aria-label="Toggle navigation"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-[#D7E5F0] bg-white px-4 pt-3 pb-6 space-y-3 animate-slide-down shadow-card">
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
                  Join Homeo Circle
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
