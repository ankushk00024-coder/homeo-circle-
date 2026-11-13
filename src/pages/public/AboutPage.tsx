import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { MEMBERSHIP_CATEGORIES, INDEPENDENCE_DISCLAIMER } from '../../lib/membership';

const Item: React.FC<{ tone: 'yes' | 'no'; children: React.ReactNode }> = ({ tone, children }) => (
  <li className="flex items-start gap-2">
    <span className={tone === 'yes' ? 'text-teal-600 font-bold' : 'text-rose-500 font-bold'}>&bull;</span>
    <span>{children}</span>
  </li>
);

export const AboutPage: React.FC = () => (
  <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
    <div className="text-center space-y-4">
      <span className="text-xs font-bold text-teal-700 tracking-wider uppercase">About us</span>
      <h1 className="text-4xl font-serif font-bold text-brand-navy">About Homeo India</h1>
      <p className="text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
        HomeoIndia is an independent platform created to facilitate academic learning, professional networking, educational discussions and knowledge sharing within the homoeopathic community.
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="bg-white rounded-2xl p-7 border border-teal-100 shadow-card space-y-4">
        <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center"><CheckCircle2 className="w-5 h-5" /></div>
        <h2 className="text-lg font-bold text-brand-navy">What Homeo India is</h2>
        <ul className="space-y-2.5 text-sm text-slate-600">
          <Item tone="yes">A community for homoeopathic practitioners, BHMS students, interns, qualified graduates and academics in India.</Item>
          <Item tone="yes">A place for educational case discussions, mentoring and sharing research.</Item>
          <Item tone="yes">A listing of academic events, webinars and workshops.</Item>
          <Item tone="yes">Committed to patient privacy: cases must be fully de-identified.</Item>
        </ul>
      </div>
      <div className="bg-white rounded-2xl p-7 border border-rose-100 shadow-card space-y-4">
        <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center"><AlertCircle className="w-5 h-5" /></div>
        <h2 className="text-lg font-bold text-brand-navy">What Homeo India is not</h2>
        <ul className="space-y-2.5 text-sm text-slate-600">
          <Item tone="no"><strong>Not a government body or register.</strong> We are not a statutory council, licensing body or registration authority, and membership grants no right to practise.</Item>
          <Item tone="no"><strong>Not a consultation service.</strong> We do not give medical advice to the public or provide emergency help.</Item>
          <Item tone="no"><strong>Not an endorsement.</strong> A badge shows what we checked, not anyone's clinical competence.</Item>
          <Item tone="no"><strong>Not a CME provider.</strong> Events carry credits only where an event states a confirmed accreditation.</Item>
        </ul>
      </div>
    </div>

    <div id="verification" className="bg-slate-50 rounded-2xl p-8 border border-slate-200/80 space-y-4 scroll-mt-24">
      <h3 className="text-lg font-serif font-bold text-brand-navy flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-teal-700" />How verification works</h3>
      <p className="text-sm text-slate-600 leading-relaxed">
        HomeoIndia reviews the academic and professional information submitted by members. Registered-practitioner status is displayed only after checking applicable professional registration records.
      </p>
      <ul className="grid gap-2 sm:grid-cols-2 text-sm">
        {MEMBERSHIP_CATEGORIES.map((c) => (
          <li key={c.value} className="rounded-xl bg-white p-3 ring-1 ring-slate-200">
            <span className="font-semibold text-brand-navy">{c.label}</span>
            <span className="block text-xs text-slate-500">Badge: {c.badge}</span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-slate-500">Read the full <Link to="/verification-policy" className="text-teal-700 underline">Verification Policy</Link>.</p>
    </div>

    <p className="text-center text-xs text-slate-500">{INDEPENDENCE_DISCLAIMER}</p>

    <div className="text-center">
      <Link to="/apply" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-teal text-white text-sm font-semibold hover:bg-brand-teal-hover transition">
        Join Homeo India <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  </div>
);
