import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { isSupabaseConfigured } from '../../lib/supabase';
import { ShieldCheck, UserCheck, Clock, UserX, Database, HelpCircle, GraduationCap, Microscope, Stethoscope } from 'lucide-react';
import { Link } from 'react-router-dom';

export const DevBanner: React.FC = () => {
  const { currentUser, role, status, loginAs } = useAuth();

  return (
    <div className="bg-slate-900 text-slate-300 text-xs px-4 py-1.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 z-50">
      <div className="flex items-center gap-3">
        {/* Backend status indicator */}
        <div className="flex items-center gap-1.5 font-medium">
          <Database className={`w-3.5 h-3.5 ${isSupabaseConfigured ? 'text-emerald-400' : 'text-amber-400'}`} />
          <span>
            Supabase: {isSupabaseConfigured ? (
              <span className="text-emerald-400 font-semibold">Connected</span>
            ) : (
              <span className="text-amber-400 font-medium">Local Mock Mode (Configure .env for Live)</span>
            )}
          </span>
        </div>

        <span className="text-slate-600 hidden sm:inline">|</span>

        {/* Current active role indicator */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400">Current View:</span>
          <span className="font-semibold text-white px-2 py-0.5 rounded bg-slate-800 border border-slate-700 capitalize flex items-center gap-1">
            {currentUser ? (
              <>
                <span>{currentUser.display_name}</span>
                <span className="text-[10px] text-teal-400 bg-teal-950 px-1.5 py-0.2 rounded border border-teal-800">
                  {role} • {status}
                </span>
              </>
            ) : (
              'Public Visitor'
            )}
          </span>
        </div>
      </div>

      {/* Role Switcher Pills */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-slate-400 hidden lg:inline">Quick Test Roles:</span>
        
        {/* Doctor */}
        <button
          onClick={() => loginAs('doctor')}
          className={`px-2 py-0.5 rounded transition flex items-center gap-1 ${
            (role === 'doctor' || role === 'member') && status === 'verified'
              ? 'bg-teal-600 text-white font-medium shadow-xs'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
          }`}
          title="Dr. Ananya - Approved Practitioner / Doctor"
        >
          <Stethoscope className="w-3 h-3" />
          <span>Doctor</span>
        </button>

        {/* Student */}
        <button
          onClick={() => loginAs('student')}
          className={`px-2 py-0.5 rounded transition flex items-center gap-1 ${
            role === 'student' && status === 'verified'
              ? 'bg-emerald-600 text-white font-medium shadow-xs'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
          }`}
          title="Rahul Verma - Final Year BHMS Student"
        >
          <GraduationCap className="w-3 h-3" />
          <span>Student</span>
        </button>

        {/* Researcher */}
        <button
          onClick={() => loginAs('researcher')}
          className={`px-2 py-0.5 rounded transition flex items-center gap-1 ${
            role === 'researcher' && status === 'verified'
              ? 'bg-sky-600 text-white font-medium shadow-xs'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
          }`}
          title="Dr. Arjun Nair - Clinical Researcher / Educator"
        >
          <Microscope className="w-3 h-3" />
          <span>Researcher</span>
        </button>

        {/* Admin */}
        <button
          onClick={() => loginAs('admin')}
          className={`px-2 py-0.5 rounded transition flex items-center gap-1 ${
            (role === 'admin' || role === 'super_admin')
              ? 'bg-indigo-600 text-white font-medium shadow-xs'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
          }`}
          title="Dr. Sanjeev Bannerjee - Super Administrator"
        >
          <ShieldCheck className="w-3 h-3" />
          <span>Admin</span>
        </button>

        {/* Pending Applicant */}
        <button
          onClick={() => loginAs('applicant')}
          className={`px-2 py-0.5 rounded transition flex items-center gap-1 ${
            role === 'applicant' && status === 'pending_review'
              ? 'bg-amber-600 text-white font-medium shadow-xs'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
          }`}
          title="Dr. Rohit Kumar - Pending Verification"
        >
          <Clock className="w-3 h-3" />
          <span>Pending</span>
        </button>

        {/* Logged Out Visitor */}
        <button
          onClick={() => loginAs('public')}
          className={`px-2 py-0.5 rounded transition flex items-center gap-1 ${
            !currentUser
              ? 'bg-slate-700 text-white font-medium shadow-xs'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
          }`}
          title="Logged Out Visitor"
        >
          <UserX className="w-3 h-3" />
          <span>Visitor</span>
        </button>

        <Link
          to="/eligibility"
          className="text-slate-400 hover:text-white ml-1.5 flex items-center gap-1"
          title="NCH Verification Criteria & Guidelines"
        >
          <HelpCircle className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
};
