import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole, ApplicationStatus } from '../types';
import { initialMembers } from '../lib/mockData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
  currentUser: UserProfile | null;
  role: UserRole;
  status: ApplicationStatus;
  isAuthenticated: boolean;
  isVerifiedMember: boolean;
  isAdmin: boolean;
  isDoctor: boolean;
  isStudent: boolean;
  isResearcher: boolean;
  isApplicant: boolean;
  loginAs: (type: 'member' | 'doctor' | 'student' | 'researcher' | 'admin' | 'applicant' | 'declined' | 'public') => void;
  loginWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateCurrentUser: (updates: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Preset test users for quick role testing
export const TEST_USERS: Record<string, UserProfile> = {
  member: initialMembers[0], // Dr. Ananya Sharma (Doctor)
  doctor: initialMembers[0], // Dr. Ananya Sharma
  student: initialMembers.find(m => m.role === 'student') || initialMembers[3], // Rahul Verma (Final Year BHMS)
  researcher: initialMembers.find(m => m.role === 'researcher') || initialMembers[2], // Dr. Arjun Nair
  admin: initialMembers.find(m => m.role === 'super_admin' || m.role === 'admin') || initialMembers[initialMembers.length - 1], // Dr. Sanjeev Bannerjee (Admin)
  applicant: {
    id: 'user-rohit',
    email: 'dr.rohit.kumar@delhihomeo.in',
    full_name: 'Dr. Rohit Kumar',
    display_name: 'Dr. Rohit Kumar',
    avatar_url: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150&auto=format&fit=crop&q=80',
    role: 'applicant',
    account_type: 'doctor',
    status: 'pending_review',
    qualification: 'MD (Hom)',
    experience_years: 5,
    registration_number: 'DHB/2019/8821',
    registration_authority: 'Delhi Homoeopathic Board',
    state: 'Delhi',
    city: 'New Delhi',
    clinic_institution: 'Apex Healing Center, Dwarka',
    specialization: 'Lifestyle & Metabolic Disorders',
    bio: 'Applicant under verification review against Delhi Homoeopathic Board gazette.',
    interests: ['Lifestyle Disorders'],
    profile_visibility: 'members_only',
    created_at: '2026-10-22T06:15:00Z',
    updated_at: '2026-10-22T06:15:00Z'
  },
  declined: {
    id: 'user-declined',
    email: 'unregistered.applicant@test.com',
    full_name: 'Dr. Vikrant Joshi',
    display_name: 'Dr. Vikrant',
    role: 'applicant',
    account_type: 'doctor',
    status: 'declined',
    qualification: 'Diploma',
    experience_years: 2,
    registration_number: 'INVALID/999',
    registration_authority: 'Non-recognized institute',
    state: 'Maharashtra',
    city: 'Mumbai',
    bio: 'Registration could not be validated against official state register.',
    created_at: '2026-10-18T10:00:00Z',
    updated_at: '2026-10-19T12:00:00Z'
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('homeocircle_current_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return TEST_USERS.member;
      }
    }
    return TEST_USERS.member;
  });

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('homeocircle_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('homeocircle_current_user');
    }
  }, [currentUser]);

  const loginAs = (type: 'member' | 'doctor' | 'student' | 'researcher' | 'admin' | 'applicant' | 'declined' | 'public') => {
    if (type === 'public') {
      setCurrentUser(null);
    } else {
      const selected = TEST_USERS[type] || TEST_USERS.member;
      setCurrentUser(selected);
    }
  };

  const loginWithEmail = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return { success: false, error: error.message };
        if (data.user) {
          const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
          if (profile) setCurrentUser(profile);
          return { success: true };
        }
      } catch (err: any) {
        return { success: false, error: err.message || 'Authentication error' };
      }
    }

    // Local authentication matching
    const emailLower = email.toLowerCase();
    if (emailLower.includes('admin') || emailLower.includes('sanjeev')) {
      setCurrentUser(TEST_USERS.admin);
      return { success: true };
    } else if (emailLower.includes('student') || emailLower.includes('rahul')) {
      setCurrentUser(TEST_USERS.student);
      return { success: true };
    } else if (emailLower.includes('research') || emailLower.includes('arjun')) {
      setCurrentUser(TEST_USERS.researcher);
      return { success: true };
    } else if (emailLower.includes('rohit') || emailLower.includes('applicant')) {
      setCurrentUser(TEST_USERS.applicant);
      return { success: true };
    } else {
      setCurrentUser(TEST_USERS.member);
      return { success: true };
    }
  };

  const logout = () => {
    if (isSupabaseConfigured && supabase) {
      supabase.auth.signOut().catch(console.error);
    }
    setCurrentUser(null);
  };

  const updateCurrentUser = (updates: Partial<UserProfile>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...updates, updated_at: new Date().toISOString() };
    setCurrentUser(updated);

    // Also sync into local members storage
    try {
      const savedMembers = localStorage.getItem('homeocircle_members');
      if (savedMembers) {
        const list: UserProfile[] = JSON.parse(savedMembers);
        const nextList = list.map(m => m.id === updated.id ? updated : m);
        localStorage.setItem('homeocircle_members', JSON.stringify(nextList));
      }
    } catch (e) {
      console.warn('Syncing member update failed', e);
    }
  };

  const isAuthenticated = Boolean(currentUser);
  const role: UserRole = currentUser ? currentUser.role : 'public';
  const status: ApplicationStatus = currentUser ? currentUser.status : 'draft';
  
  // Security rule: Only approved users with status === 'verified' can access member community features
  const isVerifiedMember = Boolean(
    currentUser && 
    currentUser.status === 'verified' &&
    ['member', 'doctor', 'student', 'researcher', 'moderator', 'admin', 'super_admin'].includes(currentUser.role)
  );

  const isAdmin = Boolean(currentUser && (currentUser.role === 'admin' || currentUser.role === 'super_admin'));
  const isDoctor = Boolean(currentUser && (currentUser.role === 'doctor' || currentUser.role === 'member'));
  const isStudent = Boolean(currentUser && currentUser.role === 'student');
  const isResearcher = Boolean(currentUser && currentUser.role === 'researcher');
  const isApplicant = Boolean(currentUser && currentUser.role === 'applicant' && (currentUser.status === 'pending_review' || currentUser.status === 'submitted' || currentUser.status === 'needs_information'));

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role,
        status,
        isAuthenticated,
        isVerifiedMember,
        isAdmin,
        isDoctor,
        isStudent,
        isResearcher,
        isApplicant,
        loginAs,
        loginWithEmail,
        logout,
        updateCurrentUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
