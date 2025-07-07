import { createClient } from '@supabase/supabase-js';
import { config } from './lib/config';

// Get Supabase configuration from environment variables
const supabaseUrl = config.supabase.url;
const supabaseAnonKey = config.supabase.anonKey;

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

// Create admin client with service role key (for server-side operations)
export const supabaseAdmin = createClient(
  supabaseUrl,
  config.supabase.serviceRoleKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        'x-client-name': 'dukafiti-admin'
      }
    }
  }
);

// Export configuration status
export const isConfigured = !!(supabaseUrl && supabaseAnonKey);
export const isDevMode = config.app.isDevelopment;