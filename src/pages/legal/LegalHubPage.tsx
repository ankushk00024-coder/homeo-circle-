import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, ArrowRight, MessageSquareWarning } from 'lucide-react';
import { POLICIES, OPERATOR, op } from '../../legal/config';
import { INDEPENDENCE_DISCLAIMER } from '../../lib/membership';

const fmt = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export const LegalHubPage: React.FC = () => (
  <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:py-14">
    <h1 className="font-serif text-3xl font-bold text-brand-navy sm:text-4xl">Legal & Policies</h1>
    <p className="mt-2 max-w-2xl text-sm text-slate-600">{INDEPENDENCE_DISCLAIMER}</p>
    <div className="mt-8 grid gap-4 sm:grid-cols-2">
      {POLICIES.map((p) => (
        <Link key={p.key} to={p.path} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-card transition hover:border-teal-300">
          <div className="flex items-start gap-3">
            <FileText className="mt-0.5 h-5 w-5 shrink-0 text-teal-700" />
            <div className="min-w-0">
              <h2 className="font-bold text-brand-navy group-hover:text-teal-700">{p.title}</h2>
              <p className="mt-1 text-sm text-slate-600">{p.summary}</p>
              <p className="mt-2 text-xs text-slate-400">Version {p.version} · effective {fmt(p.effective)}</p>
            </div>
            <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-slate-300 group-hover:text-teal-600" />
          </div>
        </Link>
      ))}
    </div>
    <div className="mt-8 flex flex-col gap-3 rounded-2xl border border-teal-100 bg-teal-50/60 p-5 text-sm sm:flex-row sm:items-center">
      <MessageSquareWarning className="h-5 w-5 shrink-0 text-teal-700" />
      <div className="flex-1">
        <p className="font-semibold text-brand-navy">Questions, complaints or privacy requests</p>
        <p className="text-slate-600">Operator: {op(OPERATOR.legalName)} · Grievance Officer: {op(OPERATOR.grievanceOfficerName)}</p>
      </div>
      <Link to="/contact" className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-teal-700 px-4 py-2 font-semibold text-white hover:bg-teal-800">Contact & complaints</Link>
    </div>
  </div>
);
