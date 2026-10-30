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
  Stethoscope, 
  GraduationCap, 
  Microscope,
  BookOpen
} from 'lucide-react';

const STATES = [
  'Andhra Pradesh', 'Assam', 'Bihar', 'Delhi', 'Gujarat', 'Haryana', 
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Odisha', 
  'Punjab', 'Rajasthan', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 
  'West Bengal', 'Other'
];

export const ApplyPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser, isVerifiedMember, loading: authLoading } = useAuth();

  // Step 1: Account Type Selection
  const initialRole = (searchParams.get('role') as AccountType) || 'doctor';
  const [accountType, setAccountType] = useState<AccountType>(
    ['doctor', 'student', 'researcher'].includes(initialRole) ? initialRole : 'doctor'
  );

  useEffect(() => {
    const roleParam = searchParams.get('role') as AccountType;
    if (roleParam && ['doctor', 'student', 'researcher'].includes(roleParam)) {
      setAccountType(roleParam);
    }
  }, [searchParams]);

  // Verified members who open the form without choosing a type go to their
  // dashboard; with ?role= they are applying for a (new) account type.
  useEffect(() => {
    if (currentUser && isVerifiedMember && !searchParams.get('role')) {
      navigate('/dashboard', { replace: true });
    }
  }, [currentUser, isVerifiedMember, searchParams]);

  // Common fields (name and email prefilled from the account)
  const [fullName, setFullName] = useState(currentUser?.full_name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState('+91 ');
  const [state, setState] = useState('Maharashtra');
  const [city, setCity] = useState('');

  useEffect(() => {
    if (!currentUser) return;
    setFullName((v) => v || currentUser.full_name || '');
    setEmail((v) => v || currentUser.email || '');
  }, [currentUser]);

  // Doctor
  const [doctorQualification, setDoctorQualification] = useState('BHMS');
  const [clinic, setClinic] = useState('');
  const [experienceYears, setExperienceYears] = useState(0);
  const [specialization, setSpecialization] = useState('');

  // Student
  const [studentInstitution, setStudentInstitution] = useState('');

  // Researcher
  const [researcherQualification, setResearcherQualification] = useState('');
  const [researchInstitution, setResearchInstitution] = useState('');
  const [researchInterests, setResearchInterests] = useState('');

  const [documentName, setDocumentName] = useState('');
  const [selectedDocFile, setSelectedDocFile] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentUser?.id) return setError('Please sign in first to apply.');
    if (!fullName.trim()) return setError('Please enter your name.');
    if (!email.trim() || !email.includes('@')) return setError('Please enter a valid email.');
    if (!phone.trim() || phone.trim() === '+91') return setError('Please enter your mobile number.');
    if (!city.trim()) return setError('Please enter your city.');
    if (!consent) return setError('Please confirm your details and accept the community rules.');

    if (accountType === 'doctor') {
      if (!selectedDocFile) return setError('Please upload your degree certificate.');
    } else if (accountType === 'student') {
      if (!studentInstitution.trim()) return setError('Please enter your college name.');
    } else if (accountType === 'researcher') {
      if (!researchInstitution.trim()) return setError('Please enter your institution.');
    }

    setSubmitting(true);

    try {
      let docPath: string | undefined = undefined;
      if (selectedDocFile) {
        try {
          const uploadRes = await dataService.uploadVerificationDocument(currentUser.id, selectedDocFile);
          docPath = uploadRes.path;
        } catch (uploadErr: any) {
          setError(`Upload failed: ${uploadErr.message || 'storage error'}. Please check the file type and size.`);
          setSubmitting(false);
          return;
        }
      }

      const newApp = await dataService.submitApplication({
        user_id: currentUser.id,
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        role_applied: accountType,
        qualification: accountType === 'doctor'
          ? doctorQualification
          : accountType === 'student'
            ? 'BHMS (Student)'
            : researcherQualification.trim(),
        // Registration numbers are no longer collected; doctors upload their degree instead.
        registration_number: '',
        registration_authority: '',
        state,
        city: city.trim(),
        clinic_institution: accountType === 'doctor'
          ? clinic.trim() || undefined
          : accountType === 'student'
            ? studentInstitution.trim()
            : researchInstitution.trim(),
        experience_years: accountType === 'doctor' ? Number(experienceYears) || 0 : 0,
        specialization: accountType === 'doctor' ? specialization.trim() || undefined : undefined,
        institution: accountType === 'student' ? studentInstitution.trim() : accountType === 'researcher' ? researchInstitution.trim() : undefined,
        research_interests: accountType === 'researcher' ? researchInterests.trim() || undefined : undefined,
        consent_at: new Date().toISOString(),
        document_url: docPath
      });

      if (newApp.status === 'verified') {
        // If automatically approved by platform settings
        navigate('/dashboard', { state: { welcomeMessage: 'Welcome to Homeo Circle!' } });
      } else {
        navigate('/application-status', { 
          state: { 
            justSubmitted: true, 
            app: newApp,
            appId: newApp.id, 
            email: email.trim(),
            fullName: fullName.trim(),
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

  // Applying needs an account: the application and degree are linked to it,
  // and approval updates that member's profile.
  if (authLoading) return null;
  if (!currentUser) {
    const back = { from: { pathname: '/apply', search: `?role=${accountType}` } };
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-card text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-serif font-bold text-brand-navy">Join Homeo Circle</h1>
          <p className="text-sm text-slate-600">
            Create a free account or sign in, then fill a short form to get verified.
          </p>
          <div className="flex flex-col gap-2 pt-2">
            <Link
              to="/login?tab=signup"
              state={back}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand-teal text-white text-sm font-semibold hover:bg-brand-teal-hover transition"
            >
              Create an account <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              state={back}
              className="w-full inline-flex items-center justify-center px-5 py-2.5 rounded-xl ring-1 ring-slate-200 text-sm font-semibold text-brand-navy hover:bg-slate-50 transition"
            >
              I already have an account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Header */}
      <div className="text-center space-y-3 mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200/80 text-[11px] font-bold text-teal-800 uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
          <span>Get verified</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-brand-navy">
          Join Homeo Circle India
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
          Choose who you are and fill a short form. Our team will review it.
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
                  <span className="text-[10px] font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 mt-1 inline-block">
                    Degree upload
                  </span>
                </div>
                <p className="text-[11.5px] text-slate-500 leading-snug">
                  BHMS, MD (Hom) and DHMS practitioners.
                </p>
              </div>
              <div className="pt-2 text-[11px] font-semibold text-teal-700">
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
                  <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 mt-1 inline-block">
                    College name only
                  </span>
                </div>
                <p className="text-[11.5px] text-slate-500 leading-snug">
                  BHMS students and interns.
                </p>
              </div>
              <div className="pt-2 text-[11px] font-semibold text-teal-700">
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
                  <span className="text-[10px] font-semibold text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 mt-1 inline-block">
                    Institution
                  </span>
                </div>
                <p className="text-[11.5px] text-slate-500 leading-snug">
                  Faculty and research scholars.
                </p>
              </div>
              <div className="pt-2 text-[11px] font-semibold text-teal-700">
                {accountType === 'researcher' ? '✓ Selected' : 'Select'}
              </div>
            </div>

          </div>
        </div>

        {/* Step 2: Role-Specific Application Form */}
        <form onSubmit={handleSubmit} className="space-y-6 pt-4 border-t border-slate-100">
          
          {/* Section: Basic details */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-brand-navy uppercase tracking-wider pb-1 border-b border-slate-100">
              1. Your details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{accountType === 'student' ? 'Student name *' : 'Full name *'}</label>
                <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Ananya Sharma" className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email *</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile number *</label>
                <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">State *</label>
                <select value={state} onChange={(e) => setState(e.target.value)} className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none bg-white">
                  {STATES.map(st => <option key={st} value={st}>{st}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">{accountType === 'student' ? 'City where you live *' : 'City *'}</label>
                <input type="text" required value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Pune" className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none" />
              </div>
            </div>
          </div>

          {accountType === 'doctor' && (
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-bold text-brand-navy uppercase tracking-wider pb-1 border-b border-slate-100 flex items-center gap-1.5">
                <Stethoscope className="w-4 h-4 text-teal-600" />
                <span>2. Degree</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Degree *</label>
                  <select value={doctorQualification} onChange={(e) => setDoctorQualification(e.target.value)} className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none bg-white">
                    <option value="BHMS">BHMS</option>
                    <option value="MD (Hom)">MD (Hom)</option>
                    <option value="DHMS">DHMS</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Years of experience</label>
                  <input type="number" min="0" max="60" value={experienceYears} onChange={(e) => setExperienceYears(Number(e.target.value))} className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Specialization</label>
                  <input type="text" value={specialization} onChange={(e) => setSpecialization(e.target.value)} placeholder="e.g. Pediatrics" className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Clinic / hospital</label>
                  <input type="text" value={clinic} onChange={(e) => setClinic(e.target.value)} placeholder="e.g. Samyak Homeopathy Center" className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none" />
                </div>
              </div>
            </div>
          )}

          {accountType === 'student' && (
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-bold text-brand-navy uppercase tracking-wider pb-1 border-b border-slate-100 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-emerald-600" />
                <span>2. College</span>
              </h3>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">College name *</label>
                <input type="text" required value={studentInstitution} onChange={(e) => setStudentInstitution(e.target.value)} placeholder="e.g. Nehru Homoeopathic Medical College, New Delhi" className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none" />
              </div>
            </div>
          )}

          {accountType === 'researcher' && (
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-bold text-brand-navy uppercase tracking-wider pb-1 border-b border-slate-100 flex items-center gap-1.5">
                <Microscope className="w-4 h-4 text-sky-600" />
                <span>2. Research</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Highest qualification *</label>
                  <input type="text" required value={researcherQualification} onChange={(e) => setResearcherQualification(e.target.value)} placeholder="e.g. MD (Hom), Ph.D." className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Institution *</label>
                  <input type="text" required value={researchInstitution} onChange={(e) => setResearchInstitution(e.target.value)} placeholder="e.g. National Institute of Homoeopathy" className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Research areas</label>
                  <input type="text" value={researchInterests} onChange={(e) => setResearchInterests(e.target.value)} placeholder="e.g. Clinical trials" className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none" />
                </div>
              </div>
            </div>
          )}

          {/* Degree upload (doctors: required; researchers: optional; students: none) */}
          {accountType !== 'student' && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
              <label className="block text-xs font-semibold text-brand-navy">
                {accountType === 'doctor' ? 'Upload your degree certificate *' : 'Upload your degree or institution ID (optional)'}
              </label>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    setSelectedDocFile(file || null);
                    setDocumentName(file?.name || '');
                  }}
                  className="text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 cursor-pointer"
                />
                {documentName && (
                  <span className="text-xs text-teal-800 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                    <span>{documentName}</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">PDF, JPG or PNG, up to 10 MB. Only our verification team can see it.</p>
            </div>
          )}

          <label className="flex items-start gap-3 p-3.5 bg-teal-50/40 rounded-xl border border-teal-200/70 cursor-pointer">
            <input
              type="checkbox"
              required
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4 mt-0.5 cursor-pointer"
            />
            <span className="text-xs text-slate-700 font-medium leading-snug">
              My details are correct, and I agree to the{' '}
              <Link to="/community-rules" className="text-teal-700 underline">community rules</Link>.
            </span>
          </label>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 bg-[#0D817B] hover:bg-[#096e69] text-white rounded-xl text-xs sm:text-sm font-semibold shadow transition disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? <span>Submitting…</span> : (<><span>Submit for verification</span><ArrowRight className="w-4 h-4" /></>)}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
