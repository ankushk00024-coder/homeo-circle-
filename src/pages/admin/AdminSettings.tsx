import React, { useState } from 'react';
import { Shield, Key, Lock, Users, CheckCircle2, AlertTriangle } from 'lucide-react';

export const AdminSettings: React.FC = () => {
  const [autoAppeal, setAutoAppeal] = useState(true);
  const [requireRenewalSlips, setRequireRenewalSlips] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-brand-navy">
          Platform Administration & Security Settings
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Super-admin controls for verification protocols and least-privilege role delegation.
        </p>
      </div>

      {saved && (
        <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl flex items-center gap-2 text-teal-800 text-xs">
          <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0" />
          <span>Security and verification rules updated.</span>
        </div>
      )}

      {/* Verification Parameters */}
      <form onSubmit={handleSave} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-card space-y-5">
        <h2 className="text-sm font-bold text-brand-navy flex items-center gap-2">
          <Shield className="w-4 h-4 text-teal-700" />
          <span>Statutory Review Protocol Parameters</span>
        </h2>

        <div className="space-y-3 text-xs text-slate-700">
          <label className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl cursor-pointer">
            <div>
              <span className="font-semibold block">Enable Self-Service Appeals for Held Applicants</span>
              <span className="text-[11px] text-slate-500">Allows practitioners with spelling discrepancies to submit gazette renewal receipts directly.</span>
            </div>
            <input
              type="checkbox"
              checked={autoAppeal}
              onChange={(e) => setAutoAppeal(e.target.checked)}
              className="rounded text-teal-700 focus:ring-teal-500 h-4 w-4"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl cursor-pointer">
            <div>
              <span className="font-semibold block">Enforce Mandatory State Board Renewal Upload</span>
              <span className="text-[11px] text-slate-500">Require document upload if registration year is older than 5 years without digital portal entry.</span>
            </div>
            <input
              type="checkbox"
              checked={requireRenewalSlips}
              onChange={(e) => setRequireRenewalSlips(e.target.checked)}
              className="rounded text-teal-700 focus:ring-teal-500 h-4 w-4"
            />
          </label>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold shadow transition"
          >
            Save Protocol Settings
          </button>
        </div>
      </form>

      {/* Admin Privileges Roster */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-card space-y-4">
        <h2 className="text-sm font-bold text-brand-navy flex items-center gap-2">
          <Users className="w-4 h-4 text-teal-700" />
          <span>Authorized Administrative Reviewers (Least Privilege)</span>
        </h2>

        <div className="divide-y divide-slate-100 text-xs">
          <div className="py-3 flex items-center justify-between">
            <div>
              <span className="font-bold text-brand-navy block">Dr. Sanjeev Bannerjee</span>
              <span className="text-[11px] text-slate-500">admin@homeocircle.in • Reg: NCH/SUPER/2006/0012</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
              Super Admin
            </span>
          </div>

          <div className="py-3 flex items-center justify-between">
            <div>
              <span className="font-bold text-brand-navy block">Dr. Ananya Sharma</span>
              <span className="text-[11px] text-slate-500">ananya@homeocircle.in • Reg: NCH/HOM/2014/0921</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
              Verified Member
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
