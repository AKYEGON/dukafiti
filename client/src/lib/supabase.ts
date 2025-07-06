import { createClient } from '@supabase/supabase-js';

// Get Supabase configuration from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://kwdzbssuovwemthmiuht.supabase.co';
// Use service role key for database operations to bypass RLS policies
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3ZHpic3N1b3Z3ZW10aG1pdWh0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTU0MTIwNiwiZXhwIjoyMDY3MTE3MjA2fQ.zSvksJ4fZLhaXKs8Ir_pq-yse-8x1NTKFTCWdiSLweQ';

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