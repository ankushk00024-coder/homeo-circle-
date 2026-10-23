import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dataService } from '../../lib/supabase';
import { UserProfile } from '../../types';
import { Avatar } from '../../components/common/Avatar';
import { 
  Search, 
  Filter, 
  MapPin, 
  Briefcase, 
  UserPlus, 
  Check, 
  MoreHorizontal,
  X
} from 'lucide-react';

export const MembersPage: React.FC = () => {
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState('All');
  const [selectedSpec, setSelectedSpec] = useState('All');
  const [connectedIds, setConnectedIds] = useState<Record<string, boolean>>({});
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [loading, setLoading] = useState(true);

  const statesList = [
    'All', 'Maharashtra', 'Karnataka', 'Delhi', 'Uttar Pradesh', 'Gujarat', 'West Bengal', 'Kerala', 'Telangana'
  ];

  const specList = [
    'All', 'Clinical Practice', 'Research & Academia', "Women's Health", 'Chronic Disease', 'Pediatrics', 'Practice Management'
  ];

  useEffect(() => {
    setLoading(true);
    dataService.getMembers(searchQuery, selectedState, selectedSpec).then((res) => {
      setMembers(res);
      setLoading(false);
    });
  }, [searchQuery, selectedState, selectedSpec]);

  const toggleConnect = (id: string) => {
    setConnectedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6">
      {/* Header matching Reference Bottom Left */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-brand-navy">
            Find Members
          </h1>
          <p className="text-xs text-[#5A6E85] mt-0.5">
            Connect with verified homeopathic practitioners across India.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#5A6E85] font-medium">
            Showing <strong className="text-brand-navy">{members.length}</strong> verified practitioners
          </span>
        </div>
      </div>

      {/* Search and Filters Bar matching Reference */}
      <div className="bg-white rounded-2xl p-4 border border-brand-border/80 shadow-subtle flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search members, specialization, location..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-[#EEF6FC]/60 border border-brand-border/80 rounded-xl focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none text-slate-700 placeholder-slate-400"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
        </div>

        {/* State Filter dropdown */}
        <div className="hidden sm:block">
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="px-3 py-2 text-xs bg-[#EEF6FC]/60 border border-brand-border/80 rounded-xl focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none text-slate-700"
          >
            <option value="All">All States</option>
            {statesList.filter(s => s !== 'All').map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Specialization Filter dropdown */}
        <div className="hidden sm:block">
          <select
            value={selectedSpec}
            onChange={(e) => setSelectedSpec(e.target.value)}
            className="px-3 py-2 text-xs bg-[#EEF6FC]/60 border border-brand-border/80 rounded-xl focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none text-slate-700"
          >
            <option value="All">All Specializations</option>
            {specList.filter(s => s !== 'All').map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Filters button matching Reference Bottom Left */}
        <button
          onClick={() => setShowFilterDrawer(!showFilterDrawer)}
          className="px-4 py-2 bg-white hover:bg-slate-50 border border-brand-border rounded-xl text-xs font-semibold text-brand-navy flex items-center gap-1.5 shadow-subtle transition"
        >
          <Filter className="w-3.5 h-3.5 text-brand-teal" />
          <span>Filters</span>
        </button>
      </div>

      {/* Mobile Filter Drawer */}
      {showFilterDrawer && (
        <div className="p-4 bg-white rounded-2xl border border-brand-border shadow-card space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-bold text-brand-navy">Filter Directory</span>
            <button onClick={() => setShowFilterDrawer(false)} className="text-slate-400">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-500 mb-1 block">State / Region</label>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full p-2 text-xs border border-brand-border rounded-lg outline-none bg-white"
              >
                {statesList.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-500 mb-1 block">Clinical Focus</label>
              <select
                value={selectedSpec}
                onChange={(e) => setSelectedSpec(e.target.value)}
                className="w-full p-2 text-xs border border-brand-border rounded-lg outline-none bg-white"
              >
                {specList.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Members Grid matching Reference Bottom Left */}
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
          <p className="text-sm font-bold text-brand-navy">No members found matching your filter criteria</p>
          <p className="text-xs text-[#5A6E85]">Try adjusting your search keywords or resetting filters.</p>
          <button
            onClick={() => { setSearchQuery(''); setSelectedState('All'); setSelectedSpec('All'); }}
            className="px-4 py-2 bg-brand-teal text-white rounded-xl text-xs font-semibold"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {members.map((member) => {
            const isConnected = connectedIds[member.id];
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
                      verified
                      className="mx-auto sm:mx-0"
                    />

                    <div className="hidden sm:block">
                      <button
                        onClick={() => alert(`Practitioner registered under: ${member.registration_authority}`)}
                        className="text-slate-400 hover:text-slate-600 p-1"
                        title="Registration Record"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <Link
                      to={`/members/${member.id}`}
                      className="text-sm font-bold text-brand-navy group-hover:text-brand-teal transition block leading-snug"
                    >
                      {member.full_name}
                    </Link>
                    <p className="text-[11px] text-[#5A6E85] font-medium">
                      {member.qualification}, {member.experience_years} yrs
                    </p>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center justify-center sm:justify-start gap-1.5 text-[#5A6E85]">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="text-[11px] truncate">{member.state}</span>
                    </div>

                    <div className="flex items-center justify-center sm:justify-start gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-brand-teal flex-shrink-0" />
                      <span className="text-[11px] font-medium text-brand-teal bg-brand-teal-50 px-2 py-0.5 rounded truncate">
                        {member.specialization || 'Clinical Practice'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Action: Connect Button matching Reference */}
                <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => toggleConnect(member.id)}
                    className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
                      isConnected
                        ? 'bg-brand-teal-100 text-brand-teal border border-brand-teal/20'
                        : 'bg-white hover:bg-brand-teal-50 text-brand-navy hover:text-brand-teal border border-brand-border'
                    }`}
                  >
                    {isConnected ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-brand-teal" />
                        <span>Connected</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5 text-slate-400" />
                        <span>Connect</span>
                      </>
                    )}
                  </button>

                  <Link
                    to={`/members/${member.id}`}
                    className="py-1.5 px-2.5 rounded-xl border border-brand-border text-xs font-medium text-[#5A6E85] hover:text-brand-navy hover:bg-slate-50 transition"
                  >
                    Profile
                  </Link>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
