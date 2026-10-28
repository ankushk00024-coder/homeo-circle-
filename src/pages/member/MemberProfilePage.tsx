import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { dataService } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { UserProfile, Post, ConnectionRequest } from '../../types';
import { Avatar } from '../../components/common/Avatar';
import { 
  ArrowLeft, 
  MapPin, 
  Building2, 
  GraduationCap, 
  ShieldCheck, 
  Clock, 
  Mail, 
  Phone,
  MessageSquare,
  CheckCircle2,
  ExternalLink,
  UserPlus,
  Check,
  HeartHandshake,
  Microscope,
  Stethoscope,
  Globe,
  Share2
} from 'lucide-react';
import { useToast } from '../../components/feedback/ToastProvider';

export const MemberProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const toast = useToast();

  const [member, setMember] = useState<UserProfile | null>(null);
  const [memberPosts, setMemberPosts] = useState<Post[]>([]);
  const [connectionRequests, setConnectionRequests] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Mentorship Modal state
  const [mentorModalOpen, setMentorModalOpen] = useState(false);
  const [mentorshipMessage, setMentorshipMessage] = useState('');
  const [mentorshipGoals, setMentorshipGoals] = useState('Acute & Chronic case repertorization and clinical posology guidance.');
  const [mentorshipSubmitted, setMentorshipSubmitted] = useState(false);
  const [actionAlert, setActionAlert] = useState<string | null>(null);

  const loadProfile = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [foundMember, posts, conns] = await Promise.all([
        dataService.getMemberById(id),
        dataService.getPosts().then(posts => posts.filter(p => p.author_id === id)),
        dataService.getConnectionRequests()
      ]);
      setMember(foundMember);
      setMemberPosts(posts);
      setConnectionRequests(conns);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [id]);

  const getConnectionStatus = () => {
    if (!currentUser || !member) return 'none';
    if (currentUser.id === member.id) return 'self';

    const conn = connectionRequests.find(c => 
      (c.sender_id === currentUser.id && c.recipient_id === member.id) ||
      (c.sender_id === member.id && c.recipient_id === currentUser.id)
    );

    if (!conn) return 'none';
    if (conn.status === 'accepted') return 'connected';
    if (conn.status === 'pending') {
      return conn.sender_id === currentUser.id ? 'pending_sent' : 'pending_received';
    }
    return 'none';
  };

  const handleConnect = async () => {
    if (!currentUser || !member) return;
    try {
      await dataService.sendConnectionRequest(currentUser, member);
      setActionAlert(`Connection request sent to ${member.display_name}! In-app notification delivered.`);
      setTimeout(() => setActionAlert(null), 4000);
      await loadProfile();
    } catch (err: any) {
      toast.error(err.message || 'Failed to send connection request.');
    }
  };

  const handleRespond = async (status: 'accepted' | 'declined') => {
    if (!currentUser || !member) return;
    const req = connectionRequests.find(c => c.recipient_id === currentUser.id && c.sender_id === member.id && c.status === 'pending');
    if (!req) return;
    try {
      await dataService.respondConnectionRequest(req.id, status, currentUser);
      setActionAlert(status === 'accepted' ? 'Connection request accepted!' : 'Connection request declined.');
      setTimeout(() => setActionAlert(null), 4000);
      await loadProfile();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update connection.');
    }
  };

  const handleSendMentorshipRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !member) return;
    try {
      await dataService.sendMentorshipRequest({
        student_id: currentUser.id,
        student_name: currentUser.display_name || currentUser.full_name,
        student_avatar: currentUser.avatar_url,
        student_institution: currentUser.institution || 'Medical College',
        student_course_year: currentUser.course_year || 'BHMS Candidate',
        mentor_id: member.id,
        mentor_name: member.display_name || member.full_name,
        mentor_avatar: member.avatar_url,
        mentor_specialization: member.specialization || 'Clinical Practice',
        message: mentorshipMessage.trim(),
        goals: mentorshipGoals.trim()
      });
      setMentorshipSubmitted(true);
      setTimeout(() => {
        setMentorshipSubmitted(false);
        setMentorModalOpen(false);
        setActionAlert('Mentorship request sent to doctor! In-app notification delivered.');
        setTimeout(() => setActionAlert(null), 4000);
      }, 1500);
    } catch (err: any) {
      toast.error(err.message || 'Failed to send mentorship request.');
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-xs text-slate-500">Loading member profile...</div>;
  }

  if (!member) {
    return (
      <div className="py-12 text-center space-y-3">
        <h2 className="text-xl font-bold text-brand-navy">Member Profile Not Found</h2>
        <Link to="/members" className="px-4 py-2 bg-teal-700 text-white rounded-xl text-xs font-semibold">
          Return to Member Directory
        </Link>
      </div>
    );
  }

  const connState = getConnectionStatus();
  const isSelf = currentUser?.id === member.id;
  const isStudent = currentUser?.role === 'student';
  const offersMentorship = Boolean(member.mentorship_available && (member.role === 'doctor' || member.role === 'member' || member.role === 'researcher'));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Back to directory */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/members')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-navy transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Member Directory</span>
        </button>

        {isSelf && (
          <Link
            to="/profile"
            className="text-xs font-semibold text-brand-teal hover:underline"
          >
            Edit My Profile &rarr;
          </Link>
        )}
      </div>

      {actionAlert && (
        <div className="p-3.5 bg-teal-50 border border-teal-200 rounded-xl flex items-center gap-2 text-teal-800 text-xs animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0" />
          <span>{actionAlert}</span>
        </div>
      )}

      {/* Main Profile Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-card space-y-6">
        
        {/* Top Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex items-start sm:items-center gap-5">
            <Avatar
              name={member.full_name || member.display_name}
              src={member.avatar_url}
              size="xl"
              verified={member.status === 'verified'}
            />
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-serif font-bold text-brand-navy">
                  {member.full_name}
                </h1>
                <span className="bg-teal-50 text-teal-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-teal-200 flex items-center gap-1 uppercase tracking-wider">
                  <ShieldCheck className="w-3 h-3 text-teal-600" />
                  <span>{member.status === 'verified' ? 'Verified Member' : 'Pending Verification'}</span>
                </span>
                <span className="bg-slate-100 text-slate-700 text-[11px] font-bold px-2.5 py-0.5 rounded-full capitalize">
                  {member.role === 'student' ? 'Student' : member.role === 'researcher' ? 'Researcher' : 'Doctor'}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 font-medium">
                {member.role === 'student' 
                  ? member.qualification 
                  : `${member.qualification}${member.experience_years ? ` • ${member.experience_years} Years Experience` : ''}`}
              </p>

              <p className="text-xs text-brand-teal font-semibold">
                {member.role === 'student'
                  ? member.institution || 'Recognized Homoeopathic Medical College'
                  : member.specialization || 'Clinical Practice'}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {!isSelf && (
              <>
                {connState === 'connected' ? (
                  <span className="px-4 py-2 bg-teal-50 text-teal-800 rounded-xl text-xs font-semibold border border-teal-200 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-teal-600" />
                    <span>Connected Peer</span>
                  </span>
                ) : connState === 'pending_sent' ? (
                  <span className="px-4 py-2 bg-amber-50 text-amber-800 rounded-xl text-xs font-semibold border border-amber-200 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Request Pending</span>
                  </span>
                ) : connState === 'pending_received' ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleRespond('accepted')}
                      className="px-4 py-2 bg-brand-teal hover:bg-teal-700 text-white rounded-xl text-xs font-semibold transition"
                    >
                      Accept Request
                    </button>
                    <button
                      onClick={() => handleRespond('declined')}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition"
                    >
                      Decline
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleConnect}
                    className="px-4 py-2 bg-brand-teal hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-2xs transition flex items-center gap-1.5"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Connect</span>
                  </button>
                )}

                {/* Student Request Mentorship CTA */}
                {offersMentorship && (
                  <button
                    onClick={() => setMentorModalOpen(true)}
                    className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
                  >
                    <HeartHandshake className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Request Mentorship</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Practice & Institutional Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-50/80 rounded-2xl border border-slate-100 text-xs">
          <div className="flex items-start gap-2.5">
            <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-slate-400 text-[11px] block uppercase font-bold">Location</span>
              <span className="font-semibold text-brand-navy">
                {member.city ? `${member.city}, ${member.state}` : member.state}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            {member.role === 'student' ? (
              <GraduationCap className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            ) : (
              <Building2 className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <span className="text-slate-400 text-[11px] block uppercase font-bold">
                {member.role === 'student' ? 'College / University' : 'Affiliated Hospital / Clinic'}
              </span>
              <span className="font-semibold text-brand-navy block">
                {member.role === 'student'
                  ? member.institution || 'Medical College'
                  : member.clinic_institution || 'Independent Clinical Practice'}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-slate-400 text-[11px] block uppercase font-bold">
                {member.role === 'student' ? 'Academic Standing' : 'Statutory Register'}
              </span>
              <span className="font-semibold text-brand-navy block">
                {member.role === 'student'
                  ? member.course_year || 'Enrolled Student'
                  : member.registration_authority || 'National Commission for Homoeopathy'}
              </span>
            </div>
          </div>
        </div>

        {/* Professional Bio */}
        {member.bio && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-brand-navy uppercase tracking-wider">
              Professional Overview
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {member.bio}
            </p>
          </div>
        )}

        {/* Student-specific: Mentorship Needs */}
        {member.role === 'student' && member.mentorship_needs && member.mentorship_needs.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-brand-navy uppercase tracking-wider flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-emerald-600" />
              <span>Seeking Clinical Guidance In:</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {member.mentorship_needs.map(n => (
                <span key={n} className="px-3 py-1 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-medium border border-emerald-200">
                  {n}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Researcher-specific: Publications & ORCID */}
        {member.role === 'researcher' && (
          <div className="space-y-3 p-4 bg-sky-50/50 rounded-2xl border border-sky-100">
            <h3 className="text-xs font-bold text-brand-navy uppercase tracking-wider flex items-center gap-1.5">
              <Microscope className="w-4 h-4 text-sky-600" />
              <span>Academic Publications & Research Lines</span>
            </h3>
            {member.research_interests && (
              <p className="text-xs text-slate-700">
                <strong>Inquiry:</strong> {member.research_interests}
              </p>
            )}
            {member.publications && (
              <p className="text-xs text-slate-700">
                <strong>Selected Publications:</strong> {member.publications}
              </p>
            )}
            {member.orcid_id && (
              <p className="text-xs text-slate-600 font-mono">
                ORCID: <a href={`https://orcid.org/${member.orcid_id}`} target="_blank" rel="noopener noreferrer" className="text-teal-700 underline">{member.orcid_id}</a>
              </p>
            )}
          </div>
        )}

        {/* Areas of Interest / Tags */}
        {member.interests && member.interests.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-brand-navy uppercase tracking-wider">
              Clinical Interests & Topics
            </h3>
            <div className="flex flex-wrap gap-2">
              {member.interests.map(int => (
                <span key={int} className="px-2.5 py-1 bg-[#EEF6FC] text-brand-navy rounded-lg text-xs font-medium border border-[#D7E5F0]">
                  {int}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Social / Professional Links (if visible) */}
        {member.social_links && (member.social_links.linkedin || member.social_links.website || member.social_links.orcid) && (
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-3 text-xs">
            {member.social_links.linkedin && (
              <a
                href={member.social_links.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 transition"
              >
                <span>LinkedIn</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            )}
            {member.social_links.website && (
              <a
                href={member.social_links.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 transition"
              >
                <Globe className="w-3.5 h-3.5 text-slate-500" />
                <span>Clinic / Academic Website</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            )}
          </div>
        )}

      </div>

      {/* Posts Published by Member */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-card space-y-4">
        <h3 className="text-sm font-bold text-brand-navy uppercase tracking-wider">
          Discussions & Observations by {member.display_name} ({memberPosts.length})
        </h3>

        {memberPosts.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">
            This member has not published any community discussions yet.
          </p>
        ) : (
          <div className="space-y-3">
            {memberPosts.map((post) => (
              <Link
                key={post.id}
                to={`/community/${post.id}`}
                className="block p-4 rounded-2xl border border-slate-200/80 hover:border-teal-400 hover:shadow-xs transition space-y-1.5 group"
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${post.category_badge_color}`}>
                    {post.category_name}
                  </span>
                  <span className="text-xs text-slate-400">{post.created_at}</span>
                </div>
                <h4 className="text-sm font-bold text-brand-navy group-hover:text-teal-800 transition">
                  {post.title}
                </h4>
                <p className="text-xs text-slate-600 line-clamp-2">
                  {post.body}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Mentorship Request Modal */}
      {mentorModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <HeartHandshake className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-brand-navy">
                  Request Clinical Mentorship
                </h3>
              </div>
              <button onClick={() => setMentorModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            {mentorshipSubmitted ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="text-sm font-bold text-brand-navy">Mentorship Request Sent</h4>
                <p className="text-xs text-slate-500">
                  Dr. {member.display_name} has received an in-app notification. You can track status on your Student Dashboard.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendMentorshipRequest} className="space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed">
                  You are requesting academic and clinical case mentorship from <strong>{member.full_name}</strong> ({member.specialization}).
                </p>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Primary Clinical Learning Goals *
                  </label>
                  <input
                    type="text"
                    required
                    value={mentorshipGoals}
                    onChange={(e) => setMentorshipGoals(e.target.value)}
                    placeholder="e.g. Learning Boenninghausen repertorial analysis for chronic skin cases"
                    className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Personal Note to Doctor *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={mentorshipMessage}
                    onChange={(e) => setMentorshipMessage(e.target.value)}
                    placeholder="Introduce yourself, your BHMS college, and what specific guidance you would value..."
                    className="w-full p-3 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none leading-relaxed"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setMentorModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow transition"
                  >
                    Send Request
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
