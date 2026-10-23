import React, { useState, useEffect } from 'react';
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
  Scale
} from 'lucide-react';

export const KnowledgePage: React.FC = () => {
  const [posts, setPosts] = useState<KnowledgePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    dataService.getKnowledgePosts().then(res => {
      setPosts(res);
      setLoading(false);
    });
  }, []);

  const filtered = posts.filter(p => 
    !searchQuery || 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.journal.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-serif font-bold text-brand-navy">
          Curated Research & Publications
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Peer-reviewed homeopathic literature, clinical trials, and meta-analyses with explicit methodological limitations.
        </p>
      </div>

      {/* Search Input */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search research by keyword, pathology, or journal title..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
        </div>
      </div>

      {/* Academic Integrity Disclaimer */}
      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs text-slate-600 flex items-start gap-3">
        <Scale className="w-4 h-4 text-teal-700 flex-shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Academic Transparency Rule:</strong> In compliance with Homeo Circle editorial policy, all indexed studies clearly indicate design limitations, sample sizes, and primary journal DOIs. Published research is provided for academic review and does not constitute universal clinical efficacy proof.
        </p>
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
      ) : (
        <div className="space-y-4">
          {filtered.map((post) => (
            <article
              key={post.id}
              className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-card hover:border-teal-300 transition space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
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
                <div className="flex items-center gap-1.5 font-bold text-[11px] uppercase tracking-wide text-amber-800">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Documented Study Limitations</span>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-800">
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
    </div>
  );
};
