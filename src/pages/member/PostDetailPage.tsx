import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dataService } from '../../lib/supabase';
import { Post, Comment, Report } from '../../types';
import { Avatar } from '../../components/common/Avatar';
import { 
  ArrowLeft, 
  Heart, 
  MessageSquare, 
  Share2, 
  Bookmark, 
  Flag, 
  ShieldCheck, 
  AlertTriangle, 
  Send, 
  ExternalLink,
  CheckCircle2,
  X,
  Edit2,
  Trash2,
  CornerDownRight
} from 'lucide-react';

export const PostDetailPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newCommentBody, setNewCommentBody] = useState('');
  const [replyingToComment, setReplyingToComment] = useState<Comment | null>(null);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Edit post state
  const [editingPost, setEditingPost] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');

  // Report modal state
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState<Report['reason']>('patient_privacy');
  const [reportNote, setReportNote] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState(false);

  const loadPostData = async () => {
    if (!postId) return;
    setLoading(true);
    try {
      const [postData, foundComments, bookmarks] = await Promise.all([
        dataService.getPostById(postId, currentUser?.id),
        dataService.getComments(postId),
        currentUser?.id ? dataService.getSavedPostIds(currentUser.id) : Promise.resolve([])
      ]);
      let found = postData;
      if (!found) {
        // Fallback search across published posts
        const allPosts = await dataService.getPosts();
        found = allPosts.find(p => p.id === postId) || null;
      }
      setPost(found);
      setComments(foundComments);
      if (found) {
        setEditTitle(found.title);
        setEditBody(found.body);
        setIsSaved(found.is_saved ?? bookmarks.includes(found.id));
      }
    } catch (err) {
      console.error('Error loading post:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPostData();
  }, [postId]);

  const handleLike = async () => {
    if (!currentUser) {
      navigate('/login', { state: { from: location } });
      return;
    }
    if (!post) return;
    const newLikes = await dataService.toggleLikePost(post.id, currentUser.id);
    setPost({ ...post, is_liked: !post.is_liked, likes_count: newLikes });
  };

  const handleSave = async () => {
    if (!currentUser) {
      navigate('/login', { state: { from: location } });
      return;
    }
    if (!post) return;
    const saved = await dataService.toggleBookmarkPost(post.id, currentUser.id);
    setIsSaved(saved);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post || !newCommentBody.trim() || !currentUser) return;

    setSubmittingComment(true);
    try {
      const added = await dataService.addComment(
        post.id, 
        currentUser, 
        newCommentBody.trim(), 
        replyingToComment?.id
      );
      setComments([...comments, added]);
      setNewCommentBody('');
      setReplyingToComment(null);
      setPost({ ...post, comments_count: post.comments_count + 1 });
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('Delete this comment?')) return;
    await dataService.deleteComment(commentId);
    setComments(comments.filter(c => c.id !== commentId));
    if (post) setPost({ ...post, comments_count: Math.max(0, post.comments_count - 1) });
  };

  const handleUpdatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post) return;
    const updated = await dataService.updatePost(post.id, {
      title: editTitle.trim(),
      body: editBody.trim()
    });
    setPost(updated);
    setEditingPost(false);
  };

  const handleDeletePost = async () => {
    if (!post || !window.confirm('Are you sure you want to delete this discussion post?')) return;
    await dataService.deletePost(post.id);
    navigate('/community');
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post || !currentUser) return;

    await dataService.submitReport({
      reporter_id: currentUser.id,
      reporter_name: currentUser.display_name,
      target_type: 'post',
      target_id: post.id,
      target_title: post.title,
      reason: reportReason,
      note: reportNote.trim()
    });

    setReportSubmitted(true);
    setTimeout(() => {
      setReportModalOpen(false);
      setReportSubmitted(false);
      setReportNote('');
    }, 2000);
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center text-xs text-slate-500">
        Loading discussion...
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
        <h2 className="text-xl font-bold text-brand-navy">Discussion Not Found</h2>
        <p className="text-xs text-slate-500">This post may have been removed or moderated.</p>
        <Link to="/community" className="px-4 py-2 bg-teal-700 text-white text-xs font-semibold rounded-xl">
          Back to Discussions Feed
        </Link>
      </div>
    );
  }

  const isPostAuthor = currentUser?.id === post.author_id;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* Back button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/community')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-navy transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Discussions Feed</span>
        </button>

        {isPostAuthor && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditingPost(!editingPost)}
              className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>{editingPost ? 'Cancel Edit' : 'Edit Post'}</span>
            </button>
            <span className="text-slate-300">|</span>
            <button
              onClick={handleDeletePost}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Post Card */}
      <article className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-card space-y-6">
        
        {/* Author Header */}
        <div className="flex items-start justify-between pb-4 border-b border-brand-border/60">
          <div className="flex items-center gap-3">
            <Avatar
              name={post.author_name}
              src={post.author_avatar}
              size="lg"
              verified={true}
            />
            <div>
              <div className="flex items-center gap-2">
                <Link to={`/members/${post.author_id}`} className="text-sm font-bold text-brand-navy hover:text-brand-teal">
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
              <p className="text-xs text-brand-muted">{post.author_qualification} • {post.author_experience}</p>
              <span className="text-[10px] text-brand-teal font-medium">Verified Community Contributor</span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5">
            <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${post.category_badge_color}`}>
              {post.category_name}
            </span>
            <span className="text-[11px] text-slate-400">{post.created_at}</span>
          </div>
        </div>

        {/* Title & Body / Inline Edit Mode */}
        {editingPost ? (
          <form onSubmit={handleUpdatePost} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Title</label>
              <input
                type="text"
                required
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full p-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Discussion Body</label>
              <textarea
                rows={6}
                required
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                className="w-full p-3 text-xs sm:text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500/20 leading-relaxed"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingPost(false)}
                className="px-4 py-2 border rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-brand-teal text-white rounded-xl text-xs font-semibold"
              >
                Save Changes
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-brand-navy leading-snug">
              {post.title}
            </h1>

            <div className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line space-y-3">
              {post.body}
            </div>

            {post.source_url && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 truncate mr-2">
                  Primary Reference: <span className="font-mono text-slate-700">{post.source_url}</span>
                </span>
                <a
                  href={post.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal-700 hover:text-teal-800 font-semibold flex items-center gap-1 flex-shrink-0"
                >
                  <span>View Source</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        )}

        {/* Clinical Disclaimer Box */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 text-[11px] text-slate-500 space-y-1">
          <p className="font-semibold text-slate-700">Peer Exchange Advisory:</p>
          <p>
            Case discussions reflect individual practitioner observations. They do not constitute established clinical guidelines or medical treatment advice.
          </p>
        </div>

        {/* Interactive Actions Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-6">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 transition ${
                post.is_liked ? 'text-rose-600 font-bold' : 'hover:text-rose-600'
              }`}
            >
              <Heart className={`w-4 h-4 ${post.is_liked ? 'fill-rose-600 text-rose-600' : ''}`} />
              <span>{post.likes_count} Likes</span>
            </button>

            <span className="flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4" />
              <span>{comments.length} Comments</span>
            </span>

            <button
              onClick={handleSave}
              className={`flex items-center gap-1.5 transition ${
                isSaved ? 'text-teal-700 font-bold' : 'hover:text-teal-700'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-teal-700' : ''}`} />
              <span>{isSaved ? 'Saved' : 'Save'}</span>
            </button>

            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 hover:text-brand-navy transition"
            >
              <Share2 className="w-4 h-4" />
              <span>{copied ? 'Link Copied!' : 'Share'}</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (!currentUser) {
                  navigate('/login', { state: { from: location } });
                  return;
                }
                setReportModalOpen(true);
              }}
              className="flex items-center gap-1 text-slate-400 hover:text-rose-600 text-[11px] transition"
              title="Report Content to Moderators"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>Report</span>
            </button>
          </div>
        </div>

      </article>

      {/* Comments Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-card space-y-6">
        <h3 className="text-sm font-bold text-brand-navy uppercase tracking-wider">
          Peer Discussion & Comments ({comments.length})
        </h3>

        {/* Comment Composer */}
        {currentUser ? (
          <form onSubmit={handleAddComment} className="space-y-3">
            {replyingToComment && (
              <div className="p-2.5 bg-teal-50 border border-teal-200 rounded-xl text-xs flex items-center justify-between text-teal-800">
                <span className="flex items-center gap-1.5">
                  <CornerDownRight className="w-3.5 h-3.5 text-teal-600" />
                  <span>Replying to <strong>{replyingToComment.author_name}</strong></span>
                </span>
                <button
                  type="button"
                  onClick={() => setReplyingToComment(null)}
                  className="text-teal-600 hover:text-teal-800 font-bold"
                >
                  ✕
                </button>
              </div>
            )}

            <textarea
              rows={3}
              required
              value={newCommentBody}
              onChange={(e) => setNewCommentBody(e.target.value)}
              placeholder="Contribute your clinical observation, repertorial rubrics, or posology question..."
              className="w-full p-3.5 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none leading-relaxed"
            />
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400">
                Posting as {currentUser.display_name} ({currentUser.qualification || 'Member'})
              </span>
              <button
                type="submit"
                disabled={submittingComment || !newCommentBody.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold transition disabled:opacity-50 shadow-2xs"
              >
                <Send className="w-3 h-3" />
                <span>{submittingComment ? 'Posting...' : 'Post Reply'}</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="p-5 bg-teal-50/50 border border-teal-100 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-xs font-bold text-teal-900">Join the Clinical Discussion</h4>
              <p className="text-[11px] text-teal-700">Sign in with your verified account to contribute clinical observations, ask questions, or reply to peers.</p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/login', { state: { from: location } })}
              className="whitespace-nowrap px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold transition shadow-xs"
            >
              Sign in to Reply
            </button>
          </div>
        )}

        {/* Comments Feed */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          {comments.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">
              No replies yet. Be the first practitioner to contribute.
            </p>
          ) : (
            comments.map((comment) => {
              const isCommentAuthor = currentUser?.id === comment.author_id;

              return (
                <div key={comment.id} className="p-4 bg-slate-50/70 rounded-2xl border border-slate-100 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={comment.author_name} src={comment.author_avatar} size="sm" />
                      <div>
                        <span className="text-xs font-bold text-brand-navy block leading-none">
                          {comment.author_name}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {comment.author_qualification || 'Doctor'} • {comment.created_at}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          if (!currentUser) {
                            navigate('/login', { state: { from: location } });
                            return;
                          }
                          setReplyingToComment(comment);
                        }}
                        className="text-[11px] text-teal-700 hover:underline flex items-center gap-1"
                      >
                        <CornerDownRight className="w-3 h-3" />
                        <span>Reply</span>
                      </button>

                      {isCommentAuthor && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                          title="Delete Comment"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed pl-10 whitespace-pre-line">
                    {comment.body}
                  </p>
                </div>
              );
            })
          )}
        </div>

      </div>

      {/* Report Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5 text-rose-700">
                <Flag className="w-4 h-4" />
                <h3 className="text-sm font-bold">Report Content</h3>
              </div>
              <button onClick={() => setReportModalOpen(false)} className="text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            {reportSubmitted ? (
              <div className="py-6 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-teal-600 mx-auto" />
                <p className="text-xs font-bold text-brand-navy">Report Logged for Review</p>
                <p className="text-[11px] text-slate-500">Our editorial council reviews reported items within 24 hours.</p>
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
                    <option value="harassment">Unprofessional Conduct</option>
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
                    onClick={() => setReportModalOpen(false)}
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
