import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dataService } from '../../lib/supabase';
import { Post, Comment } from '../../types';
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
  X
} from 'lucide-react';

export const PostDetailPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newCommentBody, setNewCommentBody] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [loading, setLoading] = useState(true);

  // Report modal state
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState<'patient_privacy' | 'misleading_clinical_claim' | 'unsolicited_promotion' | 'harassment'>('patient_privacy');
  const [reportNote, setReportNote] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState(false);

  useEffect(() => {
    if (!postId) return;
    Promise.all([
      dataService.getPosts().then(posts => posts.find(p => p.id === postId) || null),
      dataService.getComments(postId)
    ]).then(([foundPost, foundComments]) => {
      setPost(foundPost);
      setComments(foundComments);
      setLoading(false);
    });
  }, [postId]);

  const handleLike = async () => {
    if (!post) return;
    const newLikes = await dataService.toggleLikePost(post.id);
    setPost({ ...post, is_liked: !post.is_liked, likes_count: newLikes });
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post || !newCommentBody.trim() || !currentUser) return;

    setSubmittingComment(true);
    try {
      const added = await dataService.addComment(post.id, currentUser, newCommentBody.trim());
      setComments([...comments, added]);
      setNewCommentBody('');
      setPost({ ...post, comments_count: post.comments_count + 1 });
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingComment(false);
    }
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

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back button */}
      <div>
        <button
          onClick={() => navigate('/community')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-navy transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Discussions Feed</span>
        </button>
      </div>

      {/* Main Post Card */}
      <article className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-card space-y-6">
        
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
              <div className="flex items-center gap-1.5">
                <Link to={`/members/${post.author_id}`} className="text-sm font-bold text-brand-navy hover:text-brand-teal">
                  {post.author_name}
                </Link>
              </div>
              <p className="text-xs text-brand-muted">{post.author_qualification} • {post.author_experience}</p>
              <span className="text-[10px] text-brand-teal font-medium">Verified National Register Record</span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5">
            <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${post.category_badge_color}`}>
              {post.category_name}
            </span>
            <span className="text-[11px] text-slate-400">{post.created_at}</span>
          </div>
        </div>

        {/* Title & Body */}
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
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setReportModalOpen(true)}
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
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-card space-y-6">
        <h3 className="text-sm font-bold text-brand-navy uppercase tracking-wider">
          Peer Discussion & Comments ({comments.length})
        </h3>

        {/* Comment Composer */}
        <form onSubmit={handleAddComment} className="space-y-3">
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
              Posting as {currentUser?.display_name} ({currentUser?.qualification})
            </span>
            <button
              type="submit"
              disabled={submittingComment || !newCommentBody.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold transition disabled:opacity-50"
            >
              <Send className="w-3 h-3" />
              <span>{submittingComment ? 'Posting...' : 'Post Reply'}</span>
            </button>
          </div>
        </form>

        {/* Comments Feed */}
        <div className="space-y-4 pt-2">
          {comments.map((comm) => (
            <div
              key={comm.id}
              className="p-4 bg-slate-50/70 rounded-xl border border-slate-100 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar
                    name={comm.author_name}
                    src={comm.author_avatar}
                    size="xs"
                  />
                  <span className="text-xs font-bold text-brand-navy">{comm.author_name}</span>
                  <span className="text-[10px] text-slate-400">• {comm.author_qualification}</span>
                </div>
                <span className="text-[10px] text-slate-400">{comm.created_at}</span>
              </div>
              <p className="text-xs text-slate-700 pl-9 leading-relaxed">
                {comm.body}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Report Post Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
                <Flag className="w-4 h-4" />
                <span>Report Discussion to Moderators</span>
              </div>
              <button onClick={() => setReportModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {reportSubmitted ? (
              <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl text-center space-y-2 text-teal-800 text-xs">
                <CheckCircle2 className="w-6 h-6 text-teal-600 mx-auto" />
                <p className="font-bold">Report Received</p>
                <p>Thank you for upholding community standards. The moderation queue has been notified.</p>
              </div>
            ) : (
              <form onSubmit={handleReportSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Reason for Flagging *
                  </label>
                  <select
                    value={reportReason}
                    onChange={(e: any) => setReportReason(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none"
                  >
                    <option value="patient_privacy">Breach of Patient Confidentiality (Identifiable records)</option>
                    <option value="misleading_clinical_claim">Misleading or Unsubstantiated Miracle Cure Claim</option>
                    <option value="unsolicited_promotion">Commercial Advertising / Remedy Selling</option>
                    <option value="harassment">Unprofessional Conduct or Harassment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Details / Context (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={reportNote}
                    onChange={(e) => setReportNote(e.target.value)}
                    placeholder="Provide specific context to assist the moderation team..."
                    className="w-full p-3 text-xs border border-slate-200 rounded-xl outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setReportModalOpen(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow"
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
