import React, { useRef } from 'react';
import { ImagePlus, FileText, Loader2, Trash2, X } from 'lucide-react';

/** Shared building blocks for the Publishing panel forms. */

export const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-brand-navy placeholder:text-slate-400 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20';

export const Field: React.FC<{ label: string; hint?: string; required?: boolean; children: React.ReactNode }> = ({ label, hint, required, children }) => (
  <label className="block">
    <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">
      {label}
      {required && <span className="text-rose-500"> *</span>}
      {hint && <span className="ml-1.5 font-normal text-slate-400">{hint}</span>}
    </span>
    {children}
  </label>
);

export const PageHeader: React.FC<{ icon: React.ReactNode; title: string; subtitle: string }> = ({ icon, title, subtitle }) => (
  <div className="flex items-start gap-3.5">
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 ring-1 ring-teal-100">{icon}</div>
    <div>
      <h1 className="font-serif text-2xl font-bold text-brand-navy">{title}</h1>
      <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>
    </div>
  </div>
);

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-card sm:p-6 ${className}`}>{children}</div>
);

export interface PickedPhoto { file: File; preview: string }

export const PhotoPicker: React.FC<{
  photos: PickedPhoto[];
  max: number;
  onChange: (photos: PickedPhoto[]) => void;
  label?: string;
}> = ({ photos, max, onChange, label = 'Add photos' }) => {
  const ref = useRef<HTMLInputElement>(null);
  const add = (files: FileList | null) => {
    if (!files) return;
    const picked = Array.from(files).filter((f) => f.type.startsWith('image/'));
    onChange([...photos, ...picked.slice(0, max - photos.length).map((file) => ({ file, preview: URL.createObjectURL(file) }))]);
  };
  const remove = (i: number) => {
    URL.revokeObjectURL(photos[i].preview);
    onChange(photos.filter((_, k) => k !== i));
  };
  return (
    <div>
      <div className="flex flex-wrap gap-2.5">
        {photos.map((p, i) => (
          <div key={p.preview} className="relative h-20 w-20 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
            <img src={p.preview} alt="" className="h-full w-full object-cover" />
            <button type="button" onClick={() => remove(i)} aria-label="Remove photo"
              className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white hover:bg-black/80">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {photos.length < max && (
          <button type="button" onClick={() => ref.current?.click()}
            className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-slate-200 text-slate-500 transition hover:border-teal-400 hover:text-teal-700">
            <ImagePlus className="h-5 w-5" />
            <span className="text-[11px] font-medium">{label}</span>
          </button>
        )}
      </div>
      <p className="mt-1.5 text-xs text-slate-400">Up to {max}. Photos are compressed automatically.</p>
      <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp" multiple={max > 1} hidden
        onChange={(e) => { add(e.target.files); e.target.value = ''; }} />
    </div>
  );
};

export const PdfPicker: React.FC<{ file: File | null; onChange: (f: File | null) => void }> = ({ file, onChange }) => {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      {file ? (
        <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm">
          <FileText className="h-4 w-4 shrink-0 text-rose-600" />
          <span className="truncate text-slate-700">{file.name}</span>
          <button type="button" onClick={() => onChange(null)} className="ml-auto text-slate-400 hover:text-slate-700" aria-label="Remove PDF">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => ref.current?.click()}
          className="inline-flex items-center gap-2 rounded-xl border-2 border-dashed border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:border-teal-400 hover:text-teal-700">
          <FileText className="h-4 w-4" /> Attach the paper (PDF, up to 20 MB)
        </button>
      )}
      <input ref={ref} type="file" accept="application/pdf" hidden
        onChange={(e) => {
          const f = e.target.files?.[0] || null;
          e.target.value = '';
          if (f && f.size > 20 * 1024 * 1024) { alert('The PDF must be 20 MB or smaller.'); return; }
          onChange(f);
        }} />
    </div>
  );
};

export const FormError: React.FC<{ message: string | null }> = ({ message }) =>
  message ? <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">{message}</p> : null;

export const SubmitButton: React.FC<{ busy: boolean; label: string; busyLabel?: string }> = ({ busy, label, busyLabel = 'Publishing…' }) => (
  <button type="submit" disabled={busy}
    className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-6 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-teal-800 disabled:opacity-60">
    {busy && <Loader2 className="h-4 w-4 animate-spin" />}
    {busy ? busyLabel : label}
  </button>
);

/** "Your posts" list: only things this person posted, with a delete button. */
export function MyItems<T extends { id: string }>({
  title, items, loading, empty, render, onDelete,
}: {
  title: string;
  items: T[];
  loading: boolean;
  empty: string;
  render: (item: T) => React.ReactNode;
  onDelete: (item: T) => Promise<void>;
}) {
  const [busyId, setBusyId] = React.useState<string | null>(null);
  return (
    <Card>
      <h2 className="text-base font-bold text-brand-navy">{title}</h2>
      {loading ? (
        <div className="flex items-center gap-2 py-8 text-sm text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
      ) : items.length === 0 ? (
        <p className="py-8 text-sm text-slate-400">{empty}</p>
      ) : (
        <ul className="mt-3 divide-y divide-slate-100">
          {items.map((item) => (
            <li key={item.id} className="flex items-start gap-3 py-3.5">
              <div className="min-w-0 flex-1">{render(item)}</div>
              <button type="button" disabled={busyId === item.id}
                onClick={async () => {
                  if (!window.confirm('Delete this? It will be removed from the website.')) return;
                  setBusyId(item.id);
                  try { await onDelete(item); } finally { setBusyId(null); }
                }}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50">
                {busyId === item.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export const when = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

export const errorText = (err: unknown, fallback: string) =>
  err instanceof Error ? err.message : (err as { message?: string })?.message || fallback;
