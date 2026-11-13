import React from 'react';
import { BadgeCheck, Clock, AlertTriangle, GraduationCap } from 'lucide-react';
import { badgeFor, BADGE_TONE_CLASSES } from '../../lib/membership';

type Props = {
  profile: Parameters<typeof badgeFor>[0];
  size?: 'sm' | 'md';
  className?: string;
};

/** Shows exactly what was verified for a member — nothing more. */
export const MemberBadge: React.FC<Props> = ({ profile, size = 'sm', className = '' }) => {
  const badge = badgeFor(profile);
  if (!badge) return null;
  const Icon = badge.tone === 'verified' ? BadgeCheck : badge.tone === 'pending' ? Clock : badge.tone === 'warning' ? AlertTriangle : GraduationCap;
  return (
    <span
      title={badge.detail}
      className={`inline-flex items-center gap-1 rounded-full ring-1 font-semibold ${BADGE_TONE_CLASSES[badge.tone]} ${
        size === 'sm' ? 'px-2 py-0.5 text-[10.5px]' : 'px-2.5 py-1 text-xs'
      } ${className}`}
    >
      <Icon className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
      {badge.label}
    </span>
  );
};
