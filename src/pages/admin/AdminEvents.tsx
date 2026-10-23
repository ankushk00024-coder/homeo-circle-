import React, { useState, useEffect } from 'react';
import { dataService } from '../../lib/supabase';
import { Event } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { 
  Calendar, 
  Plus, 
  Clock, 
  MapPin, 
  ExternalLink, 
  CheckCircle2, 
  X 
} from 'lucide-react';

export const AdminEvents: React.FC = () => {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // New Event form fields
  const [title, setTitle] = useState('');
  const [format, setFormat] = useState<'Webinar' | 'Conference' | 'Workshop' | 'Study Circle' | 'State Chapter CME'>('Webinar');
  const [organizer, setOrganizer] = useState('Homeo Circle Central');
  const [speaker, setSpeaker] = useState('');
  const [speakerTitle, setSpeakerTitle] = useState('Senior Consultant');
  const [day, setDay] = useState('15');
  const [month, setMonth] = useState('FEB');
  const [timeDisplay, setTimeDisplay] = useState('Online • 6:00 PM - 7:30 PM IST');
  const [location, setLocation] = useState('Online via Secure Meeting Room');
  const [registrationUrl, setRegistrationUrl] = useState('https://homeocircle.in');
  const [summary, setSummary] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadEvents = async () => {
    setLoading(true);
    const data = await dataService.getEvents();
    setEvents(data);
    setLoading(false);
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const newEvt = await dataService.createEvent({
        title: title.trim(),
        format,
        organizer: organizer.trim(),
        speaker: speaker.trim(),
        speaker_title: speakerTitle.trim(),
        date_badge_day: day.trim(),
        date_badge_month: month.trim().toUpperCase(),
        time_display: timeDisplay.trim(),
        location: location.trim(),
        registration_url: registrationUrl.trim(),
        summary: summary.trim(),
        created_by: currentUser?.id
      });

      await dataService.addAuditLog({
        actor_id: currentUser?.id || 'admin',
        actor_name: currentUser?.display_name || 'Administrator',
        action: 'EVENT_CREATED',
        target_type: 'event',
        target_id: newEvt.id,
        metadata: { title: newEvt.title, speaker: newEvt.speaker }
      });

      setTitle('');
      setSpeaker('');
      setSummary('');
      setCreateModalOpen(false);
      await loadEvents();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-brand-navy">
            Events & Webinars Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Publish and schedule continuing medical education (CME) and clinical conferences.
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold shadow transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Publish New Event</span>
        </button>
      </div>

      {/* Events Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Date Badge</th>
                <th className="py-3 px-4">Event Title</th>
                <th className="py-3 px-4">Speaker & Organizer</th>
                <th className="py-3 px-4">Format</th>
                <th className="py-3 px-4">Timing & Venue</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {events.map((evt) => (
                <tr key={evt.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4">
                    <span className="font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 font-mono text-[11px]">
                      {evt.date_badge_day} {evt.date_badge_month}
                    </span>
                  </td>
                  <td className="py-3 px-4 max-w-xs">
                    <div className="font-bold text-brand-navy truncate">{evt.title}</div>
                    <div className="text-[11px] text-slate-400 line-clamp-1">{evt.summary}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-slate-800">{evt.speaker}</div>
                    <div className="text-[10px] text-slate-500">{evt.organizer}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-semibold">
                      {evt.format}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 text-[11px]">
                    {evt.time_display}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 capitalize">
                      {evt.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Event Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-brand-navy">Create New Community Event</h3>
              <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Event Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Masterclass in Boenninghausen Repertorial Prescribing"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Format *</label>
                  <select
                    value={format}
                    onChange={(e: any) => setFormat(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none bg-white"
                  >
                    <option value="Webinar">Webinar (Online)</option>
                    <option value="State Chapter CME">State Chapter CME</option>
                    <option value="Conference">National Conference</option>
                    <option value="Workshop">Clinical Workshop</option>
                    <option value="Study Circle">Peer Study Circle</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Organizer *</label>
                  <input
                    type="text"
                    required
                    value={organizer}
                    onChange={(e) => setOrganizer(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Speaker Name *</label>
                  <input
                    type="text"
                    required
                    value={speaker}
                    onChange={(e) => setSpeaker(e.target.value)}
                    placeholder="e.g. Dr. K. Radhakrishnan"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Speaker Title</label>
                  <input
                    type="text"
                    value={speakerTitle}
                    onChange={(e) => setSpeakerTitle(e.target.value)}
                    placeholder="e.g. Professor & HOD"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Day (e.g. 19)</label>
                  <input
                    type="text"
                    required
                    value={day}
                    onChange={(e) => setDay(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Month (e.g. DEC)</label>
                  <input
                    type="text"
                    required
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Timing String *</label>
                <input
                  type="text"
                  required
                  value={timeDisplay}
                  onChange={(e) => setTimeDisplay(e.target.value)}
                  placeholder="e.g. Online • 6:00 PM - 7:30 PM IST"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Location / Meeting Platform *</label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Summary / Curriculum Description</label>
                <textarea
                  rows={3}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Outline key learning objectives for homeopathic practitioners..."
                  className="w-full p-2.5 border border-slate-200 rounded-xl outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-xs font-semibold text-slate-600 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold shadow"
                >
                  {submitting ? 'Publishing...' : 'Publish Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
