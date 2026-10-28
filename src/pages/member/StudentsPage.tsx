import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
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
import { useToast } from '../../components/feedback/ToastProvider';

export const StudentsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const toast = useToast();
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
        const isNotStudent = m.role !== 'student' && m.role !== 'applicant' && m.role !== 'public';
        const isEligibleRole = m.role === 'doctor' || m.role === 'researcher' || m.role === 'member' || m.role === 'admin' || m.role === 'super_admin';
        const isNotSuspended = m.status !== 'suspended';
        return isNotStudent && isEligibleRole && isNotSuspended;
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
      toast.error(err.message || 'Failed to send mentorship request.');
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

  const handleConnect = async (targetMember: UserProfile) => {
    if (!currentUser) return;
    try {
      await dataService.sendConnectionRequest(currentUser, targetMember);
      setActionFeedback(`Connection request sent to ${targetMember.display_name || targetMember.full_name}. Real-time in-app notification delivered!`);
      setTimeout(() => setActionFeedback(null), 5000);
      const updatedConns = await dataService.getConnectionRequests();
      setConnectionRequests(updatedConns);
    } catch (err: any) {
      toast.error(err.message || 'Failed to send connection request.');
    }
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

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0F2836] via-[#133E4D] to-[#0A4D54] rounded-3xl p-6 sm:p-8 text-white shadow-card relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-600/60 text-emerald-300 text-xs font-semibold">
            <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
            <span>Dedicated Student Corner & Clinical Mentorship</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight">
            Bridging Homoeopathic Education & Clinical Mastery
          </h1>

          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
            Welcome to Homeo Circle’s student hub. Discover verified doctor mentors, access classic Materia Medica and Repertory study aids, join student CMEs, and find clinical internships.
          </p>

          <div className="pt-2 flex flex-wrap gap-2.5">
            <button
              onClick={() => { setActiveTab('mentors'); setSearchParams({ tab: 'mentors' }); }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow transition cursor-pointer"
            >
              <HeartHandshake className="w-3.5 h-3.5" />
              <span>Find Clinical Mentors</span>
            </button>
          </div>
        </div>

        {/* Constellation decoration */}
        <div className="absolute right-0 bottom-0 opacity-15 pointer-events-none">
          <GraduationCap className="w-64 h-64 text-white -mr-10 -mb-10" />
        </div>
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

      {/* Navigation Tabs (Strictly "Discover Mentors" without hardcoded count) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-brand-border/70 scrollbar-none">
        {[
          { id: 'overview', label: 'My Student Dashboard', icon: GraduationCap },
          { id: 'mentors', label: 'Discover Mentors', icon: HeartHandshake },
          { id: 'resources', label: 'Study Aids & Rubrics', icon: BookOpen },
          { id: 'events', label: 'Student Webinars & CMEs', icon: Calendar },
          { id: 'internships', label: 'Internships & Clerkships', icon: Briefcase },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id as any); setSearchParams({ tab: tab.id }); }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === tab.id
                ? 'bg-teal-700 text-white shadow-2xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-brand-border'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ────────────────── 1. STUDENT DASHBOARD OVERVIEW ────────────────── */}
      {activeTab === 'overview' && (
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
                      {currentUser?.full_name || 'Rahul Verma'}
                    </h2>
                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Student Member
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {currentUser?.qualification || 'Final Year BHMS'} • {currentUser?.institution || currentUser?.clinic_institution || 'Nehru Homoeopathic Medical College, Delhi'}
                  </p>
                </div>
              </div>

              <Link
                to="/profile"
                className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-brand-navy rounded-xl text-xs font-semibold border border-slate-200 transition text-center"
              >
                Update Student Profile
              </Link>
            </div>

            {/* Mentorship Focus Summary */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-brand-navy uppercase tracking-wider block">
                My Learning & Mentorship Focus:
              </span>
              <div className="flex flex-wrap gap-2">
                {(currentUser?.mentorship_needs || ['Acute Case Taking', 'Repertorization of Chronic Pathology', 'Clinical Practice Setup']).map(item => (
                  <span key={item} className="px-3 py-1 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-medium border border-emerald-200">
                    ✓ {item}
                  </span>
                ))}
              </div>
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
                onClick={() => { setActiveTab('mentors'); setSearchParams({ tab: 'mentors' }); }}
                className="text-xs font-semibold text-brand-teal hover:underline cursor-pointer"
              >
                Discover New Mentors &rarr;
              </button>
            </div>

            {myMentorshipRequests.length === 0 ? (
              <div className="text-center py-6 space-y-2">
                <p className="text-xs text-slate-500">You haven’t submitted any clinical mentorship requests yet.</p>
                <button
                  onClick={() => { setActiveTab('mentors'); setSearchParams({ tab: 'mentors' }); }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs transition"
                >
                  Browse Eligible Clinician Mentors
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
                        <p className="text-xs text-teal-700 font-medium">{req.mentor_specialization}</p>
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

          {/* Quick Links Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div 
              onClick={() => { setActiveTab('resources'); setSearchParams({ tab: 'resources' }); }}
              className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-teal-400 hover:shadow-xs cursor-pointer transition space-y-2"
            >
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-brand-navy">Study Aids & Rubrics</h4>
              <p className="text-xs text-slate-500">Classic Boenninghausen Concordance index and Organon aphorism analysis.</p>
            </div>

            <div 
              onClick={() => { setActiveTab('events'); setSearchParams({ tab: 'events' }); }}
              className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-teal-400 hover:shadow-xs cursor-pointer transition space-y-2"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-brand-navy">Student CMEs & Webinars</h4>
              <p className="text-xs text-slate-500">Live clinical case-taking sessions tailored for BHMS interns.</p>
            </div>

            <div 
              onClick={() => { setActiveTab('internships'); setSearchParams({ tab: 'internships' }); }}
              className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-teal-400 hover:shadow-xs cursor-pointer transition space-y-2"
            >
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                <Briefcase className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-brand-navy">Internships & Fellowships</h4>
              <p className="text-xs text-slate-500">Apply for clinical registry clerkships and hospital OPD attachments.</p>
            </div>
          </div>

        </div>
      )}

      {/* ────────────────── 2. DISCOVER ELIGIBLE MENTORS ────────────────── */}
      {activeTab === 'mentors' && (
        <div className="space-y-6">
          
          {/* Search & Multi-Filter Control Box */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-card space-y-4">
            
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                value={mentorSearch}
                onChange={(e) => setMentorSearch(e.target.value)}
                placeholder="Search mentors by name, specialty, degree, city, or clinical interests..."
                className="w-full pl-9 pr-9 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 text-slate-800 font-medium"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              {mentorSearch && (
                <button
                  onClick={() => setMentorSearch('')}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Dropdowns Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              
              {/* Specialization Filter */}
              <div>
                <label className="block text-[11px] uppercase font-bold text-slate-400 mb-1">
                  Specialization Focus
                </label>
                <select
                  value={selectedSpec}
                  onChange={(e) => setSelectedSpec(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-xl outline-none text-slate-700 font-medium focus:border-teal-600"
                >
                  {specializationOptions.map(spec => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </select>
              </div>

              {/* State Filter */}
              <div>
                <label className="block text-[11px] uppercase font-bold text-slate-400 mb-1">
                  State / Council
                </label>
                <select
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-xl outline-none text-slate-700 font-medium focus:border-teal-600"
                >
                  {stateOptions.map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              {/* Verification Status Filter */}
              <div>
                <label className="block text-[11px] uppercase font-bold text-slate-400 mb-1">
                  Verification Status
                </label>
                <select
                  value={selectedVerification}
                  onChange={(e) => setSelectedVerification(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-xl outline-none text-slate-700 font-medium focus:border-teal-600"
                >
                  <option value="All">All Registered Practitioners</option>
                  <option value="Verified Only">Verified Council Record Only</option>
                </select>
              </div>

              {/* Mentorship Availability Filter */}
              <div>
                <label className="block text-[11px] uppercase font-bold text-slate-400 mb-1">
                  Mentorship Status
                </label>
                <button
                  type="button"
                  onClick={() => setOnlyAcceptingMentorship(prev => !prev)}
                  className={`w-full px-2.5 py-1.5 text-xs font-semibold rounded-xl border transition flex items-center justify-between ${
                    onlyAcceptingMentorship 
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span>Accepting Mentees</span>
                  <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[11px] ${
                    onlyAcceptingMentorship ? 'bg-emerald-600 text-white' : 'border border-slate-300'
                  }`}>
                    {onlyAcceptingMentorship ? '✓' : ''}
                  </span>
                </button>
              </div>

            </div>

            {/* Results counter and reset */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <span className="text-slate-500">
                Found <strong className="text-brand-navy">{filteredMentors.length}</strong> eligible clinician & educator mentors
              </span>
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="text-teal-700 hover:text-teal-900 font-semibold text-xs flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Reset Filters</span>
                </button>
              )}
            </div>

          </div>

          {/* Mentors Directory Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs animate-pulse space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-slate-200" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-4 bg-slate-200 rounded w-2/3" />
                      <div className="h-3 bg-slate-100 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="h-16 bg-slate-50 rounded-xl" />
                  <div className="h-8 bg-slate-100 rounded-xl" />
                </div>
              ))}
            </div>
          ) : filteredMentors.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
              <HeartHandshake className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-brand-navy">
                {hasActiveFilters ? 'No mentors match your selected filters' : 'No eligible mentors currently available'}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                {hasActiveFilters
                  ? 'Try expanding your search parameters or clearing location and specialty filters to view all registered clinicians.'
                  : 'Platform doctors and academic researchers will appear here as practitioner registrations are verified.'}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 bg-teal-700 text-white rounded-xl text-xs font-semibold shadow transition cursor-pointer"
                >
                  View All Available Mentors
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredMentors.slice(0, visibleCount).map((mentor) => {
                  const connStatus = getConnectionStatus(mentor.id);
                  const isVerified = mentor.status === 'verified' || mentor.verification_status === 'verified';
                  const isSelf = currentUser?.id === mentor.id;

                  return (
                    <div
                      key={mentor.id}
                      className="bg-white rounded-3xl p-5 border border-slate-200 shadow-subtle hover:shadow-card hover:border-emerald-300 transition flex flex-col justify-between space-y-4 group"
                    >
                      <div className="space-y-3.5">
                        
                        {/* Avatar & Badges */}
                        <div className="flex items-start justify-between">
                          <Avatar 
                            name={mentor.full_name} 
                            src={mentor.avatar_url} 
                            size="lg" 
                            verified={isVerified} 
                          />
                          <div className="flex flex-col items-end gap-1">
                            {mentor.mentorship_available !== false ? (
                              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                                ✓ Accepting Mentees
                              </span>
                            ) : (
                              <span className="text-[11px] font-semibold text-slate-600 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200">
                                Practitioner
                              </span>
                            )}
                            {isVerified && (
                              <span className="text-[10.5px] font-bold text-teal-800 bg-teal-50/80 px-2 py-0.5 rounded border border-teal-200">
                                Verified Council
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Practitioner Name & Degree */}
                        <div>
                          <Link 
                            to={`/members/${mentor.id}`} 
                            className="text-base font-bold text-brand-navy group-hover:text-teal-700 transition block leading-snug"
                          >
                            {mentor.full_name}
                          </Link>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">
                            {mentor.qualification} • {mentor.experience_years ? `${mentor.experience_years} Years Practice` : 'Experienced Practitioner'}
                          </p>
                        </div>

                        {/* Location & Specialty Box */}
                        <div className="p-3 bg-slate-50 rounded-2xl text-xs space-y-1.5 border border-slate-100">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] uppercase font-bold text-slate-400">Specialty</span>
                            <span className="font-semibold text-brand-navy truncate max-w-[160px]">
                              {mentor.specialization || 'Classical Homoeopathy'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                            <span className="text-[11px] uppercase font-bold text-slate-400">Location</span>
                            <span className="text-slate-600 truncate max-w-[160px] flex items-center gap-1 text-xs">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {mentor.city ? `${mentor.city}, ${mentor.state}` : mentor.state}
                            </span>
                          </div>

                          {mentor.registration_number && (
                            <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-xs">
                              <span className="text-[11px] uppercase font-bold text-slate-400">Council</span>
                              <span className="font-mono text-teal-900 font-semibold truncate max-w-[160px]">
                                {mentor.registration_number}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Bio Excerpt */}
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                          {mentor.bio || 'Consultant clinician and academic educator dedicated to mentoring BHMS candidates in clinical case repertorization and acute posology.'}
                        </p>

                        {/* Interests / Inquiries Tags */}
                        {mentor.interests && mentor.interests.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-0.5">
                            {mentor.interests.slice(0, 3).map(interest => (
                              <span key={interest} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-medium">
                                #{interest}
                              </span>
                            ))}
                          </div>
                        )}

                      </div>

                      {/* Action Buttons */}
                      <div className="pt-3 border-t border-slate-100 space-y-2">
                        <div className="flex items-center gap-2">
                          
                          {/* 1. Request Mentorship Button */}
                          <button
                            onClick={() => setSelectedMentor(mentor)}
                            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                          >
                            <HeartHandshake className="w-3.5 h-3.5" />
                            <span>Request Mentorship</span>
                          </button>

                          {/* 2. View Profile Button */}
                          <Link
                            to={`/members/${mentor.id}`}
                            className="py-2 px-3 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                          >
                            Profile
                          </Link>
                        </div>

                        {/* 3. Connect Button */}
                        {!isSelf && (
                          <div>
                            {connStatus === 'none' && (
                              <button
                                onClick={() => handleConnect(mentor)}
                                className="w-full py-1.5 px-3 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-xl text-xs font-semibold border border-teal-200/80 transition flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <UserPlus className="w-3.5 h-3.5" />
                                <span>Connect on Network</span>
                              </button>
                            )}

                            {connStatus === 'pending_sent' && (
                              <div className="flex items-center justify-between p-1.5 px-3 bg-amber-50 rounded-xl border border-amber-200 text-xs">
                                <span className="text-xs font-semibold text-amber-800 flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> Request Sent
                                </span>
                                <button
                                  onClick={() => handleCancelConnection(mentor.id)}
                                  className="text-[11px] font-semibold text-slate-500 hover:text-rose-600 underline"
                                >
                                  Cancel
                                </button>
                              </div>
                            )}

                            {connStatus === 'connected' && (
                              <div className="w-full py-1.5 px-3 bg-teal-50 rounded-xl border border-teal-200 text-xs text-center text-teal-800 font-semibold flex items-center justify-center gap-1">
                                <Check className="w-3.5 h-3.5 text-teal-600" />
                                <span>Connected Peer</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>

              {/* Incremental Loading / Pagination */}
              {filteredMentors.length > visibleCount && (
                <div className="pt-2 text-center">
                  <button
                    onClick={() => setVisibleCount(prev => prev + 6)}
                    className="px-6 py-2.5 bg-white border border-slate-200 hover:border-teal-400 text-brand-navy rounded-xl text-xs font-semibold shadow-xs hover:shadow-card transition cursor-pointer"
                  >
                    Load More Mentors ({filteredMentors.length - visibleCount} remaining)
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* ────────────────── 3. STUDY AIDS & RESOURCES ────────────────── */}
      {activeTab === 'resources' && (
        <div className="space-y-4">
          <div className="p-4 bg-teal-50 rounded-2xl border border-teal-200 text-xs text-teal-900 leading-relaxed">
            <strong>Academic Reference Note:</strong> Educational study guides are compiled for academic inquiry and Materia Medica study circles. They adhere to classic homoeopathic literature and do not substitute for individual faculty instruction.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {educationalResources.map((res) => (
              <div key={res.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:shadow-card transition space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                      {res.content_type}
                    </span>
                    <span className="text-xs text-slate-400">{res.published_at}</span>
                  </div>

                  <h3 className="text-base font-bold text-brand-navy leading-snug">
                    {res.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                    {res.summary}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 italic">{res.journal}</span>
                  <a
                    href={res.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-teal-700 font-semibold hover:underline"
                  >
                    <span>Read Study Guide</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ────────────────── 4. STUDENT WEBINARS & EVENTS ────────────────── */}
      {activeTab === 'events' && (
        <div className="space-y-4">
          {studentEvents.map((evt) => (
            <div key={evt.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl bg-[#0F1E36] text-white flex flex-col items-center justify-center flex-shrink-0 text-center shadow-xs">
                  <span className="text-xl font-bold leading-none">{evt.date_badge_day}</span>
                  <span className="text-[11px] uppercase tracking-wider font-semibold text-teal-300 mt-0.5">
                    {evt.date_badge_month}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    {evt.format}
                  </span>
                  <h3 className="text-sm sm:text-base font-bold text-brand-navy">{evt.title}</h3>
                  <p className="text-xs text-slate-500">Faculty: {evt.speaker} • {evt.time_display}</p>
                </div>
              </div>

              <Link
                to="/events"
                className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-xl transition"
              >
                Register on Events Page &rarr;
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* ────────────────── 5. INTERNSHIPS & CLERKSHIPS ────────────────── */}
      {activeTab === 'internships' && (
        <div className="space-y-4">
          {studentOpportunities.map((opp) => (
            <div key={opp.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center flex-shrink-0">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-brand-navy">{opp.title}</h3>
                    <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                      {opp.type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">{opp.organization} • {opp.location}</p>
                  <p className="text-xs text-slate-500 italic">{opp.eligibility}</p>
                </div>
              </div>

              <Link
                to="/opportunities"
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-brand-navy text-xs font-semibold rounded-xl transition"
              >
                View Opportunity &rarr;
              </Link>
            </div>
          ))}
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

    </div>
  );
};
