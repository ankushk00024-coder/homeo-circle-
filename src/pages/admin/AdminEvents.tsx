import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, X, Award, Trash2 } from 'lucide-react';
import { dataService } from '../../lib/supabase';
import { getRequiredSupabase } from '../../services/supabaseClient';
import { Event } from '../../types';
import { useToast } from '../../components/feedback/ToastProvider';

/**
 * Admin → Academic Events. New events use the same form as the Publishing
 * panel. Accreditation (CME credits) can be recorded here only with the
 * approving body and reference — never assumed.
 */
export const AdminEvents: React.FC = () => {
  const toast = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Event | null>(null);
  const [accredited, setAccredited] = useState(false);
  const [details, setDetails] = useState('');
  const [certificate, setCertificate] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setEvents(await dataService.getEvents()); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openEdit = (e: Event) => {
    setEditing(e);
    setAccredited(e.accreditation_status === 'accredited');
    setDetails(e.accreditation_details || '');
    setCertificate(e.certificate_info || '');
  };

  const save = async () => {
    if (!editing) return;
    if (accredited && !details.trim()) { toast.error('Enter the accrediting body and approval reference.'); return; }
    setSaving(true);
    try {
      const { error } = await getRequiredSupabase().from('events').update({
        accreditation_status: accredited ? 'accredited' : 'not_accredited',
        accreditation_details: accredited ? details.trim() : null,
        certificate_info: certificate.trim() || null,
      }).eq('id', editing.id);
      if (error) throw error;
      toast.success('Event updated.');
      setEditing(null);
      load();
    } catch (err) { toast.error((err as Error).message); } finally { setSaving(false); }
  };

  const remove = async (e: Event) => {
    if (!window.confirm(`Delete "${e.title}"?`)) return;
    const { error } = await getRequiredSupabase().from('events').delete().eq('id', e.id);
    if (error) toast.error(error.message); else { toast.success('Event deleted.'); load(); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-brand-navy">Academic Events, Webinars and Workshops</h1>
          <p className="text-xs text-slate-500 mt-0.5">Events are shown as not accredited unless you record a confirmed accreditation here.</p>
        </div>
        <Link to="/publish/events" className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold shadow transition">
          <Plus className="w-3.5 h-3.5" /> New event
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
        {loading ? <div className="py-16 text-center text-xs text-slate-400">Loading…</div> : events.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500">No events yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr><th className="py-3 px-4">Date</th><th className="py-3 px-4">Event</th><th className="py-3 px-4">Speaker & organiser</th><th className="py-3 px-4">Accreditation</th><th className="py-3 px-4" /></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {events.map((evt) => (
                  <tr key={evt.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-teal-800">{evt.date_badge_day} {evt.date_badge_month}</td>
                    <td className="py-3 px-4 max-w-xs"><div className="font-bold text-brand-navy truncate">{evt.title}</div><div className="text-slate-400">{evt.format} · {evt.time_display}</div></td>
                    <td className="py-3 px-4"><div className="font-medium text-slate-800">{evt.speaker}</div><div className="text-[11px] text-slate-500">{evt.organizer}</div></td>
                    <td className="py-3 px-4">
                      {evt.accreditation_status === 'accredited'
                        ? <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700 ring-1 ring-emerald-200" title={evt.accreditation_details}>Accredited</span>
                        : <span className="text-slate-500">Not accredited</span>}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button onClick={() => openEdit(evt)} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 font-semibold text-teal-700 hover:bg-teal-50"><Award className="h-3.5 w-3.5" />Accreditation</button>
                      <button onClick={() => remove(evt)} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 font-semibold text-rose-600 hover:bg-rose-50"><Trash2 className="h-3.5 w-3.5" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between"><h3 className="text-base font-bold text-brand-navy">Accreditation — {editing.title}</h3>
              <button onClick={() => setEditing(null)} className="text-slate-400 hover:text-slate-600" aria-label="Close"><X className="w-5 h-5" /></button></div>
            <label className="flex items-start gap-2"><input type="checkbox" checked={accredited} onChange={(e) => setAccredited(e.target.checked)} className="mt-0.5 rounded text-teal-600" />
              <span>This event has a <strong>confirmed</strong> accreditation (for example CME credit points approved by the competent body).</span></label>
            {accredited && (
              <label className="block"><span className="block font-semibold text-slate-700 mb-1">Accrediting body, credits and approval reference *</span>
                <textarea rows={3} maxLength={500} value={details} onChange={(e) => setDetails(e.target.value)} className="w-full p-2.5 border border-slate-200 rounded-xl" placeholder="Name of the body, number of credits, approval number and date" /></label>
            )}
            <label className="block"><span className="block font-semibold text-slate-700 mb-1">Certificate information (optional)</span>
              <input maxLength={500} value={certificate} onChange={(e) => setCertificate(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl" placeholder="e.g. Participation certificate by email after the session" /></label>
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="px-4 py-2 border border-slate-200 rounded-xl font-semibold text-slate-600">Cancel</button>
              <button onClick={save} disabled={saving} className="px-5 py-2 bg-teal-700 text-white rounded-xl font-semibold disabled:opacity-60">{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
