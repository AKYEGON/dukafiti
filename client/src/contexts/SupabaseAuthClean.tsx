import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabaseClient';
import { User, Session } from '@supabase/supabase-js';

interface AuthUser {
  id: string
  email: string
  username?: string
  phone?: string
}

interface AuthContextType {
  user: AuthUser | null
  session: Session | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ error?: any }>
  signup: (email: string, password: string, name?: string) => Promise<{ error?: any }>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    let mounted = true;

    const initSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Error getting session:', error);
        } else if (session && mounted) {
          const authUser: AuthUser = {
            id: session.user.id,
            email: session.user.email || '',
            username: session.user.user_metadata?.name || session.user.email?.split('@')[0],
            phone: session.user.user_metadata?.phone
          };
          setSession(session);
          setUser(authUser);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Session initialization error:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (mounted) {
        setSession(session);

        if (session?.user) {
          const authUser: AuthUser = {
            id: session.user.id,
            email: session.user.email || '',
            username: session.user.user_metadata?.name || session.user.email?.split('@')[0],
            phone: session.user.user_metadata?.phone
          };
          setUser(authUser);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }

        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          queryClient.clear();
        }
      }
    });

    initSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [queryClient]);

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Login error from Supabase:', error);
        return { error };
      }

      return { error: null }
    } catch (error) {
      console.error('Login catch error:', error);
      return { error: { message: 'An unexpected error occurred during login' } }
    }
  };

  const signup = async (email: string, password: string, name?: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name || email.split('@')[0]
          }
        }
      });

      if (error) {
        console.error('Signup error from Supabase:', error);
        return { error };
      }

      return { error: null }
    } catch (error) {
      console.error('Signup catch error:', error);
      return { error: { message: 'An unexpected error occurred during signup' } }
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('Logout error:', error);
      }

      setUser(null);
      setSession(null);
      setIsAuthenticated(false);
      queryClient.clear();
    } catch (error) {
      console.error('Logout catch error:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
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
  );
};