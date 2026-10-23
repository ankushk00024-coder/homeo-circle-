import React from 'react';
import { Link } from 'react-router-dom';

interface BrandLogoProps {
  className?: string;
  theme?: 'dark' | 'light';
  size?: 'sm' | 'md' | 'lg';
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ 
  className = '', 
  theme = 'light',
  size = 'md' 
}) => {
  const isDark = theme === 'dark';
  
  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl'
  };

  return (
    <Link to="/" className={`inline-flex items-center gap-2.5 group select-none ${className}`}>
      {/* Botanical Lotus Icon */}
      <div className={`${iconSizes[size]} flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105`}>
        <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-xs">
          <path
            d="M 18 4 C 18 4 12 14 12 21 C 12 25.5 14.5 28 18 28 C 21.5 28 24 25.5 24 21 C 24 14 18 4 18 4 Z"
            fill={isDark ? '#14B8A6' : '#0D817B'}
          />
          <path
            d="M 18 12 C 18 12 8 16 6 23 C 4.5 28 8 31 12 30 C 15 29 17 25 18 22 Z"
            fill={isDark ? '#38BDF8' : '#14243F'}
            opacity="0.9"
          />
          <path
            d="M 18 12 C 18 12 28 16 30 23 C 31.5 28 28 31 24 30 C 21 29 19 25 18 22 Z"
            fill={isDark ? '#38BDF8' : '#14243F'}
            opacity="0.9"
          />
          <circle cx="18" cy="22" r="2.2" fill={isDark ? '#14243F' : '#FFFFFF'} />
        </svg>
      </div>

      {/* Brand Text */}
      <span className={`font-sans font-bold tracking-[0.14em] uppercase ${textSizes[size]} ${isDark ? 'text-white' : 'text-brand-navy'}`}>
        HOMEO <span className={isDark ? 'text-teal-400' : 'text-brand-teal'}>CIRCLE</span>
      </span>
    </Link>
  );
};
