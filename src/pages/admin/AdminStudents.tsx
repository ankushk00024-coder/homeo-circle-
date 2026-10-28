import React, { useState, useEffect } from 'react';
import { dataService } from '../../lib/supabase';
import { UserProfile } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../../components/common/Avatar';
import { 
  GraduationCap, 
  Search, 
  Building2, 
  ChevronLeft, 
  ChevronRight,
  Eye,
  X,
  RefreshCw,
  Sparkles
} from 'lucide-react';

const ITEMS_PER_PAGE = 10;

export const AdminStudents: React.FC = () => {
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStudent, setSelectedStudent] = useState<UserProfile | null>(null);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const allMembers = await dataService.getMembers(searchQuery);
      // Filter for student accounts or student roles
      const studentList = allMembers.filter(
        m => m.role === 'student' || m.account_type === 'student' || m.qualification?.toLowerCase().includes('bhms')
      );
      setStudents(studentList);
    } catch (err) {
      console.error('Failed to load students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, [searchQuery]);

  const filteredStudents = students.filter(s => {
    if (yearFilter !== 'all') {
      const qual = (s.qualification || '').toLowerCase();
      if (!qual.includes(yearFilter.toLowerCase())) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE) || 1;
  const paginatedStudents = filteredStudents.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-serif font-bold text-brand-navy">
              Student Scholars & Interns
            </h1>
            <span className="text-[11px] font-semibold text-indigo-800 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
              Academic Network
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Monitor undergraduate and postgraduate homoeopathy students, academic affiliations, and clinical mentorship participation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadStudents}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-teal-600' : 'text-slate-500'}`} />
            <span>Refresh</span>
          </button>
          <span className="text-xs text-slate-500">
            Total Students: <strong className="text-brand-navy">{filteredStudents.length}</strong>
          </span>
        </div>
      </div>

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
            placeholder="Search by student name, college/institution, or state..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Year of Study:</span>
          <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200 text-xs">
            {[
              { id: 'all', label: 'All Years' },
              { id: 'final', label: 'Final Year' },
              { id: 'intern', label: 'Interns' },
              { id: 'postgraduate', label: 'PG / MD' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setYearFilter(tab.id);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                  yearFilter === tab.id
                    ? 'bg-white text-brand-navy font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-400">Loading student directory...</div>
        ) : filteredStudents.length === 0 ? (
          <div className="py-20 text-center space-y-2">
            <GraduationCap className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">No student profiles found</p>
            <p className="text-xs text-slate-500">Try adjusting your search query or year filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Course / Program</th>
                  <th className="py-3 px-4">College / University</th>
                  <th className="py-3 px-4">State</th>
                  <th className="py-3 px-4">Mentorship Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={s.full_name} src={s.avatar_url} size="sm" />
                        <div>
                          <div className="font-bold text-brand-navy">{s.full_name}</div>
                          <div className="text-[11px] text-slate-400">{s.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      <div>{s.qualification || 'BHMS Undergraduate'}</div>
                      <div className="text-[11px] text-indigo-700 font-semibold">
                        {s.experience_years ? `Year ${s.experience_years}` : 'Enrolled'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate max-w-[220px]">{s.clinic_institution || 'Govt. Homoeopathic College'}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {s.state || 'India'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <Sparkles className="w-3 h-3 text-emerald-600" />
                        Eligible for Mentorship
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedStudent(s)}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 rounded-lg text-xs font-semibold border border-indigo-200 transition inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect Profile</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {filteredStudents.length > ITEMS_PER_PAGE && (
          <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <div>
              Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredStudents.length)} of {filteredStudents.length} students
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

      {/* Student Profile Detail Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <Avatar name={selectedStudent.full_name} src={selectedStudent.avatar_url} size="md" />
                <div>
                  <h3 className="text-base font-bold text-brand-navy">{selectedStudent.full_name}</h3>
                  <p className="text-xs text-slate-500">{selectedStudent.qualification}</p>
                </div>
              </div>
              <button onClick={() => setSelectedStudent(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 text-[10px] block font-semibold uppercase">Email</span>
                  <span className="font-medium text-slate-800">{selectedStudent.email}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block font-semibold uppercase">State</span>
                  <span className="font-medium text-slate-800">{selectedStudent.state}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block font-semibold uppercase">Academic College</span>
                  <span className="font-medium text-slate-800">{selectedStudent.clinic_institution || 'Homoeopathic Medical College'}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block font-semibold uppercase">Mentorship Status</span>
                  <span className="font-medium text-indigo-700">Eligible</span>
                </div>
              </div>

              {selectedStudent.interests && selectedStudent.interests.length > 0 && (
                <div>
                  <span className="font-semibold text-slate-700 block mb-1">Clinical Interests & Focus Areas</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedStudent.interests.map((int, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-800 text-[11px] font-medium border border-indigo-200">
                        {int}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedStudent.bio && (
                <div>
                  <span className="font-semibold text-slate-700 block mb-1">Academic Statement</span>
                  <p className="text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed text-[11px]">
                    {selectedStudent.bio}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedStudent(null)}
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
