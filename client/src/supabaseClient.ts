import { createClient } from '@supabase/supabase-js';

// Environment variables with validation
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Development mode fallback - allows app to run without Supabase for demonstration
const isDevelopment = import.meta.env.DEV && (!supabaseUrl || !supabaseAnonKey);

if (isDevelopment) {
  console.warn('🚧 Development Mode: Missing Supabase credentials');
  console.log('📝 For full functionality, add these Replit secrets:');
  console.log('   • VITE_SUPABASE_URL');
  console.log('   • VITE_SUPABASE_ANON_KEY');
  console.log('🔧 Using placeholder configuration for development...');
}

// Use fallback values for development mode
const finalSupabaseUrl = supabaseUrl || 'https://placeholder.supabase.co';
const finalSupabaseKey = supabaseAnonKey || 'placeholder-key';

console.log('Initializing Supabase client...');
console.log('VITE_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
console.log('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Missing');

// Create Supabase client
export const supabase = createClient(
  finalSupabaseUrl,
  finalSupabaseKey,
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
export const isDevMode = isDevelopment;