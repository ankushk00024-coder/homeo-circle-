import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dataService } from '../../lib/supabase';
import { Post, Report } from '../../types';
import { Avatar } from '../../components/common/Avatar';
import { 
  Heart, 
  MessageSquare, 
  Share2, 
  Bookmark, 
  Search, 
  Plus, 
  AlertTriangle, 
  X, 
  Lock,
  MoreHorizontal,
  Trash2,
  CheckCircle2,
  Flag,
  ArrowRight,
  TrendingUp,
  GraduationCap,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Scale
} from 'lucide-react';

export const DiscussionsPage: React.FC = () => {
  const { currentUser, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get('category') || 'all';
  const filterParam = searchParams.get('filter');

  const [posts, setPosts] = useState<Post[]>([]);
  const [savedPostIds, setSavedPostIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [composerOpen, setComposerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null);

  // New/Edit post state
  const [postTitle, setPostTitle] = useState('');
  const postCategory = 'general';
  const [postBody, setPostBody] = useState('');
  const [postSource, setPostSource] = useState('');
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);

  // Report state
  const [reportingPost, setReportingPost] = useState<Post | null>(null);
  const [reportReason, setReportReason] = useState<Report['reason']>('patient_privacy');
  const [reportNote, setReportNote] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState(false);

  const categoryMetadata: Record<string, { name: string; color: string }> = {
    'general': { name: 'General Discussion', color: 'bg-slate-100 text-slate-800 border-slate-200' },
    'clinical-cases': { name: 'Clinical Learning', color: 'bg-teal-50 text-teal-800 border-teal-200' },
    'research': { name: 'Research', color: 'bg-sky-50 text-sky-800 border-sky-200' },
    'students': { name: 'Student Corner', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
    'practice-management': { name: 'Practice Management', color: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
    'events': { name: 'Events', color: 'bg-purple-50 text-purple-800 border-purple-200' }
  };

  const loadPosts = async () => {
    setLoading(true);
    const [fetchedPosts, bookmarks] = await Promise.all([
      dataService.getPosts('all', 'latest'),
      currentUser?.id ? dataService.getSavedPostIds(currentUser.id) : Promise.resolve([])
    ]);
    setPosts(fetchedPosts);
    setSavedPostIds(bookmarks);
    setLoading(false);
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const handleLike = async (e: React.MouseEvent, postId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUser?.id) {
      navigate('/login', { state: { from: location } });
      return;
    }
    const newCount = await dataService.toggleLikePost(postId, currentUser.id);
    setPosts(posts.map(p => p.id === postId ? { ...p, is_liked: !p.is_liked, likes_count: newCount } : p));
  };

  const handleSave = async (e: React.MouseEvent, postId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUser?.id) {
      navigate('/login', { state: { from: location } });
      return;
    }
    const isSaved = await dataService.toggleBookmarkPost(postId, currentUser.id);
    setSavedPostIds(prev => isSaved ? [...prev, postId] : prev.filter(id => id !== postId));
  };

  const handleShare = (e: React.MouseEvent, postId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/community/${postId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedPostId(postId);
      setTimeout(() => setCopiedPostId(null), 2000);
    });
  };

  const openCreateComposer = () => {
    if (!currentUser?.id) {
      navigate('/login', { state: { from: location } });
      return;
    }
    setPostTitle('');
    setPostBody('');
    setPostSource('');
    setPostError(null);
    setComposerOpen(true);
  };

  const handleDeletePost = async (e: React.MouseEvent, postId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this discussion post?')) return;
    await dataService.deletePost(postId);
    await loadPosts();
  };

  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setPostError(null);

    if (!postTitle.trim()) {
      setPostError('Please enter a descriptive discussion title.');
      return;
    }
    if (!postBody.trim()) {
      setPostError('Please provide details for your discussion.');
      return;
    }

    setPosting(true);
    try {
      const selectedMeta = categoryMetadata[postCategory] || categoryMetadata['clinical-cases'];

      {
        const authorType = currentUser?.account_type || currentUser?.role;
        await dataService.createPost({
          author_id: currentUser?.id,
          author_name: currentUser?.display_name || currentUser?.full_name || 'Practitioner',
          author_avatar: currentUser?.avatar_url || currentUser?.avatar_path,
          author_qualification: currentUser?.qualification && currentUser.qualification !== 'Not specified' ? currentUser.qualification : undefined,
          author_experience: authorType === 'student'
            ? currentUser?.course_year
            : currentUser?.experience_years ? `${currentUser.experience_years} yrs exp` : undefined,
          author_role: authorType || 'member',
          title: postTitle.trim(),
          body: postBody.trim(),
          category_id: postCategory,
          category_name: selectedMeta.name,
          category_badge_color: selectedMeta.color,
          source_url: postSource.trim() || undefined
        });
      }

      setComposerOpen(false);
        await loadPosts();
    } catch (err: any) {
      setPostError(err.message || 'Failed to save post.');
    } finally {
      setPosting(false);
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingPost || !currentUser) return;

    await dataService.submitReport({
      reporter_id: currentUser.id,
      reporter_name: currentUser.display_name,
      target_type: 'post',
      target_id: reportingPost.id,
      target_title: reportingPost.title,
      reason: reportReason,
      note: reportNote.trim()
    });

    setReportSubmitted(true);
    setTimeout(() => {
      setReportingPost(null);
      setReportSubmitted(false);
      setReportNote('');
    }, 2000);
  };

  // Search moves matching posts to the top (title matches first); the rest follow.
  const q = searchQuery.trim().toLowerCase();
  const scoreOf = (p: Post) => {
    if (!q) return 0;
    if (p.title.toLowerCase().includes(q)) return 2;
    if (p.body.toLowerCase().includes(q) || p.author_name.toLowerCase().includes(q)) return 1;
    return 0;
  };
  const showSavedOnly = activeCategory === 'saved' || filterParam === 'saved';
  const filteredPosts = posts
    .filter((p) => !showSavedOnly || savedPostIds.includes(p.id))
    .map((p, i) => ({ p, i, score: scoreOf(p) }))
    .sort((a, b) => b.score - a.score || a.i - b.i)
    .map(({ p }) => p);
  const matchCount = q ? filteredPosts.filter((p) => scoreOf(p) > 0).length : 0;

  const formatWhen = (iso: string) => {
    const d = new Date(iso);
    return Number.isNaN(d.getTime())
      ? iso
      : d.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-brand-navy">
            {showSavedOnly ? 'Saved Discussions' : 'Discussions'}
          </h1>
        </div>

        <button
          onClick={openCreateComposer}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-teal hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-xs hover:shadow transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Discussion</span>
        </button>
      </div>

      {/* Search: matching posts move to the top */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search discussions…"
          className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none text-slate-700 placeholder:text-slate-400"
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
        {q && (
          <p className="mt-1.5 text-xs text-slate-500">
            {matchCount === 0 ? 'No posts match your search.' : `${matchCount} matching post${matchCount === 1 ? '' : 's'} shown first.`}
          </p>
        )}
      </div>

      {/* 2-Column Feed Layout */}
      <div>
        <div className="space-y-4">
          
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-6 border border-brand-border/60 shadow-subtle animate-pulse space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200"></div>
                    <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                  </div>
                  <div className="h-4 bg-slate-100 rounded w-3/4"></div>
                  <div className="h-16 bg-slate-50 rounded"></div>
                </div>
              ))}
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-brand-border space-y-3">
              <MessageSquare className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-brand-navy">
                {showSavedOnly ? 'No saved posts yet' : 'No discussions yet'}
              </h3>
              <p className="text-xs text-slate-500">
                {showSavedOnly ? 'Use the save icon on any post to keep it here.' : 'Be the first to start one.'}
              </p>
              <button
                onClick={openCreateComposer}
                className="px-4 py-2 bg-brand-teal text-white rounded-xl text-xs font-semibold shadow transition"
              >
                New Discussion
              </button>
            </div>
          ) : (
            filteredPosts.map((post) => {
              const isAuthor = currentUser?.id === post.author_id;
              const isSaved = savedPostIds.includes(post.id);

              return (
                <article
                  key={post.id}
                  className="bg-white rounded-2xl p-5 sm:p-6 border border-brand-border/80 shadow-subtle hover:shadow-card hover:border-brand-teal/40 transition space-y-4 group"
                >
                  {/* Author Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar
                        name={post.author_name}
                        src={post.author_avatar}
                        size="md"
                        verified={true}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/members/${post.author_id}`}
                            className="text-xs sm:text-sm font-bold text-brand-navy hover:text-brand-teal transition"
                          >
                            {post.author_name}
                          </Link>
                          {post.author_role === 'student' && (
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              Student
                            </span>
                          )}
                          {post.author_role === 'researcher' && (
                            <span className="text-[10px] font-bold text-sky-800 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
                              Researcher
                            </span>
                          )}
                        </div>
                        {[post.author_qualification, post.author_experience].filter((x) => x && x !== 'Not specified').length > 0 && (
                          <p className="text-[11px] text-[#5A6E85]">
                            {[post.author_qualification, post.author_experience].filter((x) => x && x !== 'Not specified').join(' • ')}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Authors can delete their discussion; posts cannot be edited. */}
                      {isAuthor && (
                        <div className="flex items-center gap-1 pl-1">
                          <button
                            onClick={(e) => handleDeletePost(e, post.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100"
                            title="Delete Discussion"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Title & Body Preview */}
                  <div className="space-y-2">
                    <Link to={`/community/${post.id}`}>
                      <h2 className="text-sm sm:text-base font-bold text-brand-navy hover:text-brand-teal transition leading-snug">
                        {post.title}
                      </h2>
                    </Link>
                    <p className="text-xs sm:text-[13px] text-slate-700 leading-relaxed line-clamp-3">
                      {post.body}
                    </p>
                    {post.source_url && (
                      <div className="pt-1">
                        <a
                          href={post.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-teal-700 hover:underline"
                        >
                          <span>Reference Source / DOI</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Actions & Timestamps Footer */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-5 sm:gap-6">
                      <button
                        onClick={(e) => handleLike(e, post.id)}
                        className={`flex items-center gap-1.5 transition ${
                          post.is_liked ? 'text-rose-600 font-bold' : 'hover:text-rose-600'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${post.is_liked ? 'fill-rose-600 text-rose-600' : ''}`} />
                        <span>{post.likes_count}</span>
                      </button>

                      <Link
                        to={`/community/${post.id}`}
                        className="flex items-center gap-1.5 hover:text-brand-navy transition"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>{post.comments_count}</span>
                      </Link>

                      <button
                        onClick={(e) => handleShare(e, post.id)}
                        className="flex items-center gap-1.5 hover:text-brand-navy transition relative"
                        title="Copy Link"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>{copiedPostId === post.id ? 'Copied!' : 'Share'}</span>
                      </button>

                      <button
                        onClick={(e) => handleSave(e, post.id)}
                        className={`flex items-center gap-1.5 transition ${
                          isSaved ? 'text-teal-700 font-bold' : 'hover:text-teal-700'
                        }`}
                        title="Save Bookmark"
                      >
                        <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-teal-700' : ''}`} />
                        <span className="hidden sm:inline">{isSaved ? 'Saved' : 'Save'}</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-slate-400">{formatWhen(post.created_at)}</span>
                      <button
                        onClick={() => {
                          if (!currentUser?.id) {
                            navigate('/login', { state: { from: location } });
                            return;
                          }
                          setReportingPost(post);
                        }}
                        className="text-slate-300 hover:text-slate-500 p-1"
                        title="Report inappropriate content"
                      >
                        <Flag className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                </article>
              );
            })
          )}
        </div>


      </div>

      {/* Create / Edit Discussion Modal */}
      {composerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-teal-700" />
                <h3 className="text-base font-bold text-brand-navy">
                  New Discussion
                </h3>
              </div>
              <button onClick={() => setComposerOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {postError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{postError}</span>
              </div>
            )}

            <form onSubmit={handleSavePost} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  placeholder="e.g. Repertorial Rubrics in Chronic Allergic Rhinitis"
                  className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Details *
                </label>
                <textarea
                  rows={6}
                  required
                  value={postBody}
                  onChange={(e) => setPostBody(e.target.value)}
                  placeholder="Write your question or case…"
                  className="w-full p-3.5 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reference link (optional)
                </label>
                <input
                  type="url"
                  value={postSource}
                  onChange={(e) => setPostSource(e.target.value)}
                  placeholder="https://doi.org/... or journal reference"
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none"
                />
              </div>

              {/* Patient Privacy Advisory */}
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-[11px] text-amber-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>
                  Don't include patient names, photos or ID numbers.
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setComposerOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={posting}
                  className="px-5 py-2 bg-brand-teal hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow transition disabled:opacity-50"
                >
                  {posting ? 'Publishing...' : 'Publish Discussion'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {reportingPost && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5 text-rose-700">
                <Flag className="w-4 h-4" />
                <h3 className="text-sm font-bold">Report Discussion</h3>
              </div>
              <button onClick={() => setReportingPost(null)} className="text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            {reportSubmitted ? (
              <div className="py-6 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-teal-600 mx-auto" />
                <p className="text-xs font-bold text-brand-navy">Report Submitted to Moderators</p>
                <p className="text-[11px] text-slate-500">Thank you for maintaining our community clinical ethics.</p>
              </div>
            ) : (
              <form onSubmit={handleReportSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold block mb-1">Reason for Report</label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value as any)}
                    className="w-full p-2 border border-slate-200 rounded-lg outline-none bg-white"
                  >
                    <option value="patient_privacy">Patient Identifiers / Privacy Violation (DISHA)</option>
                    <option value="misleading_clinical_claim">Misleading or Miracle Clinical Claim</option>
                    <option value="unsolicited_promotion">Commercial Spam / Unsolicited Promotion</option>
                    <option value="harassment">Unprofessional Conduct or Harassment</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold block mb-1">Additional Notes</label>
                  <textarea
                    rows={3}
                    value={reportNote}
                    onChange={(e) => setReportNote(e.target.value)}
                    placeholder="Provide details for the moderation review queue..."
                    className="w-full p-2 border border-slate-200 rounded-lg outline-none"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setReportingPost(null)}
                    className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold"
                  >
                    Submit Report
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
