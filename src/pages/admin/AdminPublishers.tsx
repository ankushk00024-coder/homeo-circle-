import React, { useCallback, useEffect, useState } from 'react';
import { PenSquare, UserPlus, Trash2, Loader2, Copy, Check } from 'lucide-react';
import { publisherService, PublisherRow } from '../../services/publisherService';
import { useToast } from '../../components/feedback/ToastProvider';

/**
 * Admin → Publishers. A publisher can only post discussions, research and
 * events from the separate Publishing panel (/publish). They see no member
 * data, numbers or approvals.
 */
export const AdminPublishers: React.FC = () => {
  const toast = useToast();
  const [rows, setRows] = useState<PublisherRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const panelUrl = `${window.location.origin}/publish`;

  const load = useCallback(async () => {
    setLoading(true);
    try { setRows(await publisherService.listPublishers()); } catch (e) { setError((e as Error).message); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Please enter a valid email address.');
    setAdding(true);
    try {
      const row = await publisherService.addPublisher(email);
      toast.success(`${row?.name || email.trim()} can now post from the Publishing panel.`);
      setEmail('');
      await load();
    } catch (err) {
      setError((err as Error).message || 'Could not add this publisher.');
    } finally {
      setAdding(false);
    }
  };

  const remove = async (r: PublisherRow) => {
    if (!window.confirm(`Remove publishing access for ${r.name}? Their earlier posts stay on the site.`)) return;
    setRemoving(r.user_id);
    try {
      await publisherService.removePublisher(r.user_id);
      toast.success(`${r.name} can no longer post from the Publishing panel.`);
      await load();
    } catch (err) {
      toast.error((err as Error).message || 'Could not remove this publisher.');
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-brand-navy">Publishers</h1>
        <p className="mt-0.5 text-xs text-slate-500">
          People who can only post discussions, research and events. They can't see members, numbers, applications or any admin pages.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <form onSubmit={add} noValidate className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
          <h2 className="flex items-center gap-2 text-sm font-bold text-brand-navy"><UserPlus className="h-4 w-4 text-teal-700" /> Add a publisher</h2>
          <p className="text-xs text-slate-500">They must have an account on the website. To post they must sign in with that email and a password; signing in with Google only gives normal member access.</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="helper@gmail.com"
              className="flex-1 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20" />
            <button type="submit" disabled={adding}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-teal-800 disabled:opacity-60">
              {adding && <Loader2 className="h-4 w-4 animate-spin" />} Add publisher
            </button>
          </div>
          {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>}
        </form>

        <div className="space-y-2 rounded-2xl border border-teal-100 bg-teal-50/60 p-5">
          <h2 className="flex items-center gap-2 text-sm font-bold text-brand-navy"><PenSquare className="h-4 w-4 text-teal-700" /> Publishing panel link</h2>
          <p className="text-xs text-slate-600">Send this to your publishers. They sign in with their email and password, then post from there. If they have no password yet, the panel lets them create one.</p>
          <div className="flex items-center gap-2 rounded-xl border border-teal-200 bg-white px-3 py-2">
            <span className="truncate text-xs font-medium text-brand-navy">{panelUrl}</span>
            <button type="button" aria-label="Copy link" className="ml-auto text-teal-700 hover:text-teal-900"
              onClick={async () => { try { await navigator.clipboard.writeText(panelUrl); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* ignore */ } }}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-14 text-xs text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> Loading publishers…</div>
        ) : rows.length === 0 ? (
          <div className="py-14 text-center text-xs text-slate-500">No publishers yet. Add one above.</div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {rows.map((r) => (
              <li key={r.user_id} className="flex items-center gap-3 px-5 py-3.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-50 text-sm font-bold text-teal-700">
                  {(r.name || r.email).charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-brand-navy">{r.name}</p>
                  <p className="truncate text-xs text-slate-500">{r.email} · added {new Date(r.added_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
                <button onClick={() => remove(r)} disabled={removing === r.user_id}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50">
                  {removing === r.user_id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />} Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
