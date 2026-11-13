/**
 * Legal configuration for Homeo India.
 *
 * OPERATOR DETAILS: fill these in before relying on the legal pages. They are
 * deliberately left empty — Homeo India's legal entity, address and contact
 * people must come from the platform owner, never be guessed. While a value is
 * empty the pages show "To be published by the operator".
 */
export const OPERATOR = {
  /** Legal name of the person or company that runs Homeo India. */
  legalName: '',
  /** Registered / postal address in India. */
  address: '',
  /** Mailbox for privacy and data requests (e.g. privacy@<your domain>). */
  privacyEmail: '',
  /** General support mailbox. */
  supportEmail: '',
  /** Grievance Officer (IT Rules, 2021) — name and contact. */
  grievanceOfficerName: '',
  grievanceOfficerEmail: '',
  grievanceOfficerAddress: '',
  /** City whose courts have jurisdiction (Terms §26). */
  jurisdictionCity: '',
};

export const NOT_PUBLISHED = 'To be published by the operator';
export const op = (v: string) => (v && v.trim() ? v : NOT_PUBLISHED);

export type PolicyKey =
  | 'privacy' | 'terms' | 'community_guidelines' | 'verification'
  | 'copyright' | 'clinical_disclaimer' | 'grievance' | 'cookies';

export interface PolicyMeta {
  key: PolicyKey;
  title: string;
  path: string;
  version: string;
  effective: string; // ISO date
  updated: string;   // ISO date
  /** Members must accept this version (shown again when it changes). */
  requiresAcceptance: boolean;
  summary: string;
}

/**
 * Current versions. When a document changes materially, bump its version
 * here AND add a row to public.policy_versions (same document/version).
 * Documents with requiresAcceptance ask signed-in members to accept again.
 */
export const POLICIES: PolicyMeta[] = [
  { key: 'privacy', title: 'Privacy Policy', path: '/privacy', version: '2.0', effective: '2026-11-13', updated: '2026-11-13', requiresAcceptance: true,
    summary: 'What personal data we collect, why, who processes it, how long we keep it and your rights.' },
  { key: 'terms', title: 'Terms of Use', path: '/terms', version: '2.0', effective: '2026-11-13', updated: '2026-11-13', requiresAcceptance: true,
    summary: 'The agreement between you and Homeo India, including membership categories and conduct.' },
  { key: 'community_guidelines', title: 'Community Guidelines', path: '/community-rules', version: '2.0', effective: '2026-11-13', updated: '2026-11-13', requiresAcceptance: false,
    summary: 'How to take part respectfully and safely, including clinical discussion rules and moderation.' },
  { key: 'verification', title: 'Verification Policy', path: '/verification-policy', version: '1.0', effective: '2026-11-13', updated: '2026-11-13', requiresAcceptance: false,
    summary: 'How each membership category is checked and what each badge means.' },
  { key: 'clinical_disclaimer', title: 'Clinical Discussion Disclaimer', path: '/clinical-disclaimer', version: '1.0', effective: '2026-11-13', updated: '2026-11-13', requiresAcceptance: false,
    summary: 'Clinical discussions are educational. No consultations, no emergency help.' },
  { key: 'copyright', title: 'Copyright Policy', path: '/copyright', version: '1.0', effective: '2026-11-13', updated: '2026-11-13', requiresAcceptance: false,
    summary: 'What may be shared in the Research Library, and how to report infringement.' },
  { key: 'grievance', title: 'Grievance & Complaint Policy', path: '/grievance-policy', version: '1.0', effective: '2026-11-13', updated: '2026-11-13', requiresAcceptance: false,
    summary: 'How to raise a complaint or appeal, and how we handle it.' },
  { key: 'cookies', title: 'Cookie & Storage Policy', path: '/cookies', version: '1.0', effective: '2026-11-13', updated: '2026-11-13', requiresAcceptance: false,
    summary: 'The browser storage the site uses to keep you signed in.' },
];

export const policy = (key: PolicyKey) => POLICIES.find((p) => p.key === key)!;
export const CURRENT_PRIVACY_VERSION = policy('privacy').version;
export const CURRENT_TERMS_VERSION = policy('terms').version;
