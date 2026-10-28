import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole, ApplicationStatus } from '../types';
import { initialMembers } from '../lib/mockData';
import { supabase, isDemoMode } from '../lib/supabase';

interface AuthContextType {
  currentUser: UserProfile | null;
  role: UserRole;
  status: ApplicationStatus;
  isAuthenticated: boolean;
  authLoading: boolean;
  isDemoMode: boolean;
  isVerifiedMember: boolean;
  isAdmin: boolean;
  isDoctor: boolean;
  isStudent: boolean;
  isResearcher: boolean;
  isApplicant: boolean;
  loginAs: (type: 'member' | 'doctor' | 'student' | 'researcher' | 'admin' | 'applicant' | 'declined' | 'public') => void;
  loginWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateCurrentUser: (updates: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo profiles — only usable in demo mode (no Supabase configured)
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

const DEMO_USER_KEY = 'homeocircle_current_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Nobody is signed in by default. In demo mode (no Supabase configured) the
  // chosen demo profile is remembered locally; in live mode the session comes
  // only from Supabase Auth and the profile from the database — never from
  // localStorage, which the user can edit.
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    if (!isDemoMode) return null;
    try {
      const saved = localStorage.getItem(DEMO_USER_KEY);
      return saved ? (JSON.parse(saved) as UserProfile) : null;
    } catch {
      return null;
    }
  });
  const [authLoading, setAuthLoading] = useState<boolean>(!isDemoMode);

  // Demo mode: remember the selected demo profile across reloads.
  useEffect(() => {
    if (!isDemoMode) return;
    try {
      if (currentUser) localStorage.setItem(DEMO_USER_KEY, JSON.stringify(currentUser));
      else localStorage.removeItem(DEMO_USER_KEY);
    } catch {
      // Storage can be unavailable (private mode); demo state then lasts for the tab only.
    }
  }, [currentUser]);

  // Live mode: restore the Supabase session and follow sign-in / sign-out / expiry.
  useEffect(() => {
    if (!supabase) return;
    const client = supabase;
    // Remove any profile a previous demo build may have cached.
    try { localStorage.removeItem(DEMO_USER_KEY); } catch { /* ignore */ }

    let active = true;
    const loadProfile = async (userId: string | undefined) => {
      if (!userId) {
        if (active) { setCurrentUser(null); setAuthLoading(false); }
        return;
      }
      const { data, error } = await client.from('profiles').select('*').eq('id', userId).maybeSingle();
      if (!active) return;
      if (error) console.error('Could not load your profile', error.message);
      setCurrentUser((data as UserProfile | null) ?? null);
      setAuthLoading(false);
    };

    client.auth.getSession().then(({ data }) => loadProfile(data.session?.user.id));
    const { data: sub } = client.auth.onAuthStateChange((_event, session) => {
      // Defer the query so it doesn't run inside the auth callback's lock.
      setTimeout(() => loadProfile(session?.user.id), 0);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const loginAs = (type: 'member' | 'doctor' | 'student' | 'researcher' | 'admin' | 'applicant' | 'declined' | 'public') => {
    if (!isDemoMode) return; // demo profiles do not exist when a real backend is connected
    setCurrentUser(type === 'public' ? null : (TEST_USERS[type] || TEST_USERS.member));
  };

  const loginWithEmail = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { success: false, error: error.message };
      if (!data.user) return { success: false, error: 'Sign-in did not complete. Please try again.' };
      const { data: profile, error: profileError } = await supabase
        .from('profiles').select('*').eq('id', data.user.id).maybeSingle();
      if (profileError || !profile) {
        return { success: false, error: 'Signed in, but your member profile could not be loaded. Please contact support.' };
      }
      setCurrentUser(profile as UserProfile);
      return { success: true };
    }

    // Demo mode only: pick a demo profile from keywords in the email.
    const emailLower = email.toLowerCase();
    if (emailLower.includes('admin') || emailLower.includes('sanjeev')) setCurrentUser(TEST_USERS.admin);
    else if (emailLower.includes('student') || emailLower.includes('rahul')) setCurrentUser(TEST_USERS.student);
    else if (emailLower.includes('research') || emailLower.includes('arjun')) setCurrentUser(TEST_USERS.researcher);
    else if (emailLower.includes('rohit') || emailLower.includes('applicant')) setCurrentUser(TEST_USERS.applicant);
    else setCurrentUser(TEST_USERS.member);
    return { success: true };
  };

  const requestPasswordReset = async (email: string): Promise<{ success: boolean; error?: string }> => {
    if (!supabase) return { success: true }; // demo mode: nothing to send
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return error ? { success: false, error: error.message } : { success: true };
  };

  const updatePassword = async (password: string): Promise<{ success: boolean; error?: string }> => {
    if (!supabase) return { success: false, error: 'Password changes need a connected backend.' };
    const { error } = await supabase.auth.updateUser({ password });
    return error ? { success: false, error: error.message } : { success: true };
  };

  const logout = () => {
    if (supabase) {
      supabase.auth.signOut().catch(console.error);
    }
    setCurrentUser(null);
  };

  const updateCurrentUser = (updates: Partial<UserProfile>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...updates, updated_at: new Date().toISOString() };
    setCurrentUser(updated);
    if (!isDemoMode) return;

    // Demo mode: keep the local member directory in sync
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
        authLoading,
        isDemoMode,
        isVerifiedMember,
        isAdmin,
        isDoctor,
        isStudent,
        isResearcher,
        isApplicant,
        loginAs,
        loginWithEmail,
        requestPasswordReset,
        updatePassword,
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
