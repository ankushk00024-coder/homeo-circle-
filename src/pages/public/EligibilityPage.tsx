import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, GraduationCap, Building2, Clock, CheckCircle2, FileQuestion, ArrowRight } from 'lucide-react';

export const EligibilityPage: React.FC = () => {
  const recognizedBoards = [
    'National Commission for Homoeopathy (Central Register)',
    'Maharashtra Council of Homoeopathy, Mumbai',
    'Delhi Homoeopathic Board, New Delhi',
    'Karnataka Board of Homoeopathic System of Medicine, Bengaluru',
    'Council of Homoeopathic System of Medicine, Gujarat',
    'Homoeopathic Medicine Board, Uttar Pradesh',
    'West Bengal Council of Homoeopathy, Kolkata',
    'Kerala State Medical Council (Homoeopathy)',
    'Telangana State Homoeopathic Board, Hyderabad',
    'Tamil Nadu Homoeopathy Medical Council, Chennai',
    'Other Statutory State Homoeopathy Boards established under Indian Law'
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Title */}
      <div className="text-center space-y-4">
        <span className="text-xs font-bold text-teal-700 tracking-wider uppercase">
          Credential Requirements
        </span>
        <h1 className="text-4xl font-serif font-bold text-brand-navy">
          Practitioner Eligibility Guidelines
        </h1>
        <p className="text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Homeo Circle is exclusively restricted to certified homoeopaths licensed to practice under the laws of the Republic of India.
        </p>
      </div>

      {/* Recognized Qualifications */}
      <div className="bg-white rounded-2xl p-7 border border-slate-200/80 shadow-card space-y-4">
        <div className="flex items-center gap-3 text-brand-navy font-bold text-lg">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
            <GraduationCap className="w-5 h-5" />
          </div>
          <h2>Recognized Medical Qualifications</h2>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Applicants must hold a degree included in the Second Schedule of the Homoeopathy Central Council Act, 1973 or recognized under the National Commission for Homoeopathy Act, 2020:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-xs font-bold text-teal-800 block">BHMS</span>
            <span className="text-[11px] text-slate-500">Bachelor of Homoeopathic Medicine and Surgery (5½ year degree program)</span>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-xs font-bold text-teal-800 block">MD (Hom)</span>
            <span className="text-[11px] text-slate-500">Doctor of Medicine in Homoeopathy (Postgraduate specialization)</span>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-xs font-bold text-teal-800 block">DHMS / LCEH</span>
            <span className="text-[11px] text-slate-500">Recognized historical diplomas registered prior to prevailing statutory cutoff dates</span>
          </div>
        </div>
      </div>

      {/* Eligible Registration Authorities */}
      <div className="bg-white rounded-2xl p-7 border border-slate-200/80 shadow-card space-y-4">
        <div className="flex items-center gap-3 text-brand-navy font-bold text-lg">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
          <h2>Statutory Registers & Authorities</h2>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Your active registration number must be verifiable in one of the following gazettes:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          {recognizedBoards.map((board) => (
            <div key={board} className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 text-xs text-slate-700 border border-slate-100">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
              <span>{board}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Review Timelines & Appeals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card space-y-3">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-brand-navy">Review Timelines</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Applications are typically reviewed within <strong>24 to 48 business hours</strong>. Reviewers inspect state portal databases. You can track your status in real-time on your personal status dashboard.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card space-y-3">
          <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center">
            <FileQuestion className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-brand-navy">Appeals & Discrepancies</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            If your registration was recently renewed or contains typographical differences in official gazettes, our review committee will request a copy of your valid renewal slip or gazette notification before making a final determination.
          </p>
        </div>
      </div>

      {/* Apply CTA */}
      <div className="text-center pt-2">
        <Link
          to="/apply?role=doctor"
          className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-teal-700 text-white text-sm font-semibold hover:bg-teal-800 shadow transition"
        >
          <span>Begin Practitioner Application</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};
