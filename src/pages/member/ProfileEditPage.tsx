import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { dataService } from '../../lib/supabase';
import { Avatar } from '../../components/common/Avatar';
import { 
  ShieldCheck, 
  CheckCircle2, 
  Sparkles,
  GraduationCap,
  Microscope,
  Stethoscope,
  Globe,
  ExternalLink,
  Phone,
  Camera,
  AlertCircle
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useToast } from '../../components/feedback/ToastProvider';
import { AccountTypeSelect } from '../../components/common/AccountTypeSelect';

export const ProfileEditPage: React.FC = () => {
  const { currentUser, updateCurrentUser, logout } = useAuth();
  const toast = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  // Permitted user categories (doctor/practitioner, student/intern, researcher/educator)
  const [category, setCategory] = useState<'doctor' | 'student' | 'researcher'>(() => {
    if (currentUser?.account_type) return currentUser.account_type;
    if (currentUser?.role === 'student') return 'student';
    if (currentUser?.role === 'researcher') return 'researcher';
    return 'doctor';
  });

  const isDoctor = category === 'doctor';
  const isStudent = category === 'student';
  const isResearcher = category === 'researcher';

  const returnDestination = (): string | null => {
    const searchParams = new URLSearchParams(location.search);
    const returnUrl = searchParams.get('returnUrl');
    if (returnUrl) return returnUrl;

    const from = (location.state as any)?.from;
    if (typeof from === 'string') return from;
    if (from && typeof from === 'object') {
      return `${from.pathname || ''}${from.search || ''}`;
    }
    return null;
  };

  const returnTo = returnDestination();
  const noticeMessage = (location.state as any)?.message;

  const [displayName, setDisplayName] = useState(currentUser?.display_name || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatar_url || '');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
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
  const [saving, setSaving] = useState(false);

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

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser?.id) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file (JPEG, PNG, WebP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB.');
      return;
    }

    try {
      setUploadingAvatar(true);
      const result = await dataService.uploadAvatar(currentUser.id, file);
      setAvatarUrl(result.publicUrl);
      await updateCurrentUser({ avatar_url: result.publicUrl });
      toast.success('Profile photo updated.');
    } catch (err: any) {
      console.error('Failed to upload avatar:', err);
      toast.error(err.message || 'Failed to upload photo. Please try again.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    const interests = interestsStr.split(',').map(s => s.trim()).filter(Boolean);
    
    // Preserve admin/moderator roles; otherwise allow updating role to match chosen category
    const isPrivileged = ['admin', 'super_admin', 'moderator'].includes(currentUser?.role || '');
    const targetRole = isPrivileged ? currentUser?.role : category;

    setSaving(true);
    try {
    await updateCurrentUser({
      account_type: category,
      role: targetRole,
      display_name: displayName.trim(),
      avatar_url: avatarUrl || currentUser?.avatar_url,
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
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Your changes could not be saved.');
      return;
    } finally {
      setSaving(false);
    }

    setSaved(true);
    if (returnTo) {
      setTimeout(() => {
        navigate(returnTo, { replace: true });
      }, 1500);
    } else {
      setTimeout(() => setSaved(false), 3500);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {noticeMessage && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-amber-900 text-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>{noticeMessage}</span>
          </div>
          {returnTo && (
            <Link to={returnTo} className="text-amber-800 underline font-semibold text-[11px] hover:text-amber-950">
              Return without saving
            </Link>
          )}
        </div>
      )}

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

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-500 pt-1">
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
        <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl flex items-center gap-2 text-teal-800 text-xs animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0" />
          <span>
            {returnTo 
              ? 'Profile updated successfully! Returning you to your action...' 
              : 'Profile updated successfully. Changes are now visible across your member profile.'}
          </span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-card space-y-6">
        
        {/* Verification Status Banner */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
          <div>
            <span className="text-[11px] uppercase font-bold text-slate-400 block">Registration & Verification</span>
            <span className="font-semibold text-brand-navy">
              {currentUser?.registration_number ? `Reg #${currentUser.registration_number}` : (currentUser?.email || 'Registered Member')}
            </span>
            <span className="text-slate-500 block">
              {currentUser?.registration_authority || (isStudent ? 'Enrolled Student' : isResearcher ? 'Academic Faculty / Researcher' : 'Registered Practitioner')}
            </span>
          </div>
          <span className="text-xs font-semibold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            <span className="capitalize">{currentUser?.verification_status || 'Verified'}</span>
          </span>
        </div>

        {/* Profile Category Selection */}
        <div className="p-5 bg-gradient-to-br from-[#F8FBFE] to-teal-50/40 rounded-2xl border border-teal-200/80 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-brand-navy flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-brand-teal" />
                <span>Choose Your Profile Type</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Select the category that best matches your practice. You can change this anytime.
              </p>
            </div>
            <span className="self-start sm:self-auto text-[11px] font-semibold text-teal-800 bg-teal-100/70 px-2.5 py-0.5 rounded-full capitalize">
              Active: {category === 'doctor' ? 'Practitioner' : category === 'student' ? 'Student / Intern' : 'Researcher'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <button
              type="button"
              onClick={() => setCategory('doctor')}
              className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                category === 'doctor'
                  ? 'bg-white border-teal-600 shadow-xs ring-2 ring-teal-500/20'
                  : 'bg-white/70 border-slate-200 hover:border-slate-300 hover:bg-white'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${category === 'doctor' ? 'bg-teal-100 text-teal-800' : 'bg-slate-100 text-slate-600'}`}>
                  <Stethoscope className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800">Practitioner</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-snug">
                Practicing clinician in OPD or private consultation practice.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setCategory('student')}
              className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                category === 'student'
                  ? 'bg-white border-teal-600 shadow-xs ring-2 ring-teal-500/20'
                  : 'bg-white/70 border-slate-200 hover:border-slate-300 hover:bg-white'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${category === 'student' ? 'bg-teal-100 text-teal-800' : 'bg-slate-100 text-slate-600'}`}>
                  <GraduationCap className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800">Student / Intern</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-snug">
                Enrolled BHMS undergraduate or rotating hospital intern.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setCategory('researcher')}
              className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                category === 'researcher'
                  ? 'bg-white border-teal-600 shadow-xs ring-2 ring-teal-500/20'
                  : 'bg-white/70 border-slate-200 hover:border-slate-300 hover:bg-white'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${category === 'researcher' ? 'bg-teal-100 text-teal-800' : 'bg-slate-100 text-slate-600'}`}>
                  <Microscope className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800">Researcher</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-snug">
                Academic faculty, clinical researcher, or medical author.
              </p>
            </button>
          </div>
        </div>

        {/* Basic Section */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b pb-1">
            Core Identity
          </h3>

          {/* Profile Photo Uploader */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200/80">
            <div className="relative group">
              <Avatar
                src={avatarUrl || currentUser?.avatar_url}
                name={displayName || currentUser?.display_name || 'Member'}
                size="lg"
                className="w-16 h-16 rounded-full object-cover border-2 border-teal-600/30 shadow-xs"
              />
              {uploadingAvatar && (
                <div className="absolute inset-0 bg-brand-navy/60 rounded-full flex items-center justify-center text-white text-[10px] font-semibold">
                  ...
                </div>
              )}
            </div>
            <div className="flex-1 space-y-1">
              <span className="block text-xs font-bold text-slate-800">Profile Photo</span>
              <p className="text-[11px] text-slate-500">
                Upload a professional photo or portrait (JPEG, PNG, WebP up to 5MB).
              </p>
              <div className="pt-1 flex items-center gap-3">
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:border-teal-600 rounded-lg text-xs font-medium text-slate-700 hover:text-teal-700 transition-colors shadow-xs">
                  <Camera className="w-3.5 h-3.5 text-slate-500" />
                  <span>{uploadingAvatar ? 'Uploading...' : 'Upload New Photo'}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleAvatarFileChange}
                    disabled={uploadingAvatar}
                  />
                </label>
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setAvatarUrl('');
                      // null (not undefined) so the photo is actually cleared in the database
                      updateCurrentUser({ avatar_url: null as unknown as string }).catch((err) =>
                        toast.error(err instanceof Error ? err.message : 'Could not remove photo.')
                      );
                    }}
                    className="text-[11px] text-slate-400 hover:text-red-600"
                  >
                    Remove Photo
                  </button>
                )}
              </div>
            </div>
          </div>

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

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
          <span className="text-xs text-slate-400">
            Complies with DISHA & NCH India professional privacy standards.
          </span>
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {returnTo && (
              <Link
                to={returnTo}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition"
              >
                Cancel & Return
              </Link>
            )}
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold shadow transition active:scale-[.98] disabled:opacity-60"
            >
              {saving ? 'Saving…' : returnTo ? 'Save & Return to Action' : 'Save Profile Changes'}
            </button>
          </div>
        </div>

      </form>

      {/* Account type (opens the verification form) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-card">
        <AccountTypeSelect />
      </div>

      {/* Sign out & account deletion */}
      <div className="bg-white rounded-2xl p-6 border border-rose-100 shadow-card space-y-3">
        <h2 className="text-sm font-bold text-rose-800">Account</h2>
        <p className="text-xs text-slate-600">Sign out, or ask us to permanently delete your account and data.</p>
        <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={async () => { await logout(); navigate('/'); }}
          className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition"
        >
          Sign out
        </button>
        <button
          type="button"
          onClick={() => toast.info('To delete your account, email dpo@homeocircle.in from your registered email. We respond within 30 days.')}
          className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold border border-rose-200 transition"
        >
          Request account deletion
        </button>
        </div>
      </div>
    </div>
  );
};
