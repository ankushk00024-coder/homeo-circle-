import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dataService } from '../../lib/supabase';
import { ShieldCheck, Upload, CheckCircle2, AlertCircle, ArrowRight, FileText } from 'lucide-react';

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

export const ApplyPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, loginAs } = useAuth();

  const [fullName, setFullName] = useState(currentUser?.full_name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState('+91 ');
  const [qualification, setQualification] = useState('BHMS');
  const [regNumber, setRegNumber] = useState('');
  const [authority, setAuthority] = useState(AUTHORITIES[0]);
  const [state, setState] = useState('Maharashtra');
  const [clinic, setClinic] = useState('');
  const [experienceYears, setExperienceYears] = useState(5);
  const [specialization, setSpecialization] = useState('Clinical Practice');
  const [documentName, setDocumentName] = useState('');
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) return setError('Please enter your full legal name as per official register.');
    if (!email.trim() || !email.includes('@')) return setError('Please provide a valid professional email.');
    if (!phone.trim() || phone.trim() === '+91') return setError('Please provide a contact phone number.');
    if (!regNumber.trim()) return setError('Registration number is required for verification.');
    if (!consent) return setError('You must consent to credential verification against official registers.');

    setSubmitting(true);

    try {
      const newApp = await dataService.submitApplication({
        user_id: currentUser?.id || 'user-' + Date.now(),
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        qualification,
        registration_number: regNumber.trim().toUpperCase(),
        registration_authority: authority,
        state,
        clinic_institution: clinic.trim(),
        experience_years: Number(experienceYears),
        specialization,
        consent_at: new Date().toISOString(),
        document_url: documentName ? `/storage/private/docs/${documentName}` : undefined
      });

      // Switch auth to this applicant session so they immediately see their status page
      loginAs('applicant');

      navigate('/application-status', { 
        state: { 
          justSubmitted: true, 
          appId: newApp.id, 
          regNumber: newApp.registration_number 
        } 
      });
    } catch (err: any) {
      setError(err.message || 'Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="text-center space-y-3 mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200/80 text-[11px] font-bold text-teal-800 uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
          <span>Statutory Practitioner Verification</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-brand-navy">
          Apply for Verified Membership
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
          Provide your registration details as recorded in the National Commission for Homoeopathy or your State Council gazette.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-800 text-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Application Form */}
      <div className="bg-white rounded-2xl p-6 sm:p-10 border border-slate-200 shadow-card">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Section 1: Identity & Contact */}
          <div>
            <h3 className="text-sm font-bold text-brand-navy uppercase tracking-wider pb-2 border-b border-slate-100 mb-4">
              1. Practitioner Identity & Contact
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Legal Name (as on Registration) *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Dr. Ramesh Chandra Gupta"
                  className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Medical Qualification *
                </label>
                <select
                  value={qualification}
                  onChange={(e) => setQualification(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none bg-white"
                >
                  <option value="BHMS">BHMS (Bachelor of Homoeopathic Medicine & Surgery)</option>
                  <option value="MD (Hom)">MD (Hom) (Doctor of Medicine in Homoeopathy)</option>
                  <option value="DHMS">DHMS / LCEH (Statutory Recognized Diploma)</option>
                  <option value="Other Recognized Degree">Other Recognized Homoeopathic Degree</option>
                </select>
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
                  placeholder="doctor@clinic.org"
                  className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number (for verification alerts) *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98200 XXXXX"
                  className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Statutory Registration Details */}
          <div>
            <h3 className="text-sm font-bold text-brand-navy uppercase tracking-wider pb-2 border-b border-slate-100 mb-4">
              2. Statutory Council Registration
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Registration Number *
                </label>
                <input
                  type="text"
                  required
                  value={regNumber}
                  onChange={(e) => setRegNumber(e.target.value)}
                  placeholder="e.g. MAH/HOM/2018/4312 or DHB/8821"
                  className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Must match the registration certificate issued by your board.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Registration Authority / Council *
                </label>
                <select
                  value={authority}
                  onChange={(e) => setAuthority(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none bg-white"
                >
                  {AUTHORITIES.map((auth) => (
                    <option key={auth} value={auth}>{auth}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  State of Primary Practice *
                </label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none bg-white"
                >
                  {STATES.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Years of Clinical Practice
                </label>
                <input
                  type="number"
                  min="0"
                  max="65"
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(Number(e.target.value))}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Current Clinic / Institutional Affiliation (Optional)
                </label>
                <input
                  type="text"
                  value={clinic}
                  onChange={(e) => setClinic(e.target.value)}
                  placeholder="e.g. Sanjeevani Homoeo Dispensary or Academic Institute"
                  className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Verification Document (Private Bucket) */}
          <div>
            <h3 className="text-sm font-bold text-brand-navy uppercase tracking-wider pb-2 border-b border-slate-100 mb-4">
              3. Supporting Document (Optional for Initial Review)
            </h3>
            <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center space-y-2">
              <Upload className="w-6 h-6 text-slate-400 mx-auto" />
              <p className="text-xs text-slate-600 font-medium">
                Upload Registration Certificate / Renewal Gazette Slip (PDF or JPG)
              </p>
              <p className="text-[11px] text-slate-400">
                Documents are saved in a private Supabase Storage bucket and reviewed only by authorized verification officers.
              </p>
              <input
                type="file"
                id="docUpload"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setDocumentName(e.target.files[0].name);
                  }
                }}
              />
              <div className="pt-1">
                <label
                  htmlFor="docUpload"
                  className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-brand-navy hover:bg-slate-100 transition"
                >
                  <FileText className="w-3.5 h-3.5 text-teal-600" />
                  <span>{documentName ? documentName : 'Select Document from Device'}</span>
                </label>
              </div>
            </div>
          </div>

          {/* Section 4: Statutory Consent */}
          <div className="p-4 bg-teal-50/60 rounded-xl border border-teal-200/80 space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 rounded text-teal-700 focus:ring-teal-500 h-4 w-4"
              />
              <span className="text-xs text-slate-700 leading-relaxed">
                <strong>Statutory Declaration & Verification Consent:</strong> I solemnly affirm that I hold an active, legally recognized qualification and registration under the National Commission for Homoeopathy Act, 2020 or relevant State Homoeopathic Council. I consent to Homeo Circle verifying my credentials against official state/central registers.
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-sm shadow-md transition disabled:opacity-50"
            >
              {submitting ? (
                <span>Submitting Credentials...</span>
              ) : (
                <>
                  <span>Submit Application for Verification</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
            <p className="text-[11px] text-center text-slate-400 mt-2">
              By submitting, you agree to our <Link to="/privacy" className="underline hover:text-teal-700">Privacy Policy</Link> and <Link to="/community-rules" className="underline hover:text-teal-700">Community Rules</Link>.
            </p>
          </div>

        </form>
      </div>
    </div>
  );
};
