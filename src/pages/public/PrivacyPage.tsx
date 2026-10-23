import React from 'react';
import { Lock, EyeOff, ShieldCheck, Database, FileText } from 'lucide-react';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="text-center space-y-3">
        <span className="text-xs font-bold text-teal-700 tracking-wider uppercase">
          Data Protection
        </span>
        <h1 className="text-4xl font-serif font-bold text-brand-navy">
          Privacy Policy & Credential Handling
        </h1>
        <p className="text-xs text-slate-500">Last updated: October 2026</p>
      </div>

      <div className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-card space-y-8 text-xs sm:text-sm text-slate-600 leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-base font-bold text-brand-navy flex items-center gap-2">
            <Database className="w-4 h-4 text-teal-600" />
            <span>1. Information We Collect</span>
          </h2>
          <p>
            When you apply for membership on Homeo Circle, we collect:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Identity & Credentials:</strong> Full legal name, medical qualification (BHMS, MD), state/central registration number, and state council authority.</li>
            <li><strong>Contact Details:</strong> Verified email address and practitioner contact telephone number.</li>
            <li><strong>Practice Context:</strong> Clinic or institutional affiliation, primary city and state, and years of clinical experience.</li>
            <li><strong>Verification Records:</strong> Date of application submission, verification source consulted, reviewer audit timestamps, and notes.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-brand-navy flex items-center gap-2">
            <Lock className="w-4 h-4 text-teal-600" />
            <span>2. Verification Document Security</span>
          </h2>
          <p>
            Any supporting verification documents uploaded by an applicant are stored in a private Supabase Storage bucket. Access is strictly controlled via database Row Level Security (RLS) policies. These documents are never indexed in public directories, never accessible to other community members, and accessible exclusively to authorized verification officers for the sole purpose of confirming registration status.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-brand-navy flex items-center gap-2">
            <EyeOff className="w-4 h-4 text-teal-600" />
            <span>3. Privacy Defaults for Member Profiles</span>
          </h2>
          <p>
            By default, upon approval, only safe member-visible fields are visible to other verified members:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Visible to Verified Peers:</strong> Display name, verified status badge, state, institution, professional interests, and academic posts.</li>
            <li><strong>Strictly Private:</strong> Personal phone number, private verification documents, internal admin verification notes, and account passwords.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-brand-navy flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>4. Data Retention & Deletion</span>
          </h2>
          <p>
            Practitioners have the right to request deletion of their account and profile data at any time through their settings or by contacting <code className="bg-slate-100 px-1 py-0.5 rounded text-brand-navy">privacy@homeocircle.in</code>. Basic audit logs of registration decisions are retained for compliance records with statutory authorities.
          </p>
        </section>
      </div>
    </div>
  );
};
