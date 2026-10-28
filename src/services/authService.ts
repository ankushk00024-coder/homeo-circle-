import { supabase, isSupabaseConfigured, getRequiredSupabase } from './supabaseClient';
import { UserProfile, AccountType } from '../types';

export interface SignUpParams {
  email: string;
  password: string;
  fullName: string;
  accountType?: AccountType;
  qualification?: string;
  state?: string;
  clinicInstitution?: string;
  specialization?: string;
  registrationNumber?: string;
  registrationAuthority?: string;
}

export const authService = {
  /**
   * Registers a new user with Supabase Auth and initial metadata.
   * Triggers the PostgreSQL on_auth_user_created hook to populate public.profiles.
   */
  async signUp(params: SignUpParams) {
    const client = getRequiredSupabase();
    const { data, error } = await client.auth.signUp({
      email: params.email.trim(),
      password: params.password,
      options: {
        data: {
          full_name: params.fullName.trim(),
          account_type: params.accountType || 'doctor',
          qualification: params.qualification || 'BHMS',
          state: params.state || 'Maharashtra',
          clinic_institution: params.clinicInstitution,
          specialization: params.specialization,
          registration_number: params.registrationNumber,
          registration_authority: params.registrationAuthority
        }
      }
    });

    if (error) throw error;
    return data;
  },

  /**
   * Signs in an existing user with email and password.
   */
  async signIn(email: string, password: string) {
    const client = getRequiredSupabase();
    const { data, error } = await client.auth.signInWithPassword({
      email: email.trim(),
      password
    });

    if (error) throw error;
    return data;
  },

  /**
   * Initiates Google OAuth sign-in flow.
   */
  async signInWithGoogle(redirectTo?: string) {
    const client = getRequiredSupabase();
    const destination = redirectTo || `${window.location.origin}/community`;
    const { data, error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: destination
      }
    });
    if (error) throw error;
    return data;
  },

  /**
   * Signs out the currently authenticated user.
   */
  async signOut() {
    if (!isSupabaseConfigured || !supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  /**
   * Dispatches a password reset email using Supabase Auth.
   */
  async resetPassword(email: string) {
    const client = getRequiredSupabase();
    const { data, error } = await client.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/login?reset=true`
    });

    if (error) throw error;
    return data;
  },

  /**
   * Gets the active session from Supabase Auth.
   */
  async getSession() {
    if (!isSupabaseConfigured || !supabase) return null;
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.warn('Error fetching Supabase auth session:', error);
      return null;
    }
    return data.session;
  },

  /**
   * Subscribes to auth state changes.
   */
  onAuthStateChange(callback: (session: any) => void) {
    if (!isSupabaseConfigured || !supabase) {
      return { unsubscribe: () => {} };
    }
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(session);
    });
    return { unsubscribe: () => data.subscription.unsubscribe() };
  }
};
