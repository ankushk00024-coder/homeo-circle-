import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dataService } from '../../lib/supabase';
import { UserProfile, ConnectionRequest } from '../../types';
import { Avatar } from '../../components/common/Avatar';
import { ConnectDialog } from '../../components/common/ConnectDialog';
import { 
  Search, 
  Filter, 
  MapPin, 
  Briefcase, 
  UserPlus, 
  Check, 
  Clock,
  X,
  Users,
  ShieldCheck,
  GraduationCap,
  Microscope,
  Stethoscope,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  MessageCircle,
  UserCheck,
  ArrowRight,
  History
} from 'lucide-react';

const typeOf = (m: UserProfile) => m.account_type || m.role;
const typeLabel = (t?: string) => (t === 'student' ? 'Student' : t === 'researcher' ? 'Researcher' : 'Doctor');
const formatDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

/** The note a member attached to a connection request. */
const RequestNote: React.FC<{ text?: string; label?: string }> = ({ text, label }) =>
  text ? (
    <div className="mt-2 flex gap-2 text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 max-w-xl">
      <MessageCircle className="w-3.5 h-3.5 text-teal-600 flex-shrink-0 mt-0.5" />
      <p className="whitespace-pre-line break-words">
        {label && <span className="font-semibold text-slate-500">{label} </span>}
        {text}
      </p>
    </div>
  ) : null;

export const MembersPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'network' ? 'network' : 'directory';

  const [activeTab, setActiveTab] = useState<'directory' | 'network'>(initialTab);
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [connectionRequests, setConnectionRequests] = useState<ConnectionRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [connectTarget, setConnectTarget] = useState<UserProfile | null>(null);

  const loadData = async () => {
    setLoading(true);
    const [fetchedMembers, fetchedConns] = await Promise.all([
      dataService.getMembers(searchQuery, 'All', 'All', 'Doctor'),
      dataService.getConnectionRequests()
    ]);
    setMembers(fetchedMembers);
    setConnectionRequests(fetchedConns);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [searchQuery]);

  useEffect(() => {
    if (searchParams.get('tab') === 'network') {
      setActiveTab('network');
    }
  }, [searchParams]);

  // Derived connection helpers
  const getConnectionStatus = (targetId: string) => {
    if (!currentUser) return 'none';
    if (currentUser.id === targetId) return 'self';

    const conn = connectionRequests.find(c => 
      (c.sender_id === currentUser.id && c.recipient_id === targetId) ||
      (c.sender_id === targetId && c.recipient_id === currentUser.id)
    );

    if (!conn) return 'none';
    if (conn.status === 'accepted') return 'connected';
    if (conn.status === 'pending') {
      return conn.sender_id === currentUser.id ? 'pending_sent' : 'pending_received';
    }
    return 'none';
  };

  const handleConnect = (targetMember: UserProfile) => {
    if (!currentUser) {
      navigate('/login', { state: { from: location } });
      return;
    }
    setConnectTarget(targetMember);
  };

  const sendRequest = async (note: string) => {
    if (!currentUser || !connectTarget) return;
    await dataService.sendConnectionRequest(currentUser, connectTarget, note);
    const name = connectTarget.display_name || connectTarget.full_name;
    setConnectTarget(null);
    setActionMessage(`Request sent to ${name}. They'll see it on their dashboard and in My Network.`);
    setTimeout(() => setActionMessage(null), 5000);
    await loadData();
  };

  const handleRespond = async (requestId: string, status: 'accepted' | 'declined') => {
    if (!currentUser) return;
    try {
      await dataService.respondConnectionRequest(requestId, status, currentUser);
      setActionMessage(status === 'accepted' ? 'Connection request accepted!' : 'Connection request declined.');
      setTimeout(() => setActionMessage(null), 4000);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update connection request.');
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    await dataService.cancelConnectionRequest(requestId);
    await loadData();
  };

  // Lists for Network Tab
  const receivedRequests = connectionRequests.filter(c => c.recipient_id === currentUser?.id && c.status === 'pending');
  const sentRequests = connectionRequests.filter(c => c.sender_id === currentUser?.id && c.status === 'pending');
  const acceptedConnections = connectionRequests.filter(c => 
    (c.sender_id === currentUser?.id || c.recipient_id === currentUser?.id) && c.status === 'accepted'
  );
  const history = [...connectionRequests]
    .filter(c => c.sender_id === currentUser?.id || c.recipient_id === currentUser?.id)
    .sort((a, b) => (b.updated_at || b.created_at).localeCompare(a.updated_at || a.created_at));

  return (
    <div className="space-y-6">
      
      {/* Top Header & Tab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-brand-navy">
            {activeTab === 'directory' ? 'Doctors' : 'My Network'}
          </h1>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-1.5 p-1 bg-white border border-brand-border rounded-xl shadow-2xs">
          <button
            onClick={() => { setActiveTab('directory'); setSearchParams({}); }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activeTab === 'directory'
                ? 'bg-brand-teal text-white shadow-2xs'
                : 'text-slate-600 hover:text-brand-navy hover:bg-slate-50'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Doctors ({members.length})</span>
          </button>

          <button
            onClick={() => { setActiveTab('network'); setSearchParams({ tab: 'network' }); }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 relative ${
              activeTab === 'network'
                ? 'bg-brand-teal text-white shadow-2xs'
                : 'text-slate-600 hover:text-brand-navy hover:bg-slate-50'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>My Network ({acceptedConnections.length})</span>
            {receivedRequests.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            )}
          </button>
        </div>
      </div>

      {/* Success / Feedback Alert */}
      {actionMessage && (
        <div className="p-3.5 bg-teal-50 border border-teal-200 rounded-xl flex items-center gap-2.5 text-teal-800 text-xs animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* ────────────────── DIRECTORY TAB ────────────────── */}
      {activeTab === 'directory' && (
        <>
          {/* Search and Filters Bar */}
          <div className="bg-white rounded-2xl p-4 border border-brand-border/80 shadow-subtle flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search doctors by name, city or specialty…"
                className="w-full pl-9 pr-4 py-2 text-xs bg-[#EEF6FC]/60 border border-brand-border/80 rounded-xl focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none text-slate-700 placeholder-slate-400"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            </div>

          </div>

          {/* Members Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-6 border border-brand-border/60 shadow-subtle animate-pulse space-y-4">
                  <div className="w-14 h-14 rounded-full bg-slate-200 mx-auto sm:mx-0"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                  <div className="h-3 bg-slate-100 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : members.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-brand-border space-y-3">
              <p className="text-sm font-bold text-brand-navy">
                {searchQuery ? 'No doctors match your search.' : 'No verified doctors yet.'}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-4 py-2 bg-brand-teal text-white rounded-xl text-xs font-semibold"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {members.map((member) => {
                const connState = getConnectionStatus(member.id);
                const req = connectionRequests.find(c => 
                  c.recipient_id === currentUser?.id && c.sender_id === member.id && c.status === 'pending'
                );

                const memberType = typeOf(member);
                const getRoleBadgeStyle = () => {
                  if (memberType === 'student') return 'bg-emerald-50 text-emerald-800 border-emerald-200';
                  if (memberType === 'researcher') return 'bg-sky-50 text-sky-800 border-sky-200';
                  return 'bg-teal-50 text-teal-800 border-teal-200';
                };

                return (
                  <div
                    key={member.id}
                    className="bg-white rounded-2xl p-5 border border-brand-border/80 shadow-subtle hover:shadow-card hover:border-brand-teal/40 transition flex flex-col justify-between space-y-4 group"
                  >
                    {/* Top Profile Summary */}
                    <div className="space-y-3 text-center sm:text-left">
                      <div className="flex items-start justify-between">
                        <Avatar
                          src={member.avatar_url}
                          name={member.full_name}
                          size="lg"
                          verified={member.status === 'verified'}
                          className="mx-auto sm:mx-0"
                        />

                        {/* Role pill badge */}
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${getRoleBadgeStyle()}`}>
                          {typeLabel(memberType)}
                        </span>
                      </div>

                      <div>
                        <Link
                          to={`/members/${member.id}`}
                          className="text-sm font-bold text-brand-navy group-hover:text-brand-teal transition block leading-snug"
                        >
                          {member.full_name}
                        </Link>
                        <p className="text-[11px] text-[#5A6E85] font-medium mt-0.5">
                          {[member.qualification, member.experience_years ? `${member.experience_years} yrs exp` : null]
                            .filter((x) => x && x !== 'Not specified')
                            .join(' • ')}
                        </p>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-600">
                        {[member.city, member.state].some((x) => x && x !== 'Not specified') && (
                          <div className="flex items-center justify-center sm:justify-start gap-1.5 text-[#5A6E85]">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span className="text-[11px] truncate">
                              {[member.city, member.state].filter((x) => x && x !== 'Not specified').join(', ')}
                            </span>
                          </div>
                        )}

                        {(member.specialization || member.clinic_institution) && (
                          <div className="flex items-center justify-center sm:justify-start gap-1.5">
                            <Briefcase className="w-3.5 h-3.5 text-brand-teal flex-shrink-0" />
                            <span className="text-[11px] font-medium text-brand-navy bg-[#EEF6FC] px-2 py-0.5 rounded truncate max-w-[200px]">
                              {member.specialization || member.clinic_institution}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Action: Connect Button with Full Workflow */}
                    <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                      {connState === 'self' ? (
                        <span className="flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold bg-slate-50 text-slate-500 border border-slate-200 text-center">
                          Your Profile
                        </span>
                      ) : connState === 'connected' ? (
                        <div className="flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200 flex items-center justify-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-teal-600" />
                          <span>Connected</span>
                        </div>
                      ) : connState === 'pending_sent' ? (
                        <div className="flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 flex items-center justify-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>Request Pending</span>
                        </div>
                      ) : connState === 'pending_received' && req ? (
                        <div className="flex-1 flex items-center gap-1">
                          <button
                            onClick={() => handleRespond(req.id, 'accepted')}
                            className="flex-1 py-1.5 px-2 bg-brand-teal text-white rounded-xl text-[11px] font-semibold hover:bg-teal-700 transition"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleRespond(req.id, 'declined')}
                            className="py-1.5 px-2 bg-slate-100 text-slate-600 rounded-xl text-[11px] font-medium hover:bg-slate-200 transition"
                          >
                            Decline
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleConnect(member)}
                          className="flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold bg-white hover:bg-brand-teal-50 text-brand-navy hover:text-brand-teal border border-brand-border transition flex items-center justify-center gap-1.5"
                        >
                          <UserPlus className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-teal" />
                          <span>Connect</span>
                        </button>
                      )}

                      <Link
                        to={`/members/${member.id}`}
                        className="py-1.5 px-3 rounded-xl border border-brand-border text-xs font-medium text-[#5A6E85] hover:text-brand-navy hover:bg-slate-50 transition"
                      >
                        Profile
                      </Link>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ────────────────── MY NETWORK TAB ────────────────── */}
      {activeTab === 'network' && (
        !currentUser ? (
          <div className="bg-white rounded-2xl p-10 border border-slate-200 shadow-card text-center max-w-md mx-auto space-y-4 my-8">
            <div className="w-12 h-12 bg-teal-50 text-teal-700 rounded-full flex items-center justify-center mx-auto">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-brand-navy">Sign in to view your network</h3>
              <p className="text-xs text-slate-500 mt-1">
                Manage your peer connections, pending invitations, and professional network.
              </p>
            </div>
            <button
              onClick={() => navigate('/login', { state: { from: location } })}
              className="w-full py-2.5 bg-brand-teal text-white font-semibold text-xs rounded-xl shadow-xs hover:bg-teal-800 transition"
            >
              Sign in to Homeo Circle
            </button>
          </div>
        ) : (
        <div className="space-y-8">
          
          {/* Section: Received Connection Requests */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-card space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-teal-700" />
                <h2 className="text-sm font-bold text-brand-navy">Received Connection Requests</h2>
              </div>
              <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                {receivedRequests.length} Pending
              </span>
            </div>

            {receivedRequests.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">
                You have no pending received connection requests.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {receivedRequests.map((req) => (
                  <div key={req.id} className="py-3.5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <Avatar name={req.sender_name} src={req.sender_avatar} size="md" />
                      <div>
                        <Link to={`/members/${req.sender_id}`} className="text-xs font-bold text-brand-navy hover:text-teal-700">
                          {req.sender_name}
                        </Link>
                        <p className="text-[11px] text-slate-500">
                          <span className="capitalize">{typeLabel(req.sender_role)}</span>
                          {req.sender_qualification ? ` • ${req.sender_qualification}` : ''}
                        </p>
                        <span className="text-[10px] text-slate-400">Sent you a request on {formatDate(req.created_at)}</span>
                        <RequestNote text={req.message} />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRespond(req.id, 'accepted')}
                        className="px-4 py-1.5 bg-brand-teal hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-2xs transition flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Accept</span>
                      </button>
                      <button
                        onClick={() => handleRespond(req.id, 'declined')}
                        className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section: Sent Connection Requests */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-card space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <h2 className="text-sm font-bold text-brand-navy">Sent Connection Requests</h2>
              </div>
              <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                {sentRequests.length} Sent
              </span>
            </div>

            {sentRequests.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">
                You have no active sent connection requests awaiting response.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {sentRequests.map((req) => (
                  <div key={req.id} className="py-3.5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <Avatar name={req.recipient_name} src={req.recipient_avatar} size="md" />
                      <div>
                        <span className="text-xs font-bold text-brand-navy block">
                          {req.recipient_name}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Sent {formatDate(req.created_at)} • waiting for a reply
                        </span>
                        <RequestNote text={req.message} label="Your note:" />
                      </div>
                    </div>

                    <button
                      onClick={() => handleCancelRequest(req.id)}
                      className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-medium transition"
                    >
                      Withdraw Request
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section: Connected Peers */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-card space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                <h2 className="text-sm font-bold text-brand-navy">My Connected Peers ({acceptedConnections.length})</h2>
              </div>
            </div>

            {acceptedConnections.length === 0 ? (
              <div className="text-center py-6 space-y-2">
                <p className="text-xs text-slate-500">You haven’t established any mutual connections yet.</p>
                <button
                  onClick={() => setActiveTab('directory')}
                  className="px-4 py-2 bg-brand-teal text-white rounded-xl text-xs font-semibold"
                >
                  Browse Doctors
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {acceptedConnections.map((conn) => {
                  const otherId = conn.sender_id === currentUser?.id ? conn.recipient_id : conn.sender_id;
                  const otherName = conn.sender_id === currentUser?.id ? conn.recipient_name : conn.sender_name;
                  const otherAvatar = conn.sender_id === currentUser?.id ? conn.recipient_avatar : conn.sender_avatar;

                  return (
                    <div key={conn.id} className="p-4 bg-slate-50/70 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar name={otherName} src={otherAvatar} size="md" />
                        <div className="min-w-0">
                          <Link to={`/members/${otherId}`} className="text-xs font-bold text-brand-navy hover:text-teal-700 truncate block">
                            {otherName}
                          </Link>
                          <span className="text-[10px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded font-medium border border-teal-200 inline-block mt-0.5">
                            Connected since {formatDate(conn.updated_at || conn.created_at)}
                          </span>
                        </div>
                      </div>

                      <Link
                        to={`/members/${otherId}`}
                        className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-brand-navy border border-slate-200 rounded-lg hover:bg-white transition flex-shrink-0"
                      >
                        Profile
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>


          {/* Section: Connection history */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-card space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <History className="w-4 h-4 text-slate-500" />
              <h2 className="text-sm font-bold text-brand-navy">Connection History</h2>
            </div>
            {history.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">No connection activity yet.</p>
            ) : (
              <ol className="relative border-l border-slate-200 ml-2 space-y-5">
                {history.map((c) => {
                  const iSent = c.sender_id === currentUser?.id;
                  const otherName = iSent ? c.recipient_name : c.sender_name;
                  const otherId = iSent ? c.recipient_id : c.sender_id;
                  const statusText =
                    c.status === 'accepted' ? 'Connected' : c.status === 'declined' ? 'Declined' : 'Pending';
                  const statusStyle =
                    c.status === 'accepted'
                      ? 'bg-teal-50 text-teal-800 border-teal-200'
                      : c.status === 'declined'
                        ? 'bg-slate-100 text-slate-600 border-slate-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200';
                  return (
                    <li key={c.id} className="ml-4">
                      <span className={`absolute -left-1.5 mt-1.5 w-3 h-3 rounded-full border-2 border-white ${c.status === 'accepted' ? 'bg-teal-500' : c.status === 'declined' ? 'bg-slate-400' : 'bg-amber-400'}`} />
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-xs text-slate-700">
                          {iSent ? 'You sent a request to ' : ''}
                          <Link to={`/members/${otherId}`} className="font-bold text-brand-navy hover:text-teal-700">{otherName}</Link>
                          {iSent ? '' : ' sent you a request'}
                        </p>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusStyle}`}>{statusText}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Requested {formatDate(c.created_at)}
                        {c.status !== 'pending' && ` • ${statusText.toLowerCase()} ${formatDate(c.updated_at)}`}
                      </p>
                      <RequestNote text={c.message} />
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </div>
        )
      )}

      <ConnectDialog
        target={connectTarget && {
          name: connectTarget.display_name || connectTarget.full_name,
          avatar: connectTarget.avatar_url,
          subtitle: [typeLabel(typeOf(connectTarget)), connectTarget.qualification, connectTarget.city || connectTarget.state]
            .filter((x) => x && x !== 'Not specified')
            .join(' · ')
        }}
        onClose={() => setConnectTarget(null)}
        onSend={sendRequest}
      />
    </div>
  );
};
