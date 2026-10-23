import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, CheckCircle2, User, Lock, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ProfileEditPage: React.FC = () => {
  const { currentUser, updateCurrentUser } = useAuth();

  const [displayName, setDisplayName] = useState(currentUser?.display_name || '');
  const [specialization, setSpecialization] = useState(currentUser?.specialization || 'Clinical Practice');
  const [clinic, setClinic] = useState(currentUser?.clinic_institution || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [interestsStr, setInterestsStr] = useState(currentUser?.interests?.join(', ') || '');
  const [visibility, setVisibility] = useState(currentUser?.profile_visibility || 'members_only');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const interests = interestsStr.split(',').map(s => s.trim()).filter(Boolean);
    updateCurrentUser({
      display_name: displayName.trim(),
      specialization: specialization.trim(),
      clinic_institution: clinic.trim(),
      bio: bio.trim(),
      interests,
      profile_visibility: visibility as any
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-brand-navy">
            Practitioner Profile
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your peer-visible credentials and clinical interests.
          </p>
        </div>
        <Link
          to={`/members/${currentUser?.id}`}
          className="text-xs font-semibold text-teal-700 hover:text-teal-800"
        >
          View Public Card &rarr;
        </Link>
      </div>

      {saved && (
        <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl flex items-center gap-2 text-teal-800 text-xs">
          <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0" />
          <span>Profile changes saved successfully.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-card space-y-5">
        
        {/* Read-only verification identity */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Verified Central/State Register</span>
            <span className="font-semibold text-brand-navy">{currentUser?.registration_number}</span>
            <span className="text-slate-500 block">{currentUser?.registration_authority}</span>
          </div>
          <span className="text-xs font-semibold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            <span>Verified Record</span>
          </span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Display Name
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
            Clinical Specialization Focus
          </label>
          <input
            type="text"
            value={specialization}
            onChange={(e) => setSpecialization(e.target.value)}
            placeholder="e.g. Autoimmune & Dermatology or Classical Practice"
            className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Dispensary / Hospital / Academic Affiliation
          </label>
          <input
            type="text"
            value={clinic}
            onChange={(e) => setClinic(e.target.value)}
            placeholder="e.g. Samyak Homeopathy Center, Bangalore"
            className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Professional Bio & Approach
          </label>
          <textarea
            rows={4}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Summarize your clinical background, repertorial methodology, and research interests..."
            className="w-full p-3 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none leading-relaxed"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Areas of Inquiry (Comma separated)
          </label>
          <input
            type="text"
            value={interestsStr}
            onChange={(e) => setInterestsStr(e.target.value)}
            placeholder="Materia Medica, Autoimmune Disorders, Pediatrics, Repertory"
            className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Profile Visibility Setting
          </label>
          <select
            value={visibility}
            onChange={(e: any) => setVisibility(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none bg-white"
          >
            <option value="members_only">Visible to Verified Practitioners Only (Recommended)</option>
            <option value="private">Private (Only visible to platform administrators)</option>
          </select>
        </div>

        <div className="pt-2 flex justify-end">
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
