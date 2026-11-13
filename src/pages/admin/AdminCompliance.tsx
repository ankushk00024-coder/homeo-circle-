import React, { useCallback, useEffect, useState } from 'react';
import { ShieldCheck, Inbox, UserCog, FileText, BadgeCheck, Loader2, RefreshCw } from 'lucide-react';
import { complianceService, Grievance, PrivacyRequest, StaffRow } from '../../services/complianceService';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/feedback/ToastProvider';
import { POLICIES } from '../../legal/config';
import { MemberBadge } from '../../components/common/MemberBadge';

type Tab = 'privacy' | 'complaints' | 'registration' | 'staff' | 'policies';
const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'privacy', label: 'Privacy requests', icon: ShieldCheck },
  { id: 'complaints', label: 'Complaints & appeals', icon: Inbox },
  { id: 'registration', label: 'Registration status', icon: BadgeCheck },
  { id: 'staff', label: 'Staff roles', icon: UserCog },
  { id: 'policies', label: 'Policy versions', icon: FileText },
];
const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin', admin: 'Admin', verification_admin: 'Verification Admin', moderator: 'Moderator',
  event_manager: 'Event Manager', research_reviewer: 'Research Reviewer', publisher: 'Publisher',
};
const when = (s?: string) => (s ? new Date(s).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—');
const box = 'rounded-2xl border border-slate-200 bg-white shadow-card';

export const AdminCompliance: React.FC = () => {
  const [tab, setTab] = useState<Tab>('privacy');
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-brand-navy">Privacy, complaints & roles</h1>
        <p className="mt-0.5 text-xs text-slate-500">Handle members' privacy requests and complaints, keep registration status accurate, and give staff only the access they need.</p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)} className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold ${tab === id ? 'bg-brand-navy text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'}`}>
            <Icon className="h-3.5 w-3.5" />{label}
          </button>
        ))}
      </div>
      {tab === 'privacy' && <PrivacyTab />}
      {tab === 'complaints' && <ComplaintsTab />}
      {tab === 'registration' && <RegistrationTab />}
      {tab === 'staff' && <StaffTab />}
      {tab === 'policies' && <PoliciesTab />}
    </div>
  );
};

const Empty: React.FC<{ text: string }> = ({ text }) => <div className="py-14 text-center text-xs text-slate-500">{text}</div>;
const Loading = () => <div className="flex items-center justify-center gap-2 py-14 text-xs text-slate-400"><Loader2 className="h-4 w-4 animate-spin" />Loading…</div>;

const PrivacyTab: React.FC = () => {
  const toast = useToast();
  const [rows, setRows] = useState<PrivacyRequest[] | null>(null);
  const [names, setNames] = useState<Record<string, string>>({});
  const [reply, setReply] = useState<Record<string, string>>({});
  const load = useCallback(async () => {
    try {
      const r = await complianceService.allPrivacyRequests();
      setRows(r);
      if (supabase && r.length) {
        const { data } = await supabase.from('profiles').select('id, display_name, email').in('id', [...new Set(r.map((x) => x.user_id))]);
        setNames(Object.fromEntries((data || []).map((p) => [p.id, `${p.display_name}${p.email ? ` (${p.email})` : ''}`])));
      }
    } catch (e) { toast.error((e as Error).message); setRows([]); }
  }, [toast]);
  useEffect(() => { load(); }, [load]);

  const act = async (r: PrivacyRequest, status: string) => {
    try { await complianceService.updatePrivacyRequest(r.id, status, reply[r.id] || ''); toast.success('Request updated; the member is notified.'); load(); }
    catch (e) { toast.error((e as Error).message); }
  };
  const erase = async (r: PrivacyRequest) => {
    if (!window.confirm(`Erase all personal data for ${names[r.user_id] || 'this member'}? This cannot be undone.`)) return;
    try {
      const res = await complianceService.eraseMember(r.user_id, r.id);
      toast.success(`Member anonymised. ${res.filesRemoved} file(s) deleted${res.filesFailed ? `, ${res.filesFailed} failed — delete them in Supabase Storage` : ''}. Now delete the login in Supabase → Authentication → Users.`);
      load();
    } catch (e) { toast.error((e as Error).message); }
  };

  if (!rows) return <div className={box}><Loading /></div>;
  if (!rows.length) return <div className={box}><Empty text="No privacy requests yet." /></div>;
  return (
    <div className={`${box} divide-y divide-slate-100`}>
      {rows.map((r) => (
        <div key={r.id} className="space-y-2 p-4 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold capitalize text-brand-navy">{r.request_type.replace('_', ' ')}</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold capitalize text-slate-600">{r.status.replace('_', ' ')}</span>
            <span className="text-slate-400">{when(r.created_at)}</span>
          </div>
          <p className="text-slate-600">From: {names[r.user_id] || r.user_id}</p>
          {r.details && <p className="rounded-lg bg-slate-50 p-2 text-slate-700">{r.details}</p>}
          {r.response && <p className="text-slate-500">Reply sent: {r.response}</p>}
          {r.status !== 'completed' && r.status !== 'rejected' && (
            <div className="space-y-2">
              <textarea rows={2} placeholder="Reply to the member (sent with the update)" value={reply[r.id] || ''} onChange={(e) => setReply({ ...reply, [r.id]: e.target.value })} className="w-full rounded-lg border border-slate-200 p-2" />
              <div className="flex flex-wrap gap-2">
                <button onClick={() => act(r, 'in_progress')} className="rounded-lg bg-sky-50 px-3 py-1.5 font-semibold text-sky-700 ring-1 ring-sky-200">Mark in progress</button>
                <button onClick={() => act(r, 'completed')} className="rounded-lg bg-emerald-50 px-3 py-1.5 font-semibold text-emerald-700 ring-1 ring-emerald-200">Mark completed</button>
                <button onClick={() => act(r, 'rejected')} className="rounded-lg bg-slate-50 px-3 py-1.5 font-semibold text-slate-600 ring-1 ring-slate-200">Reject (give reason)</button>
                {r.request_type === 'erasure' && <button onClick={() => erase(r)} className="rounded-lg bg-rose-600 px-3 py-1.5 font-semibold text-white">Erase member data</button>}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const ComplaintsTab: React.FC = () => {
  const toast = useToast();
  const [rows, setRows] = useState<Grievance[] | null>(null);
  const [note, setNote] = useState<Record<string, string>>({});
  const load = useCallback(async () => {
    try { setRows(await complianceService.allGrievances()); } catch (e) { toast.error((e as Error).message); setRows([]); }
  }, [toast]);
  useEffect(() => { load(); }, [load]);
  const act = async (g: Grievance, status: string) => {
    try { await complianceService.updateGrievance(g.id, status, note[g.id] || g.resolution || ''); toast.success('Complaint updated.'); load(); }
    catch (e) { toast.error((e as Error).message); }
  };
  if (!rows) return <div className={box}><Loading /></div>;
  if (!rows.length) return <div className={box}><Empty text="No complaints yet." /></div>;
  return (
    <div className={`${box} divide-y divide-slate-100`}>
      {rows.map((g) => {
        const ageH = (Date.now() - new Date(g.created_at).getTime()) / 36e5;
        const overdueAck = g.status === 'received' && ageH > 24;
        return (
          <div key={g.id} className="space-y-2 p-4 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-brand-navy">{g.subject}</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold capitalize text-slate-600">{g.category}</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold capitalize text-slate-600">{g.status.replace('_', ' ')}</span>
              {overdueAck && <span className="rounded-full bg-rose-50 px-2 py-0.5 font-semibold text-rose-700 ring-1 ring-rose-200">Not acknowledged within 24h</span>}
              <span className="text-slate-400">{when(g.created_at)}</span>
            </div>
            <p className="text-slate-600">{g.name} · {g.email}{g.user_id ? ' · member' : ' · guest'}</p>
            <p className="whitespace-pre-line rounded-lg bg-slate-50 p-2 text-slate-700">{g.details}</p>
            {g.related_url && <a href={g.related_url} target="_blank" rel="noopener noreferrer" className="text-teal-700 underline">{g.related_url}</a>}
            {g.status !== 'resolved' && g.status !== 'rejected' ? (
              <div className="space-y-2">
                <textarea rows={2} placeholder="Outcome / reply (shown to members in notifications)" value={note[g.id] ?? g.resolution ?? ''} onChange={(e) => setNote({ ...note, [g.id]: e.target.value })} className="w-full rounded-lg border border-slate-200 p-2" />
                <div className="flex flex-wrap gap-2">
                  {g.status === 'received' && <button onClick={() => act(g, 'acknowledged')} className="rounded-lg bg-sky-50 px-3 py-1.5 font-semibold text-sky-700 ring-1 ring-sky-200">Acknowledge</button>}
                  <button onClick={() => act(g, 'in_progress')} className="rounded-lg bg-slate-50 px-3 py-1.5 font-semibold text-slate-600 ring-1 ring-slate-200">In progress</button>
                  <button onClick={() => act(g, 'resolved')} className="rounded-lg bg-emerald-50 px-3 py-1.5 font-semibold text-emerald-700 ring-1 ring-emerald-200">Resolve</button>
                  <button onClick={() => act(g, 'rejected')} className="rounded-lg bg-slate-50 px-3 py-1.5 font-semibold text-slate-600 ring-1 ring-slate-200">Reject</button>
                </div>
                {!g.user_id && <p className="text-slate-400">Guest complaint — reply by email to {g.email}.</p>}
              </div>
            ) : g.resolution && <p className="text-slate-500">Outcome: {g.resolution}</p>}
          </div>
        );
      })}
    </div>
  );
};

type RegRow = { id: string; display_name: string; email?: string; account_type: string; status: string; registration_status: string; registration_number?: string; registration_authority?: string; registration_verified_at?: string; registration_valid_until?: string; registration_verification_source?: string; qualification_verified?: boolean };
const RegistrationTab: React.FC = () => {
  const toast = useToast();
  const [rows, setRows] = useState<RegRow[] | null>(null);
  const [src, setSrc] = useState<Record<string, string>>({});
  const [until, setUntil] = useState<Record<string, string>>({});
  const load = useCallback(async () => {
    if (!supabase) return setRows([]);
    const { data, error } = await supabase.from('profiles')
      .select('id, display_name, email, account_type, status, registration_status, registration_number, registration_authority, registration_verified_at, registration_valid_until, registration_verification_source, qualification_verified')
      .eq('account_type', 'doctor').order('registration_status');
    if (error) { toast.error(error.message); setRows([]); } else setRows(data as RegRow[]);
  }, [toast]);
  useEffect(() => { load(); }, [load]);
  const set = async (r: RegRow, status: string) => {
    try { await complianceService.setRegistrationStatus(r.id, status, src[r.id], until[r.id]); toast.success('Registration status saved and member notified.'); load(); }
    catch (e) { toast.error((e as Error).message); }
  };
  if (!rows) return <div className={box}><Loading /></div>;
  if (!rows.length) return <div className={box}><Empty text="No Registered Practitioner members yet." /></div>;
  return (
    <div className={`${box} divide-y divide-slate-100`}>
      <p className="p-4 text-xs text-slate-500">Record a registration as verified only after checking it with the registering authority's records. Write exactly what you checked.</p>
      {rows.map((r) => (
        <div key={r.id} className="space-y-2 p-4 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-brand-navy">{r.display_name}</span>
            <MemberBadge profile={r} />
            <span className="text-slate-400">{r.email}</span>
          </div>
          <p className="text-slate-600">Reg. no. <span className="font-mono">{r.registration_number || '—'}</span> · {r.registration_authority || 'authority not given'}</p>
          {r.registration_verified_at && <p className="text-slate-500">Last verified {when(r.registration_verified_at)} via {r.registration_verification_source}{r.registration_valid_until ? ` · valid until ${r.registration_valid_until}` : ''}</p>}
          <div className="flex flex-wrap items-center gap-2">
            <input placeholder="Where you checked (required to verify)" value={src[r.id] || ''} onChange={(e) => setSrc({ ...src, [r.id]: e.target.value })} className="min-w-[14rem] flex-1 rounded-lg border border-slate-200 px-2.5 py-1.5" />
            <input type="date" value={until[r.id] || ''} onChange={(e) => setUntil({ ...until, [r.id]: e.target.value })} className="rounded-lg border border-slate-200 px-2.5 py-1.5" title="Valid until (optional)" />
            <button onClick={() => set(r, 'verified')} className="rounded-lg bg-emerald-600 px-3 py-1.5 font-semibold text-white">Registration verified</button>
            <button onClick={() => set(r, 'lapsed')} className="rounded-lg bg-amber-50 px-3 py-1.5 font-semibold text-amber-800 ring-1 ring-amber-200">Lapsed</button>
            <button onClick={() => set(r, 'expired')} className="rounded-lg bg-rose-50 px-3 py-1.5 font-semibold text-rose-700 ring-1 ring-rose-200">Expired</button>
            <button onClick={() => set(r, 'pending')} className="rounded-lg bg-slate-50 px-3 py-1.5 font-semibold text-slate-600 ring-1 ring-slate-200">Back to pending</button>
          </div>
        </div>
      ))}
    </div>
  );
};

const StaffTab: React.FC = () => {
  const toast = useToast();
  const [rows, setRows] = useState<StaffRow[] | null>(null);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('moderator');
  const load = useCallback(async () => {
    try { setRows(await complianceService.listStaff()); } catch (e) { toast.error((e as Error).message); setRows([]); }
  }, [toast]);
  useEffect(() => { load(); }, [load]);
  const change = async (e: string, r: string, grant: boolean) => {
    try { await complianceService.setStaffRole(e, r, grant); toast.success(grant ? 'Role given.' : 'Role removed.'); setEmail(''); load(); }
    catch (err) { toast.error((err as Error).message); }
  };
  return (
    <div className="space-y-4">
      <div className={`${box} space-y-3 p-4 text-xs`}>
        <p className="font-bold text-brand-navy">Give a staff role</p>
        <ul className="list-disc space-y-0.5 pl-4 text-slate-500">
          <li><strong>Verification Admin</strong> — reviews applications and is the only role (with Super Admin) that can open verification documents.</li>
          <li><strong>Moderator</strong> — handles reports and complaints, hides posts and comments.</li>
          <li><strong>Event Manager</strong> — manages events, including confirmed accreditation details.</li>
          <li><strong>Research Reviewer</strong> — manages the Research Library.</li>
          <li><strong>Publisher</strong> — posts from the Publishing panel only.</li>
        </ul>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input type="email" placeholder="their sign-up email" value={email} onChange={(e) => setEmail(e.target.value)} className="flex-1 rounded-lg border border-slate-200 px-3 py-2" />
          <select value={role} onChange={(e) => setRole(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
            {['verification_admin', 'moderator', 'event_manager', 'research_reviewer', 'publisher'].map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </select>
          <button onClick={() => change(email, role, true)} className="rounded-lg bg-teal-700 px-4 py-2 font-semibold text-white">Give role</button>
        </div>
        <p className="text-slate-400">Only Super Admins can change roles. Every change is recorded in the audit log.</p>
      </div>
      <div className={`${box} divide-y divide-slate-100`}>
        {!rows ? <Loading /> : !rows.length ? <Empty text="No staff yet." /> : rows.map((r) => (
          <div key={`${r.user_id}-${r.role}`} className="flex flex-wrap items-center gap-2 p-3.5 text-xs">
            <span className="font-semibold text-brand-navy">{r.name}</span>
            <span className="text-slate-400">{r.email}</span>
            <span className="rounded-full bg-indigo-50 px-2 py-0.5 font-semibold text-indigo-700">{ROLE_LABELS[r.role] || r.role}</span>
            {!['super_admin', 'admin'].includes(r.role) && (
              <button onClick={() => window.confirm(`Remove ${ROLE_LABELS[r.role]} from ${r.name}?`) && change(r.email, r.role, false)} className="ml-auto rounded-lg px-2.5 py-1 font-semibold text-rose-600 hover:bg-rose-50">Remove</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const PoliciesTab: React.FC = () => {
  const [counts, setCounts] = useState<Record<string, number> | null>(null);
  const load = useCallback(async () => {
    if (!supabase) return setCounts({});
    const out: Record<string, number> = {};
    for (const p of POLICIES.filter((x) => x.requiresAcceptance)) {
      const type = p.key === 'privacy' ? 'privacy_notice' : p.key;
      const { data } = await supabase.from('consent_records').select('user_id').eq('consent_type', type).eq('policy_version', p.version).eq('granted', true);
      out[p.key] = new Set((data || []).map((d: { user_id: string }) => d.user_id)).size;
    }
    setCounts(out);
  }, []);
  useEffect(() => { load(); }, [load]);
  return (
    <div className={`${box} p-4 text-xs`}>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-slate-500">To publish a new version: edit the document, bump its version in <code>src/legal/config.ts</code>, and add the same version to <code>policy_versions</code>. Documents that need acceptance are shown again to every member.</p>
        <button onClick={load} className="ml-3 shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100" aria-label="Refresh"><RefreshCw className="h-4 w-4" /></button>
      </div>
      <table className="w-full text-left">
        <thead className="text-[10px] uppercase tracking-wide text-slate-400"><tr><th className="py-2">Document</th><th>Version</th><th>Effective</th><th>Needs acceptance</th><th>Members accepted</th></tr></thead>
        <tbody className="divide-y divide-slate-100">
          {POLICIES.map((p) => (
            <tr key={p.key}><td className="py-2 font-semibold text-brand-navy">{p.title}</td><td>{p.version}</td><td>{p.effective}</td><td>{p.requiresAcceptance ? 'Yes' : 'No'}</td><td>{p.requiresAcceptance ? (counts ? counts[p.key] ?? 0 : '…') : '—'}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
