import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dataService } from '../../lib/supabase';
import { AccountType } from '../../types';
import { MEMBERSHIP_CATEGORIES, categoryOf, INDEPENDENCE_DISCLAIMER } from '../../lib/membership';
import { ShieldCheck, CheckCircle2, AlertCircle, ArrowRight, Stethoscope, GraduationCap, Microscope, Hospital, Award, Info } from 'lucide-react';

const STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh',
  'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha',
  'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir',
  'Ladakh', 'Lakshadweep', 'Puducherry', 'Outside India',
];

const ICONS: Record<AccountType, React.ElementType> = {
  doctor: Stethoscope, student: GraduationCap, intern: Hospital, graduate: Award, researcher: Microscope,
};

const DOC_LABEL: Record<AccountType, string> = {
  doctor: 'Registration certificate (or degree certificate if you do not have it to hand)',
  student: 'Student ID card or bonafide certificate from your college',
  intern: 'Internship letter or internship ID',
  graduate: 'Degree or provisional certificate',
  researcher: 'Institution ID, appointment letter or a document showing your academic role',
};

const DECLARATION: Record<AccountType, string> = {
  doctor: 'I am registered to practise homoeopathy with the authority named above, and the registration details I have given are true.',
  student: 'I am currently a BHMS student. I understand that I am not a registered practitioner and will not present myself as one on Homeo India.',
  intern: 'I am currently an intern. I understand that internship does not make me a registered practitioner and that I practise only under supervision.',
  graduate: 'I hold the qualification given above. I understand that I will not be shown as a registered practitioner until my registration is verified.',
  researcher: 'I work in homoeopathy academics or research as described above. I will not present myself as a registered practitioner unless I am one.',
};

const input = 'w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none bg-white';
const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label className="block text-xs font-semibold text-slate-700 mb-1">{children}</label>
);

export const ApplyPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser, isVerifiedMember, loading: authLoading } = useAuth();

  const isCategory = (v: string | null): v is AccountType => MEMBERSHIP_CATEGORIES.some((c) => c.value === v);
  const roleParam = searchParams.get('role');
  const [accountType, setAccountType] = useState<AccountType>(isCategory(roleParam) ? roleParam : 'doctor');

  useEffect(() => {
    const r = searchParams.get('role');
    if (isCategory(r)) setAccountType(r);
  }, [searchParams]);

  useEffect(() => {
    if (currentUser && isVerifiedMember && !searchParams.get('role')) navigate('/dashboard', { replace: true });
  }, [currentUser, isVerifiedMember, searchParams, navigate]);

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

  // Practitioner / graduate
  const [qualification, setQualification] = useState('BHMS');
  const [regNumber, setRegNumber] = useState('');
  const [regAuthority, setRegAuthority] = useState('');
  const [experienceYears, setExperienceYears] = useState(0);
  const [specialization, setSpecialization] = useState('');
  const [clinic, setClinic] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  const [regStatusDeclared, setRegStatusDeclared] = useState('Applied — awaiting registration');
  // Student / intern
  const [college, setCollege] = useState('');
  const [courseYear, setCourseYear] = useState('1st year');
  const [internship, setInternship] = useState('');
  // Academic
  const [institution, setInstitution] = useState('');
  const [academicRole, setAcademicRole] = useState('');
  const [researchInterests, setResearchInterests] = useState('');

  const [docFile, setDocFile] = useState<File | null>(null);
  const [adult, setAdult] = useState(false);
  const [declared, setDeclared] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cat = categoryOf(accountType)!;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!currentUser?.id) return setError('Please sign in first to apply.');
    if (!fullName.trim()) return setError('Please enter your full name.');
    if (!email.trim() || !email.includes('@')) return setError('Please enter a valid email.');
    if (!phone.trim() || phone.trim() === '+91') return setError('Please enter your mobile number.');
    if (!city.trim()) return setError('Please enter your city.');
    if (accountType === 'doctor' && (!regNumber.trim() || !regAuthority.trim()))
      return setError('Please enter your registration number and the council or authority you are registered with.');
    if ((accountType === 'student' || accountType === 'intern') && !college.trim()) return setError('Please enter your college name.');
    if (accountType === 'intern' && !internship.trim()) return setError('Please enter your internship hospital and period.');
    if (accountType === 'graduate' && !graduationYear.trim()) return setError('Please enter your year of passing.');
    if (accountType === 'researcher' && (!institution.trim() || !academicRole.trim()))
      return setError('Please enter your institution and your academic or research role.');
    if (!docFile) return setError(`Please upload: ${DOC_LABEL[accountType]}.`);
    if (!adult) return setError('Membership is open to people aged 18 or over.');
    if (!declared) return setError('Please confirm the declaration for your membership category.');
    if (!accepted) return setError('Please accept the Terms of Use and confirm you have read the Privacy Policy.');

    setSubmitting(true);
    try {
      let docPath: string | undefined;
      try {
        docPath = (await dataService.uploadVerificationDocument(currentUser.id, docFile)).path;
      } catch (uploadErr: any) {
        setError(`Upload failed: ${uploadErr.message || 'storage error'}. Use a PDF, JPG or PNG under 10 MB.`);
        setSubmitting(false);
        return;
      }

      const isStudentLike = accountType === 'student' || accountType === 'intern';
      const newApp = await dataService.submitApplication({
        user_id: currentUser.id,
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        role_applied: accountType,
        qualification:
          accountType === 'student' ? 'BHMS (student)'
          : accountType === 'intern' ? 'BHMS (intern)'
          : accountType === 'researcher' ? qualification.trim() || 'Not specified'
          : qualification,
        registration_number: accountType === 'doctor' ? regNumber.trim() : '',
        registration_authority: accountType === 'doctor' ? regAuthority.trim() : '',
        registration_status_declared: accountType === 'graduate' ? regStatusDeclared : accountType === 'doctor' ? 'Registered' : undefined,
        state,
        city: city.trim(),
        clinic_institution: accountType === 'doctor' ? clinic.trim() || undefined : isStudentLike ? college.trim() : accountType === 'researcher' ? institution.trim() : undefined,
        experience_years: accountType === 'doctor' ? Number(experienceYears) || 0 : 0,
        specialization: accountType === 'doctor' ? specialization.trim() || undefined : undefined,
        institution: isStudentLike ? college.trim() : accountType === 'researcher' ? institution.trim() : undefined,
        course_year: accountType === 'student' ? courseYear : undefined,
        internship_details: accountType === 'intern' ? internship.trim() : undefined,
        graduation_year: accountType === 'graduate' ? graduationYear.trim() : undefined,
        academic_role: accountType === 'researcher' ? academicRole.trim() : undefined,
        research_interests: accountType === 'researcher' ? researchInterests.trim() || undefined : undefined,
        adult_confirmed: true,
        consent_at: new Date().toISOString(),
        document_url: docPath,
      });

      navigate('/application-status', {
        state: { justSubmitted: true, app: newApp, appId: newApp.id, email: email.trim(), fullName: fullName.trim(), regNumber: newApp.registration_number, roleApplied: accountType },
      });
    } catch (err: any) {
      setError(err.message || 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) return null;
  if (!currentUser) {
    const back = { from: { pathname: '/apply', search: `?role=${accountType}` } };
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-card text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center"><ShieldCheck className="w-6 h-6" /></div>
          <h1 className="text-xl font-serif font-bold text-brand-navy">Join Homeo India</h1>
          <p className="text-sm text-slate-600">Create a free account or sign in, then fill a short form to get verified.</p>
          <div className="flex flex-col gap-2 pt-2">
            <Link to="/login?tab=signup" state={back} className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand-teal text-white text-sm font-semibold hover:bg-brand-teal-hover transition">
              Create an account <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/login" state={back} className="w-full inline-flex items-center justify-center px-5 py-2.5 rounded-xl ring-1 ring-slate-200 text-sm font-semibold text-brand-navy hover:bg-slate-50 transition">
              I already have an account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-center space-y-3 mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200/80 text-[11px] font-bold text-teal-800 uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-600" /><span>Membership verification</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-brand-navy">Join Homeo India</h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
          Choose the category that describes you today. Each category is verified differently — see the{' '}
          <Link to="/verification-policy" className="text-teal-700 underline">Verification Policy</Link>.
        </p>
      </div>

      {error && (
        <div role="alert" className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-800 text-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" /><span>{error}</span>
        </div>
      )}

      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-card space-y-8">
        <div className="space-y-4">
          <h2 className="text-base font-bold text-brand-navy">Your membership category</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {MEMBERSHIP_CATEGORIES.map((c) => {
              const Icon = ICONS[c.value];
              const on = accountType === c.value;
              return (
                <button type="button" key={c.value} onClick={() => setAccountType(c.value)} aria-pressed={on}
                  className={`text-left p-4 rounded-2xl border-2 transition space-y-2 ${on ? 'border-brand-teal bg-teal-50/40 ring-1 ring-brand-teal/20' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${on ? 'bg-brand-teal text-white' : 'bg-slate-100 text-slate-600'}`}><Icon className="w-5 h-5" /></div>
                  <h3 className="text-sm font-bold text-brand-navy">{c.label}</h3>
                  <p className="text-[11.5px] text-slate-500 leading-snug">{c.who}</p>
                  <p className="text-[11px] font-semibold text-teal-700">{on ? '✓ Selected' : 'Select'}</p>
                </button>
              );
            })}
          </div>
          <div className="flex gap-2.5 rounded-xl bg-slate-50 p-3.5 text-[11.5px] text-slate-600 leading-relaxed">
            <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <p><strong className="text-brand-navy">{cat.label}</strong> — you'll need: {cat.needs.join(', ')}.</p>
              <p className="mt-1">Badge after verification: <strong>{cat.badge}</strong>.{' '}
                {accountType !== 'doctor' && 'This category is never shown as a registered practitioner.'}
                {accountType === 'doctor' && 'Shown only once your registration has been checked against registration records.'}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-6 pt-4 border-t border-slate-100">
          <section className="space-y-4">
            <h3 className="text-xs font-bold text-brand-navy uppercase tracking-wider pb-1 border-b border-slate-100">1. Your details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><Label>Full name (as on your documents) *</Label><input className={input} value={fullName} maxLength={120} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Ananya Sharma" /></div>
              <div><Label>Email *</Label><input type="email" className={input} value={email} maxLength={254} onChange={(e) => setEmail(e.target.value)} /></div>
              <div><Label>Mobile number * <span className="font-normal text-slate-400">(never shown publicly)</span></Label><input type="tel" className={input} value={phone} maxLength={20} onChange={(e) => setPhone(e.target.value)} /></div>
              <div><Label>State / UT *</Label><select className={input} value={state} onChange={(e) => setState(e.target.value)}>{STATES.map((s) => <option key={s}>{s}</option>)}</select></div>
              <div className="sm:col-span-2"><Label>City *</Label><input className={input} value={city} maxLength={100} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Pune" /></div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-xs font-bold text-brand-navy uppercase tracking-wider pb-1 border-b border-slate-100">2. {cat.label} details</h3>
            {(accountType === 'doctor' || accountType === 'graduate') && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><Label>Qualification *</Label>
                  <select className={input} value={qualification} onChange={(e) => setQualification(e.target.value)}>
                    {['BHMS', 'MD (Hom)', 'DHMS', 'Other'].map((q) => <option key={q}>{q}</option>)}
                  </select>
                </div>
                {accountType === 'doctor' ? (
                  <>
                    <div><Label>Registration number *</Label><input className={input} value={regNumber} maxLength={100} onChange={(e) => setRegNumber(e.target.value)} placeholder="As printed on your registration certificate" /></div>
                    <div className="sm:col-span-2"><Label>Registered with (council / board / register) *</Label><input className={input} value={regAuthority} maxLength={200} onChange={(e) => setRegAuthority(e.target.value)} placeholder="Full name of the State or Central register you are enrolled in" /></div>
                    <div><Label>Years of practice <span className="font-normal text-slate-400">(self-reported)</span></Label><input type="number" min={0} max={70} className={input} value={experienceYears} onChange={(e) => setExperienceYears(Number(e.target.value))} /></div>
                    <div><Label>Area of interest <span className="font-normal text-slate-400">(self-reported, not a verified specialty)</span></Label><input className={input} value={specialization} maxLength={200} onChange={(e) => setSpecialization(e.target.value)} placeholder="e.g. Paediatrics" /></div>
                    <div className="sm:col-span-2"><Label>Clinic / hospital <span className="font-normal text-slate-400">(optional)</span></Label><input className={input} value={clinic} maxLength={200} onChange={(e) => setClinic(e.target.value)} /></div>
                  </>
                ) : (
                  <>
                    <div><Label>Year of passing *</Label><input className={input} value={graduationYear} maxLength={10} onChange={(e) => setGraduationYear(e.target.value)} placeholder="e.g. 2025" /></div>
                    <div className="sm:col-span-2"><Label>Your registration status *</Label>
                      <select className={input} value={regStatusDeclared} onChange={(e) => setRegStatusDeclared(e.target.value)}>
                        {['Applied — awaiting registration', 'Not applied yet', 'Preparing for a required licensing exam', 'Other'].map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                  </>
                )}
              </div>
            )}
            {(accountType === 'student' || accountType === 'intern') && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2"><Label>College *</Label><input className={input} value={college} maxLength={200} onChange={(e) => setCollege(e.target.value)} placeholder="e.g. Nehru Homoeopathic Medical College, New Delhi" /></div>
                {accountType === 'student' ? (
                  <div><Label>Current year *</Label>
                    <select className={input} value={courseYear} onChange={(e) => setCourseYear(e.target.value)}>
                      {['1st year', '2nd year', '3rd year', 'Final year'].map((y) => <option key={y}>{y}</option>)}
                    </select>
                  </div>
                ) : (
                  <div className="sm:col-span-2"><Label>Internship hospital and period *</Label><input className={input} value={internship} maxLength={1000} onChange={(e) => setInternship(e.target.value)} placeholder="e.g. College hospital, Jan 2026 – Dec 2026" /></div>
                )}
              </div>
            )}
            {accountType === 'researcher' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><Label>Highest qualification</Label><input className={input} value={qualification === 'BHMS' ? '' : qualification} maxLength={200} onChange={(e) => setQualification(e.target.value)} placeholder="e.g. MD (Hom), PhD" /></div>
                <div><Label>Institution *</Label><input className={input} value={institution} maxLength={200} onChange={(e) => setInstitution(e.target.value)} /></div>
                <div><Label>Academic / research role *</Label><input className={input} value={academicRole} maxLength={300} onChange={(e) => setAcademicRole(e.target.value)} placeholder="e.g. Associate Professor, Materia Medica" /></div>
                <div><Label>Research areas</Label><input className={input} value={researchInterests} maxLength={3000} onChange={(e) => setResearchInterests(e.target.value)} /></div>
              </div>
            )}
          </section>

          <section className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
            <Label>3. Upload: {DOC_LABEL[accountType]} *</Label>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                className="text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 cursor-pointer" />
              {docFile && <span className="text-xs text-teal-800 font-semibold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />{docFile.name}</span>}
            </div>
            <p className="text-[11px] text-slate-500">PDF, JPG or PNG, up to 10 MB. Stored privately; only our verification team can open it. Uploading a document does not by itself verify you.</p>
          </section>

          <section className="space-y-2.5">
            {[
              { v: adult, set: setAdult, text: <>I am 18 years of age or older.</> },
              { v: declared, set: setDeclared, text: <>{DECLARATION[accountType]}</> },
              { v: accepted, set: setAccepted, text: <>I accept the <Link to="/terms" className="text-teal-700 underline">Terms of Use</Link> and <Link to="/community-rules" className="text-teal-700 underline">Community Guidelines</Link>, and I have read the <Link to="/privacy" className="text-teal-700 underline">Privacy Policy</Link>, including how my documents are used for verification.</> },
            ].map((c, i) => (
              <label key={i} className="flex items-start gap-3 p-3 bg-teal-50/40 rounded-xl border border-teal-200/70 cursor-pointer">
                <input type="checkbox" checked={c.v} onChange={(e) => c.set(e.target.checked)} className="rounded text-teal-600 w-4 h-4 mt-0.5" />
                <span className="text-xs text-slate-700 leading-snug">{c.text}</span>
              </label>
            ))}
          </section>

          <p className="text-[11px] text-slate-500 leading-relaxed">{INDEPENDENCE_DISCLAIMER} Verification on Homeo India does not grant any registration or licence to practise.</p>

          <div className="flex justify-end">
            <button type="submit" disabled={submitting} className="px-6 py-3 bg-[#0D817B] hover:bg-[#096e69] text-white rounded-xl text-xs sm:text-sm font-semibold shadow transition disabled:opacity-50 flex items-center gap-2">
              {submitting ? 'Submitting…' : (<>Submit for verification <ArrowRight className="w-4 h-4" /></>)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
