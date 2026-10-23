import React, { useState, useEffect } from 'react';
import { dataService } from '../../lib/supabase';
import { Opportunity } from '../../types';
import { 
  Briefcase, 
  MapPin, 
  Clock, 
  ArrowRight, 
  CheckCircle2, 
  ExternalLink,
  Building,
  GraduationCap,
  X
} from 'lucide-react';

export const OpportunitiesPage: React.FC = () => {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [activeTab, setActiveTab] = useState('All');
  const [loading, setLoading] = useState(true);
  const [activeOpp, setActiveOpp] = useState<Opportunity | null>(null);
  const [appliedIds, setAppliedIds] = useState<Record<string, boolean>>({});

  const filterTabs = ['All', 'Jobs', 'Internships', 'Research', 'Collaborations'];

  useEffect(() => {
    setLoading(true);
    dataService.getOpportunities(activeTab).then((res) => {
      setOpportunities(res);
      setLoading(false);
    });
  }, [activeTab]);

  const handleApply = (opp: Opportunity) => {
    setAppliedIds(prev => ({ ...prev, [opp.id]: true }));
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'job': return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'research': return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'collaboration': return 'bg-purple-50 text-purple-700 border-purple-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header matching Reference */}
      <div>
        <h1 className="text-2xl font-serif font-bold text-brand-navy">
          Opportunities
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Jobs, internships, research calls and collaborations.
        </p>
      </div>

      {/* Filter Tabs matching Reference */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-brand-border/70">
        {filterTabs.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                isActive
                  ? 'bg-brand-teal text-white shadow-xs'
                  : 'bg-white text-brand-muted hover:bg-brand-ice/60 border border-brand-border/80'
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Opportunities List matching Reference */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs animate-pulse space-y-3">
              <div className="h-5 bg-slate-200 rounded w-1/3"></div>
              <div className="h-4 bg-slate-100 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : opportunities.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-3">
          <Briefcase className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-brand-navy">No opportunities found in this category</h3>
          <p className="text-xs text-slate-500">New postings are reviewed and added weekly.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {opportunities.map((opp) => {
            const hasApplied = appliedIds[opp.id];
            return (
              <div
                key={opp.id}
                onClick={() => setActiveOpp(opp)}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-card hover:border-teal-300 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer group"
              >
                {/* Left: Icon + Title + Meta */}
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-100 text-teal-700 flex items-center justify-center flex-shrink-0 group-hover:bg-teal-50 transition">
                    <Briefcase className="w-5 h-5" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-brand-navy group-hover:text-teal-800 transition">
                        {opp.title}
                      </h2>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${getTypeBadgeColor(opp.type)}`}>
                        {opp.type}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600">
                      {opp.organization}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                      <span>{opp.timing}</span>
                      <span>•</span>
                      <span>{opp.mode}</span>
                      <span>•</span>
                      <span>{opp.location}</span>
                      <span>•</span>
                      <span>{opp.posted_time_ago}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Apply action */}
                <div className="w-full sm:w-auto flex items-center justify-end">
                  <button
                    onClick={(e) => { e.stopPropagation(); setActiveOpp(opp); }}
                    className="w-full sm:w-auto px-4 py-2 bg-slate-50 hover:bg-teal-50 text-brand-navy hover:text-teal-800 rounded-xl text-xs font-semibold border border-slate-200 transition"
                  >
                    View Details &rarr;
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Opportunity Modal */}
      {activeOpp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${getTypeBadgeColor(activeOpp.type)}`}>
                {activeOpp.type}
              </span>
              <button onClick={() => setActiveOpp(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <h2 className="text-lg font-serif font-bold text-brand-navy leading-snug">
                {activeOpp.title}
              </h2>
              <p className="text-xs font-semibold text-slate-700">
                {activeOpp.organization} • {activeOpp.location} ({activeOpp.mode})
              </p>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 space-y-2">
                <div>
                  <span className="font-semibold text-brand-navy block">Eligibility:</span>
                  <span>{activeOpp.eligibility}</span>
                </div>
                <div>
                  <span className="font-semibold text-brand-navy block">Description:</span>
                  <span className="leading-relaxed block">{activeOpp.description}</span>
                </div>
                <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                  <span>Commitment: <strong>{activeOpp.timing}</strong></span>
                  <span>Application Deadline: <strong>{activeOpp.deadline}</strong></span>
                </div>
              </div>

              {appliedIds[activeOpp.id] && (
                <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-teal-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0" />
                  <span>Application submitted! Your verified practitioner profile was sent to {activeOpp.organization}.</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setActiveOpp(null)}
                className="px-4 py-2 border border-slate-200 text-xs font-semibold text-slate-600 rounded-xl"
              >
                Close
              </button>
              {!appliedIds[activeOpp.id] && (
                <button
                  onClick={() => handleApply(activeOpp)}
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold shadow"
                >
                  Apply with Verified Profile
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
