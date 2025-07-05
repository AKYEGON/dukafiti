import { createClient } from '@supabase/supabase-js'
// Use both VITE_ and REACT_APP_ prefixes for compatibility
const url = import.meta.env.VITE_SUPABASE_URL ||
           import.meta.env.REACT_APP_SUPABASE_URL ||
           'https://kwdzbssuovwemthmiuht.supabase.co'
const key = import.meta.env.VITE_SUPABASE_ANON_KEY ||
           import.meta.env.REACT_APP_SUPABASE_ANON_KEY ||
           'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3ZHpic3N1b3Z3ZW10aG1pdWh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NDEyMDYsImV4cCI6MjA2NzExNzIwNn0.7AGomhrpXHBnSgJ15DxFMi80E479S9w9mIeqMnsvNrA'
export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false
  },
  global: {
    headers: {
      'x-client-name': 'dukafiti-web'
    }
  }
});