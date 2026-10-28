import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, HeartPulse, Scale, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Header */}
      <div className="text-center space-y-4">
        <span className="text-xs font-bold text-teal-700 tracking-wider uppercase">
          Mission & Governance
        </span>
        <h1 className="text-4xl font-serif font-bold text-brand-navy">
          About Homeo Circle India
        </h1>
        <p className="text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
          A dedicated sanctuary for registered homoeopathic medical professionals in India to collaborate, exchange clinical case observations, and foster evidence-based research.
        </p>
      </div>

      {/* Scope and Non-Scope Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl p-7 border border-teal-100 shadow-card space-y-4">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-brand-navy">What Homeo Circle Is</h2>
          <ul className="space-y-2.5 text-xs text-slate-600">
            <li className="flex items-start gap-2">
              <span className="text-teal-600 font-bold">&bull;</span>
              <span>An exclusive, verified peer network for legally registered homoeopaths in India.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-teal-600 font-bold">&bull;</span>
              <span>A platform for academic case repertorization, posology dialogue, and clinical feedback.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-teal-600 font-bold">&bull;</span>
              <span>A repository of accredited CMEs, clinical webinars, and research fellowship opportunities.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-teal-600 font-bold">&bull;</span>
              <span>A champion of ethical practice, scientific inquiry, and DISHA patient data de-identification.</span>
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-2xl p-7 border border-rose-100 shadow-card space-y-4">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <AlertCircle className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-brand-navy">What Homeo Circle Is Not</h2>
          <ul className="space-y-2.5 text-xs text-slate-600">
            <li className="flex items-start gap-2">
              <span className="text-rose-500 font-bold">&bull;</span>
              <span><strong>Not a patient consultation service:</strong> We do not offer telemedicine or public medical advice.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rose-500 font-bold">&bull;</span>
              <span><strong>Not an endorsement of competence:</strong> Verification confirms that registration was checked on official gazettes, not clinical outcomes.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rose-500 font-bold">&bull;</span>
              <span><strong>Not a marketplace for unverified remedies:</strong> Commercial product promotion and miracle cure claims are banned.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Verification Integrity Principle */}
      <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200/80 space-y-4">
        <h3 className="text-lg font-serif font-bold text-brand-navy">
          The Verification Principle
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          In India, the practice of homoeopathy is regulated under the National Commission for Homoeopathy Act, 2020. Practitioners are legally mandated to be enrolled in the Central Register of Homoeopathy or the relevant State Homoeopathic Register. 
        </p>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Homeo Circle adheres strictly to this statutory framework. Every applicant must submit their official registration number and state council authority. In v1 of our platform, each record is manually audited by authorized practitioners before access to the member network is granted.
        </p>
      </div>

      {/* Action Banner */}
      <div className="text-center pt-4">
        <Link
          to="/apply?role=doctor"
          className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-teal-700 text-white text-sm font-semibold hover:bg-teal-800 shadow transition"
        >
          <span>Apply for Practitioner Verification</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};
