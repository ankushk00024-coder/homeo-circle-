import React, { useState, useEffect } from 'react';
import { dataService } from '../../lib/supabase';
import { Post, Report } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { 
  ShieldCheck, 
  Flag, 
  MessageSquare, 
  EyeOff, 
  Eye, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle,
  XCircle,
  ExternalLink 
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminContent: React.FC = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'discussions' | 'reports'>('reports');
  const [posts, setPosts] = useState<Post[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [postsData, reportsData] = await Promise.all([
        dataService.getPosts(),
        dataService.getReports()
      ]);
      setPosts(postsData);
      setReports(reportsData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleHidePost = async (post: Post) => {
    const newStatus = post.status === 'hidden' ? 'published' : 'hidden';
    const reason = prompt(`Enter moderation reason for changing status to ${newStatus}:`, 'Breach of clinical case de-identification guidelines');
    if (reason === null) return;

    try {
      await dataService.updatePost(post.id, { status: newStatus as any });
      await loadData();

      await dataService.addAuditLog({
        actor_id: currentUser?.id || 'admin',
        actor_name: currentUser?.display_name || 'Administrator',
        action: newStatus === 'hidden' ? 'POST_HIDDEN' : 'POST_RESTORED',
        target_type: 'post',
        target_id: post.id,
        metadata: { title: post.title, author: post.author_name, reason }
      });
    } catch (err: any) {
      alert(err.message || 'Failed to update post status.');
    }
  };

  const handleResolveReport = async (reportId: string, status: 'resolved' | 'dismissed') => {
    const note = prompt(`Enter resolution note:`, status === 'resolved' ? 'Post investigated and author informed.' : 'Report dismissed upon review.');
    if (note === null) return;

    await dataService.updateReportStatus(reportId, status, note);
    await loadData();

    await dataService.addAuditLog({
      actor_id: currentUser?.id || 'admin',
      actor_name: currentUser?.display_name || 'Administrator',
      action: `REPORT_${status.toUpperCase()}`,
      target_type: 'report',
      target_id: reportId,
      metadata: { status, resolution_note: note }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-serif font-bold text-brand-navy">
          Content Moderation & Reports Queue
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Enforce patient de-identification (DISHA compliance), academic standards, and member safety.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('reports')}
          className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'reports'
              ? 'border-teal-700 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-brand-navy'
          }`}
        >
          <Flag className="w-4 h-4" />
          <span>Member Reports Queue ({reports.filter(r => r.status === 'open').length} open)</span>
        </button>

        <button
          onClick={() => setActiveTab('discussions')}
          className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'discussions'
              ? 'border-teal-700 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-brand-navy'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>All Community Posts ({posts.length})</span>
        </button>
      </div>

      {activeTab === 'reports' ? (
        /* Reports Queue */
        <div className="space-y-4">
          {reports.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <h3 className="text-sm font-bold text-brand-navy">All reports resolved</h3>
              <p className="text-xs text-slate-500">There are no open moderation flags.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">Reported Target</th>
                      <th className="py-3 px-4">Reason</th>
                      <th className="py-3 px-4">Reporter Note</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reports.map((rep) => (
                      <tr key={rep.id} className="hover:bg-slate-50 transition">
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-brand-navy block">{rep.target_title}</span>
                          <span className="text-[11px] text-slate-400 capitalize">Target: {rep.target_type} • ID: {rep.target_id}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            {rep.reason.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 max-w-xs">
                          {rep.note || 'No additional note provided.'}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${
                            rep.status === 'open' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {rep.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-1.5">
                          {rep.status === 'open' ? (
                            <>
                              <button
                                onClick={() => handleResolveReport(rep.id, 'resolved')}
                                className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-lg text-xs font-semibold border border-teal-200"
                              >
                                Resolve
                              </button>
                              <button
                                onClick={() => handleResolveReport(rep.id, 'dismissed')}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-semibold"
                              >
                                Dismiss
                              </button>
                            </>
                          ) : (
                            <span className="text-slate-400 text-xs">Completed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Posts Moderation List */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Title & Author</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Stats</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Moderation Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-4 max-w-sm">
                      <div className="font-bold text-brand-navy truncate">{post.title}</div>
                      <div className="text-xs text-slate-400">By {post.author_name} ({post.author_qualification})</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${post.category_badge_color}`}>
                        {post.category_name}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {post.likes_count} likes • {post.comments_count} replies
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${
                        post.status === 'published' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {post.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => toggleHidePost(post)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                          post.status === 'hidden'
                            ? 'bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200'
                            : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {post.status === 'hidden' ? 'Restore Post' : 'Hide / Moderate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
