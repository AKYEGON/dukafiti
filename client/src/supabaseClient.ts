import { createClient } from '@supabase/supabase-js';
import { config, validateConfig } from './lib/config';

// Validate configuration
const configValidation = validateConfig();
if (!configValidation.isValid) {
  console.error('Configuration validation failed:', configValidation.errors);
  if (config.app.isProduction) {
    throw new Error('Invalid configuration for production deployment');
  }
}

export const supabase = createClient(
  config.supabase.url,
  config.supabase.anonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false, // Prevent issues with URL-based auth detection
    },
    global: {
      headers: {
        'x-client-name': 'dukafiti-web'
      }
    }
  }
);