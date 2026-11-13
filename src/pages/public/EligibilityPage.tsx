import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Info } from 'lucide-react';
import { MEMBERSHIP_CATEGORIES, INDEPENDENCE_DISCLAIMER } from '../../lib/membership';

export const EligibilityPage: React.FC = () => (
  <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
    <div className="text-center space-y-4">
      <span className="text-xs font-bold text-teal-700 tracking-wider uppercase">Membership</span>
      <h1 className="text-4xl font-serif font-bold text-brand-navy">Who can join Homeo India</h1>
      <p className="text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
        Homeo India is open to people aged 18 or over in five categories. Each is verified differently, and each has its own badge.
      </p>
    </div>

    <div className="grid gap-4 sm:grid-cols-2">
      {MEMBERSHIP_CATEGORIES.map((c) => (
        <div key={c.value} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-card space-y-3">
          <h2 className="text-lg font-bold text-brand-navy">{c.label}</h2>
          <p className="text-sm text-slate-600">{c.who}</p>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">What you'll need</p>
            <ul className="mt-1 list-disc pl-5 text-sm text-slate-600 space-y-0.5">{c.needs.map((n) => <li key={n}>{n}</li>)}</ul>
          </div>
          <p className="text-xs text-slate-500">Badge: <strong className="text-brand-navy">{c.badge}</strong></p>
          <Link to={`/apply?role=${c.value}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:underline">Apply as {c.short.toLowerCase()} <ArrowRight className="h-4 w-4" /></Link>
        </div>
      ))}
    </div>

    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 space-y-3 text-sm text-slate-600 leading-relaxed">
      <p className="flex items-start gap-2 font-semibold text-brand-navy"><Info className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />Important</p>
      <ul className="list-disc pl-5 space-y-1.5">
        <li>Under the National Commission for Homoeopathy Act, 2020, practising homoeopathy generally requires enrolment in a State Register or the National Register. Homeo India does not decide who may practise.</li>
        <li>Having a degree or diploma does not by itself mean a person is currently registered. We do not assume that any qualification — including older diplomas — automatically gives a right to current registration.</li>
        <li>Students and interns join in their own categories and are never asked to claim that they are registered practitioners.</li>
        <li>The "Verified Registered Practitioner" badge is shown only after a member's registration has been checked against registration records.</li>
      </ul>
      <p>See the <Link to="/verification-policy" className="text-teal-700 underline">Verification Policy</Link> for details.</p>
    </div>

    <p className="text-center text-xs text-slate-500">{INDEPENDENCE_DISCLAIMER}</p>
  </div>
);
