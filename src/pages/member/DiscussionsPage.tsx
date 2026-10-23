import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dataService } from '../../lib/supabase';
import { Post } from '../../types';
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
  Lock
} from 'lucide-react';

export const DiscussionsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get('category') || 'all';

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [composerOpen, setComposerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null);

  // New post state
  const [postTitle, setPostTitle] = useState('');
  const [postCategory, setPostCategory] = useState('clinical-cases');
  const [postBody, setPostBody] = useState('');
  const [postSource, setPostSource] = useState('');
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);

  // Filter tabs matching reference top right
  const filterTabs = [
    { label: 'All Posts', id: 'all' },
    { label: 'Clinical Cases', id: 'clinical-cases' },
    { label: 'Research', id: 'research' },
    { label: 'Practice Management', id: 'practice-management' },
    { label: 'Events', id: 'events' },
  ];

  // Trending topics matching reference top right
  const trendingTopics = [
    { tag: 'Seasonal Allergies', count: '24 posts' },
    { tag: 'Clinical Cases', count: '19 posts' },
    { tag: 'Materia Medica', count: '16 posts' },
    { tag: 'Research Papers', count: '12 posts' },
    { tag: 'Practice Management', count: '11 posts' },
  ];

  const loadPosts = async () => {
    setLoading(true);
    const data = await dataService.getPosts(activeCategory);
    setPosts(data);
    setLoading(false);
  };

  useEffect(() => {
    loadPosts();
  }, [activeCategory]);

  const handleLike = async (e: React.MouseEvent, postId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const newCount = await dataService.toggleLikePost(postId);
    setPosts(posts.map(p => p.id === postId ? { ...p, is_liked: !p.is_liked, likes_count: newCount } : p));
  };

  const handleSave = (e: React.MouseEvent, postId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setPosts(posts.map(p => p.id === postId ? { ...p, is_saved: !p.is_saved } : p));
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

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setPostError(null);

    if (!postTitle.trim()) {
      setPostError('Please enter a descriptive discussion title.');
      return;
    }
    if (!postBody.trim()) {
      setPostError('Please provide details for your clinical case or query.');
      return;
    }

    setPosting(true);
    try {
      const categoryNames: Record<string, { name: string; color: string }> = {
        'clinical-cases': { name: 'Clinical Case', color: 'bg-brand-teal-100 text-brand-teal border-brand-teal/20' },
        'research': { name: 'Research', color: 'bg-brand-pale text-brand-indigo border-brand-indigo/20' },
        'practice-management': { name: 'Practice Management', color: 'bg-brand-ice text-brand-navy border-brand-border' },
        'events': { name: 'Events', color: 'bg-purple-50 text-purple-700 border-purple-200' }
      };

      const selectedCat = categoryNames[postCategory] || categoryNames['clinical-cases'];

      await dataService.createPost({
        author_id: currentUser?.id,
        author_name: currentUser?.display_name || 'Dr. Practitioner',
        author_avatar: currentUser?.avatar_url,
        author_qualification: currentUser?.qualification || 'MD (Hom)',
        author_experience: `${currentUser?.experience_years || 8} years experience`,
        title: postTitle.trim(),
        body: postBody.trim(),
        category_id: postCategory,
        category_name: selectedCat.name,
        category_badge_color: selectedCat.color,
        source_url: postSource.trim() || undefined
      });

      setPostTitle('');
      setPostBody('');
      setPostSource('');
      setComposerOpen(false);
      await loadPosts();
    } catch (err: any) {
      setPostError(err.message || 'Failed to submit post.');
    } finally {
      setPosting(false);
    }
  };

  const filteredPosts = posts.filter(p => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return p.title.toLowerCase().includes(q) || p.body.toLowerCase().includes(q) || p.author_name.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Header matching Reference */}
      <div>
        <h1 className="text-2xl font-serif font-bold text-brand-navy">
          Community Discussions
        </h1>
        <p className="text-xs text-[#5A6E85] mt-0.5">
          Ask questions, share knowledge and learn from fellow practitioners.
        </p>
      </div>

      {/* Filter Tabs matching Reference Top Right */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-brand-border/60">
        {filterTabs.map((tab) => {
          const isActive = activeCategory === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id === 'all') {
                  searchParams.delete('category');
                  setSearchParams(searchParams);
                } else {
                  setSearchParams({ category: tab.id });
                }
              }}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                isActive
                  ? 'bg-brand-navy text-white shadow-xs'
                  : 'bg-white text-[#4A627A] hover:bg-[#EEF6FC] border border-brand-border/80'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 2-Column Content Layout: Main Feed (8 cols) + Right Sidebar (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Main Feed Column */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Create Post Prompt Box */}
          <div className="bg-white rounded-2xl p-4 border border-brand-border/80 shadow-subtle flex items-center gap-3">
            <Avatar
              src={currentUser?.avatar_url}
              name={currentUser?.display_name || 'Dr. Practitioner'}
              size="sm"
              verified
            />
            <button
              onClick={() => setComposerOpen(true)}
              className="flex-1 text-left px-4 py-2.5 bg-[#EEF6FC]/60 hover:bg-[#EEF6FC] rounded-xl text-xs text-[#5A6E85] font-medium transition border border-brand-border/60"
            >
              Create a post...
            </button>
            <button
              onClick={() => setComposerOpen(true)}
              className="p-2.5 bg-brand-teal text-white rounded-xl hover:bg-brand-teal-hover transition shadow-xs"
              title="New Discussion"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Posts Feed */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-6 border border-brand-border/60 shadow-subtle animate-pulse space-y-3">
                  <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                  <div className="h-5 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-16 bg-slate-100 rounded"></div>
                </div>
              ))}
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-brand-border space-y-3">
              <MessageSquare className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-brand-navy">No discussions in this category yet</h3>
              <p className="text-xs text-[#5A6E85] max-w-sm mx-auto">
                Be the first verified practitioner to share a clinical case or question with the community.
              </p>
              <button
                onClick={() => setComposerOpen(true)}
                className="px-4 py-2 rounded-xl bg-brand-teal text-white text-xs font-semibold hover:bg-brand-teal-hover transition shadow-xs"
              >
                Create New Post
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPosts.map((post) => (
                <article
                  key={post.id}
                  className="bg-white rounded-2xl p-5 sm:p-6 border border-brand-border/80 shadow-subtle hover:shadow-card hover:border-brand-teal/40 transition space-y-3.5"
                >
                  {/* Author Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={post.author_avatar}
                        name={post.author_name}
                        size="md"
                        verified
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <Link to={`/members/${post.author_id}`} className="text-xs font-bold text-brand-navy hover:text-brand-teal transition">
                            {post.author_name}
                          </Link>
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-teal inline-block" title="Verified Practitioner"></span>
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
                      <span className="text-[11px] text-[#5A6E85]">
                        {post.created_at}
                      </span>
                    </div>
                  </div>

                  {/* Post Title & Content */}
                  <Link to={`/community/${post.id}`} className="block group space-y-1.5">
                    <h2 className="text-sm sm:text-base font-bold text-brand-navy group-hover:text-brand-teal transition leading-snug">
                      {post.title}
                    </h2>
                    <p className="text-xs text-[#4A627A] leading-relaxed line-clamp-3">
                      {post.body}
                    </p>
                  </Link>

                  {/* Actions Footer matching Reference */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-[#5A6E85]">
                    <div className="flex items-center gap-6">
                      {/* Likes count */}
                      <button
                        onClick={(e) => handleLike(e, post.id)}
                        className={`flex items-center gap-1.5 transition ${
                          post.is_liked ? 'text-rose-600 font-bold' : 'hover:text-rose-600'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${post.is_liked ? 'fill-rose-600 text-rose-600' : ''}`} />
                        <span>{post.likes_count}</span>
                      </button>

                      {/* Comments count */}
                      <Link
                        to={`/community/${post.id}`}
                        className="flex items-center gap-1.5 hover:text-brand-teal transition"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>{post.comments_count}</span>
                      </Link>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Share */}
                      <button
                        onClick={(e) => handleShare(e, post.id)}
                        className="flex items-center gap-1.5 hover:text-brand-teal transition"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>{copiedPostId === post.id ? 'Copied' : 'Share'}</span>
                      </button>

                      {/* Save */}
                      <button
                        onClick={(e) => handleSave(e, post.id)}
                        className={`flex items-center gap-1.5 transition ${
                          post.is_saved ? 'text-brand-teal font-bold' : 'hover:text-brand-teal'
                        }`}
                      >
                        <Bookmark className={`w-3.5 h-3.5 ${post.is_saved ? 'fill-brand-teal' : ''}`} />
                        <span>Save</span>
                      </button>
                    </div>
                  </div>

                </article>
              ))}
            </div>
          )}

        </div>

        {/* Right Sidebar Column matching Reference Image Top Right */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Search Discussions Input */}
          <div className="bg-white rounded-2xl p-4 border border-brand-border/80 shadow-subtle">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search discussions..."
                className="w-full pl-9 pr-3.5 py-2 text-xs bg-[#EEF6FC]/60 border border-brand-border/80 rounded-xl focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none text-slate-700"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Trending Topics Card matching Reference Image Top Right */}
          <div className="bg-white rounded-2xl p-5 border border-brand-border/80 shadow-subtle space-y-3">
            <h3 className="text-xs font-bold text-brand-navy uppercase tracking-wider">
              Trending Topics
            </h3>
            <div className="space-y-1.5">
              {trendingTopics.map((topic) => (
                <div
                  key={topic.tag}
                  onClick={() => setSearchQuery(topic.tag)}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-[#EEF6FC] cursor-pointer transition"
                >
                  <span className="text-xs font-semibold text-brand-navy hover:text-brand-teal">
                    # {topic.tag}
                  </span>
                  <span className="text-[11px] text-[#5A6E85] font-medium">
                    {topic.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Webinar Card matching Reference Top Right */}
          <div className="bg-white rounded-2xl p-5 border border-brand-border/80 shadow-subtle space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-brand-navy uppercase tracking-wider">
                Upcoming Webinar
              </h3>
              <span className="w-2 h-2 rounded-full bg-brand-teal"></span>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-brand-navy text-white flex flex-col items-center justify-center flex-shrink-0 text-center shadow-xs">
                <span className="text-sm font-bold leading-none">19</span>
                <span className="text-[9px] uppercase tracking-wider font-semibold text-teal-300 mt-0.5">DEC</span>
              </div>
              <div className="overflow-hidden">
                <h4 className="text-xs font-bold text-brand-navy leading-snug">
                  Research in Homoeopathy
                </h4>
                <p className="text-[11px] text-[#5A6E85] mt-0.5">Online • 6:00 PM IST</p>
              </div>
            </div>

            <Link
              to="/events"
              className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-brand-teal-100 hover:bg-brand-teal/20 text-brand-teal text-xs font-semibold transition"
            >
              <span>View Details</span>
              <span>&rarr;</span>
            </Link>
          </div>

          {/* Patient Privacy Compliance Reminder */}
          <div className="p-4 bg-brand-teal-50 rounded-2xl border border-brand-teal/20 text-xs text-[#4A627A] space-y-1.5">
            <div className="flex items-center gap-1.5 text-brand-teal font-bold">
              <Lock className="w-3.5 h-3.5 text-brand-teal" />
              <span>DISHA & Patient Privacy</span>
            </div>
            <p className="text-[11px] text-[#5A6E85] leading-relaxed">
              Never share patient names, photographs, or identifying details. Focus discussions on symptom totality, repertory rubrics, and posology.
            </p>
          </div>

        </div>

      </div>

      {/* Modal Post Composer */}
      {composerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-elevated border border-brand-border space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-brand-teal-100 text-brand-teal flex items-center justify-center font-bold text-xs">
                  HC
                </div>
                <h3 className="text-sm font-bold text-brand-navy">Create Professional Discussion</h3>
              </div>
              <button
                onClick={() => setComposerOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mandatory Patient Confidentiality Warning Banner */}
            <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200/80 flex items-start gap-2.5 text-amber-900 text-xs leading-relaxed">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Confidentiality Notice:</strong> Do not post patient names, face photographs, or contact records. Violations result in post removal.
              </div>
            </div>

            {postError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
                {postError}
              </div>
            )}

            <form onSubmit={handleCreatePost} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Topic Title *
                </label>
                <input
                  type="text"
                  required
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  placeholder="e.g. Repertorial differentiation between Pulsatilla and Silicea in recurrent otitis"
                  className="w-full px-3.5 py-2 text-xs border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Category *
                </label>
                <select
                  value={postCategory}
                  onChange={(e) => setPostCategory(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none bg-white"
                >
                  <option value="clinical-cases">Clinical Case Study</option>
                  <option value="research">Research & Publications</option>
                  <option value="practice-management">Practice Management & Ethics</option>
                  <option value="events">Events & Study Circles</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Case Details / Discussion Body *
                </label>
                <textarea
                  rows={5}
                  required
                  value={postBody}
                  onChange={(e) => setPostBody(e.target.value)}
                  placeholder="Describe the clinical presentation, rubrics selected, repertorial grid, remedy potency, and observations..."
                  className="w-full p-3 text-xs border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Source or DOI Link (Optional)
                </label>
                <input
                  type="url"
                  value={postSource}
                  onChange={(e) => setPostSource(e.target.value)}
                  placeholder="https://doi.org/... or https://pubmed.ncbi.nlm.nih.gov/..."
                  className="w-full px-3.5 py-2 text-xs border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setComposerOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={posting}
                  className="px-5 py-2 rounded-xl bg-brand-teal hover:bg-brand-teal-hover text-white text-xs font-semibold shadow-xs transition disabled:opacity-50"
                >
                  {posting ? 'Publishing...' : 'Publish Post to Feed'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
