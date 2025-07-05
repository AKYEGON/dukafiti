import { createClient } from '@supabase/supabase-js';

// Environment variables with validation
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate required environment variables
if (!supabaseUrl) {
  console.error('❌ Missing VITE_SUPABASE_URL environment variable');
  console.log('📝 To fix this:');
  console.log('1. Get your Supabase URL from https://supabase.com/dashboard');
  console.log('2. Add VITE_SUPABASE_URL as a Replit secret');
  console.log('3. Restart the development server');
  throw new Error('Missing required environment variable: VITE_SUPABASE_URL');
}

if (!supabaseAnonKey) {
  console.error('❌ Missing VITE_SUPABASE_ANON_KEY environment variable');
  console.log('📝 To fix this:');
  console.log('1. Get your Supabase Anon Key from https://supabase.com/dashboard');
  console.log('2. Add VITE_SUPABASE_ANON_KEY as a Replit secret');
  console.log('3. Restart the development server');
  throw new Error('Missing required environment variable: VITE_SUPABASE_ANON_KEY');
}

// Create Supabase client
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        'x-client-name': 'dukafiti-web'
      }
    }
  }
);

// Export configuration status for debugging
export const isConfigured = !!(supabaseUrl && supabaseAnonKey);