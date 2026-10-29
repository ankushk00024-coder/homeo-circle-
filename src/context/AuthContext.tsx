import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { UserProfile, UserRole, ApplicationStatus } from '../types';
import { initialMembers } from '../lib/mockData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { SignUpParams } from '../services/authService';

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
  loading: boolean;
  /** Alias of `loading`, used by newer pages. */
  authLoading: boolean;
  isBackendConfigured: boolean;
  /** True when no Supabase backend is configured (sample data, demo logins). */
  isDemoMode: boolean;
  updatePassword: (password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (params: SignUpParams) => Promise<{ success: boolean; needsEmailConfirmation?: boolean; error?: string }>;
  loginWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: (redirectTo?: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateCurrentUser: (updates: Partial<UserProfile>) => Promise<void>;
  loginAs: (type: 'member' | 'doctor' | 'student' | 'researcher' | 'admin' | 'applicant' | 'declined' | 'public') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Preset test profiles for offline development and UI layout inspection
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

/**
 * Safely resolves a UserProfile for an authenticated Supabase user.
 * 1. Checks public.profiles.
 * 2. If row not found (e.g. Google OAuth or trigger latency), constructs a valid profile from user metadata.
 * 3. Attempts non-blocking upsert to public.profiles.
 */
async function resolveOrCreateProfile(client: any, user: any): Promise<UserProfile> {
  try {
    const { data: profile, error } = await client
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (profile && !error) {
      return profile;
    }
  } catch (err) {
    console.warn('Could not query public.profiles:', err);
  }

  const fullName = user.user_metadata?.full_name || 
                   user.user_metadata?.name || 
                   user.email?.split('@')[0] || 
                   'Member';

  const avatar = user.user_metadata?.avatar_url || 
                 user.user_metadata?.picture || 
                 undefined;

  const fallback: UserProfile = {
    id: user.id,
    email: user.email || '',
    full_name: fullName,
    display_name: fullName,
    avatar_url: avatar,
    // Never trust user_metadata for privileges: the database also forces
    // role/status on self-created profiles (see 20261029000000_launch_fixes).
    role: 'member',
    status: 'pending',
    verification_status: 'pending',
    qualification: user.user_metadata?.qualification || 'Not specified',
    experience_years: 0,
    state: user.user_metadata?.state || 'Not specified',
    created_at: user.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  try {
    const { data: inserted, error: insErr } = await client
      .from('profiles')
      .upsert([fallback], { onConflict: 'id' })
      .select()
      .maybeSingle();

    if (inserted && !insErr) {
      return inserted;
    }
  } catch (e) {
    // Non-breaking fallback to in-memory profile
  }

  return fallback;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Security: with a real backend the user ALWAYS comes from the Supabase
  // session, never from localStorage (which anyone can edit, e.g. to set
  // "role": "admin"). Saved profiles are only used in offline demo mode, and
  // nobody is signed in by default.
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    if (isSupabaseConfigured) return null;
    const saved = localStorage.getItem('homeocircle_current_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [loading, setLoading] = useState(true);
  // While signUp() runs, ignore Supabase's automatic SIGNED_IN event so a new
  // account is NOT logged in: the product flow is sign up → log in.
  const signingUpRef = useRef(false);

  // Sync session with Supabase Auth when credentials are configured
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    const client = supabase;

    // 1. Initial active session restoration
    client.auth.getSession().then(async ({ data: { session }, error }) => {
      if (error) {
        console.warn('Session restoration failed:', error.message);
        setLoading(false);
        return;
      }

      if (session?.user) {
        try {
          const profile = await resolveOrCreateProfile(client, session.user);
          setCurrentUser(profile);
          localStorage.setItem('homeocircle_current_user', JSON.stringify(profile));
        } catch (fetchErr) {
          console.error('Error restoring profile from Supabase:', fetchErr);
        }
      } else {
        // No Supabase session means signed out. Never restore a saved
        // profile here: it is user-editable and could claim an admin role.
        setCurrentUser(null);
        localStorage.removeItem('homeocircle_current_user');
      }
      setLoading(false);
    });

    // 2. Reactive subscription to Supabase auth state transitions
    const { data: { subscription } } = client.auth.onAuthStateChange(async (event, session) => {
      if (signingUpRef.current) return;
      if (session?.user) {
        try {
          const profile = await resolveOrCreateProfile(client, session.user);
          setCurrentUser(profile);
          localStorage.setItem('homeocircle_current_user', JSON.stringify(profile));
        } catch (err) {
          console.error('Error fetching profile on auth state change:', err);
        }
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        localStorage.removeItem('homeocircle_current_user');
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Demo mode only: remember the chosen demo profile across reloads
  useEffect(() => {
    if (isSupabaseConfigured) return;
    if (currentUser) {
      localStorage.setItem('homeocircle_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('homeocircle_current_user');
    }
  }, [currentUser]);

  /**
   * Registers a new user with Supabase Auth.
   */
  const signUp = async (params: SignUpParams): Promise<{ success: boolean; needsEmailConfirmation?: boolean; error?: string }> => {
    if (!isSupabaseConfigured || !supabase) {
      return {
        success: false,
        error: 'Account registration needs the Supabase backend. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable it.'
      };
    }

    signingUpRef.current = true;
    try {
      const { data, error } = await supabase.auth.signUp({
        email: params.email.trim(),
        password: params.password,
        options: {
          // Confirmation emails bring the user back to the sign-in page.
          emailRedirectTo: `${window.location.origin}/login?confirmed=1`,
          data: {
            full_name: params.fullName.trim(),
            ...(params.accountType ? { account_type: params.accountType } : {}),
            qualification: params.qualification,
            state: params.state,
            clinic_institution: params.clinicInstitution,
            specialization: params.specialization,
            registration_number: params.registrationNumber,
            registration_authority: params.registrationAuthority
          }
        }
      });

      if (error) return { success: false, error: error.message };

      // With email confirmation on, Supabase reports success (and sends no
      // email) when the address is already registered: identities is empty.
      if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        return { success: false, error: 'An account with this email already exists. Please sign in instead.' };
      }

      if (data.session) {
        // Email confirmation is off, so Supabase signed the user in. End that
        // session: the user logs in explicitly on the sign-in page next.
        await supabase.auth.signOut();
        setCurrentUser(null);
        return { success: true, needsEmailConfirmation: false };
      }

      return { success: true, needsEmailConfirmation: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Registration failed' };
    } finally {
      signingUpRef.current = false;
    }
  };

  /**
   * Email & password login via Supabase Auth with fallback for evaluator admin profiles.
   */
  const loginWithEmail = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();

    // 1. Evaluator demo accounts — ONLY when no backend is configured. With a
    //    real backend these emails go through Supabase Auth like everyone else
    //    (otherwise anyone could type admin@homeocircle.in and become admin).
    if (!isSupabaseConfigured && (cleanEmail === 'admin@homeocircle.in' || cleanEmail === 'admin' || cleanEmail === 'admin@test.com')) {
      if (!password || password.trim().length === 0) {
        return { success: false, error: 'Please enter a password.' };
      }
      setCurrentUser(TEST_USERS.admin);
      localStorage.setItem('homeocircle_current_user', JSON.stringify(TEST_USERS.admin));
      return { success: true };
    }

    if (!isSupabaseConfigured && (cleanEmail === 'ananya@homeocircle.in' || cleanEmail === 'doctor@homeocircle.in' || cleanEmail === 'member@homeocircle.in')) {
      setCurrentUser(TEST_USERS.member);
      localStorage.setItem('homeocircle_current_user', JSON.stringify(TEST_USERS.member));
      return { success: true };
    }

    if (!isSupabaseConfigured && (cleanEmail === 'rohit@homeocircle.in' || cleanEmail === 'applicant@homeocircle.in')) {
      setCurrentUser(TEST_USERS.applicant);
      localStorage.setItem('homeocircle_current_user', JSON.stringify(TEST_USERS.applicant));
      return { success: true };
    }

    // 2. Try real Supabase Auth if configured
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ 
          email: cleanEmail, 
          password 
        });

        if (error) {
          return { success: false, error: error.message };
        }

        if (data?.user) {
          const profile = await resolveOrCreateProfile(supabase, data.user);
          setCurrentUser(profile);
          localStorage.setItem('homeocircle_current_user', JSON.stringify(profile));
          return { success: true };
        }
      } catch (err: any) {
        return { success: false, error: err.message || 'Authentication failed' };
      }
    }

    if (!isSupabaseConfigured || !supabase) {
      return { 
        success: false, 
        error: 'Supabase backend is not configured. For admin access, use: admin@homeocircle.in / admin123' 
      };
    }

    return { 
      success: false, 
      error: 'Invalid email or password.' 
    };
  };

  /**
   * Initiates Google OAuth sign-in flow.
   */
  const signInWithGoogle = async (redirectTo?: string): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured || !supabase) {
      return { 
        success: false, 
        error: 'Supabase backend is not configured. Please define VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.' 
      };
    }
    try {
      const destination = redirectTo || `${window.location.origin}/community`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: destination
        }
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Google sign-in initiation failed.' };
    }
  };

  /**
   * Triggers password reset email via Supabase Auth.
   */
  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured || !supabase) {
      return { 
        success: false, 
        error: 'Supabase backend is not configured. Please define VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.' 
      };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Password reset request failed' };
    }
  };

  /**
   * Sets a new password for the signed-in user (used after a recovery email).
   */
  const updatePassword = async (password: string): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Password changes need a connected backend.' };
    }
    const { error } = await supabase.auth.updateUser({ password });
    return error ? { success: false, error: error.message } : { success: true };
  };

  /**
   * Signs out current user from Supabase session.
   */
  const logout = () => {
    if (isSupabaseConfigured && supabase) {
      supabase.auth.signOut().catch(console.error);
    }
    setCurrentUser(null);
    localStorage.removeItem('homeocircle_current_user');
  };

  /**
   * Updates user profile fields in Supabase database and local state.
   */
  const updateCurrentUser = async (updates: Partial<UserProfile>): Promise<void> => {
    if (!currentUser) return;

    if (isSupabaseConfigured && supabase && currentUser.id) {
      // Save first, then show what the database actually stored (its triggers
      // keep role/account_type in sync and may reset the verification badge).
      // Previously the screen updated even when the save was rejected.
      const { id: _id, email: _email, created_at: _created, ...changes } = updates as Partial<UserProfile> & Record<string, unknown>;
      const { data, error } = await supabase
        .from('profiles')
        .update(changes)
        .eq('id', currentUser.id)
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      setCurrentUser(data as UserProfile);
      return;
    }

    // Demo mode: local only
    setCurrentUser({ ...currentUser, ...updates, updated_at: new Date().toISOString() });
  };

  /**
   * Quick role switcher for offline frontend UI inspection during development.
   */
  const loginAs = (type: 'member' | 'doctor' | 'student' | 'researcher' | 'admin' | 'applicant' | 'declined' | 'public') => {
    if (isSupabaseConfigured) return; // demo profiles do not exist with a real backend
    if (type === 'public') {
      setCurrentUser(null);
    } else {
      const selected = TEST_USERS[type] || TEST_USERS.member;
      setCurrentUser(selected);
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
  const isApplicant = Boolean(
    currentUser && 
    currentUser.role === 'applicant' && 
    (currentUser.status === 'pending_review' || currentUser.status === 'submitted' || currentUser.status === 'needs_information')
  );

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
        loading,
        authLoading: loading,
        isBackendConfigured: isSupabaseConfigured,
        isDemoMode: !isSupabaseConfigured,
        updatePassword,
        signUp,
        loginWithEmail,
        signInWithGoogle,
        resetPassword,
        logout,
        updateCurrentUser,
        loginAs
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
