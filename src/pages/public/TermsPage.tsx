import React from 'react';
import { Scale, AlertCircle, FileCheck } from 'lucide-react';

export const TermsPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="text-center space-y-3">
        <span className="text-xs font-bold text-teal-700 tracking-wider uppercase">
          Legal Agreement
        </span>
        <h1 className="text-4xl font-serif font-bold text-brand-navy">
          Terms of Use & Clinical Disclaimer
        </h1>
        <p className="text-xs text-slate-500">Effective from October 2026</p>
      </div>

      <div className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-card space-y-8 text-xs sm:text-sm text-slate-600 leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-base font-bold text-brand-navy flex items-center gap-2">
            <Scale className="w-4 h-4 text-teal-600" />
            <span>1. Eligibility Representation</span>
          </h2>
          <p>
            By applying for or accessing a verified account on Homeo Circle, you legally represent and warrant that you hold a valid, unrevoked registration as a homoeopathic medical practitioner under the National Commission for Homoeopathy Act, 2020 or relevant State legislation in India. Any misrepresentation of credentials or submission of fraudulent registration details will result in immediate termination and may be reported to statutory bodies.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-brand-navy flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <span>2. Comprehensive Clinical Disclaimer</span>
          </h2>
          <p>
            Homeo Circle is an academic and clinical peer discussion platform. Content published on this service—including case analyses, remedy selections, posology observations, and forum discussions—is provided for peer educational exchange only.
          </p>
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs">
            <strong>Notice:</strong> Community discussions do not constitute clinical guidelines, medical advice, or treatment endorsement. Every practitioner remains exclusively responsible for exercising their own independent clinical judgment in diagnosing and treating patients.
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-brand-navy flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-teal-600" />
            <span>3. Nature of "Verified Practitioner" Status</span>
          </h2>
          <p>
            The "Verified Practitioner" badge indicates solely that Homeo Circle’s administration has cross-checked the user’s submitted registration identifier against an official central or state register. It does NOT constitute an endorsement, certificate of clinical competence, or guarantee of treatment efficacy.
          </p>
        </section>
      </div>
    </div>
  );
};
