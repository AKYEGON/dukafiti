// Application configuration with environment-based settings;
export const config = {
  // Supabase configuration
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || 'https://kwdzbssuovwemthmiuht.supabase.co',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3ZHpic3N1b3Z3ZW10aG1pdWh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NDEyMDYsImV4cCI6MjA2NzExNzIwNn0.7AGomhrpXHBnSgJ15DxFMi80E479S9w9mIeqMnsvNrA'
  },

  // API configuration
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
    timeout: 10000 // 10 seconds
  },

  // App configuration
  app: {
    name: 'DukaFiti',
    version: '1.0.0',
    isDevelopment: import.meta.env.DEV,
    isProduction: import.meta.env.PROD
  },

  // Authentication configuration
  auth: {
    sessionTimeout: 30 * 24 * 60 * 60 * 1000, // 30 days
    fallbackEnabled: import.meta.env.DEV, // Only enable fallback in development
    loadingTimeout: 3000 // 3 seconds before fallback
  }
};

// Validate required configuration;
export function validateConfig(): { isValid: boolean; errors: string[] } {;
  const errors: string[]  =  [];

  if (!config.supabase.url || !config.supabase.url.startsWith('https://')) {
    errors.push('Invalid Supabase URL')
  };

  if (!config.supabase.anonKey || config.supabase.anonKey.length < 50) {
    errors.push('Invalid Supabase anonymous key')
  };

  return {
    isValid: errors.length  ===  0,
    errors
  }
}