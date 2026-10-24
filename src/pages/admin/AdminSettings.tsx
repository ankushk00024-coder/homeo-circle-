import React, { useState, useEffect } from 'react';
import { dataService } from '../../lib/supabase';
import { PlatformSettings } from '../../types';
import { 
  Shield, 
  Key, 
  Lock, 
  Users, 
  CheckCircle2, 
  AlertTriangle,
  Settings,
  Stethoscope,
  GraduationCap,
  Microscope,
  Info
} from 'lucide-react';

export const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState<PlatformSettings>({
    require_doctor_verification: true,
    require_researcher_verification: true,
    require_student_verification: false,
    allow_student_mentorship_requests: true,
    auto_appeal_enabled: true
  });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dataService.getPlatformSettings().then(s => {
      setSettings(s);
      setLoading(false);
    });
  }, []);

  const handleToggle = (key: keyof PlatformSettings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dataService.updatePlatformSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3500);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-brand-navy">
          Platform Administration & Verification Policies
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure role-based onboarding verification gates and administrative access rules.
        </p>
      </div>

      {saved && (
        <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl flex items-center gap-2 text-teal-800 text-xs animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0" />
          <span>Platform configuration and verification requirements saved successfully.</span>
        </div>
      )}

      {/* Role Verification Policy Configuration */}
      <form onSubmit={handleSave} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-card space-y-6">
        <div className="flex items-center justify-between border-b pb-3">
          <h2 className="text-sm font-bold text-brand-navy flex items-center gap-2">
            <Shield className="w-4 h-4 text-teal-700" />
            <span>Role-Based Verification Gates</span>
          </h2>
          <span className="text-[11px] font-semibold text-slate-400">
            Admins decide which roles require manual or council document verification
          </span>
        </div>

        <div className="space-y-4">
          <label className="flex items-start justify-between p-4 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100/70 transition">
            <div className="flex items-start gap-3">
              <Stethoscope className="w-5 h-5 text-teal-700 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-xs font-bold text-brand-navy block">
                  Mandatory Doctor / Practitioner Verification
                </span>
                <span className="text-[11px] text-slate-500 leading-relaxed block mt-0.5">
                  When enabled, doctor registrations start in <strong>Pending</strong> status until an admin verifies their Central Council (NCH) or State Board registration number against official gazettes.
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.require_doctor_verification}
              onChange={() => handleToggle('require_doctor_verification')}
              className="rounded text-teal-700 focus:ring-teal-500 h-4 w-4 mt-1"
            />
          </label>

          <label className="flex items-start justify-between p-4 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100/70 transition">
            <div className="flex items-start gap-3">
              <Microscope className="w-5 h-5 text-purple-700 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-xs font-bold text-brand-navy block">
                  Mandatory Academic Researcher Verification
                </span>
                <span className="text-[11px] text-slate-500 leading-relaxed block mt-0.5">
                  When enabled, researcher accounts must provide verified university affiliation, institutional email, or ORCID identifier before obtaining publishing rights in the Research Library.
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.require_researcher_verification}
              onChange={() => handleToggle('require_researcher_verification')}
              className="rounded text-teal-700 focus:ring-teal-500 h-4 w-4 mt-1"
            />
          </label>

          <label className="flex items-start justify-between p-4 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100/70 transition">
            <div className="flex items-start gap-3">
              <GraduationCap className="w-5 h-5 text-blue-700 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-xs font-bold text-brand-navy block">
                  Student Medical College ID Check
                </span>
                <span className="text-[11px] text-slate-500 leading-relaxed block mt-0.5">
                  When enabled, homoeopathic students must upload college ID / enrollment slip to access the Student Corner and send clinical mentorship requests. (Default: Instant Community Access).
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.require_student_verification}
              onChange={() => handleToggle('require_student_verification')}
              className="rounded text-teal-700 focus:ring-teal-500 h-4 w-4 mt-1"
            />
          </label>

          <label className="flex items-start justify-between p-4 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100/70 transition">
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-teal-700 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-xs font-bold text-brand-navy block">
                  Permit Student Mentorship Requests to Verified Doctors
                </span>
                <span className="text-[11px] text-slate-500 leading-relaxed block mt-0.5">
                  Allows students to submit structured clinical case-taking and repertory mentorship requests to willing doctors.
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.allow_student_mentorship_requests}
              onChange={() => handleToggle('allow_student_mentorship_requests')}
              className="rounded text-teal-700 focus:ring-teal-500 h-4 w-4 mt-1"
            />
          </label>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold shadow transition"
          >
            Save Verification Policies
          </button>
        </div>
      </form>

      {/* Super Admin Security Provisioning Guide */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-card space-y-4">
        <h2 className="text-sm font-bold text-brand-navy flex items-center gap-2">
          <Key className="w-4 h-4 text-teal-700" />
          <span>Super Admin Provisioning Protocol (Zero Client-Side Bypass)</span>
        </h2>

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-2">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <Info className="w-4 h-4 text-teal-700" />
            <span>Secure Backend Elevation Process</span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-600">
            Homeo Circle strictly rejects insecure client-side role manipulation or hard-coded passwords. To designate a new Super Administrator on a production Supabase instance, execute the following SQL migration command with service-role permissions:
          </p>
          <pre className="p-3 bg-slate-900 text-teal-300 rounded-lg text-[11px] font-mono overflow-x-auto">
{`-- Run in Supabase SQL Editor to grant verified administrative rights:
UPDATE public.profiles
SET 
  role = 'super_admin',
  verification_status = 'verified',
  status = 'active'
WHERE email = 'target_admin@homeocircle.in';`}
          </pre>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          <div className="py-3 flex items-center justify-between">
            <div>
              <span className="font-bold text-brand-navy block">Dr. Sanjeev Bannerjee</span>
              <span className="text-[11px] text-slate-500">admin@homeocircle.in • Reg: NCH/SUPER/2006/0012</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
              Super Admin (DB Backed)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
