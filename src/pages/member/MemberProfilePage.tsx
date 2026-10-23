import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { dataService } from '../../lib/supabase';
import { UserProfile, Post } from '../../types';
import { Avatar } from '../../components/common/Avatar';
import { 
  ArrowLeft, 
  MapPin, 
  Building2, 
  GraduationCap, 
  ShieldCheck, 
  Clock, 
  Mail, 
  Lock, 
  MessageSquare,
  CheckCircle2
} from 'lucide-react';

export const MemberProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [member, setMember] = useState<UserProfile | null>(null);
  const [memberPosts, setMemberPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [inquirySent, setInquirySent] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      dataService.getMemberById(id),
      dataService.getPosts().then(posts => posts.filter(p => p.author_id === id))
    ]).then(([foundMember, posts]) => {
      setMember(foundMember);
      setMemberPosts(posts);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return <div className="py-12 text-center text-xs text-slate-500">Loading profile...</div>;
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button
        onClick={() => navigate('/members')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-navy transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Member Directory</span>
      </button>

      {/* Main Profile Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-card space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-5">
            <Avatar
              name={member.full_name || member.display_name}
              src={member.avatar_url}
              size="xl"
              verified={member.status === 'verified'}
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-serif font-bold text-brand-navy">
                  {member.full_name}
                </h1>
                <span className="bg-teal-50 text-teal-800 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-teal-200 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-teal-600" />
                  <span>Verified</span>
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                {member.qualification} • {member.experience_years} Years Clinical Standing
              </p>
              <p className="text-xs text-teal-800 font-medium mt-1">
                {member.specialization || 'Clinical Practice'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {inquirySent ? (
              <span className="text-xs font-semibold text-teal-800 bg-teal-50 px-4 py-2 rounded-xl border border-teal-200">
                Inquiry Sent to Doctor
              </span>
            ) : (
              <button
                onClick={() => setInquirySent(true)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow transition"
              >
                Send Peer Inquiry / Referral
              </button>
            )}
          </div>
        </div>

        {/* Practice & Verification details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs">
          <div className="flex items-center gap-2.5">
            <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <div>
              <span className="text-slate-400 text-[10px] block">State Jurisdiction</span>
              <span className="font-semibold text-brand-navy">{member.state}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Building2 className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <div>
              <span className="text-slate-400 text-[10px] block">Affiliated Dispensary / Clinic</span>
              <span className="font-semibold text-brand-navy truncate block">
                {member.clinic_institution || 'Independent Clinical Practice'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <GraduationCap className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <div>
              <span className="text-slate-400 text-[10px] block">Statutory Register</span>
              <span className="font-semibold text-brand-navy truncate block">
                {member.registration_authority || 'National Commission for Homoeopathy'}
              </span>
            </div>
          </div>
        </div>

        {/* Bio */}
        {member.bio && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-brand-navy uppercase tracking-wider">
              Practitioner Background & Approach
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {member.bio}
            </p>
          </div>
        )}

        {/* Clinical Interests */}
        {member.interests && member.interests.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-brand-navy uppercase tracking-wider">
              Specialized Areas of Inquiry
            </h3>
            <div className="flex flex-wrap gap-2">
              {member.interests.map((interest) => (
                <span
                  key={interest}
                  className="px-3 py-1 rounded-lg bg-teal-50 text-teal-800 text-xs font-medium border border-teal-100"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Privacy Guard Notice */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center gap-2 text-[11px] text-slate-500">
          <Lock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <span>
            Under Homeo Circle data minimization rules, personal phone numbers and internal statutory registration files are kept private.
          </span>
        </div>

      </div>

      {/* Authored Discussions */}
      {memberPosts.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-card space-y-4">
          <h3 className="text-xs font-bold text-brand-navy uppercase tracking-wider">
            Discussions by {member.full_name} ({memberPosts.length})
          </h3>
          <div className="space-y-3">
            {memberPosts.map((post) => (
              <Link
                key={post.id}
                to={`/community/${post.id}`}
                className="block p-3.5 bg-slate-50 hover:bg-teal-50/50 rounded-xl border border-slate-100 transition space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-brand-navy">{post.title}</span>
                  <span className="text-[10px] text-slate-400">{post.created_at}</span>
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-1">{post.body}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
