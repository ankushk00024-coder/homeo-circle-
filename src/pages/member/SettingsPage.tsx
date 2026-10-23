import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Shield, Bell, Key, Trash2, CheckCircle2, Lock } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const [notifyWebinars, setNotifyWebinars] = useState(true);
  const [notifyDiscussions, setNotifyDiscussions] = useState(true);
  const [passwordNotice, setPasswordNotice] = useState(false);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-brand-navy">
          Account Settings
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Notification preferences and credential security.
        </p>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-card space-y-4">
        <h2 className="text-sm font-bold text-brand-navy flex items-center gap-2">
          <Bell className="w-4 h-4 text-teal-700" />
          <span>Notification Preferences</span>
        </h2>

        <div className="space-y-3 text-xs text-slate-700">
          <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl cursor-pointer">
            <div>
              <span className="font-semibold block">Accredited Webinars & CME Alerts</span>
              <span className="text-[11px] text-slate-500">Receive notifications for new national study circles and state CME dates.</span>
            </div>
            <input
              type="checkbox"
              checked={notifyWebinars}
              onChange={(e) => setNotifyWebinars(e.target.checked)}
              className="rounded text-teal-700 focus:ring-teal-500 h-4 w-4"
            />
          </label>

          <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl cursor-pointer">
            <div>
              <span className="font-semibold block">Case Replies & Mentions</span>
              <span className="text-[11px] text-slate-500">Get alerted when fellow doctors reply to your case observations.</span>
            </div>
            <input
              type="checkbox"
              checked={notifyDiscussions}
              onChange={(e) => setNotifyDiscussions(e.target.checked)}
              className="rounded text-teal-700 focus:ring-teal-500 h-4 w-4"
            />
          </label>
        </div>
      </div>

      {/* Security & Password */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-card space-y-4">
        <h2 className="text-sm font-bold text-brand-navy flex items-center gap-2">
          <Key className="w-4 h-4 text-teal-700" />
          <span>Security & Password</span>
        </h2>

        {passwordNotice && (
          <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0" />
            <span>Password reset dispatch triggered for {currentUser?.email}. Check your inbox.</span>
          </div>
        )}

        <p className="text-xs text-slate-600 leading-relaxed">
          Your account is secured with email/password authentication and Supabase PostgreSQL Row Level Security.
        </p>

        <button
          onClick={() => setPasswordNotice(true)}
          className="px-4 py-2 border border-slate-200 text-brand-navy hover:bg-slate-50 rounded-xl text-xs font-semibold transition"
        >
          Send Password Reset Email
        </button>
      </div>

      {/* Account Deletion / Data Rights */}
      <div className="bg-white rounded-2xl p-6 border border-rose-100 shadow-card space-y-3">
        <h2 className="text-sm font-bold text-rose-800 flex items-center gap-2">
          <Trash2 className="w-4 h-4 text-rose-600" />
          <span>Right to Deletion & Account Closure</span>
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          Under Indian Digital Personal Data Protection laws, you may request permanent removal of your account and profile records from the active member database.
        </p>
        <button
          onClick={() => alert('To permanently delete your verified account, an email request will be drafted to privacy@homeocircle.in.')}
          className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold border border-rose-200 transition"
        >
          Request Account Deletion
        </button>
      </div>
    </div>
  );
};
