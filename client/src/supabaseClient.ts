import { createClient } from '@supabase/supabase-js';

// Environment variables with validation
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate required environment variables
if (!supabaseUrl || supabaseUrl === 'your_supabase_project_url_here') {
  console.error('❌ Missing VITE_SUPABASE_URL environment variable');
  console.log('📝 To fix this:');
  console.log('1. Get your Supabase URL from https://supabase.com/dashboard');
  console.log('2. Add VITE_SUPABASE_URL=your_actual_url to your .env file');
  console.log('3. Restart the development server');
}

if (!supabaseAnonKey || supabaseAnonKey === 'your_supabase_anon_key_here') {
  console.error('❌ Missing VITE_SUPABASE_ANON_KEY environment variable');
  console.log('📝 To fix this:');
  console.log('1. Get your Supabase Anon Key from https://supabase.com/dashboard');
  console.log('2. Add VITE_SUPABASE_ANON_KEY=your_actual_key to your .env file');
  console.log('3. Restart the development server');
}

// Create Supabase client with fallback values for development
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
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
export const isConfigured = !!(supabaseUrl && supabaseAnonKey && 
  supabaseUrl !== 'your_supabase_project_url_here' && 
  supabaseAnonKey !== 'your_supabase_anon_key_here');