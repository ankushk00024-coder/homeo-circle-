import React, { useState, useEffect } from 'react';
import { dataService } from '../../lib/supabase';
import { KnowledgePost } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Plus, X, ImagePlus, FileText } from 'lucide-react';
import { useToast } from '../../components/feedback/ToastProvider';

export const AdminKnowledge: React.FC = () => {
  const { currentUser } = useAuth();
  const [posts, setPosts] = useState<KnowledgePost[]>([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form
  const [title, setTitle] = useState('');
  const [journal, setJournal] = useState('');
  const [contentType, setContentType] = useState<'Clinical Trial' | 'Systematic Review' | 'Observational Study' | 'Materia Medica Analysis'>('Clinical Trial');
  const [sourceUrl, setSourceUrl] = useState('');
  const [summary, setSummary] = useState('');
  const [limitations, setLimitations] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([]);
  const [pdf, setPdf] = useState<File | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const toast = useToast();

  const addPhotos = (files: FileList | null) => {
    if (!files) return;
    const picked = Array.from(files).filter((f) => f.type.startsWith('image/'));
    setPhotos((prev) => [...prev, ...picked.slice(0, 6 - prev.length).map((file) => ({ file, preview: URL.createObjectURL(file) }))]);
  };

  const loadData = async () => {
    setLoading(true);
    const data = await dataService.getKnowledgePosts();
    setPosts(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.id) return;
    setFormError(null);
    setSubmitting(true);

    try {
      // Upload files first (photos are compressed; the PDF is kept as is).
      const imageUrls: string[] = [];
      for (const p of photos) imageUrls.push(await dataService.uploadResearchFile(currentUser.id, p.file));
      const attachmentUrl = pdf ? await dataService.uploadResearchFile(currentUser.id, pdf) : undefined;

      const newPost = await dataService.createKnowledgePost({
        title: title.trim(),
        journal: journal.trim() || 'Homeo India',
        content_type: contentType,
        source_url: sourceUrl.trim() || attachmentUrl || '',
        summary: summary.trim(),
        limitations: limitations.trim() || 'See the full paper for methods and limitations.',
        image_urls: imageUrls,
        attachment_url: attachmentUrl,
        created_by: currentUser.id
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
      setJournal('');
      setLimitations('');
      photos.forEach((p) => URL.revokeObjectURL(p.preview));
      setPhotos([]);
      setPdf(null);
      setCreateModalOpen(false);
      toast.success('Research published. It is live on the Research page.');
      await loadData();
    } catch (err) {
      console.error(err);
      setFormError(err instanceof Error ? err.message : 'Could not publish this research.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-brand-navy">
            Research
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Add papers with images and a PDF. They go live on the Research page straight away.
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold shadow transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add research</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-400">Loading research entries...</div>
        ) : posts.length === 0 ? (
          <div className="py-20 text-center text-xs text-slate-500">No research studies indexed yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
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
                    {(post.image_urls?.length || post.attachment_url) && (
                      <span className="text-[10px] text-teal-700">
                        {post.image_urls?.length ? `${post.image_urls.length} image${post.image_urls.length > 1 ? 's' : ''}` : ''}
                        {post.image_urls?.length && post.attachment_url ? ' · ' : ''}
                        {post.attachment_url ? 'PDF attached' : ''}
                      </span>
                    )}
                    <span className="text-[11px] text-slate-400 line-clamp-1">{post.summary}</span>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-700 italic">
                    {post.journal}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-50 text-sky-800 border border-sky-200">
                      {post.content_type}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-amber-800 max-w-xs text-[11px]">
                    <span className="line-clamp-1">{post.limitations}</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                    {post.published_at}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>

      {/* Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-brand-navy">Add research</h3>
              <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Title *</label>
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
                  <label className="block font-semibold text-slate-700 mb-1">Journal / source</label>
                  <input
                    type="text"
                    placeholder="e.g. Indian Journal of Research in Homoeopathy"
                    value={journal}
                    onChange={(e) => setJournal(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Type *</label>
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
                <label className="block font-semibold text-slate-700 mb-1">Link (DOI / PubMed / website, optional)</label>
                <input
                  type="url"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  placeholder="https://doi.org/... or https://pubmed.ncbi.nlm.nih.gov/..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Summary *</label>
                <textarea
                  rows={5}
                  required
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Limitations (optional)
                </label>
                <textarea
                  rows={2}
                  value={limitations}
                  onChange={(e) => setLimitations(e.target.value)}
                  placeholder="Mention sample size constraints, open-label bias, or need for multicentric replication..."
                  className="w-full p-2.5 border border-slate-200 rounded-xl outline-none text-amber-900 bg-amber-50/50"
                />
              </div>

              {/* Images (up to 6) */}
              <div className="space-y-2">
                {photos.length > 0 && (
                  <div className="grid grid-cols-6 gap-1.5">
                    {photos.map((p, i) => (
                      <div key={p.preview} className="relative aspect-square rounded-lg overflow-hidden ring-1 ring-slate-200">
                        <img src={p.preview} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setPhotos((prev) => { URL.revokeObjectURL(prev[i].preview); return prev.filter((_, idx) => idx !== i); })}
                          className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center"
                          aria-label="Remove image"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {photos.length < 6 && (
                    <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 font-semibold text-brand-navy hover:bg-slate-50 cursor-pointer">
                      <ImagePlus className="w-4 h-4 text-teal-700" />
                      Add images <span className="font-normal text-slate-400">({photos.length}/6)</span>
                      <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { addPhotos(e.target.files); e.target.value = ''; }} />
                    </label>
                  )}
                  <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 font-semibold text-brand-navy hover:bg-slate-50 cursor-pointer max-w-full">
                    <FileText className="w-4 h-4 text-teal-700 flex-shrink-0" />
                    <span className="truncate">{pdf ? pdf.name : 'Attach PDF (optional)'}</span>
                    <input type="file" accept="application/pdf" className="hidden" onChange={(e) => { setPdf(e.target.files?.[0] || null); e.target.value = ''; }} />
                  </label>
                  {pdf && (
                    <button type="button" onClick={() => setPdf(null)} className="text-slate-400 hover:text-rose-600 text-[11px]">Remove PDF</button>
                  )}
                </div>
              </div>

              {formError && <p className="text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{formError}</p>}

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
                  {submitting ? 'Uploading…' : 'Publish research'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
