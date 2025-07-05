import { createClient } from '@supabase/supabase-js'
// Get Supabase config from the server
async function getSupabaseConfig() {
  try {
    const response = await fetch('/api/supabase-config')
    const config = await response.json()
    return config
  } catch (error) {
    console.error('Failed to get Supabase config:', error)
    throw new Error('Failed to initialize Supabase client')
  }
}

// Create Supabase client with config from server
let supabaseClient: ReturnType<typeof createClient> | null = null
export async function getSupabaseClient() {
  if (!supabaseClient) {
    const config = await getSupabaseConfig()
    supabaseClient = createClient(config.url, config.anonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
  }
  return supabaseClient
}
export const supabase = {
  auth: {
    async signUp(credentials: any, options?: any) {
      const client = await getSupabaseClient()
      if (options) {
        return client.auth.signUp({ ...credentials, options })
      }
      return client.auth.signUp(credentials)
    },
    async signInWithOtp(credentials: any) {
      const client = await getSupabaseClient()
      return client.auth.signInWithOtp(credentials)
    },
    async signInWithPassword(credentials: any) {
      const client = await getSupabaseClient()
      return client.auth.signInWithPassword(credentials)
    },
    async getSession() {
      const client = await getSupabaseClient()
      return client.auth.getSession()
    },
    async getUser() {
      const client = await getSupabaseClient()
      return client.auth.getUser()
    },
    async signOut() {
      const client = await getSupabaseClient()
      return client.auth.signOut()
    },
    onAuthStateChange(callback: any) {
      getSupabaseClient().then(client => {
        client.auth.onAuthStateChange(callback)
      })
    }
  }
}

export default supabase;