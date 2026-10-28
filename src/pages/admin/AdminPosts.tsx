import React, { useState, useEffect } from 'react';
import { dataService } from '../../lib/supabase';
import { Post } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../../components/common/Avatar';
import { 
  MessageSquare, 
  Search, 
  EyeOff, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  ChevronLeft, 
  ChevronRight,
  RefreshCw,
  Heart,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';

const ITEMS_PER_PAGE = 10;

export const AdminPosts: React.FC = () => {
  const { currentUser } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  // Moderation action modal
  const [actionModal, setActionModal] = useState<{
    open: boolean;
    type: 'hide' | 'restore' | 'delete';
    post: Post;
    reason: string;
  } | null>(null);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadPosts = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const data = await dataService.getPosts();
      setPosts(data);
    } catch (err: any) {
      console.error('Failed to load posts:', err);
      setFeedback({
        type: 'error',
        message: err?.message || 'Could not load community discussions.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const initiateAction = (type: 'hide' | 'restore' | 'delete', post: Post) => {
    let defaultReason = '';
    if (type === 'hide') {
      defaultReason = 'Breach of clinical case de-identification guidelines (DISHA)';
    } else if (type === 'delete') {
      defaultReason = 'Direct violation of Community Safety Guidelines or spam';
    } else {
      defaultReason = 'Content verified and restored by administrator';
    }

    setActionModal({
      open: true,
      type,
      post,
      reason: defaultReason
    });
  };

  const executeAction = async () => {
    if (!actionModal) return;
    const { type, post, reason } = actionModal;
    setActionModal(null);

    const actorId = currentUser?.id || 'admin';
    const actorName = currentUser?.display_name || currentUser?.full_name || 'Administrator';

    try {
      if (type === 'delete') {
        await dataService.deletePost(post.id);
        await dataService.addAuditLog({
          actor_id: actorId,
          actor_name: actorName,
          action: 'POST_DELETED',
          target_type: 'post',
          target_id: post.id,
          metadata: { title: post.title, author: post.author_name, reason }
        });
        setFeedback({
          type: 'success',
          message: `Post "${post.title}" deleted permanently.`
        });
      } else {
        const newStatus = type === 'hide' ? 'hidden' : 'published';
        await dataService.updatePost(post.id, { status: newStatus as any });
        await dataService.addAuditLog({
          actor_id: actorId,
          actor_name: actorName,
          action: type === 'hide' ? 'POST_HIDDEN' : 'POST_RESTORED',
          target_type: 'post',
          target_id: post.id,
          metadata: { title: post.title, author: post.author_name, reason }
        });
        setFeedback({
          type: 'success',
          message: `Post visibility updated to "${newStatus}".`
        });
      }

      await loadPosts();
    } catch (err: any) {
      console.error('Moderation action failed:', err);
      setFeedback({
        type: 'error',
        message: err?.message || 'Failed to complete moderation action.'
      });
    }
  };

  const filteredPosts = posts.filter(p => {
    if (categoryFilter !== 'all' && p.category_name !== categoryFilter && p.category_id !== categoryFilter) return false;
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchAuthor = p.author_name.toLowerCase().includes(q);
      const matchContent = (p.body || '').toLowerCase().includes(q);
      if (!matchTitle && !matchAuthor && !matchContent) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filteredPosts.length / ITEMS_PER_PAGE) || 1;
  const paginatedPosts = filteredPosts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-serif font-bold text-brand-navy">
              Community Posts Moderation
            </h1>
            <span className="text-[11px] font-semibold text-sky-800 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
              DISHA & Patient Privacy
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Oversee clinical case discussions, uphold de-identification guidelines, and moderate flagged publications.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadPosts}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-teal-600' : 'text-slate-500'}`} />
            <span>Refresh</span>
          </button>
          <span className="text-xs text-slate-500">
            Total Posts: <strong className="text-brand-navy">{filteredPosts.length}</strong>
          </span>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div className={`p-4 rounded-xl border text-xs flex items-center justify-between ${
          feedback.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
            : 'bg-rose-50 border-rose-200 text-rose-900'
        }`}>
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

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
            placeholder="Search discussions by title, clinical keywords, or author name..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200 text-xs">
            {[
              { id: 'all', label: 'All Status' },
              { id: 'published', label: 'Published' },
              { id: 'hidden', label: 'Hidden / Flagged' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setStatusFilter(tab.id);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition ${
                  statusFilter === tab.id
                    ? 'bg-white text-brand-navy shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Posts Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-400">Loading discussions...</div>
        ) : filteredPosts.length === 0 ? (
          <div className="py-20 text-center space-y-2">
            <MessageSquare className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">No discussions match your filter</p>
            <p className="text-xs text-slate-500">Try searching for other clinical terms.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Discussion Title</th>
                  <th className="py-3 px-4">Author</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Engagement</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 max-w-sm">
                      <div className="font-bold text-brand-navy truncate hover:text-teal-700 cursor-pointer" onClick={() => setSelectedPost(post)}>
                        {post.title}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-xs">{(post.body || '').slice(0, 90)}...</div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Avatar name={post.author_name} src={post.author_avatar} size="xs" />
                        <div>
                          <div className="font-semibold text-slate-800">{post.author_name}</div>
                          <div className="text-[10px] text-slate-400">{post.author_qualification || 'Practitioner'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {post.category_name || 'General'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-3 text-slate-500 text-[11px]">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                          {post.comments_count || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="w-3.5 h-3.5 text-slate-400" />
                          {post.likes_count || 0}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        post.status === 'hidden'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {post.status === 'hidden' ? <EyeOff className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                        {post.status || 'Published'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <Link
                          to={`/community/${post.id}`}
                          target="_blank"
                          className="p-1.5 text-slate-400 hover:text-teal-700 hover:bg-slate-100 rounded-lg transition"
                          title="Open in Member View"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                        {post.status === 'hidden' ? (
                          <button
                            onClick={() => initiateAction('restore', post)}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-semibold border border-emerald-200 transition"
                          >
                            Restore
                          </button>
                        ) : (
                          <button
                            onClick={() => initiateAction('hide', post)}
                            className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-semibold border border-amber-200 transition"
                          >
                            Hide
                          </button>
                        )}
                        <button
                          onClick={() => initiateAction('delete', post)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                          title="Delete Post"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {filteredPosts.length > ITEMS_PER_PAGE && (
          <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <div>
              Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredPosts.length)} of {filteredPosts.length} posts
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

      {/* Action Modal */}
      {actionModal && actionModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                actionModal.type === 'delete' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
              }`}>
                {actionModal.type === 'delete' ? <Trash2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-base font-bold text-brand-navy">
                  {actionModal.type === 'delete' ? 'Delete Community Post?' : actionModal.type === 'hide' ? 'Hide Discussion?' : 'Restore Discussion?'}
                </h3>
                <p className="text-xs text-slate-500">Moderation action confirmation</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {actionModal.type === 'delete'
                ? `Are you sure you want to permanently delete "${actionModal.post.title}"? This cannot be undone and will be permanently recorded in the audit log.`
                : actionModal.type === 'hide'
                ? `Hiding will remove "${actionModal.post.title}" from member feeds while preserving it for audit review.`
                : `Restoring will make "${actionModal.post.title}" publicly visible again in community discussions.`}
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Moderation Reason *
              </label>
              <textarea
                rows={2}
                value={actionModal.reason}
                onChange={(e) => setActionModal({ ...actionModal, reason: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActionModal(null)}
                className="px-4 py-2 border border-slate-200 text-xs font-semibold text-slate-600 rounded-xl hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeAction}
                className={`px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-xs transition ${
                  actionModal.type === 'delete' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-teal-700 hover:bg-teal-800'
                }`}
              >
                Confirm Moderation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
