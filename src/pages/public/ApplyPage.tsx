import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dataService } from '../../lib/supabase';
import { AccountType } from '../../types';
import { 
  ShieldCheck, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  FileText, 
  Stethoscope, 
  GraduationCap, 
  Microscope,
  HelpCircle,
  Building2,
  BookOpen
} from 'lucide-react';

const AUTHORITIES = [
  'National Commission for Homoeopathy (Central Register)',
  'Maharashtra Council of Homoeopathy, Mumbai',
  'Delhi Homoeopathic Board',
  'Karnataka Board of Homoeopathic System of Medicine',
  'Council of Homoeopathic System of Medicine, Gujarat',
  'Homoeopathic Medicine Board, Uttar Pradesh',
  'West Bengal Council of Homoeopathy',
  'Kerala State Medical Council (Homoeopathy)',
  'Telangana State Homoeopathic Board',
  'Tamil Nadu Homoeopathy Medical Council',
  'Punjab Homoeopathic Council',
  'Rajasthan Homoeopathic Medical Board',
  'Bihar State Board of Homoeopathic Medicine',
  'Other Statutory State Homoeopathic Council'
];

const STATES = [
  'Andhra Pradesh', 'Assam', 'Bihar', 'Delhi', 'Gujarat', 'Haryana', 
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Odisha', 
  'Punjab', 'Rajasthan', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 
  'West Bengal', 'Other'
];

const STUDENT_MENTORSHIP_OPTIONS = [
  'Acute & Emergency Case Taking',
  'Chronic Pathology & Repertorization',
  'Materia Medica Rubric Differentiation',
  'Posology & Potency Selection in OPD',
  'Modern Clinic Setup & Record Keeping',
  'Research Methodology & Clinical Trials'
];

export const ApplyPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser, loginAs } = useAuth();

  // Step 1: Account Type Selection
  const initialRole = (searchParams.get('role') as AccountType) || 'doctor';
  const [accountType, setAccountType] = useState<AccountType>(
    ['doctor', 'student', 'researcher'].includes(initialRole) ? initialRole : 'doctor'
  );

  // Common Fields
  const [fullName, setFullName] = useState(currentUser?.full_name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState('+91 ');
  const [state, setState] = useState('Maharashtra');
  const [city, setCity] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Doctor Fields
  const [doctorQualification, setDoctorQualification] = useState('BHMS');
  const [regNumber, setRegNumber] = useState('');
  const [authority, setAuthority] = useState(AUTHORITIES[0]);
  const [clinic, setClinic] = useState('');
  const [experienceYears, setExperienceYears] = useState(5);
  const [specialization, setSpecialization] = useState('Clinical Practice');
  const [doctorBio, setDoctorBio] = useState('');
  const [mentorshipAvailable, setMentorshipAvailable] = useState(true);

  // Student Fields
  const [studentInstitution, setStudentInstitution] = useState('');
  const [courseYear, setCourseYear] = useState('3rd Year BHMS');
  const [selectedMentorshipNeeds, setSelectedMentorshipNeeds] = useState<string[]>([
    'Acute & Emergency Case Taking',
    'Chronic Pathology & Repertorization'
  ]);
  const [studentInterests, setStudentInterests] = useState('Boenninghausen Method, Materia Medica');

  // Researcher Fields
  const [researcherQualification, setResearcherQualification] = useState('MD (Hom)');
  const [researchInstitution, setResearchInstitution] = useState('');
  const [researchInterests, setResearchInterests] = useState('Clinical Trials, High Dilutions, Cytokine Modulation');
  const [publications, setPublications] = useState('');
  const [teachingInterests, setTeachingInterests] = useState('Research Methodology, Organon of Medicine');
  const [orcidId, setOrcidId] = useState('');

  // Submission State
  const [documentName, setDocumentName] = useState('');
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleMentorshipNeed = (item: string) => {
    setSelectedMentorshipNeeds(prev => 
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) return setError('Please enter your full legal name.');
    if (!email.trim() || !email.includes('@')) return setError('Please provide a valid professional email.');
    if (!phone.trim() || phone.trim() === '+91') return setError('Please provide a valid contact phone number.');
    if (!consent) return setError('You must agree to the Homeo Circle community ethics and data confidentiality rules.');

    if (accountType === 'doctor') {
      if (!regNumber.trim()) return setError('Registration number is required for practitioner statutory verification.');
    } else if (accountType === 'student') {
      if (!studentInstitution.trim()) return setError('Please specify your Homoeopathic Medical College or Institution.');
    } else if (accountType === 'researcher') {
      if (!researchInstitution.trim()) return setError('Please specify your affiliated University, Hospital, or Research Center.');
    }

    setSubmitting(true);

    try {
      const newApp = await dataService.submitApplication({
        user_id: currentUser?.id || 'user-' + Date.now(),
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        role_applied: accountType,
        qualification: accountType === 'doctor' 
          ? doctorQualification 
          : accountType === 'student' 
            ? courseYear 
            : researcherQualification,
        registration_number: accountType === 'doctor' ? regNumber.trim().toUpperCase() : undefined,
        registration_authority: accountType === 'doctor' ? authority : undefined,
        state,
        city: city.trim(),
        clinic_institution: accountType === 'doctor' 
          ? clinic.trim() 
          : accountType === 'student' 
            ? studentInstitution.trim() 
            : researchInstitution.trim(),
        experience_years: accountType === 'doctor' ? Number(experienceYears) : 0,
        specialization: accountType === 'doctor' ? specialization : undefined,
        institution: accountType === 'student' ? studentInstitution.trim() : researchInstitution.trim(),
        course_year: accountType === 'student' ? courseYear : undefined,
        mentorship_needs: accountType === 'student' ? selectedMentorshipNeeds : undefined,
        research_interests: accountType === 'researcher' ? researchInterests : undefined,
        publications: accountType === 'researcher' ? publications : undefined,
        consent_at: new Date().toISOString(),
        document_url: documentName ? `/storage/private/docs/${documentName}` : undefined
      });

      // Demo mode: switch to the demo applicant (no-op when a backend is connected)
      loginAs('applicant');

      if (newApp.status === 'verified') {
        // If automatically approved by platform settings
        navigate('/dashboard', { state: { welcomeMessage: 'Welcome to Homeo Circle!' } });
      } else {
        navigate('/application-status', { 
          state: { 
            justSubmitted: true, 
            appId: newApp.id, 
            regNumber: newApp.registration_number,
            roleApplied: accountType
          } 
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Header */}
      <div className="text-center space-y-3 mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200/80 text-xs font-bold text-teal-800 uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
          <span>Unified Onboarding & Registration</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-brand-navy">
          Join Homeo Circle India
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
          One unified account system for homoeopathic doctors, academic researchers, and medical students across India.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-800 text-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Form Wrapper */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-card space-y-8">
        
        {/* Step 1: “How would you like to join Homeo Circle?” */}
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-bold text-brand-navy">
              How would you like to join Homeo Circle?
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select your membership category to customize your profile, directory listing, and community permissions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* 1. Doctor */}
            <div
              onClick={() => setAccountType('doctor')}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between space-y-3 ${
                accountType === 'doctor'
                  ? 'border-brand-teal bg-teal-50/40 shadow-xs ring-1 ring-brand-teal/20'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="space-y-2.5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  accountType === 'doctor' ? 'bg-brand-teal text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-brand-navy">Doctor / Practitioner</h3>
                  <span className="text-[11px] font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 mt-1 inline-block">
                    Statutory Verification
                  </span>
                </div>
                <p className="text-[13px] text-slate-500 leading-snug">
                  Registered BHMS, MD (Hom), or DHMS practitioners with state or central council credentials.
                </p>
              </div>
              <div className="pt-2 text-xs font-semibold text-teal-700">
                {accountType === 'doctor' ? '✓ Selected' : 'Select'}
              </div>
            </div>

            {/* 2. Student */}
            <div
              onClick={() => setAccountType('student')}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between space-y-3 ${
                accountType === 'student'
                  ? 'border-brand-teal bg-teal-50/40 shadow-xs ring-1 ring-brand-teal/20'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="space-y-2.5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  accountType === 'student' ? 'bg-brand-teal text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-brand-navy">Student / Intern</h3>
                  <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 mt-1 inline-block">
                    Educational Access
                  </span>
                </div>
                <p className="text-[13px] text-slate-500 leading-snug">
                  Undergraduate BHMS students and clinical interns seeking peer learning, study resources, and doctor mentorship.
                </p>
              </div>
              <div className="pt-2 text-xs font-semibold text-teal-700">
                {accountType === 'student' ? '✓ Selected' : 'Select'}
              </div>
            </div>

            {/* 3. Researcher */}
            <div
              onClick={() => setAccountType('researcher')}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between space-y-3 ${
                accountType === 'researcher'
                  ? 'border-brand-teal bg-teal-50/40 shadow-xs ring-1 ring-brand-teal/20'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="space-y-2.5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  accountType === 'researcher' ? 'bg-brand-teal text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  <Microscope className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-brand-navy">Researcher / Educator</h3>
                  <span className="text-[11px] font-semibold text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 mt-1 inline-block">
                    Academic Verification
                  </span>
                </div>
                <p className="text-[13px] text-slate-500 leading-snug">
                  Faculty, clinical trial investigators, and research scholars publishing in high-dilution science.
                </p>
              </div>
              <div className="pt-2 text-xs font-semibold text-teal-700">
                {accountType === 'researcher' ? '✓ Selected' : 'Select'}
              </div>
            </div>

          </div>
        </div>

        {/* Step 2: Role-Specific Application Form */}
        <form onSubmit={handleSubmit} className="space-y-6 pt-4 border-t border-slate-100">
          
          {/* Section: Basic Identity */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-brand-navy uppercase tracking-wider pb-1 border-b border-slate-100">
              1. Basic Contact & Identity
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name (as per Official Records) *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Dr. Ananya Sharma or Rahul Verma"
                  className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="professional.email@domain.com"
                  className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contact Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  State / Jurisdiction *
                </label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none bg-white"
                >
                  {STATES.map(st => <option key={st} value={st}>{st}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  City / Location
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Pune, Bengaluru, New Delhi"
                  className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section: Role-Specific Details */}
          {accountType === 'doctor' && (
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-bold text-brand-navy uppercase tracking-wider pb-1 border-b border-slate-100 flex items-center gap-1.5">
                <Stethoscope className="w-4 h-4 text-teal-600" />
                <span>2. Medical Qualifications & Registration</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Primary Degree / Qualification *
                  </label>
                  <select
                    value={doctorQualification}
                    onChange={(e) => setDoctorQualification(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none bg-white"
                  >
                    <option value="BHMS">BHMS (Bachelor of Homoeopathic Medicine & Surgery)</option>
                    <option value="MD (Hom)">MD (Hom) — Post Graduate</option>
                    <option value="DHMS">DHMS (Diploma)</option>
                    <option value="Other Recognized Degree">Other Recognized Statutory Degree</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Registration Number (Central/State Register) *
                  </label>
                  <input
                    type="text"
                    required
                    value={regNumber}
                    onChange={(e) => setRegNumber(e.target.value)}
                    placeholder="e.g. MCH/2014/5431"
                    className="w-full px-3.5 py-2 text-xs sm:text-sm font-mono border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none uppercase"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Statutory Register Authority *
                  </label>
                  <select
                    value={authority}
                    onChange={(e) => setAuthority(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none bg-white"
                  >
                    {AUTHORITIES.map(auth => <option key={auth} value={auth}>{auth}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Years of Clinical Experience
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Clinical Specialization Focus
                  </label>
                  <input
                    type="text"
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    placeholder="e.g. Autoimmune, Pediatrics, Classical"
                    className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Dispensary, Clinic or Hospital Affiliation
                  </label>
                  <input
                    type="text"
                    value={clinic}
                    onChange={(e) => setClinic(e.target.value)}
                    placeholder="e.g. Samyak Homeopathy Center, Indiranagar"
                    className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Professional Bio
                  </label>
                  <textarea
                    rows={3}
                    value={doctorBio}
                    onChange={(e) => setDoctorBio(e.target.value)}
                    placeholder="Summarize your clinical philosophy, repertorial methodology, and practice areas..."
                    className="w-full p-3 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none"
                  />
                </div>

                <div className="sm:col-span-2 p-3 bg-teal-50/50 rounded-xl border border-teal-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-brand-navy block">Student Mentorship Willingness</span>
                    <span className="text-xs text-slate-500">Allow BHMS interns and final year students to request academic case mentorship from you.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={mentorshipAvailable}
                    onChange={(e) => setMentorshipAvailable(e.target.checked)}
                    className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {accountType === 'student' && (
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-bold text-brand-navy uppercase tracking-wider pb-1 border-b border-slate-100 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-emerald-600" />
                <span>2. Medical College & Learning Needs</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Homoeopathic Medical College / Institution *
                  </label>
                  <input
                    type="text"
                    required
                    value={studentInstitution}
                    onChange={(e) => setStudentInstitution(e.target.value)}
                    placeholder="e.g. Nehru Homoeopathic Medical College & Hospital, New Delhi"
                    className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Course & Academic Year *
                  </label>
                  <select
                    value={courseYear}
                    onChange={(e) => setCourseYear(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none bg-white"
                  >
                    <option value="1st Year BHMS">1st Year BHMS</option>
                    <option value="2nd Year BHMS">2nd Year BHMS</option>
                    <option value="3rd Year BHMS">3rd Year BHMS</option>
                    <option value="Final Year BHMS">Final Year BHMS</option>
                    <option value="Clinical Intern (CRRI)">Clinical Intern (CRRI)</option>
                    <option value="MD (Hom) Post Graduate Resident">MD (Hom) Post Graduate Resident</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Clinical Topics of High Interest
                  </label>
                  <input
                    type="text"
                    value={studentInterests}
                    onChange={(e) => setStudentInterests(e.target.value)}
                    placeholder="e.g. Materia Medica, Organon, Repertory"
                    className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none"
                  />
                </div>

                <div className="sm:col-span-2 space-y-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    What areas do you seek clinical mentorship in? (Select all that apply)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {STUDENT_MENTORSHIP_OPTIONS.map((opt) => (
                      <label 
                        key={opt} 
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer flex items-center gap-2 transition ${
                          selectedMentorshipNeeds.includes(opt)
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold'
                            : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedMentorshipNeeds.includes(opt)}
                          onChange={() => toggleMentorshipNeed(opt)}
                          className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {accountType === 'researcher' && (
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-bold text-brand-navy uppercase tracking-wider pb-1 border-b border-slate-100 flex items-center gap-1.5">
                <Microscope className="w-4 h-4 text-sky-600" />
                <span>2. Research Qualifications & Academic Affiliation</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Highest Academic Qualification *
                  </label>
                  <input
                    type="text"
                    required
                    value={researcherQualification}
                    onChange={(e) => setResearcherQualification(e.target.value)}
                    placeholder="e.g. MD (Hom), Ph.D., M.Sc."
                    className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ORCID ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={orcidId}
                    onChange={(e) => setOrcidId(e.target.value)}
                    placeholder="0000-0002-XXXX-XXXX"
                    className="w-full px-3.5 py-2 text-xs sm:text-sm font-mono border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    University, Hospital, or Research Institution Affiliation *
                  </label>
                  <input
                    type="text"
                    required
                    value={researchInstitution}
                    onChange={(e) => setResearchInstitution(e.target.value)}
                    placeholder="e.g. National Institute of Homoeopathy / Central Council for Research in Homoeopathy"
                    className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Primary Research Areas of Inquiry
                  </label>
                  <input
                    type="text"
                    value={researchInterests}
                    onChange={(e) => setResearchInterests(e.target.value)}
                    placeholder="e.g. Nanopharmacology, Clinical Trial Methodology, Systematic Reviews"
                    className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Key Publications / Journal References (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={publications}
                    onChange={(e) => setPublications(e.target.value)}
                    placeholder="List DOI links or titles of indexed publications..."
                    className="w-full p-3 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Section 3: Statutory Verification & Ethics Declaration */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold text-brand-navy uppercase tracking-wider pb-1 border-b border-slate-100 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>3. Verification & Community Ethics Consent</span>
            </h3>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs text-slate-600 space-y-2 leading-relaxed">
              <p>
                <strong>Community Standard Declaration:</strong> Homeo Circle is an academic, research, and clinical peer community. In compliance with the National Commission for Homoeopathy rules, the DPDP Act 2023, and DISHA medical guidelines:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-xs text-slate-500">
                <li>I confirm that the details provided are accurate and correspond to official records.</li>
                <li>I agree that patient case discussions must be completely de-identified with zero patient identifiers.</li>
                <li>I understand that membership does not constitute a public endorsement of clinical competence.</li>
              </ul>
            </div>

            <label className="flex items-start gap-3 p-3.5 bg-teal-50/40 rounded-xl border border-teal-200/70 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4 mt-0.5 cursor-pointer"
              />
              <span className="text-xs text-slate-700 font-medium leading-snug">
                I agree to the Homeo Circle Community Rules, patient privacy compliance, and statutory verification checks.
              </span>
            </label>
          </div>

          {/* Submit Action */}
          <div className="pt-4 flex items-center justify-between">
            <Link
              to="/login"
              className="text-xs font-semibold text-slate-500 hover:text-brand-navy"
            >
              Already have an account? Sign in
            </Link>

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 bg-[#0D817B] hover:bg-[#096e69] text-white rounded-xl text-xs sm:text-sm font-semibold shadow transition disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? (
                <span>Submitting Registration...</span>
              ) : (
                <>
                  <span>Complete Registration</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
