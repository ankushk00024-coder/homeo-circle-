import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  ShieldCheck, 
  CheckCircle2, 
  User, 
  Lock, 
  ArrowLeft,
  Sparkles,
  GraduationCap,
  Microscope,
  Stethoscope,
  Globe,
  ExternalLink,
  Phone,
  Mail,
  Eye,
  EyeOff
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const ProfileEditPage: React.FC = () => {
  const { currentUser, updateCurrentUser, isDoctor, isStudent, isResearcher } = useAuth();

  const [displayName, setDisplayName] = useState(currentUser?.display_name || '');
  const [qualification, setQualification] = useState(currentUser?.qualification || '');
  const [specialization, setSpecialization] = useState(currentUser?.specialization || 'Clinical Practice');
  const [clinic, setClinic] = useState(currentUser?.clinic_institution || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [experienceYears, setExperienceYears] = useState(currentUser?.experience_years ? String(currentUser.experience_years) : '');
  const [interestsStr, setInterestsStr] = useState(currentUser?.interests?.join(', ') || '');
  
  // Student specifics
  const [institution, setInstitution] = useState(currentUser?.student_details?.institution || currentUser?.clinic_institution || '');
  const [courseYear, setCourseYear] = useState(currentUser?.student_details?.course_year || 'Final Year (4th BHMS)');
  const [mentorshipNeeds, setMentorshipNeeds] = useState(currentUser?.student_details?.mentorship_needs?.join(', ') || 'Case Taking, Repertory Application, Chronic Pathology');

  // Researcher specifics
  const [orcid, setOrcid] = useState(currentUser?.social_links?.orcid || '');
  const [publicationsCount, setPublicationsCount] = useState(currentUser?.researcher_details?.publications_count ? String(currentUser.researcher_details.publications_count) : '0');

  // Social & Contact
  const [linkedin, setLinkedin] = useState(currentUser?.social_links?.linkedin || '');
  const [website, setWebsite] = useState(currentUser?.social_links?.website || '');
  const [whatsapp, setWhatsapp] = useState(currentUser?.social_links?.whatsapp || '');

  // Privacy Settings
  const [visibility, setVisibility] = useState(currentUser?.profile_visibility || 'members_only');
  const [showEmail, setShowEmail] = useState(currentUser?.privacy_settings?.show_email ?? false);
  const [showPhone, setShowPhone] = useState(currentUser?.privacy_settings?.show_phone ?? false);

  const [saved, setSaved] = useState(false);

  // Compute profile completion percentage
  const calculateCompletion = () => {
    let score = 0;
    if (displayName) score += 20;
    if (bio && bio.length > 20) score += 20;
    if (specialization || courseYear) score += 20;
    if (interestsStr) score += 20;
    if (linkedin || website || orcid || whatsapp) score += 20;
    return score;
  };

  const completionPct = calculateCompletion();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const interests = interestsStr.split(',').map(s => s.trim()).filter(Boolean);
    
    updateCurrentUser({
      display_name: displayName.trim(),
      qualification: qualification.trim(),
      specialization: specialization.trim(),
      clinic_institution: isStudent ? institution.trim() : clinic.trim(),
      bio: bio.trim(),
      experience_years: experienceYears ? parseInt(experienceYears, 10) : undefined,
      interests,
      profile_visibility: visibility as any,
      social_links: {
        linkedin: linkedin.trim(),
        website: website.trim(),
        whatsapp: whatsapp.trim(),
        orcid: orcid.trim()
      },
      privacy_settings: {
        show_email: showEmail,
        show_phone: showPhone,
        show_experience: true,
        profile_visibility: visibility as any
      },
      student_details: isStudent ? {
        institution: institution.trim(),
        course_year: courseYear.trim(),
        mentorship_needs: mentorshipNeeds.split(',').map((s: string) => s.trim()).filter(Boolean)
      } : currentUser?.student_details,
      researcher_details: isResearcher ? {
        academic_affiliation: clinic.trim(),
        research_interests: interests,
        publications_count: parseInt(publicationsCount, 10) || 0
      } : currentUser?.researcher_details
    });

    setSaved(true);
    setTimeout(() => setSaved(false), 3500);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-brand-navy">
            {isDoctor ? 'Practitioner Profile' : isStudent ? 'Student Profile & Academic Details' : 'Researcher Profile'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your peer-visible credentials, clinical focus, and privacy settings.
          </p>
        </div>
        <Link
          to={`/members/${currentUser?.id}`}
          className="text-xs font-semibold text-teal-700 hover:text-teal-800"
        >
          View Public Card &rarr;
        </Link>
      </div>

      {/* Profile Completion Indicator */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-600" />
            <h3 className="text-xs font-bold text-brand-navy uppercase tracking-wider">
              Profile Completeness
            </h3>
          </div>
          <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
            {completionPct}% Complete
          </span>
        </div>

        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-teal-500 to-teal-700 h-2.5 rounded-full transition-all duration-500" 
            style={{ width: `${completionPct}%` }}
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-500 pt-1">
          <span className={displayName ? "text-teal-700 font-medium flex items-center gap-1" : "text-slate-400 flex items-center gap-1"}>
            <CheckCircle2 className="w-3 h-3" /> Basic Info
          </span>
          <span className={bio ? "text-teal-700 font-medium flex items-center gap-1" : "text-slate-400 flex items-center gap-1"}>
            <CheckCircle2 className="w-3 h-3" /> Clinical Bio
          </span>
          <span className={interestsStr ? "text-teal-700 font-medium flex items-center gap-1" : "text-slate-400 flex items-center gap-1"}>
            <CheckCircle2 className="w-3 h-3" /> Practice Topics
          </span>
          <span className={(linkedin || website || orcid || whatsapp) ? "text-teal-700 font-medium flex items-center gap-1" : "text-slate-400 flex items-center gap-1"}>
            <CheckCircle2 className="w-3 h-3" /> Social / Contact
          </span>
        </div>
      </div>

      {saved && (
        <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl flex items-center gap-2 text-teal-800 text-xs animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0" />
          <span>Profile updated successfully. Changes are now visible across your member profile.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-card space-y-6">
        
        {/* Verification Status Banner */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Registration & Verification</span>
            <span className="font-semibold text-brand-navy">
              {currentUser?.registration_number ? `Reg #${currentUser.registration_number}` : (currentUser?.email || 'Registered Member')}
            </span>
            <span className="text-slate-500 block">
              {currentUser?.registration_authority || (isStudent ? 'Enrolled Student' : 'Academic Member')}
            </span>
          </div>
          <span className="text-xs font-semibold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            <span className="capitalize">{currentUser?.verification_status || 'Verified'}</span>
          </span>
        </div>

        {/* Basic Section */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b pb-1">
            Core Identity
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Display Name
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Degree & Primary Qualifications
              </label>
              <input
                type="text"
                required
                value={qualification}
                onChange={(e) => setQualification(e.target.value)}
                placeholder="e.g. BHMS, MD (Hom), or BHMS Student"
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Role-Specific Fields */}
        {isDoctor && (
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b pb-1 flex items-center gap-1.5">
              <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
              <span>Practitioner Clinical Specifics</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Clinical Specialization Focus
                </label>
                <input
                  type="text"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  placeholder="e.g. Autoimmune & Dermatology, Pediatrics, Classical"
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Years of Active Practice
                </label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(e.target.value)}
                  placeholder="e.g. 12"
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Clinic, Dispensary or Hospital Center
              </label>
              <input
                type="text"
                value={clinic}
                onChange={(e) => setClinic(e.target.value)}
                placeholder="e.g. Samyak Homeopathy Center, Bangalore"
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none"
              />
            </div>
          </div>
        )}

        {isStudent && (
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b pb-1 flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
              <span>Academic & Student Enrolment</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Homoeopathic Medical College / University
                </label>
                <input
                  type="text"
                  required
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="e.g. Nehru Homoeopathic Medical College, Delhi"
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Current Academic Stage / Year
                </label>
                <select
                  value={courseYear}
                  onChange={(e) => setCourseYear(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl outline-none bg-white"
                >
                  <option value="1st Year BHMS">1st Year BHMS</option>
                  <option value="2nd Year BHMS">2nd Year BHMS</option>
                  <option value="3rd Year BHMS">3rd Year BHMS</option>
                  <option value="Final Year (4th BHMS)">Final Year (4th BHMS)</option>
                  <option value="Compulsory Rotatory Internship">Compulsory Rotatory Internship</option>
                  <option value="MD (Hom) Post-Graduate Scholar">MD (Hom) Post-Graduate Scholar</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mentorship & Clinical Guidance Interests
              </label>
              <input
                type="text"
                value={mentorshipNeeds}
                onChange={(e) => setMentorshipNeeds(e.target.value)}
                placeholder="e.g. Case Taking, Repertorization, Organon Application"
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none"
              />
            </div>
          </div>
        )}

        {isResearcher && (
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b pb-1 flex items-center gap-1.5">
              <Microscope className="w-3.5 h-3.5 text-purple-600" />
              <span>Research & Academic Credentials</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Academic Institution / Research Council
                </label>
                <input
                  type="text"
                  value={clinic}
                  onChange={(e) => setClinic(e.target.value)}
                  placeholder="e.g. Central Council for Research in Homoeopathy (CCRH)"
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Peer-Reviewed Publications Count
                </label>
                <input
                  type="number"
                  min="0"
                  value={publicationsCount}
                  onChange={(e) => setPublicationsCount(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ORCID iD
              </label>
              <input
                type="text"
                value={orcid}
                onChange={(e) => setOrcid(e.target.value)}
                placeholder="0000-0002-1825-0097"
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none"
              />
            </div>
          </div>
        )}

        {/* Bio & Interests */}
        <div className="space-y-4 pt-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b pb-1">
            Bio & Clinical Approach
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Professional Biography
            </label>
            <textarea
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Summarize your clinical methodology, research questions, or learning goals..."
              className="w-full p-3 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Areas of Professional Interest (Comma separated)
            </label>
            <input
              type="text"
              value={interestsStr}
              onChange={(e) => setInterestsStr(e.target.value)}
              placeholder="e.g. Materia Medica, Autoimmune, Pediatrics, Repertory, Organon"
              className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none"
            />
          </div>
        </div>

        {/* Social & Contact Links */}
        <div className="space-y-4 pt-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b pb-1">
            Professional Links & Contacts
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                <span>LinkedIn Profile URL</span>
              </label>
              <input
                type="url"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                placeholder="https://linkedin.com/in/username"
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-teal-600" />
                <span>Clinic or Academic Website</span>
              </label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://drsharmahomeopathy.com"
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              <span>WhatsApp Professional Consultation Number</span>
            </label>
            <input
              type="text"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none"
            />
          </div>
        </div>

        {/* Privacy & Member Visibility */}
        <div className="space-y-4 pt-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b pb-1">
            Privacy & Member Directory Visibility
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Who Can Discover Your Profile?
            </label>
            <select
              value={visibility}
              onChange={(e: any) => setVisibility(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none bg-white"
            >
              <option value="members_only">Verified Community Members Only (Recommended)</option>
              <option value="public">Public Directory (Visible on web & search engines)</option>
              <option value="private">Hidden / Only Platform Admins</option>
            </select>
          </div>

          <div className="space-y-2 pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
              <input
                type="checkbox"
                checked={showEmail}
                onChange={(e) => setShowEmail(e.target.checked)}
                className="rounded border-slate-300 text-teal-700 focus:ring-teal-600"
              />
              <span>Display email address to connected peers</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
              <input
                type="checkbox"
                checked={showPhone}
                onChange={(e) => setShowPhone(e.target.checked)}
                className="rounded border-slate-300 text-teal-700 focus:ring-teal-600"
              />
              <span>Display phone / WhatsApp number on member profile</span>
            </label>
          </div>
        </div>

        <div className="pt-4 flex items-center justify-between border-t border-slate-100">
          <span className="text-xs text-slate-400">
            Complies with DISHA & NCH India professional privacy standards.
          </span>
          <button
            type="submit"
            className="px-6 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold shadow transition"
          >
            Save Profile Changes
          </button>
        </div>

      </form>
    </div>
  );
};
