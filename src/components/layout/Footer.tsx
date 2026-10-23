import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BrandLogo } from '../common/BrandLogo';
import { ArrowRight } from 'lucide-react';

export const Footer: React.FC = () => {
  const [email, setEmail] = useState('');

  const platform = [
    { label: 'Community', path: '/community' },
    { label: 'Events', path: '/events' },
    { label: 'Opportunities', path: '/opportunities' },
    { label: 'Research', path: '/knowledge' },
  ];

  const about = [
    { label: 'Our Mission', path: '/about' },
    { label: 'How Verification Works', path: '/about#verification' },
    { label: 'Eligibility', path: '/eligibility' },
    { label: 'Contact', path: '/contact' },
  ];

  const legal = [
    { label: 'Privacy Policy', path: '/privacy' },
    { label: 'Community Guidelines', path: '/community-rules' },
    { label: 'Terms of Service', path: '/terms' },
    { label: 'FAQ', path: '/faq' },
  ];

  return (
    <footer className="bg-[#EAF3FA] border-t border-[#D7E5F0]/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10">

          {/* Brand column — spans 2 */}
          <div className="md:col-span-2 space-y-5">
            <BrandLogo size="md" />
            <p className="text-xs text-[#3E556E] leading-relaxed max-w-xs font-normal">
              India's trusted members-only professional community exclusively for registered homoeopathic practitioners.
            </p>
            {/* Newsletter subscribe */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-[#122238]">Subscribe for updates</p>
              <div className="flex items-center gap-0 rounded-xl overflow-hidden border border-[#D0E2EF] bg-white max-w-xs shadow-2xs">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email address"
                  className="flex-1 px-4 py-2.5 text-xs bg-transparent text-[#122238] placeholder:text-[#8AA3B8] outline-none"
                />
                <button
                  className="px-3.5 py-2.5 bg-[#0D817B] hover:bg-[#096e69] text-white flex items-center justify-center transition"
                  aria-label="Subscribe"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Platform */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-[#122238] tracking-wider uppercase">Platform</h4>
            <ul className="space-y-2.5">
              {platform.map((l) => (
                <li key={l.label}>
                  <Link to={l.path} className="text-xs text-[#3E556E] hover:text-[#0D817B] font-medium transition">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* About */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-[#122238] tracking-wider uppercase">About</h4>
            <ul className="space-y-2.5">
              {about.map((l) => (
                <li key={l.label}>
                  <Link to={l.path} className="text-xs text-[#3E556E] hover:text-[#0D817B] font-medium transition">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-[#122238] tracking-wider uppercase">Legal</h4>
            <ul className="space-y-2.5">
              {legal.map((l) => (
                <li key={l.label}>
                  <Link to={l.path} className="text-xs text-[#3E556E] hover:text-[#0D817B] font-medium transition">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-[#D0E2EF]/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#5A738E] font-medium">
          <p>© {new Date().getFullYear()} Homeo Circle India. All rights reserved.</p>
          <p className="text-center">India's verified professional homoeopathic community.</p>
        </div>
      </div>
    </footer>
  );
};
