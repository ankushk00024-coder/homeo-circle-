import React, { useState, useEffect } from 'react';
import { dataService } from '../../lib/supabase';
import { PlatformSettings } from '../../types';
import { 
  Shield, 
  Key, 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  Stethoscope, 
  GraduationCap, 
  Microscope, 
  Info,
  RefreshCw,
  X,
  Megaphone
} from 'lucide-react';

export const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState<PlatformSettings>({
    require_doctor_verification: true,
    require_researcher_verification: true,
    require_student_verification: false,
    allow_student_mentorship_requests: true,
    auto_appeal_enabled: true,
    announcement_banner: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadSettings = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const s = await dataService.getPlatformSettings();
      setSettings(s);
    } catch (err: any) {
      console.error('Failed to load settings:', err);
      setFeedback({
        type: 'error',
        message: err?.message || 'Could not load platform settings.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleToggle = (key: keyof PlatformSettings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    try {
      const updated = await dataService.updatePlatformSettings(settings);
      setSettings(updated);
      setFeedback({
        type: 'success',
        message: 'Platform onboarding verification gates and settings saved successfully.'
      });
    } catch (err: any) {
      console.error('Failed to save settings:', err);
      setFeedback({
        type: 'error',
        message: err?.message || 'Failed to update platform settings. Administrator role permissions required.'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-serif font-bold text-brand-navy">
              Platform Configuration & Policies
            </h1>
            <span className="text-[11px] font-semibold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
              Governance Gates
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configure role-based onboarding gates, statutory verification requirements, and broadcast announcements.
          </p>
        </div>

        <button
          onClick={loadSettings}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-teal-600' : 'text-slate-500'}`} />
          <span>Reload</span>
        </button>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div className={`p-4 rounded-xl border text-xs flex items-center justify-between ${
          feedback.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
            : 'bg-rose-50 border-rose-200 text-rose-900'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Role Verification Policy Configuration */}
      <form onSubmit={handleSave} className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-brand-navy flex items-center gap-2">
            <Shield className="w-4 h-4 text-teal-700" />
            <span>Role-Based Verification Gates</span>
          </h2>
          <span className="text-[11px] font-semibold text-slate-400">
            Admins decide which roles require statutory gazette checks
          </span>
        </div>

        <div className="space-y-4">
          <label className="flex items-start justify-between p-4 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100/70 transition border border-slate-200/60">
            <div className="flex items-start gap-3">
              <Stethoscope className="w-5 h-5 text-teal-700 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-xs font-bold text-brand-navy block">
                  Mandatory Doctor / Practitioner Verification
                </span>
                <span className="text-[11px] text-slate-500 leading-relaxed block mt-0.5">
                  When enabled, doctor registrations start in <strong>Pending</strong> status until verified against Central Council (NCH) or State Board registration records.
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

          <label className="flex items-start justify-between p-4 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100/70 transition border border-slate-200/60">
            <div className="flex items-start gap-3">
              <Microscope className="w-5 h-5 text-purple-700 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-xs font-bold text-brand-navy block">
                  Mandatory Academic Researcher Verification
                </span>
                <span className="text-[11px] text-slate-500 leading-relaxed block mt-0.5">
                  When enabled, researcher accounts must provide verified university affiliation, institutional email, or ORCID identifier before obtaining publishing rights.
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

          <label className="flex items-start justify-between p-4 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100/70 transition border border-slate-200/60">
            <div className="flex items-start gap-3">
              <GraduationCap className="w-5 h-5 text-blue-700 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-xs font-bold text-brand-navy block">
                  Student Medical College ID Check
                </span>
                <span className="text-[11px] text-slate-500 leading-relaxed block mt-0.5">
                  When enabled, homoeopathic students must upload college ID or enrollment slip to access the Student Corner.
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

          <label className="flex items-start justify-between p-4 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100/70 transition border border-slate-200/60">
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
              checked={settings.allow_student_mentorship_requests ?? true}
              onChange={() => handleToggle('allow_student_mentorship_requests')}
              className="rounded text-teal-700 focus:ring-teal-500 h-4 w-4 mt-1"
            />
          </label>
        </div>

        {/* Global Announcement Banner Field */}
        <div className="pt-2 border-t border-slate-100">
          <label className="block text-xs font-bold text-brand-navy mb-1.5 flex items-center gap-1.5">
            <Megaphone className="w-4 h-4 text-amber-600" />
            <span>Community-Wide Banner Announcement (Optional)</span>
          </label>
          <input
            type="text"
            value={settings.announcement_banner || ''}
            onChange={(e) => setSettings({ ...settings, announcement_banner: e.target.value })}
            placeholder="e.g. Annual National Homoeopathic Congress registrations now open for delegates."
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
          />
          <p className="text-[10px] text-slate-400 mt-1">
            Displayed across member dashboards when non-empty.
          </p>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs transition"
          >
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </form>

      {/* Super Admin Security Provisioning Guide */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-brand-navy flex items-center gap-2">
          <Key className="w-4 h-4 text-teal-700" />
          <span>Super Admin Security Provisioning (Zero Client-Side Elevation)</span>
        </h2>

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-2">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <Info className="w-4 h-4 text-teal-700" />
            <span>Concurrency-Safe Stored Procedure</span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-600">
            Homeo Circle strictly rejects client-side role manipulation. Initial Super Administrator designation is guarded by an advisory transaction lock. Execute the database procedure via the Supabase SQL editor:
          </p>
          <pre className="p-3 bg-slate-900 text-teal-300 rounded-xl text-[11px] font-mono overflow-x-auto">
{`-- Atomic elevation with concurrency advisory lock:
CALL public.provision_first_super_admin('admin@homeocircle.in');`}
          </pre>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          <div className="py-3 flex items-center justify-between">
            <div>
              <span className="font-bold text-brand-navy block">Super Administrator Console</span>
              <span className="text-[11px] text-slate-500">Service-role secret keys are never bundled in frontend code.</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
              Strict RLS Guarded
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
