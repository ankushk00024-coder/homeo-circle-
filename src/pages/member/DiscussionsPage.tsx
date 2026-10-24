import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
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
  Edit2,
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
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get('category') || 'all';
  const filterParam = searchParams.get('filter');

  const [posts, setPosts] = useState<Post[]>([]);
  const [savedPostIds, setSavedPostIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [composerOpen, setComposerOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'latest' | 'discussed' | 'liked'>('latest');

  // New/Edit post state
  const [postTitle, setPostTitle] = useState('');
  const [postCategory, setPostCategory] = useState('clinical-cases');
  const [postBody, setPostBody] = useState('');
  const [postSource, setPostSource] = useState('');
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);

  // Report state
  const [reportingPost, setReportingPost] = useState<Post | null>(null);
  const [reportReason, setReportReason] = useState<Report['reason']>('patient_privacy');
  const [reportNote, setReportNote] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState(false);

  // Filter tabs matching requirements
  const filterTabs = [
    { label: 'All Discussions', id: 'all' },
    { label: 'General Discussion', id: 'general' },
    { label: 'Clinical Learning', id: 'clinical-cases' },
    { label: 'Research', id: 'research' },
    { label: 'Student Corner', id: 'students' },
    { label: 'Practice Management', id: 'practice-management' },
    { label: 'Events & CMEs', id: 'events' },
    { label: 'Saved Bookmarks', id: 'saved' },
  ];

  const categoryMetadata: Record<string, { name: string; color: string }> = {
    'general': { name: 'General Discussion', color: 'bg-slate-100 text-slate-800 border-slate-200' },
    'clinical-cases': { name: 'Clinical Learning', color: 'bg-teal-50 text-teal-800 border-teal-200' },
    'research': { name: 'Research', color: 'bg-sky-50 text-sky-800 border-sky-200' },
    'students': { name: 'Student Corner', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
    'practice-management': { name: 'Practice Management', color: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
    'events': { name: 'Events', color: 'bg-purple-50 text-purple-800 border-purple-200' }
  };

  const trendingTopics = [
    { tag: 'Boenninghausen Method', count: '24 posts' },
    { tag: 'Autoimmune Protocols', count: '19 posts' },
    { tag: 'Seasonal Allergies', count: '16 posts' },
    { tag: 'DISHA Patient Privacy', count: '14 posts' },
    { tag: 'Student Clinical Cases', count: '12 posts' },
  ];

  const loadPosts = async () => {
    setLoading(true);
    const catQuery = activeCategory === 'saved' ? 'all' : activeCategory;
    const [fetchedPosts, bookmarks] = await Promise.all([
      dataService.getPosts(catQuery, sortBy),
      currentUser?.id ? dataService.getSavedPostIds(currentUser.id) : Promise.resolve([])
    ]);
    setPosts(fetchedPosts);
    setSavedPostIds(bookmarks);
    setLoading(false);
  };

  useEffect(() => {
    loadPosts();
  }, [activeCategory, sortBy]);

  const handleLike = async (e: React.MouseEvent, postId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const newCount = await dataService.toggleLikePost(postId);
    setPosts(posts.map(p => p.id === postId ? { ...p, is_liked: !p.is_liked, likes_count: newCount } : p));
  };

  const handleSave = async (e: React.MouseEvent, postId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUser?.id) return;
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
    setEditingPost(null);
    setPostTitle('');
    setPostBody('');
    setPostSource('');
    setPostCategory('clinical-cases');
    setPostError(null);
    setComposerOpen(true);
  };

  const openEditComposer = (e: React.MouseEvent, post: Post) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingPost(post);
    setPostTitle(post.title);
    setPostBody(post.body);
    setPostSource(post.source_url || '');
    setPostCategory(post.category_id || 'clinical-cases');
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

      if (editingPost) {
        await dataService.updatePost(editingPost.id, {
          title: postTitle.trim(),
          body: postBody.trim(),
          category_id: postCategory,
          category_name: selectedMeta.name,
          category_badge_color: selectedMeta.color,
          source_url: postSource.trim() || undefined
        });
      } else {
        await dataService.createPost({
          author_id: currentUser?.id,
          author_name: currentUser?.display_name || currentUser?.full_name || 'Practitioner',
          author_avatar: currentUser?.avatar_url,
          author_qualification: currentUser?.qualification || 'BHMS',
          author_experience: currentUser?.role === 'student' ? currentUser.course_year : `${currentUser?.experience_years || 5} yrs exp`,
          author_role: currentUser?.role || 'doctor',
          title: postTitle.trim(),
          body: postBody.trim(),
          category_id: postCategory,
          category_name: selectedMeta.name,
          category_badge_color: selectedMeta.color,
          source_url: postSource.trim() || undefined
        });
      }

      setComposerOpen(false);
      setEditingPost(null);
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

  const filteredPosts = posts.filter(p => {
    if (activeCategory === 'saved' || filterParam === 'saved') {
      if (!savedPostIds.includes(p.id)) return false;
    }
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return p.title.toLowerCase().includes(q) || 
           p.body.toLowerCase().includes(q) || 
           p.author_name.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-brand-navy">
            Community Discussions
          </h1>
          <p className="text-xs text-[#5A6E85] mt-0.5">
            Share clinical case observations, repertory queries, research insights, and student study notes.
          </p>
        </div>

        <button
          onClick={openCreateComposer}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-teal hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-xs hover:shadow transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Discussion</span>
        </button>
      </div>

      {/* Disclaimer on Professional Medical Judgement */}
      <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 text-[11.5px] text-slate-600 flex items-start gap-2.5">
        <Scale className="w-4 h-4 text-teal-700 flex-shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Clinical Exchange Standard:</strong> Case observations shared in Homeo Circle are for educational peer review among registered doctors, researchers, and students. Discussions do not constitute formal medical prescription or treatment advice. Patient identifiers must remain completely de-identified.
        </p>
      </div>

      {/* Filter Tabs & Sorting */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-brand-border/70 pb-3">
        {/* Categories Tab Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {filterTabs.map((tab) => {
            const isActive = activeCategory === tab.id || (tab.id === 'saved' && filterParam === 'saved');
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === 'saved') {
                    setSearchParams({ category: 'saved' });
                  } else {
                    setSearchParams(tab.id === 'all' ? {} : { category: tab.id });
                  }
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                  isActive
                    ? 'bg-brand-teal text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-brand-border'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 flex-shrink-0">
          <span>Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="p-1 px-2.5 bg-white border border-brand-border rounded-lg text-xs font-semibold text-brand-navy outline-none"
          >
            <option value="latest">Latest Discussions</option>
            <option value="discussed">Most Discussed</option>
            <option value="liked">Top Liked</option>
          </select>
        </div>
      </div>

      {/* 2-Column Feed Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Feed (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          
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
                {activeCategory === 'saved' ? 'No saved bookmarks yet' : 'No discussions in this category'}
              </h3>
              <p className="text-xs text-slate-500">
                {activeCategory === 'saved'
                  ? 'Bookmark useful discussions using the save icon on any post.'
                  : 'Start the conversation by sharing a clinical query or case study.'}
              </p>
              <button
                onClick={openCreateComposer}
                className="px-4 py-2 bg-brand-teal text-white rounded-xl text-xs font-semibold shadow transition"
              >
                Create New Discussion
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
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                              Student
                            </span>
                          )}
                          {post.author_role === 'researcher' && (
                            <span className="text-[10px] font-bold text-sky-800 bg-sky-50 px-1.5 py-0.2 rounded border border-sky-200">
                              Researcher
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#5A6E85]">
                          {post.author_qualification} • {post.author_experience}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${post.category_badge_color}`}>
                        {post.category_name}
                      </span>

                      {/* Author Edit/Delete Menu */}
                      {isAuthor && (
                        <div className="flex items-center gap-1 pl-1">
                          <button
                            onClick={(e) => openEditComposer(e, post)}
                            className="p-1 text-slate-400 hover:text-brand-teal rounded hover:bg-slate-100"
                            title="Edit Discussion"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
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
                      <span className="text-[11px] text-slate-400">{post.created_at}</span>
                      <button
                        onClick={() => setReportingPost(post)}
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

        {/* Right Sidebar (4 cols) */}
        <aside className="lg:col-span-4 space-y-6">
          
          {/* Search Card */}
          <div className="bg-white rounded-2xl p-5 border border-brand-border/80 shadow-subtle space-y-3">
            <h3 className="text-xs font-bold text-brand-navy uppercase tracking-wider">
              Search Discussions
            </h3>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search topics or symptoms..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-[#EEF6FC]/60 border border-brand-border/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal/20 text-slate-700"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Trending Clinical Topics */}
          <div className="bg-white rounded-2xl p-5 border border-brand-border/80 shadow-subtle space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brand-teal" />
              <h3 className="text-xs font-bold text-brand-navy uppercase tracking-wider">
                Trending Clinical Topics
              </h3>
            </div>
            <div className="space-y-2">
              {trendingTopics.map((item) => (
                <div
                  key={item.tag}
                  onClick={() => setSearchQuery(item.tag)}
                  className="flex items-center justify-between text-xs py-1.5 px-2 hover:bg-slate-50 rounded-lg cursor-pointer transition"
                >
                  <span className="font-medium text-brand-navy hover:text-brand-teal">
                    #{item.tag}
                  </span>
                  <span className="text-[11px] text-[#5A6E85]">{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Student Corner Banner */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-5 border border-emerald-200/80 shadow-subtle space-y-3">
            <div className="flex items-center gap-2 text-emerald-800">
              <GraduationCap className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider">Student Corner Active</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you a BHMS student or intern? Access curated study notes, repertory rubrics, and request clinical mentorship from senior practitioners.
            </p>
            <Link
              to="/students"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-900"
            >
              <span>Explore Student Resources</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

        </aside>

      </div>

      {/* Create / Edit Discussion Modal */}
      {composerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-teal-700" />
                <h3 className="text-base font-bold text-brand-navy">
                  {editingPost ? 'Edit Discussion' : 'Start a Clinical / Peer Discussion'}
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
                  Discussion Category *
                </label>
                <select
                  value={postCategory}
                  onChange={(e) => setPostCategory(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none bg-white"
                >
                  <option value="general">General Discussion</option>
                  <option value="clinical-cases">Clinical Learning & Case Observations</option>
                  <option value="research">Research & Publications</option>
                  <option value="students">Student Corner & Mentorship</option>
                  <option value="practice-management">Practice Management & Ethics</option>
                  <option value="events">Conferences & CME Events</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Title / Subject *
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
                  Discussion Content & Observations *
                </label>
                <textarea
                  rows={6}
                  required
                  value={postBody}
                  onChange={(e) => setPostBody(e.target.value)}
                  placeholder="Describe your clinical observation, repertorial rubrics, potencies studied, and questions for peer deliberation..."
                  className="w-full p-3.5 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reference Source Link or DOI (Optional)
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
                  <strong>DISHA & Privacy Rule:</strong> Never include identifiable patient names, facial photos, or Aadhaar/UHID records.
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
                  {posting ? 'Publishing...' : editingPost ? 'Update Discussion' : 'Publish Discussion'}
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
