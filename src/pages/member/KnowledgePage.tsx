import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dataService } from '../../lib/supabase';
import { KnowledgePost } from '../../types';
import { 
  BookOpen, 
  ExternalLink, 
  AlertCircle, 
  CheckCircle2, 
  Search, 
  Filter, 
  FileText,
  Scale,
  Plus,
  X
} from 'lucide-react';

export const KnowledgePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, isDoctor, isResearcher, isAdmin } = useAuth();
  const [posts, setPosts] = useState<KnowledgePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // New Research Post Form State
  const [newTitle, setNewTitle] = useState('');
  const [newJournal, setNewJournal] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [newLimitations, setNewLimitations] = useState('');
  const [newSourceUrl, setNewSourceUrl] = useState('');
  const [newContentType, setNewContentType] = useState<'Systematic Review' | 'Clinical Trial' | 'Observational Study' | 'Materia Medica Analysis'>('Clinical Trial');

  const categories = ['All', 'Clinical Trials', 'Meta-Analyses', 'Monographs', 'Observational Studies'];

  const loadPosts = async () => {
    setLoading(true);
    try {
      const res = await dataService.getKnowledgePosts();
      setPosts(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const handleCreateResearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newSummary.trim()) return;

    try {
      await dataService.createKnowledgePost({
        title: newTitle.trim(),
        journal: newJournal.trim() || 'Peer-Reviewed Literature',
        summary: newSummary.trim(),
        limitations: newLimitations.trim() || 'Methodological constraints and control group details detailed in full paper.',
        source_url: newSourceUrl.trim() || 'https://pubmed.ncbi.nlm.nih.gov',
        content_type: newContentType
      });

      setSubmitSuccess(true);
      setShowSubmitModal(false);
      setNewTitle('');
      setNewJournal('');
      setNewSummary('');
      setNewLimitations('');
      setNewSourceUrl('');
      loadPosts();
      setTimeout(() => setSubmitSuccess(false), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = posts.filter(p => {
    const matchesSearch = !searchQuery || 
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.journal.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (selectedCategory === 'All') return true;
    if (selectedCategory === 'Clinical Trials') return p.content_type === 'Clinical Trial';
    if (selectedCategory === 'Monographs') return p.content_type === 'Materia Medica Analysis';
    if (selectedCategory === 'Meta-Analyses') return p.content_type === 'Systematic Review';
    if (selectedCategory === 'Observational Studies') return p.content_type === 'Observational Study';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-brand-navy">
            Research
          </h1>
        </div>

        {currentUser ? (
          (isDoctor || isResearcher || isAdmin) && (
            <button
              onClick={() => setShowSubmitModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold shadow-xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add research</span>
            </button>
          )
        ) : (
          <button
            onClick={() => navigate('/login', { state: { from: location } })}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add research</span>
          </button>
        )}
      </div>

      {submitSuccess && (
        <div className="p-3 bg-teal-50 border border-teal-200 text-teal-800 rounded-xl text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-teal-600" />
          <span>Research publication submitted successfully and published to the peer library.</span>
        </div>
      )}

      {/* Category Pills & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search research…"
            className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
        </div>

      </div>

      {/* Publications List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs animate-pulse space-y-3">
              <div className="h-5 bg-slate-200 rounded w-1/3"></div>
              <div className="h-16 bg-slate-100 rounded"></div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-3">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-brand-navy">No publications match your criteria</h3>
          <p className="text-xs text-slate-500">Try adjusting your search query or selected category filter.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((post) => (
            <article
              key={post.id}
              className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-card hover:border-teal-300 transition space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200 uppercase tracking-wide">
                  {post.content_type}
                </span>
                <span className="text-xs text-slate-400">{post.published_at}</span>
              </div>

              <div className="space-y-1.5">
                <h2 className="text-base font-bold text-brand-navy leading-snug">
                  {post.title}
                </h2>
                <p className="text-xs font-semibold text-slate-500">
                  Published in: <span className="italic text-slate-700">{post.journal}</span>
                </p>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {post.summary}
              </p>

              {/* Explicit Limitations Box (PRD requirement) */}
              <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200/80 text-xs text-amber-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wide text-amber-800">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Documented Study Limitations</span>
                </div>
                <p className="text-xs leading-relaxed text-amber-800">
                  {post.limitations}
                </p>
              </div>

              {/* Source Link */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <a
                  href={post.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-teal-700 hover:text-teal-800 font-semibold"
                >
                  <span>Read Full Text / DOI</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Submit Research Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">
                Submit Research Resource
              </span>
              <button onClick={() => setShowSubmitModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateResearch} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Study Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Individualized Homeopathy in Chronic Migraine: A Double-Blind Trial"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Journal / Publisher
                  </label>
                  <input
                    type="text"
                    required
                    value={newJournal}
                    onChange={(e) => setNewJournal(e.target.value)}
                    placeholder="e.g. Homeopathy (Thieme)"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Study Type
                  </label>
                  <select
                    value={newContentType}
                    onChange={(e: any) => setNewContentType(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none bg-white"
                  >
                    <option value="Clinical Trial">Randomized Controlled Trial</option>
                    <option value="Observational Study">Observational Clinical Study</option>
                    <option value="Systematic Review">Systematic Review & Meta-Analysis</option>
                    <option value="Materia Medica Analysis">Materia Medica Monograph</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Clinical Summary & Methodology *
                </label>
                <textarea
                  required
                  rows={3}
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  placeholder="Detail cohort size, intervention group, potencies evaluated, and primary endpoints..."
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Documented Study Limitations (Required for Editorial Compliance) *
                </label>
                <input
                  type="text"
                  required
                  value={newLimitations}
                  onChange={(e) => setNewLimitations(e.target.value)}
                  placeholder="e.g. Single-center study; limited 12-month follow-up window."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  DOI or PubMed URL
                </label>
                <input
                  type="url"
                  value={newSourceUrl}
                  onChange={(e) => setNewSourceUrl(e.target.value)}
                  placeholder="https://doi.org/10.1055/s-..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold shadow"
                >
                  Publish Publication
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
