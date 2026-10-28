import React, { useState, useEffect } from 'react';
import { dataService } from '../../lib/supabase';
import { UserProfile, UserRole } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../../components/common/Avatar';
import { 
  Users, 
  Search, 
  ShieldCheck, 
  UserX, 
  UserCheck, 
  AlertTriangle, 
  Building2, 
  GraduationCap,
  Microscope,
  Stethoscope,
  Shield
} from 'lucide-react';
import { useConfirm } from '../../components/feedback/ToastProvider';

export const AdminMembers: React.FC = () => {
  const { currentUser } = useAuth();
  const confirmAction = useConfirm();
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const data = await dataService.getMembers(searchQuery);
      setMembers(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, [searchQuery]);

  const toggleSuspension = async (member: UserProfile) => {
    const isSuspending = member.status !== 'suspended';
    const actionDesc = isSuspending ? 'suspend' : 'reactivate';
    
    if (!(await confirmAction(`Are you sure you want to ${actionDesc} ${member.full_name}?`, { confirmLabel: isSuspending ? 'Suspend' : 'Reactivate', danger: isSuspending }))) return;

    const updatedStatus = isSuspending ? 'suspended' : 'active';
    const updatedMembers = members.map(m => m.id === member.id ? { ...m, status: updatedStatus as any } : m);
    setMembers(updatedMembers);
    localStorage.setItem('homeocircle_members', JSON.stringify(updatedMembers));

    await dataService.addAuditLog({
      actor_id: currentUser?.id || 'admin',
      actor_name: currentUser?.display_name || 'Administrator',
      action: isSuspending ? 'MEMBER_SUSPENDED' : 'MEMBER_REACTIVATED',
      target_type: 'member',
      target_id: member.id,
      metadata: { full_name: member.full_name, previous_status: member.status }
    });
  };

  const handleRoleChange = async (member: UserProfile, newRole: UserRole) => {
    if (!(await confirmAction(`Change role for ${member.full_name} to "${newRole}"?`, { confirmLabel: 'Change role' }))) return;

    const updatedMembers = members.map(m => m.id === member.id ? { ...m, role: newRole } : m);
    setMembers(updatedMembers);
    localStorage.setItem('homeocircle_members', JSON.stringify(updatedMembers));

    await dataService.addAuditLog({
      actor_id: currentUser?.id || 'admin',
      actor_name: currentUser?.display_name || 'Administrator',
      action: 'MEMBER_ROLE_UPDATED',
      target_type: 'member',
      target_id: member.id,
      metadata: { full_name: member.full_name, previous_role: member.role, new_role: newRole }
    });
  };

  const filteredMembers = members.filter(m => {
    if (roleFilter !== 'all') {
      const actualRole = m.role || 'doctor';
      if (actualRole !== roleFilter) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-brand-navy">
          Member Directory & Role Management
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Audit registered practitioners, scholars, and students; manage verification states and least-privilege role assignments.
        </p>
      </div>

      {/* Search and Role Filter */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by practitioner name, state, or specialization..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {['all', 'doctor', 'student', 'researcher', 'admin'].map((rf) => (
            <button
              key={rf}
              onClick={() => setRoleFilter(rf)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition ${
                roleFilter === rf
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {rf === 'all' ? 'All Roles' : rf}
            </button>
          ))}
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Member Name</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Degree / Details</th>
                <th className="py-3 px-4">State & Council</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMembers.map((member) => {
                const memberRole = member.role || 'doctor';
                return (
                  <tr key={member.id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={member.full_name} src={member.avatar_url} size="xs" />
                        <div>
                          <div className="font-bold text-brand-navy">{member.full_name}</div>
                          <div className="text-xs text-slate-400">{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <select
                        value={memberRole}
                        onChange={(e) => handleRoleChange(member, e.target.value as UserRole)}
                        className="text-xs font-semibold px-2 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 outline-none"
                      >
                        <option value="doctor">Doctor</option>
                        <option value="student">Student</option>
                        <option value="researcher">Researcher</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      <div>{member.qualification}</div>
                      <div className="text-xs text-slate-400">{member.specialization}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{member.state}</div>
                      <div className="font-mono text-[11px] text-teal-800">{member.registration_number || 'Enrolled Member'}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full capitalize ${
                        member.status === 'suspended'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-teal-50 text-teal-700 border border-teal-200'
                      }`}>
                        {member.status || 'Active'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => toggleSuspension(member)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                          member.status === 'suspended'
                            ? 'bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200'
                            : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {member.status === 'suspended' ? 'Reactivate' : 'Suspend'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
