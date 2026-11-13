import React, { useCallback, useEffect, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dataService } from '../../lib/supabase';
import { publisherService } from '../../services/publisherService';
import { normalizeUrl } from '../../lib/safeUrl';
import { useToast } from '../../components/feedback/ToastProvider';
import type { Event } from '../../types';
import { Card, Field, FormError, MyItems, PageHeader, PhotoPicker, PickedPhoto, SubmitButton, errorText, inputClass } from './PublishUi';

const FORMATS = ['Webinar', 'Workshop', 'Conference', 'Study Circle', 'State Chapter Meeting'] as const;
type Format = (typeof FORMATS)[number];

/** "18:30" → "6:30 PM" */
const time12 = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};
/** Date + time in India time → ISO timestamp */
const istIso = (date: string, time: string) => new Date(`${date}T${time}:00+05:30`).toISOString();

export const PublishEvents: React.FC = () => {
  const { currentUser } = useAuth();
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [format, setFormat] = useState<Format>('Webinar');
  const [date, setDate] = useState('');
  const [start, setStart] = useState('18:00');
  const [end, setEnd] = useState('19:30');
  const [online, setOnline] = useState(true);
  const [venue, setVenue] = useState('');
  const [link, setLink] = useState('');
  const [speaker, setSpeaker] = useState('');
  const [speakerTitle, setSpeakerTitle] = useState('');
  const [organizer, setOrganizer] = useState('Homeo India');
  const [summary, setSummary] = useState('');
  const [poster, setPoster] = useState<PickedPhoto[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mine, setMine] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!currentUser?.id) return;
    setLoading(true);
    try { setMine(await publisherService.myEvents(currentUser.id)); } catch { setMine([]); } finally { setLoading(false); }
  }, [currentUser?.id]);
  useEffect(() => { load(); }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.id) return;
    setError(null);
    if (!title.trim()) return setError('Please add the event title.');
    if (!date) return setError('Please choose the date.');
    if (!start) return setError('Please choose the start time.');
    if (end && end <= start) return setError('The end time must be after the start time.');
    if (!speaker.trim()) return setError('Please add the speaker or host.');
    if (!online && !venue.trim()) return setError('Please add the venue address.');
    const cleanLink = normalizeUrl(link);
    if (link.trim() && !cleanLink) return setError('The link must be a web address (https://…).');
    setBusy(true);
    try {
      const imageUrl = poster[0] ? await dataService.uploadResearchFile(currentUser.id, poster[0].file) : undefined;
      const d = new Date(`${date}T00:00:00`);
      const timeText = `${time12(start)}${end ? ` – ${time12(end)}` : ''} IST`;
      await dataService.createEvent({
        title: title.trim(),
        format,
        organizer: organizer.trim() || 'Homeo India',
        speaker: speaker.trim(),
        speaker_title: speakerTitle.trim() || undefined,
        date_badge_day: String(d.getDate()),
        date_badge_month: d.toLocaleString('en-IN', { month: 'short' }).toUpperCase(),
        time_display: `${online ? 'Online' : 'In person'} • ${timeText}`,
        start_at: istIso(date, start),
        end_at: end ? istIso(date, end) : undefined,
        location: online ? 'Online' : venue.trim(),
        registration_url: cleanLink || '/events',
        meeting_link: cleanLink || undefined,
        summary: summary.trim(),
        image_url: imageUrl,
        created_by: currentUser.id,
      });
      poster.forEach((p) => URL.revokeObjectURL(p.preview));
      setTitle(''); setSpeaker(''); setSpeakerTitle(''); setSummary(''); setLink(''); setVenue(''); setDate(''); setPoster([]);
      toast.success('Event posted. It is live on the Events page.');
      await load();
    } catch (err) {
      setError(errorText(err, 'Could not post this event.'));
    } finally {
      setBusy(false);
    }
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <PageHeader icon={<CalendarDays className="h-5 w-5" />} title="Post an event" subtitle="Shows on the community Events page. Members can register for it." />
      <Card>
        <form onSubmit={submit} noValidate className="space-y-4">
          <Field label="Event title" required>
            <input className={inputClass} value={title} maxLength={300} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Repertorisation masterclass: chronic skin cases" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Type">
              <select className={inputClass} value={format} onChange={(e) => setFormat(e.target.value as Format)}>
                {FORMATS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </Field>
            <Field label="Date" required>
              <input type="date" min={today} className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Starts" hint="(IST)" required>
              <input type="time" className={inputClass} value={start} onChange={(e) => setStart(e.target.value)} />
            </Field>
            <Field label="Ends" hint="(IST)">
              <input type="time" className={inputClass} value={end} onChange={(e) => setEnd(e.target.value)} />
            </Field>
          </div>
          <div>
            <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">Where</span>
            <div className="inline-flex rounded-xl bg-slate-100 p-1">
              {[{ v: true, l: 'Online' }, { v: false, l: 'In person' }].map(({ v, l }) => (
                <button key={l} type="button" onClick={() => setOnline(v)}
                  className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${online === v ? 'bg-white text-brand-navy shadow-sm' : 'text-slate-500'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          {!online && (
            <Field label="Venue address" required>
              <input className={inputClass} value={venue} maxLength={300} onChange={(e) => setVenue(e.target.value)} placeholder="e.g. Govt Homoeopathic Medical College, Bengaluru" />
            </Field>
          )}
          <Field label={online ? 'Joining or registration link' : 'Registration link'} hint="(optional)">
            <input className={inputClass} value={link} maxLength={2048} onChange={(e) => setLink(e.target.value)} placeholder="https://…" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Speaker or host" required>
              <input className={inputClass} value={speaker} maxLength={200} onChange={(e) => setSpeaker(e.target.value)} placeholder="e.g. Dr. K. Radhakrishnan" />
            </Field>
            <Field label="Speaker's title" hint="(optional)">
              <input className={inputClass} value={speakerTitle} maxLength={200} onChange={(e) => setSpeakerTitle(e.target.value)} placeholder="e.g. Professor of Materia Medica" />
            </Field>
          </div>
          <Field label="Organised by">
            <input className={inputClass} value={organizer} maxLength={200} onChange={(e) => setOrganizer(e.target.value)} />
          </Field>
          <Field label="About the event" hint="(optional)">
            <textarea className={`${inputClass} min-h-[7rem]`} value={summary} maxLength={5000} onChange={(e) => setSummary(e.target.value)} placeholder="What will be covered and who it is for." />
          </Field>
          <Field label="Poster" hint="(optional)">
            <PhotoPicker photos={poster} max={1} onChange={setPoster} label="Add poster" />
          </Field>
          <FormError message={error} />
          <div className="flex justify-end"><SubmitButton busy={busy} label="Post event" /></div>
        </form>
      </Card>
      <MyItems
        title="Your events"
        items={mine}
        loading={loading}
        empty="You haven't posted an event yet."
        onDelete={async (ev) => { await publisherService.deleteEvent(ev.id); toast.success('Event deleted.'); await load(); }}
        render={(ev) => (
          <div className="flex items-start gap-3">
            <div className="w-12 shrink-0 rounded-xl border border-teal-100 bg-teal-50 py-1.5 text-center leading-tight">
              <div className="text-base font-bold text-teal-800">{ev.date_badge_day}</div>
              <div className="text-[10px] font-bold uppercase text-teal-700">{ev.date_badge_month}</div>
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-brand-navy">{ev.title}</p>
              <p className="mt-0.5 text-sm text-slate-500">{ev.time_display} · {ev.location}</p>
              <p className="mt-0.5 text-xs text-slate-400">{ev.format} · {ev.speaker}</p>
            </div>
          </div>
        )}
      />
    </div>
  );
};
