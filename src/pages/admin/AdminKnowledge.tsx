import React, { useState, useEffect } from 'react';
import { dataService } from '../../lib/supabase';
import { KnowledgePost } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, Plus, ExternalLink, AlertCircle, X } from 'lucide-react';

export const AdminKnowledge: React.FC = () => {
  const { currentUser } = useAuth();
  const [posts, setPosts] = useState<KnowledgePost[]>([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form
  const [title, setTitle] = useState('');
  const [journal, setJournal] = useState('Indian Journal of Research in Homoeopathy');
  const [contentType, setContentType] = useState<'Clinical Trial' | 'Systematic Review' | 'Observational Study' | 'Materia Medica Analysis'>('Clinical Trial');
  const [sourceUrl, setSourceUrl] = useState('');
  const [summary, setSummary] = useState('');
  const [limitations, setLimitations] = useState('Preliminary cohort; requires multicenter blinded replication before definitive clinical recommendation.');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await dataService.getKnowledgePosts();
      setPosts(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const newPost = await dataService.createKnowledgePost({
        title: title.trim(),
        journal: journal.trim(),
        content_type: contentType,
        source_url: sourceUrl.trim(),
        summary: summary.trim(),
        limitations: limitations.trim(),
        created_by: currentUser?.id
      });

      await dataService.addAuditLog({
        actor_id: currentUser?.id || 'admin',
        actor_name: currentUser?.display_name || 'Administrator',
        action: 'KNOWLEDGE_POST_CREATED',
        target_type: 'knowledge_post',
        target_id: newPost.id,
        metadata: { title: newPost.title, journal: newPost.journal }
      });

      setTitle('');
      setSummary('');
      setSourceUrl('');
      setCreateModalOpen(false);
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-brand-navy">
            Curated Research Knowledge Repository
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Maintain high-quality research entries with explicit study limitations and primary DOI references.
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold shadow transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Index New Study</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Study Title</th>
                <th className="py-3 px-4">Journal</th>
                <th className="py-3 px-4">Design Type</th>
                <th className="py-3 px-4">Limitations Statement</th>
                <th className="py-3 px-4">Indexed Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {posts.map((post) => (
                <tr key={post.id} className="hover:bg-slate-50 transition">
                  <td className="py-3.5 px-4 max-w-sm">
                    <span className="font-bold text-brand-navy block truncate">{post.title}</span>
                    <span className="text-xs text-slate-400 line-clamp-1">{post.summary}</span>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-700 italic">
                    {post.journal}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-sky-50 text-sky-800 border border-sky-200">
                      {post.content_type}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-amber-800 max-w-xs text-xs">
                    <span className="line-clamp-1">{post.limitations}</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 font-mono text-xs">
                    {post.published_at}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-brand-navy">Index Peer-Reviewed Research</h3>
              <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Study Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Observational Study on Multi-Centric Psoriasis Cohorts in India"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Journal Name *</label>
                  <input
                    type="text"
                    required
                    value={journal}
                    onChange={(e) => setJournal(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Methodology Type *</label>
                  <select
                    value={contentType}
                    onChange={(e: any) => setContentType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none bg-white"
                  >
                    <option value="Clinical Trial">Clinical Trial</option>
                    <option value="Systematic Review">Systematic Review & Meta-Analysis</option>
                    <option value="Observational Study">Observational Registry</option>
                    <option value="Materia Medica Analysis">Materia Medica Analysis</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Primary DOI / PubMed URL *</label>
                <input
                  type="url"
                  required
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  placeholder="https://doi.org/... or https://pubmed.ncbi.nlm.nih.gov/..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Abstract Summary *</label>
                <textarea
                  rows={3}
                  required
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Documented Limitations (Mandatory under PRD guidelines) *
                </label>
                <textarea
                  rows={2}
                  required
                  value={limitations}
                  onChange={(e) => setLimitations(e.target.value)}
                  placeholder="Mention sample size constraints, open-label bias, or need for multicentric replication..."
                  className="w-full p-2.5 border border-slate-200 rounded-xl outline-none text-amber-900 bg-amber-50/50"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-xs font-semibold text-slate-600 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold shadow"
                >
                  {submitting ? 'Indexing...' : 'Index Publication'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
