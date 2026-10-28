import React, { useState, useEffect } from 'react';
import { dataService } from '../../lib/supabase';
import { UserProfile, UserRole } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../../components/common/Avatar';
import { 
  Users, 
  Search, 
  AlertTriangle, 
  ChevronLeft,
  ChevronRight,
  Eye,
  X
} from 'lucide-react';

const ITEMS_PER_PAGE = 10;

export const AdminMembers: React.FC = () => {
  const { currentUser } = useAuth();
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMember, setSelectedMember] = useState<UserProfile | null>(null);

  // Confirmation modal state
  const [actionConfirm, setActionConfirm] = useState<{
    open: boolean;
    type: 'role' | 'suspend';
    member: UserProfile;
    newRole?: UserRole;
    isSuspending?: boolean;
  } | null>(null);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadMembers = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const data = await dataService.getMembers(searchQuery);
      setMembers(data);
    } catch (err: any) {
      console.error('Failed to load members:', err);
      setFeedback({
        type: 'error',
        message: err?.message || 'Could not load member directory.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, [searchQuery]);

  const confirmSuspension = (member: UserProfile) => {
    const isSuspending = member.status !== 'suspended';
    setActionConfirm({
      open: true,
      type: 'suspend',
      member,
      isSuspending
    });
  };

  const confirmRoleChange = (member: UserProfile, newRole: UserRole) => {
    setActionConfirm({
      open: true,
      type: 'role',
      member,
      newRole
    });
  };

  const executeConfirmedAction = async () => {
    if (!actionConfirm) return;
    const { type, member, newRole, isSuspending } = actionConfirm;
    setActionConfirm(null);

    try {
      const actorId = currentUser?.id || 'admin';
      const actorName = currentUser?.display_name || currentUser?.full_name || 'Administrator';

      if (type === 'suspend' && typeof isSuspending === 'boolean') {
        await dataService.toggleMemberSuspension(member.id, isSuspending, actorId, actorName);
        setFeedback({
          type: 'success',
          message: `${member.full_name} has been ${isSuspending ? 'suspended' : 'reactivated'}.`
        });
      } else if (type === 'role' && newRole) {
        await dataService.updateUserRole(member.id, newRole, actorId, actorName);
        setFeedback({
          type: 'success',
          message: `Role for ${member.full_name} updated to "${newRole}".`
        });
      }

      await loadMembers();
    } catch (err: any) {
      console.error('Administrative action failed:', err);
      setFeedback({
        type: 'error',
        message: err?.message || 'Failed to update member record.'
      });
    }
  };

  const filteredMembers = members.filter(m => {
    if (roleFilter !== 'all') {
      const actualRole = m.role || 'doctor';
      if (actualRole !== roleFilter) return false;
    }
    if (statusFilter !== 'all') {
      if (statusFilter === 'active' && m.status === 'suspended') return false;
      if (statusFilter === 'suspended' && m.status !== 'suspended') return false;
      if (statusFilter === 'verified' && m.status !== 'verified') return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filteredMembers.length / ITEMS_PER_PAGE) || 1;
  const paginatedMembers = filteredMembers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-serif font-bold text-brand-navy">
              Member Directory & Roles
            </h1>
            <span className="text-[11px] font-semibold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
              Community Governance
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Audit registered practitioners, researchers, students, and admins; manage account statuses and role assignments.
          </p>
        </div>

        <span className="text-xs text-slate-500">
          Total Members: <strong className="text-brand-navy">{filteredMembers.length}</strong>
        </span>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div className={`p-4 rounded-xl border text-xs flex items-center justify-between ${
          feedback.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
            : 'bg-rose-50 border-rose-200 text-rose-900'
        }`}>
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by practitioner name, email, specialization, or state..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200 text-xs">
            {['all', 'doctor', 'student', 'researcher', 'admin'].map((rf) => (
              <button
                key={rf}
                onClick={() => {
                  setRoleFilter(rf);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition ${
                  roleFilter === rf
                    ? 'bg-white text-brand-navy shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {rf === 'all' ? 'All Roles' : rf}
              </button>
            ))}
          </div>

          <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200 text-xs">
            {[
              { id: 'all', label: 'All Statuses' },
              { id: 'verified', label: 'Verified' },
              { id: 'suspended', label: 'Suspended' }
            ].map((sf) => (
              <button
                key={sf.id}
                onClick={() => {
                  setStatusFilter(sf.id);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                  statusFilter === sf.id
                    ? 'bg-white text-brand-navy font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {sf.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-400">Loading member records...</div>
        ) : filteredMembers.length === 0 ? (
          <div className="py-20 text-center space-y-2">
            <Users className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">No members match your criteria</p>
            <p className="text-xs text-slate-500">Try adjusting your role or search filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Member Name</th>
                  <th className="py-3 px-4">Role Assignment</th>
                  <th className="py-3 px-4">Degree & Practice</th>
                  <th className="py-3 px-4">State & Council</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedMembers.map((member) => {
                  const memberRole = member.role || 'doctor';
                  return (
                    <tr key={member.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <Avatar 
                            name={member.full_name} 
                            src={member.avatar_url} 
                            size="sm" 
                            verified={member.status === 'verified'}
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-brand-navy truncate">{member.full_name}</div>
                            <div className="text-[11px] text-slate-400 truncate">{member.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <select
                          value={memberRole}
                          onChange={(e) => confirmRoleChange(member, e.target.value as UserRole)}
                          className="text-[11px] font-semibold px-2 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 outline-none focus:ring-1 focus:ring-teal-700"
                        >
                          <option value="doctor">Doctor</option>
                          <option value="student">Student</option>
                          <option value="researcher">Researcher</option>
                          <option value="moderator">Moderator</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        <div className="font-medium">{member.qualification || 'BHMS'}</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-xs">{member.specialization || 'General Homoeopathy'}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{member.state || 'India'}</div>
                        <div className="font-mono text-[10px] text-teal-800">{member.registration_number || 'Enrolled Member'}</div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize ${
                          member.status === 'suspended'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {member.status === 'suspended' ? 'Suspended' : 'Verified Member'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => setSelectedMember(member)}
                            className="p-1.5 text-slate-400 hover:text-teal-700 hover:bg-slate-100 rounded-lg transition"
                            title="View member profile details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => confirmSuspension(member)}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                              member.status === 'suspended'
                                ? 'bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200'
                                : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {member.status === 'suspended' ? 'Reactivate' : 'Suspend'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {filteredMembers.length > ITEMS_PER_PAGE && (
          <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <div>
              Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredMembers.length)} of {filteredMembers.length} members
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-semibold text-brand-navy">
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Member Profile Detail Modal */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <Avatar name={selectedMember.full_name} src={selectedMember.avatar_url} size="md" verified={selectedMember.status === 'verified'} />
                <div>
                  <h3 className="text-base font-bold text-brand-navy">{selectedMember.full_name}</h3>
                  <p className="text-xs text-slate-500 capitalize">{selectedMember.role} • {selectedMember.qualification}</p>
                </div>
              </div>
              <button onClick={() => setSelectedMember(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 text-[10px] block font-semibold uppercase">Email</span>
                  <span className="font-medium text-slate-800">{selectedMember.email}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block font-semibold uppercase">Phone</span>
                  <span className="font-medium text-slate-800">{selectedMember.phone || 'Private / Unset'}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block font-semibold uppercase">Location</span>
                  <span className="font-medium text-slate-800">{selectedMember.city ? `${selectedMember.city}, ` : ''}{selectedMember.state}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block font-semibold uppercase">Experience</span>
                  <span className="font-medium text-slate-800">{selectedMember.experience_years} years</span>
                </div>
              </div>

              {selectedMember.registration_number && (
                <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-200">
                  <span className="text-[10px] font-bold text-teal-900 uppercase block">Registration Authority</span>
                  <span className="font-mono text-xs font-bold text-teal-950">{selectedMember.registration_number}</span>
                  <span className="text-[11px] text-teal-800 block mt-0.5">{selectedMember.registration_authority || 'State Homoeopathic Council'}</span>
                </div>
              )}

              {selectedMember.bio && (
                <div>
                  <span className="font-semibold text-slate-700 block mb-1">Clinical Biography</span>
                  <p className="text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed text-[11px]">
                    {selectedMember.bio}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedMember(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Confirmation Modal */}
      {actionConfirm && actionConfirm.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-brand-navy">
                  {actionConfirm.type === 'suspend' 
                    ? (actionConfirm.isSuspending ? 'Suspend Member Account?' : 'Reactivate Member Account?')
                    : 'Confirm Role Change?'}
                </h3>
                <p className="text-xs text-slate-500">Administrative Confirmation</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {actionConfirm.type === 'suspend'
                ? (actionConfirm.isSuspending 
                    ? `Are you sure you want to suspend ${actionConfirm.member.full_name}? The user will immediately lose access to member discussions and their profile will be marked suspended.`
                    : `Are you sure you want to reactivate ${actionConfirm.member.full_name}? The user will regain normal verified member access.`)
                : `Are you sure you want to change the security role for ${actionConfirm.member.full_name} to "${actionConfirm.newRole}"? This will update their administrative privileges.`}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActionConfirm(null)}
                className="px-4 py-2 border border-slate-200 text-xs font-semibold text-slate-600 rounded-xl hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeConfirmedAction}
                className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold shadow-xs transition"
              >
                Confirm Action
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
