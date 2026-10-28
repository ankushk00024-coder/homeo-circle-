import React, { useState } from 'react';
import { dataService } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { 
  Bell, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink,
  Sparkles,
  X
} from 'lucide-react';

export const AdminNotifications: React.FC = () => {
  const { currentUser } = useAuth();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [link, setLink] = useState('');
  const [targetRole, setTargetRole] = useState<'all' | 'doctor' | 'student' | 'researcher'>('all');
  const [noticeType, setNoticeType] = useState<'system_notice' | 'announcement' | 'reminder'>('system_notice');
  const [isSending, setIsSending] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string; count?: number } | null>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    if (!window.confirm(`Broadcast notification to ${targetRole === 'all' ? 'ALL active members' : `all ${targetRole}s`}?`)) {
      return;
    }

    setIsSending(true);
    setFeedback(null);

    try {
      const actorId = currentUser?.id || 'admin';
      const actorName = currentUser?.display_name || currentUser?.full_name || 'Administrator';

      const result = await dataService.sendBroadcastNotification({
        title: title.trim(),
        message: message.trim(),
        link: link.trim() || undefined,
        type: noticeType,
        targetRole,
        actorId,
        actorName
      });

      setFeedback({
        type: 'success',
        message: `Notification broadcast dispatched successfully to ${result.dispatchedCount} members.`,
        count: result.dispatchedCount
      });

      // Reset form
      setTitle('');
      setMessage('');
      setLink('');
    } catch (err: any) {
      console.error('Failed to send notification broadcast:', err);
      setFeedback({
        type: 'error',
        message: err?.message || 'Failed to dispatch broadcast. Ensure database connectivity and administrator permissions.'
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-serif font-bold text-brand-navy">
            Broadcast Notifications
          </h1>
          <span className="text-[11px] font-semibold text-sky-800 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
            Push Dispatcher
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Send urgent regulatory alerts, statutory compliance advisories, or CME announcements to member notification inboxes.
        </p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compose Form (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <Bell className="w-4 h-4 text-teal-700" />
            <span>Compose Notification Broadcast</span>
          </h2>

          <form onSubmit={handleSend} className="space-y-4 text-xs">
            {/* Target Audience */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                Target Recipient Group *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'all', label: 'All Members', desc: 'Doctors, students, researchers' },
                  { id: 'doctor', label: 'Doctors Only', desc: 'Verified practitioners' },
                  { id: 'student', label: 'Students Only', desc: 'BHMS scholars & interns' },
                  { id: 'researcher', label: 'Researchers', desc: 'Clinical investigators' }
                ].map(group => (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => setTargetRole(group.id as any)}
                    className={`p-2.5 rounded-xl border text-left transition ${
                      targetRole === group.id
                        ? 'bg-teal-50/70 border-teal-600 text-teal-900 font-semibold shadow-xs ring-1 ring-teal-600'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <div className="text-xs">{group.label}</div>
                    <div className="text-[10px] text-slate-400 font-normal">{group.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Notification Type */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Notice Classification *
              </label>
              <select
                value={noticeType}
                onChange={(e) => setNoticeType(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none bg-white text-slate-700"
              >
                <option value="system_notice">System Regulatory Notice</option>
                <option value="announcement">Community Announcement</option>
                <option value="reminder">CME / Event Reminder</option>
              </select>
            </div>

            {/* Title */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Notification Headline *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. National Commission for Homoeopathy (NCH) Gazette Update"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 text-xs"
              />
            </div>

            {/* Message Body */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Detailed Message Body *
              </label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter detailed message text to be displayed in recipient notifications..."
                className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 text-xs leading-relaxed"
              />
            </div>

            {/* Action Link (Optional) */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Optional In-App Action Link
              </label>
              <input
                type="text"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="e.g. /events or /knowledge/nch-guidelines-2024"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-xs outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
              />
              <p className="text-[10px] text-slate-400 mt-1">Recipients can click to directly navigate to this module.</p>
            </div>

            {/* Submit */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Audited action: All dispatches are logged to permanent audit ledger.
              </span>
              <button
                type="submit"
                disabled={isSending || !title.trim() || !message.trim()}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs transition"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSending ? 'Dispatching Broadcast...' : 'Dispatch Notification'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Live Notification Preview (1 col) */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-sky-600" />
            <span>Member In-App Preview</span>
          </h2>

          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 space-y-3">
            <div className="flex items-center justify-between text-[11px] text-slate-400 pb-2 border-b border-slate-100">
              <span>Notification Card</span>
              <span className="font-semibold text-teal-800 uppercase text-[9px] bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                {noticeType.replace('_', ' ')}
              </span>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bell className="w-4 h-4" />
              </div>
              <div className="space-y-1 min-w-0">
                <h4 className="text-xs font-bold text-brand-navy leading-snug">
                  {title || 'Headline will appear here...'}
                </h4>
                <p className="text-[11px] text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {message || 'The detailed message content will appear in this format in member notification trays across mobile and desktop interfaces.'}
                </p>
                {link && (
                  <div className="pt-1">
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-teal-700 hover:underline">
                      <span>View details</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </span>
                  </div>
                )}
                <p className="text-[9px] text-slate-400 pt-1">Just now • Official Notice</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1.5">
            <h4 className="font-bold text-brand-navy text-xs">Broadcast Policies</h4>
            <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-500">
              <li>Suspended member accounts are automatically excluded from broadcasts.</li>
              <li>Dispatches are throttled in batches of 100 to prevent Supabase connection exhaustion.</li>
              <li>Every recipient receives an individualized row with reading status tracking.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
