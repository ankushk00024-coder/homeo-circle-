import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Read configuration from environment variables
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabaseKey = (
  import.meta.env.VITE_SUPABASE_ANON_KEY || 
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 
  ''
).trim();

// Determine if valid production or staging Supabase credentials are provided
export const isSupabaseConfigured: boolean = Boolean(
  supabaseUrl &&
  supabaseKey &&
  supabaseUrl.startsWith('http') &&
  !supabaseUrl.includes('placeholder') &&
  !supabaseUrl.includes('your-project-id') &&
  !supabaseUrl.includes('your-supabase-url') &&
  !supabaseKey.includes('your-anon-key') &&
  !supabaseKey.includes('your-publishable-key')
);

// Singleton Supabase Client
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null;

/**
 * Custom error thrown when an action requires a configured Supabase backend.
 */
export class BackendConfigError extends Error {
  constructor(message = 'Supabase backend is not configured. Please define VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.') {
    super(message);
    this.name = 'BackendConfigError';
  }
}

/**
 * Returns the active Supabase client or throws a BackendConfigError.
 */
export function getRequiredSupabase(): SupabaseClient {
  if (!isSupabaseConfigured || !supabase) {
    throw new BackendConfigError();
  }
  return supabase;
}
