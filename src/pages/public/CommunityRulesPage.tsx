import React from 'react';
import { Shield, Lock, AlertTriangle, CheckCircle2, MessageSquare, Scale } from 'lucide-react';

export const CommunityRulesPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Title */}
      <div className="text-center space-y-4">
        <span className="text-xs font-bold text-teal-700 tracking-wider uppercase">
          Ethical Charter
        </span>
        <h1 className="text-4xl font-serif font-bold text-brand-navy">
          Community Rules & Clinical Standards
        </h1>
        <p className="text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Homeo Circle is committed to maintaining high standards of clinical rigor, academic integrity, and legal compliance. All members agree to uphold these standards.
        </p>
      </div>

      {/* Rule 1: Patient Privacy (Crucial) */}
      <div id="patient-privacy" className="bg-white rounded-2xl p-7 border-2 border-teal-500/30 shadow-card space-y-4">
        <div className="flex items-center gap-3 text-teal-800 font-bold text-lg">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <h2>1. Strict Patient Privacy & De-Identification (Mandatory)</h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
          In strict compliance with national health privacy regulations (DISHA and DPDP Act, 2023), NO patient-identifying data may be shared in community discussions or case presentations:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs text-slate-600">
          <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-100 flex items-start gap-2">
            <span className="text-rose-600 font-bold text-sm leading-none">&times;</span>
            <span>Do NOT post patient photographs showing facial features, eyes, or identifying marks.</span>
          </div>
          <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-100 flex items-start gap-2">
            <span className="text-rose-600 font-bold text-sm leading-none">&times;</span>
            <span>Do NOT post real patient names, Aadhaar numbers, ABHA IDs, phone numbers, or addresses.</span>
          </div>
          <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 flex items-start gap-2">
            <span className="text-emerald-600 font-bold text-sm leading-none">&#10003;</span>
            <span>Use generic age and gender descriptors (e.g. "A 42-year-old female presenting with chronic urticaria").</span>
          </div>
          <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 flex items-start gap-2">
            <span className="text-emerald-600 font-bold text-sm leading-none">&#10003;</span>
            <span>Focus case discussions strictly on symptom totality, rubrics, repertorial analysis, and posology.</span>
          </div>
        </div>
      </div>

      {/* Rule 2: Scientific & Academic Integrity */}
      <div className="bg-white rounded-2xl p-7 border border-slate-200/80 shadow-card space-y-4">
        <div className="flex items-center gap-3 text-brand-navy font-bold text-lg">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
            <Scale className="w-5 h-5" />
          </div>
          <h2>2. Scientific Rigor & No Guaranteed Outcome Claims</h2>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          While homoeopathy honors individualization, discussions must maintain academic decorum:
        </p>
        <ul className="space-y-2 text-xs text-slate-600">
          <li className="flex items-start gap-2">
            <span className="text-teal-600 font-bold">&bull;</span>
            <span>Do not promote single remedies as "universal miracle cures" or guarantees for incurable conditions.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal-600 font-bold">&bull;</span>
            <span>When citing research studies, always mention sample size, study design, and known limitations.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal-600 font-bold">&bull;</span>
            <span>Include primary journal DOIs or official institutional links whenever referencing clinical trials.</span>
          </li>
        </ul>
      </div>

      {/* Rule 3: Commercial Promotion & Advertising */}
      <div className="bg-white rounded-2xl p-7 border border-slate-200/80 shadow-card space-y-4">
        <div className="flex items-center gap-3 text-brand-navy font-bold text-lg">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <h2>3. Zero Tolerance for Spam & Direct Remedy Selling</h2>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Homeo Circle is an intellectual sanctuary, not an advertising channel:
        </p>
        <ul className="space-y-2 text-xs text-slate-600">
          <li className="flex items-start gap-2">
            <span className="text-teal-600 font-bold">&bull;</span>
            <span>Unsolicited commercial advertisements, patented product sales pitches, and affiliate links are prohibited.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal-600 font-bold">&bull;</span>
            <span>Job openings and academic conferences should be posted in the dedicated Opportunities and Events modules.</span>
          </li>
        </ul>
      </div>

      {/* Rule 4: Moderation & Sanctions */}
      <div className="bg-slate-50 rounded-2xl p-7 border border-slate-200/80 space-y-4">
        <div className="flex items-center gap-3 text-brand-navy font-bold text-lg">
          <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <h2>4. Community Reporting & Moderation Protocol</h2>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Members are encouraged to flag inappropriate submissions using the "Report Content" option on any post or comment. Reports are reviewed by the administration panel within 12 hours:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600 pt-1">
          <div className="p-3 bg-white rounded-xl border border-slate-200">
            <span className="font-bold text-brand-navy block mb-1">First Infraction</span>
            <span>Post hidden, private educational guidance sent to author.</span>
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-200">
            <span className="font-bold text-brand-navy block mb-1">Repeated Breach</span>
            <span>Temporary 14-day posting suspension applied.</span>
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-200">
            <span className="font-bold text-brand-navy block mb-1">Severe / Privacy Breach</span>
            <span>Immediate account suspension and revocation of verified badge.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
