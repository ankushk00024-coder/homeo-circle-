import React, { useState, useEffect } from 'react';
import { dataService } from '../../lib/supabase';
import { UserProfile } from '../../types';
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
  GraduationCap 
} from 'lucide-react';

export const AdminMembers: React.FC = () => {
  const { currentUser } = useAuth();
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const loadMembers = async () => {
    setLoading(true);
    const data = await dataService.getMembers(searchQuery);
    setMembers(data);
    setLoading(false);
  };

  useEffect(() => {
    loadMembers();
  }, [searchQuery]);

  const toggleSuspension = async (member: UserProfile) => {
    const isSuspending = member.status !== 'suspended';
    const actionDesc = isSuspending ? 'suspend' : 'reactivate';
    
    if (!window.confirm(`Are you sure you want to ${actionDesc} ${member.full_name}?`)) return;

    // Update member status
    const updatedStatus = isSuspending ? 'suspended' : 'verified';
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-brand-navy">
          Member Directory Management
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Audit verified active members, inspect state council credentials, and manage suspensions.
        </p>
      </div>

      {/* Search Input */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by practitioner name, state, or specialization..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Member Name</th>
                <th className="py-3 px-4">Degree</th>
                <th className="py-3 px-4">Registration Authority</th>
                <th className="py-3 px-4">State</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50 transition">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={member.full_name} src={member.avatar_url} size="xs" />
                      <div>
                        <div className="font-bold text-brand-navy">{member.full_name}</div>
                        <div className="text-[11px] text-slate-400">{member.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-700">
                    {member.qualification} ({member.experience_years} yrs)
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-mono text-teal-900 font-semibold">{member.registration_number || 'NCH/Central'}</div>
                    <div className="text-[10px] text-slate-500 max-w-[200px] truncate">{member.registration_authority}</div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 font-medium">
                    {member.state}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full capitalize ${
                      member.status === 'verified'
                        ? 'bg-teal-50 text-teal-700 border border-teal-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      {member.status}
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
