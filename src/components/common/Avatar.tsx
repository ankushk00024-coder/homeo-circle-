import React, { useState } from 'react';
import { Check } from 'lucide-react';

interface AvatarProps {
  src?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  verified?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name = 'Doctor',
  size = 'md',
  className = '',
  verified = false,
}) => {
  const [hasError, setHasError] = useState(false);

  const sizeClasses = {
    xs: 'w-6 h-6 text-[11px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base',
    xl: 'w-20 h-20 text-xl',
  };

  const badgeSizes = {
    xs: 'w-2 h-2',
    sm: 'w-2.5 h-2.5 p-0.5',
    md: 'w-3.5 h-3.5 p-0.5',
    lg: 'w-4 h-4 p-0.5',
    xl: 'w-5 h-5 p-1',
  };

  // Generate deterministic pastel background from name
  const getInitials = (n: string) => {
    const parts = n.replace(/^Dr\.\s*/i, '').trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0] ? parts[0].substring(0, 2).toUpperCase() : 'DR';
  };

  const initials = getInitials(name);

  // Soft medical gradients for fallbacks
  const getAvatarGradient = (n: string) => {
    const charCode = n.charCodeAt(0) + (n.charCodeAt(1) || 0);
    const gradients = [
      'from-[#14243F] to-[#344A78]', // Navy to Indigo
      'from-[#0D817B] to-[#14243F]', // Teal to Navy
      'from-[#1E3A5F] to-[#0D817B]', // Deep Blue to Teal
      'from-[#243456] to-[#09635F]', // Indigo to Dark Teal
    ];
    return gradients[charCode % gradients.length];
  };

  return (
    <div className={`relative inline-block flex-shrink-0 select-none ${className}`}>
      {src && !hasError ? (
        <img
          src={src}
          alt={name}
          onError={() => setHasError(true)}
          className={`${sizeClasses[size]} rounded-full object-cover ring-1 ring-black/5`}
        />
      ) : (
        <div
          className={`${sizeClasses[size]} rounded-full bg-gradient-to-br ${getAvatarGradient(
            name
          )} text-white font-bold flex items-center justify-center tracking-wider shadow-xs ring-1 ring-white/20`}
        >
          {initials}
        </div>
      )}

      {verified && (
        <span
          className={`absolute bottom-0 right-0 bg-brand-teal text-white rounded-full flex items-center justify-center ring-2 ring-white shadow-xs ${badgeSizes[size]}`}
          title="Verified Homoeopathic Practitioner"
        >
          <Check className="w-full h-full stroke-[3]" />
        </span>
      )}
    </div>
  );
};
