import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dataService } from '../../lib/supabase';
import { 
  UserProfile, 
  MentorshipRequest, 
  Event, 
  Opportunity, 
  KnowledgePost,
  ConnectionRequest
} from '../../types';
import { Avatar } from '../../components/common/Avatar';
import { ConnectDialog } from '../../components/common/ConnectDialog';
import { 
  GraduationCap, 
  HeartHandshake, 
  BookOpen, 
  Calendar, 
  Briefcase, 
  Search, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  ExternalLink,
  ShieldCheck,
  Stethoscope,
  Microscope,
  FileText,
  Building2,
  Sparkles,
  AlertCircle,
  Filter,
  UserPlus,
  Check,
  X,
  MapPin
} from 'lucide-react';

export const StudentsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'overview';

  const [activeTab, setActiveTab] = useState<'overview' | 'mentors' | 'resources' | 'events' | 'internships'>(
    (currentTab as any) || 'overview'
  );

  const [allEligibleMentors, setAllEligibleMentors] = useState<UserProfile[]>([]);
  const [connectionRequests, setConnectionRequests] = useState<ConnectionRequest[]>([]);
  const [myMentorshipRequests, setMyMentorshipRequests] = useState<MentorshipRequest[]>([]);
  const [studentEvents, setStudentEvents] = useState<Event[]>([]);
  const [studentOpportunities, setStudentOpportunities] = useState<Opportunity[]>([]);
  const [educationalResources, setEducationalResources] = useState<KnowledgePost[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State for Discover Mentors
  const [mentorSearch, setMentorSearch] = useState('');
  const [selectedSpec, setSelectedSpec] = useState('All');
  const [selectedState, setSelectedState] = useState('All');
  const [selectedVerification, setSelectedVerification] = useState('All');
  const [onlyAcceptingMentorship, setOnlyAcceptingMentorship] = useState(false);
  const [visibleCount, setVisibleCount] = useState(6);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [connectTarget, setConnectTarget] = useState<UserProfile | null>(null);

  // Mentor request modal state
  const [selectedMentor, setSelectedMentor] = useState<UserProfile | null>(null);
  const [mentorshipGoals, setMentorshipGoals] = useState('Acute & Chronic case repertorization and clinical posology guidance.');
  const [mentorshipMessage, setMentorshipMessage] = useState('');
  const [modalSuccess, setModalSuccess] = useState(false);

  const specializationOptions = [
    'All',
    'Clinical Practice',
    'Autoimmune & Dermatology',
    "Women's Health",
    'Chronic Disease',
    'Pediatrics',
    'Research & Academia',
    'Materia Medica'
  ];

  const stateOptions = [
    'All',
    'Maharashtra',
    'Karnataka',
    'Delhi',
    'Uttar Pradesh',
    'Gujarat',
    'West Bengal',
    'Kerala',
    'Telangana'
  ];

  const loadStudentData = async () => {
    setLoading(true);
    try {
      const [allMembers, allConns, allRequests, allEvents, allOpps, allKnowledge] = await Promise.all([
        dataService.getMembers(),
        dataService.getConnectionRequests(),
        dataService.getMentorshipRequests(currentUser?.id),
        dataService.getEvents(),
        dataService.getOpportunities('Internship'),
        dataService.getKnowledgePosts()
      ]);

      // Define mentor eligibility rules from platform user records:
      // Must be a doctor, researcher, educator, or senior practitioner member.
      // Must not be a student, unverified public visitor, or suspended account.
      const eligible = allMembers.filter(m => {
        // The directory only lists people who chose a type; mentors are doctors and researchers.
        const type = m.account_type || m.role;
        return (type === 'doctor' || type === 'researcher') && m.status !== 'suspended';
      });

      setAllEligibleMentors(eligible);
      setConnectionRequests(allConns);
      setMyMentorshipRequests(allRequests);
      setStudentEvents(
        allEvents.filter(e => 
          e.title.toLowerCase().includes('student') || 
          e.title.toLowerCase().includes('study') || 
          e.format === 'Webinar' || 
          e.format === 'Study Circle'
        )
      );
      setStudentOpportunities(allOpps);
      setEducationalResources(allKnowledge);
    } catch (err) {
      console.error('Failed to load student hub data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudentData();
  }, [currentUser?.id]);

  useEffect(() => {
    if (searchParams.get('tab')) {
      setActiveTab(searchParams.get('tab') as any);
    }
  }, [searchParams]);

  // Handle Mentorship Modal Submission
  const handleSendMentorship = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMentor || !currentUser) return;

    try {
      await dataService.sendMentorshipRequest({
        student_id: currentUser.id,
        student_name: currentUser.display_name || currentUser.full_name,
        student_avatar: currentUser.avatar_url,
        student_institution: currentUser.institution || currentUser.clinic_institution || 'Recognized Homoeopathic Medical College',
        student_course_year: currentUser.course_year || 'Final Year BHMS',
        mentor_id: selectedMentor.id,
        mentor_name: selectedMentor.display_name || selectedMentor.full_name,
        mentor_avatar: selectedMentor.avatar_url,
        mentor_specialization: selectedMentor.specialization || 'Clinical Practice',
        message: mentorshipMessage.trim(),
        goals: mentorshipGoals.trim()
      });

      setModalSuccess(true);
      setTimeout(() => {
        setModalSuccess(false);
        setSelectedMentor(null);
        setMentorshipMessage('');
        loadStudentData();
      }, 1800);
    } catch (err: any) {
      alert(err.message || 'Failed to dispatch mentorship request.');
    }
  };

  // Connection status calculation
  const getConnectionStatus = (targetId: string) => {
    if (!currentUser) return 'none';
    if (currentUser.id === targetId) return 'self';

    const conn = connectionRequests.find(c => 
      (c.sender_id === currentUser.id && c.recipient_id === targetId) ||
      (c.sender_id === targetId && c.recipient_id === currentUser.id)
    );

    if (!conn) return 'none';
    if (conn.status === 'accepted') return 'connected';
    if (conn.status === 'pending') {
      return conn.sender_id === currentUser.id ? 'pending_sent' : 'pending_received';
    }
    return 'none';
  };

  const handleConnect = (targetMember: UserProfile) => {
    if (!currentUser) {
      navigate('/login', { state: { from: location } });
      return;
    }
    setConnectTarget(targetMember);
  };

  const sendRequest = async (note: string) => {
    if (!currentUser || !connectTarget) return;
    await dataService.sendConnectionRequest(currentUser, connectTarget, note);
    setConnectTarget(null);
    setActionFeedback(`Request sent to ${connectTarget.display_name || connectTarget.full_name}. They'll see it on their dashboard.`);
    setTimeout(() => setActionFeedback(null), 5000);
    setConnectionRequests(await dataService.getConnectionRequests());
  };

  const handleCancelConnection = async (targetId: string) => {
    const req = connectionRequests.find(c => c.sender_id === currentUser?.id && c.recipient_id === targetId);
    if (req) {
      await dataService.cancelConnectionRequest(req.id);
      const updatedConns = await dataService.getConnectionRequests();
      setConnectionRequests(updatedConns);
      setActionFeedback('Connection request cancelled.');
      setTimeout(() => setActionFeedback(null), 3000);
    }
  };

  // Multi-facet filtering for Discover Mentors
  const filteredMentors = allEligibleMentors.filter(m => {
    // 1. Search Query
    if (mentorSearch.trim()) {
      const q = mentorSearch.toLowerCase();
      const matchesName = m.full_name.toLowerCase().includes(q) || m.display_name.toLowerCase().includes(q);
      const matchesSpec = m.specialization ? m.specialization.toLowerCase().includes(q) : false;
      const matchesQual = m.qualification ? m.qualification.toLowerCase().includes(q) : false;
      const matchesLocation = (m.state && m.state.toLowerCase().includes(q)) || (m.city && m.city.toLowerCase().includes(q));
      const matchesInstitution = m.clinic_institution ? m.clinic_institution.toLowerCase().includes(q) : false;
      const matchesInterests = m.interests ? m.interests.some(i => i.toLowerCase().includes(q)) : false;
      const matchesBio = m.bio ? m.bio.toLowerCase().includes(q) : false;

      if (!matchesName && !matchesSpec && !matchesQual && !matchesLocation && !matchesInstitution && !matchesInterests && !matchesBio) {
        return false;
      }
    }

    // 2. Specialization
    if (selectedSpec !== 'All') {
      if (!m.specialization || !m.specialization.toLowerCase().includes(selectedSpec.toLowerCase())) {
        return false;
      }
    }

    // 3. State
    if (selectedState !== 'All') {
      if (!m.state || m.state.toLowerCase() !== selectedState.toLowerCase()) {
        return false;
      }
    }

    // 4. Verification
    if (selectedVerification === 'Verified Only') {
      const isVerified = m.status === 'verified' || m.verification_status === 'verified';
      if (!isVerified) return false;
    }

    // 5. Accepting Mentorship
    if (onlyAcceptingMentorship) {
      if (m.mentorship_available === false) return false;
    }

    return true;
  });

  const resetFilters = () => {
    setMentorSearch('');
    setSelectedSpec('All');
    setSelectedState('All');
    setSelectedVerification('All');
    setOnlyAcceptingMentorship(false);
  };

  const hasActiveFilters = Boolean(
    mentorSearch.trim() || 
    selectedSpec !== 'All' || 
    selectedState !== 'All' || 
    selectedVerification !== 'All' || 
    onlyAcceptingMentorship
  );

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-serif font-bold text-brand-navy">Student Corner</h1>
        <Link
          to="/members"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-teal hover:bg-teal-700 text-white font-semibold text-xs shadow-xs transition"
        >
          <HeartHandshake className="w-3.5 h-3.5" />
          <span>Find mentors</span>
        </Link>
      </div>

      {actionFeedback && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs flex items-center justify-between animate-fade-in shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{actionFeedback}</span>
          </div>
          <button onClick={() => setActionFeedback(null)} className="text-emerald-700 hover:text-emerald-950">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Tabs: mentors are the Doctors directory; webinars live in Events & CMEs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-brand-border/70 scrollbar-none">
        <button
          onClick={() => { setActiveTab('overview'); setSearchParams({ tab: 'overview' }); }}
          className="px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 bg-teal-700 text-white shadow-2xs"
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>My Student Dashboard</span>
        </button>
        <Link
          to="/members"
          className="px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 bg-white text-slate-600 hover:bg-slate-100 border border-brand-border"
        >
          <HeartHandshake className="w-3.5 h-3.5" />
          <span>Discover Mentors</span>
        </Link>
        <Link
          to="/events"
          className="px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 bg-white text-slate-600 hover:bg-slate-100 border border-brand-border"
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Student Webinars & CMEs</span>
        </Link>
      </div>

      {/* ────────────────── 1. STUDENT DASHBOARD OVERVIEW ────────────────── */}
      {(
        <div className="space-y-6">
          
          {/* Student Profile Snapshot Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-card space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <Avatar
                  name={currentUser?.full_name || 'Student Member'}
                  src={currentUser?.avatar_url}
                  size="lg"
                  verified={currentUser?.status === 'verified'}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-brand-navy">
                      {currentUser?.full_name}
                    </h2>
                    {(currentUser?.account_type || currentUser?.role) === 'student' && (
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Student
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {[currentUser?.institution || currentUser?.clinic_institution, currentUser?.city]
                      .filter((x) => x && x !== 'Not specified')
                      .join(' • ') || 'Add your college in your profile.'}
                  </p>
                </div>
              </div>

              <Link
                to="/profile"
                className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-brand-navy rounded-xl text-xs font-semibold border border-slate-200 transition text-center"
              >
                Edit profile
              </Link>
            </div>

          </div>

          {/* Mentorship Requests Tracker */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-card space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <HeartHandshake className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-brand-navy">
                  My Mentorship Requests ({myMentorshipRequests.length})
                </h3>
              </div>
              <button
                onClick={() => navigate('/members')}
                className="text-xs font-semibold text-brand-teal hover:underline cursor-pointer"
              >
                Discover New Mentors &rarr;
              </button>
            </div>

            {!currentUser ? (
              <div className="text-center py-6 space-y-2">
                <p className="text-xs text-slate-500">Sign in to track your mentorship requests and connect directly with senior clinicians.</p>
                <button
                  onClick={() => navigate('/login', { state: { from: location } })}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs transition"
                >
                  Sign in to Request Mentorship
                </button>
              </div>
            ) : myMentorshipRequests.length === 0 ? (
              <div className="text-center py-6 space-y-2">
                <p className="text-xs text-slate-500">No mentorship requests yet.</p>
                <button
                  onClick={() => navigate('/members')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs transition"
                >
                  Find mentors
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {myMentorshipRequests.map((req) => (
                  <div key={req.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <Avatar name={req.mentor_name} src={req.mentor_avatar} size="md" />
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-brand-navy block">{req.mentor_name}</span>
                        <p className="text-[11px] text-teal-700 font-medium">{req.mentor_specialization}</p>
                        <p className="text-xs text-slate-600 line-clamp-1 italic">"{req.goals}"</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                        req.status === 'accepted'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : req.status === 'declined'
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        {req.status === 'accepted' ? '✓ Accepted by Doctor' : req.status === 'declined' ? 'Declined' : '⏳ Pending Review'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* Mentorship Request Modal */}
      {selectedMentor && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <HeartHandshake className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-brand-navy">
                  Request Clinical Mentorship
                </h3>
              </div>
              <button 
                onClick={() => setSelectedMentor(null)} 
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {modalSuccess ? (
              <div className="py-6 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="text-sm font-bold text-brand-navy">Mentorship Request Dispatched!</h4>
                <p className="text-xs text-slate-500">
                  {selectedMentor.full_name} has received your request. You can review response progress anytime in your Student Dashboard.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendMentorship} className="space-y-4">
                <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
                  <span className="text-slate-500 block">Mentor Clinician:</span>
                  <span className="font-bold text-brand-navy text-sm block">{selectedMentor.full_name}</span>
                  <span className="text-teal-700">{selectedMentor.specialization} • {selectedMentor.clinic_institution || selectedMentor.state}</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    What are your primary clinical learning goals? *
                  </label>
                  <input
                    type="text"
                    required
                    value={mentorshipGoals}
                    onChange={(e) => setMentorshipGoals(e.target.value)}
                    placeholder="e.g. Chronic dermatological case taking and rubric synthesis"
                    className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Introduction & Note to Doctor *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={mentorshipMessage}
                    onChange={(e) => setMentorshipMessage(e.target.value)}
                    placeholder="Explain your academic year, college, and what clinical guidance you are looking for..."
                    className="w-full p-3 text-xs border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500/20 leading-relaxed"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedMentor(null)}
                    className="px-4 py-2 border rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow transition cursor-pointer"
                  >
                    Send Mentorship Request
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <ConnectDialog
        target={connectTarget && {
          name: connectTarget.display_name || connectTarget.full_name,
          avatar: connectTarget.avatar_url,
          subtitle: [connectTarget.qualification, connectTarget.city || connectTarget.state].filter((x) => x && x !== 'Not specified').join(' · ')
        }}
        onClose={() => setConnectTarget(null)}
        onSend={sendRequest}
      />
    </div>
  );
};
