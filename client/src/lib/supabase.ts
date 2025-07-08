import { createClient } from '@supabase/supabase-js';

// Development fallback for demo purposes
// Replace with real Supabase credentials in production
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://demo.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'demo-key-for-development-only';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);