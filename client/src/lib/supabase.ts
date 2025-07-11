import { createClient } from '@supabase/supabase-js';

// Get Supabase configuration from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://kwdzbssuovwemthmiuht.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3ZHpic3N1b3Z3ZW10aG1pdWh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NDEyMDYsImV4cCI6MjA2NzExNzIwNn0.7AGomhrpXHBnSgJ15DxFMi80E479S9w9mIeqMnsvNrA';

// Validate required environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing required Supabase environment variables');
}

// Create Supabase client
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

export const supabase = supabaseClient;

// Export simplified auth methods
export const auth = {
  signUp: (credentials: any, options?: any) => {
    if (options) {
      return supabaseClient.auth.signUp({ ...credentials, options });
    }
    return supabaseClient.auth.signUp(credentials);
  },
  signInWithOtp: (credentials: any) => supabaseClient.auth.signInWithOtp(credentials),
  signInWithPassword: (credentials: any) => supabaseClient.auth.signInWithPassword(credentials),
  getSession: () => supabaseClient.auth.getSession(),
  getUser: () => supabaseClient.auth.getUser(),
  signOut: () => supabaseClient.auth.signOut(),
  onAuthStateChange: (callback: any) => supabaseClient.auth.onAuthStateChange(callback)
};

export default supabase;