import type { AccountType, RegistrationStatus } from '../types';

/**
 * One place for membership categories, badges and verification wording, so
 * every page says the same thing.
 *
 * Verification principles:
 *  - A verified degree is not a verified professional registration.
 *  - Only members whose registration was checked against registration records
 *    get the "Verified Registered Practitioner" badge.
 *  - Homeo India is not a statutory authority and does not grant registration.
 */

export interface MembershipCategory {
  value: AccountType;
  label: string;
  short: string;
  who: string;
  needs: string[];
  badge: string;
}

export const MEMBERSHIP_CATEGORIES: MembershipCategory[] = [
  {
    value: 'doctor',
    label: 'Registered Practitioner',
    short: 'Practitioner',
    who: 'Homoeopathic practitioners registered with a State or Central register.',
    needs: ['Recognised qualification', 'Registration number', 'Registering council / authority', 'Registration or degree certificate'],
    badge: 'Verified Registered Practitioner',
  },
  {
    value: 'student',
    label: 'BHMS Student',
    short: 'Student',
    who: 'Students currently enrolled in a BHMS course.',
    needs: ['College name', 'Current year of study', 'Student ID card or bonafide certificate'],
    badge: 'Student Member',
  },
  {
    value: 'intern',
    label: 'Intern',
    short: 'Intern',
    who: 'BHMS graduates doing their compulsory rotatory internship.',
    needs: ['College and internship hospital', 'Internship period', 'Internship letter or proof'],
    badge: 'Intern Member',
  },
  {
    value: 'graduate',
    label: 'Qualified Graduate',
    short: 'Graduate',
    who: 'Homoeopathy graduates whose professional registration is not yet complete.',
    needs: ['Degree and year of passing', 'Degree certificate', 'Current registration status'],
    badge: 'Qualification Verified — Registration Pending',
  },
  {
    value: 'researcher',
    label: 'Academic / Research Member',
    short: 'Academic',
    who: 'Teachers, researchers and academics working in homoeopathy.',
    needs: ['Institution', 'Academic or research role', 'Supporting credentials'],
    badge: 'Academic Member',
  },
];

export const categoryOf = (type?: string | null): MembershipCategory | undefined =>
  MEMBERSHIP_CATEGORIES.find((c) => c.value === type);

export type BadgeTone = 'verified' | 'pending' | 'warning' | 'neutral';

export interface MemberBadge {
  label: string;
  tone: BadgeTone;
  /** Plain-language explanation shown in tooltips/profile pages. */
  detail: string;
}

/**
 * The badge a member gets, based only on what was actually verified.
 * Returns null for members who are not verified yet.
 */
export const badgeFor = (p: {
  account_type?: string | null;
  status?: string | null;
  registration_status?: RegistrationStatus | string | null;
  qualification_verified?: boolean | null;
}): MemberBadge | null => {
  if (p.status !== 'verified' || !p.account_type) return null;
  const reg = p.registration_status || 'not_applicable';
  switch (p.account_type) {
    case 'doctor':
      if (reg === 'verified') {
        return { label: 'Verified Registered Practitioner', tone: 'verified', detail: 'Professional registration checked against registration records.' };
      }
      if (reg === 'lapsed' || reg === 'expired') {
        return { label: 'Registration lapsed — re-verification needed', tone: 'warning', detail: 'The registration on record has lapsed or expired.' };
      }
      return { label: 'Qualification Verified — Registration Pending', tone: 'pending', detail: 'Qualification checked. Professional registration not yet verified.' };
    case 'graduate':
      return { label: 'Qualification Verified — Registration Pending', tone: 'pending', detail: 'Qualification checked. Not shown as a registered practitioner.' };
    case 'student':
      return { label: 'Student Member', tone: 'neutral', detail: 'Enrolment details reviewed. Students are not licensed practitioners.' };
    case 'intern':
      return { label: 'Intern Member', tone: 'neutral', detail: 'Internship details reviewed. Interns practise only under supervision.' };
    case 'researcher':
      return { label: 'Academic Member', tone: 'neutral', detail: 'Academic or research background reviewed.' };
    default:
      return null;
  }
};

/** True only for members whose professional registration was verified. */
export const isRegisteredPractitioner = (p: { account_type?: string | null; status?: string | null; registration_status?: string | null }) =>
  p.status === 'verified' && p.account_type === 'doctor' && p.registration_status === 'verified';

/** Fields the profile/edit pages show for each category. */
export const profileShapeOf = (type?: string | null): 'practitioner' | 'student' | 'academic' =>
  type === 'student' || type === 'intern' ? 'student' : type === 'researcher' ? 'academic' : 'practitioner';

export const BADGE_TONE_CLASSES: Record<BadgeTone, string> = {
  verified: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  pending: 'bg-amber-50 text-amber-800 ring-amber-200',
  warning: 'bg-rose-50 text-rose-700 ring-rose-200',
  neutral: 'bg-sky-50 text-sky-800 ring-sky-200',
};

export const INDEPENDENCE_DISCLAIMER =
  'Homeo India is an independent platform. It is not a government authority, statutory medical council, licensing body or medical registration authority.';
