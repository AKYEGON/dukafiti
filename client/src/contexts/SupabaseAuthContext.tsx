import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../supabaseClient'
import { User, Session } from '@supabase/supabase-js'
interface AuthContextType {
  user: User | null
  session: Session | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ error?: any }>
  signup: (email: string, password: string) => Promise<{ error?: any }>
  logout: () => Promise<void>
}
const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context  ===  undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
interface AuthProviderProps {
  children: ReactNode
}
export const AuthProvider: React.FC<AuthProviderProps>  =  ({ children }) => {
  const [user, setUser]  =  useState<User | null>(null)
  const [session, setSession]  =  useState<Session | null>(null)
  const [isAuthenticated, setIsAuthenticated]  =  useState(false)
  const [isLoading, setIsLoading]  =  useState(true)
  const queryClient = useQueryClient()
  useEffect(() => {
    let mounted = true
    // Get initial session
    const initSession = async () => {
      try {
        const { data: { session }, error }  =  await supabase.auth.getSession()

        if (error) {
          console.error('Error getting session:', error)
        } else if (session && mounted) {
          setSession(session)
          setUser(session.user)
          setIsAuthenticated(true)
        } else {
          }
      } catch (error) {
        console.error('Session initialization error:', error)
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }
    // Set up auth state listener
    const {
      data: { subscription }
    }  =  supabase.auth.onAuthStateChange(async (event, session) => {
      if (mounted) {
        setSession(session)
        setUser(session?.user ?? null)
        setIsAuthenticated(!!session)
        // Clear React Query cache on auth changes
        if (event  ===  'SIGNED_IN' || event  ===  'SIGNED_OUT') {
          queryClient.clear()
        }
      }
    })
    initSession()

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [queryClient])

  const login = async (email: string, password: string) => {
    try {
      const { data, error }  =  await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        console.error('Login error from Supabase:', error)
        return { error }
      }
      return { error: null }
    } catch (error) {
      console.error('Login catch error:', error)
      return { error: { message: 'An unexpected error occurred during login' } }
    }
  }

  const signup = async (email: string, password: string) => {
    try {
      const { data, error }  =  await supabase.auth.signUp({
        email,
        password
      })

      if (error) {
        console.error('Signup error from Supabase:', error)
        return { error }
      }
      return { error: null }
    } catch (error) {
      console.error('Signup catch error:', error)
      return { error: { message: 'An unexpected error occurred during signup' } }
    }
  }

  const logout = async () => {
    try {
      const { error }  =  await supabase.auth.signOut()

      if (error) {
        console.error('Logout error:', error)
      } else {
        }

      // Clear local state regardless of error
      setUser(null)
      setSession(null)
      setIsAuthenticated(false)
      // Clear React Query cache
      queryClient.clear()
    } catch (error) {
      console.error('Logout catch error:', error)
    }
  }

  return (
    <AuthContext.Provider
      value = {{
        user,
        session,
        isAuthenticated,
        isLoading,
        login,
        signup,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  )
};