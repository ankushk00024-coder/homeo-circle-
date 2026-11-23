import React from 'react';
import { Link } from 'react-router-dom';
import { BrandLogo } from '../common/BrandLogo';
import { INDEPENDENCE_DISCLAIMER } from '../../lib/membership';

export const Footer: React.FC = () => {

  const platform = [
    { label: 'Community', path: '/community' },
    { label: 'Events', path: '/events' },
    { label: 'Research', path: '/knowledge' },
  ];

  const about = [
    { label: 'Our Mission', path: '/about' },
    { label: 'How Verification Works', path: '/verification-policy' },
    { label: 'Eligibility', path: '/eligibility' },
    { label: 'FAQ', path: '/faq' },
    { label: 'Contact', path: '/contact' },
  ];

  const legal = [
    { label: 'Legal & Policies', path: '/legal' },
    { label: 'Privacy Policy', path: '/privacy' },
    { label: 'Terms of Use', path: '/terms' },
    { label: 'Community Guidelines', path: '/community-rules' },
    { label: 'Clinical Disclaimer', path: '/clinical-disclaimer' },
    { label: 'Complaints & Grievances', path: '/grievance-policy' },
  ];

  return (
    <footer className="bg-[#EAF3FA] border-t border-[#D7E5F0]/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10">

          {/* Brand column — spans 2 */}
          <div className="md:col-span-2 space-y-5">
            <BrandLogo size="md" />
            <p className="text-xs text-[#3E556E] leading-relaxed max-w-xs font-normal">
              An independent academic and professional community connecting homoeopathic practitioners, students, interns and researchers across India.
            </p>
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
          <p>© {new Date().getFullYear()} Homeo India. All rights reserved.</p>
          <p className="text-center sm:text-right max-w-xl">{INDEPENDENCE_DISCLAIMER}</p>
        </div>
      </div>
    </footer>
  );
};
