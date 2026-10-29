import React, { useState, useEffect } from 'react';
import { dataService } from '../../lib/supabase';
import { UserProfile } from '../../types';
import { Avatar } from '../../components/common/Avatar';
import { 
  FlaskConical, 
  Search, 
  Building2, 
  ExternalLink,
  ChevronLeft, 
  ChevronRight,
  Eye,
  X,
  RefreshCw,
  Award,
  Link as LinkIcon
} from 'lucide-react';

const ITEMS_PER_PAGE = 10;

export const AdminResearchers: React.FC = () => {
  const [researchers, setResearchers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedResearcher, setSelectedResearcher] = useState<UserProfile | null>(null);

  const loadResearchers = async () => {
    setLoading(true);
    try {
      const allMembers = await dataService.getMembers(searchQuery, 'All', 'All', 'All', true);
      const researcherList = allMembers.filter(
        m => m.role === 'researcher' || m.account_type === 'researcher' || (m.interests && m.interests.some(i => i.toLowerCase().includes('research')))
      );
      setResearchers(researcherList);
    } catch (err) {
      console.error('Failed to load researchers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResearchers();
  }, [searchQuery]);

  const filteredResearchers = researchers.filter(r => {
    const q = searchQuery.toLowerCase();
    return !q || 
      r.full_name.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q) ||
      (r.clinic_institution && r.clinic_institution.toLowerCase().includes(q)) ||
      (r.specialization && r.specialization.toLowerCase().includes(q));
  });

  const totalPages = Math.ceil(filteredResearchers.length / ITEMS_PER_PAGE) || 1;
  const paginatedResearchers = filteredResearchers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-serif font-bold text-brand-navy">
              Research Scholars & Investigators
            </h1>
            <span className="text-[11px] font-semibold text-purple-800 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
              Clinical Research
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Audit clinical trialists, research fellows, institutional affiliations, and ORCID publications across the network.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadResearchers}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-teal-600' : 'text-slate-500'}`} />
            <span>Refresh</span>
          </button>
          <span className="text-xs text-slate-500">
            Total Researchers: <strong className="text-brand-navy">{filteredResearchers.length}</strong>
          </span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by researcher name, institution (CCRH, NIH, etc.), or clinical domain..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
          />
        </div>
      </div>

      {/* Researchers Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-400">Loading research directory...</div>
        ) : filteredResearchers.length === 0 ? (
          <div className="py-20 text-center space-y-2">
            <FlaskConical className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">No researchers found</p>
            <p className="text-xs text-slate-500">Try adjusting your search criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Researcher Name</th>
                  <th className="py-3 px-4">Degree & Domain</th>
                  <th className="py-3 px-4">Affiliated Research Institution</th>
                  <th className="py-3 px-4">State</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedResearchers.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={r.full_name} src={r.avatar_url} size="sm" />
                        <div>
                          <div className="font-bold text-brand-navy">{r.full_name}</div>
                          <div className="text-[11px] text-slate-400">{r.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      <div>{r.qualification || 'MD (Hom) / PhD'}</div>
                      <div className="text-[11px] text-purple-700 font-semibold truncate max-w-xs">
                        {r.specialization || 'Clinical Trials & Pharmacology'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="truncate max-w-[220px]">{r.clinic_institution || 'Central Council for Research in Homoeopathy'}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {r.state || 'India'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-800 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                        <Award className="w-3 h-3 text-purple-600" />
                        Accredited Researcher
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedResearcher(r)}
                        className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-lg text-xs font-semibold border border-purple-200 transition inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect Credentials</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {filteredResearchers.length > ITEMS_PER_PAGE && (
          <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <div>
              Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredResearchers.length)} of {filteredResearchers.length} researchers
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

      {/* Researcher Modal */}
      {selectedResearcher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <Avatar name={selectedResearcher.full_name} src={selectedResearcher.avatar_url} size="md" />
                <div>
                  <h3 className="text-base font-bold text-brand-navy">{selectedResearcher.full_name}</h3>
                  <p className="text-xs text-slate-500">{selectedResearcher.qualification} • {selectedResearcher.specialization}</p>
                </div>
              </div>
              <button onClick={() => setSelectedResearcher(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 text-[10px] block font-semibold uppercase">Email</span>
                  <span className="font-medium text-slate-800">{selectedResearcher.email}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block font-semibold uppercase">State / Territory</span>
                  <span className="font-medium text-slate-800">{selectedResearcher.state}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block font-semibold uppercase">Institution</span>
                  <span className="font-medium text-slate-800">{selectedResearcher.clinic_institution || 'Independent Research Institute'}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block font-semibold uppercase">Years in Research</span>
                  <span className="font-medium text-purple-700">{selectedResearcher.experience_years} years</span>
                </div>
              </div>

              {selectedResearcher.social_links?.orcid && (
                <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <LinkIcon className="w-4 h-4 text-purple-700" />
                    <div>
                      <span className="text-[10px] font-bold text-purple-900 uppercase block">ORCID Identifier</span>
                      <span className="font-mono text-xs font-bold text-purple-950">{selectedResearcher.social_links.orcid}</span>
                    </div>
                  </div>
                  <a
                    href={`https://orcid.org/${selectedResearcher.social_links.orcid}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 text-purple-700 hover:text-purple-900"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}

              {selectedResearcher.interests && selectedResearcher.interests.length > 0 && (
                <div>
                  <span className="font-semibold text-slate-700 block mb-1">Methodologies & Research Interests</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedResearcher.interests.map((int, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-lg bg-purple-50 text-purple-800 text-[11px] font-medium border border-purple-200">
                        {int}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedResearcher.bio && (
                <div>
                  <span className="font-semibold text-slate-700 block mb-1">Investigator Summary</span>
                  <p className="text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed text-[11px]">
                    {selectedResearcher.bio}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedResearcher(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
