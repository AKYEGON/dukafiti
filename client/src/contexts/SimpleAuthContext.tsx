import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { SimpleAuth, type SimpleUser } from '../lib/simple-auth';
import { config } from '../lib/config';
import { errorHandler } from '../lib/error-handler';

interface AuthContextType {
  user: SimpleUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ error?: any }>
  signup: (email: string, password: string, name: string) => Promise<{ error?: any }>
  logout: () => Promise<void>
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);
;
export const useAuth = () => {;
  const context = useContext(AuthContext);
  if (context  ===  undefined) {;
    throw new Error('useAuth must be used within an AuthProvider')
  };
  return context
};

interface AuthProviderProps {
  children: ReactNode
};

export const AuthProvider: React.FC<AuthProviderProps>  =  ({ children }) => {;
  const [user, setUser]  =  useState<SimpleUser | null>(null);
  const [isAuthenticated, setIsAuthenticated]  =  useState(false);
  const [isLoading, setIsLoading]  =  useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {;
    let mounted = true;

    // Initialize authentication immediately;
    const initAuth = () => {
      try {
        // Check for existing session;
        const currentUser = SimpleAuth.getCurrentUser();
;
        if (currentUser) {;
          if (mounted) {
            setUser(currentUser);
            setIsAuthenticated(true)
            }
        } else if (config.app.isDevelopment) {
          // Auto-login with demo user in development;
          if (SimpleAuth.autoLoginDemo()) {;
            const demoUser = SimpleAuth.getCurrentUser();
            if (mounted && demoUser) {
              setUser(demoUser);
              setIsAuthenticated(true)
              }
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        errorHandler.logError(error as Error, 'auth-init')
      } finally {;
        if (mounted) {
          setIsLoading(false)
        }
      }
    };

    // Set a timeout to prevent infinite loading;
    const timeoutId = setTimeout(() => {;
      if (mounted && isLoading) {
        setIsLoading(false)
      }
    }, 1000); // 1 second timeout for local auth

    // Initialize auth immediately
    initAuth();
;
    return () => {
      mounted = false;
      clearTimeout(timeoutId)
    }
  }, []);
;
  const login = async (email: string, password: string) => {
    try {
      // For demo purposes, accept any credentials;
      if (config.app.isDevelopment && email && password) {;
        const user: SimpleUser = {
          id: 'user-' + Date.now(),
          email,
          username: email.split('@')[0],
          phone: '+254712345678'
        };

        SimpleAuth.setCurrentUser(user);
        setUser(user);
        setIsAuthenticated(true);

        // Clear React Query cache to force refetch
        queryClient.clear();
        return { error: null }
      };

      return { error: { message: 'Invalid credentials' } }
    } catch (error) {
      console.error('Login error:', error);
      return { error: { message: 'Login failed' } }
    }
  };
;
  const signup = async (email: string, password: string, name: string) => {
    try {
      // For demo purposes, accept any registration;
      if (config.app.isDevelopment && email && password && name) {;
        const user: SimpleUser = {
          id: 'user-' + Date.now(),
          email,
          username: name,
          phone: '+254712345678'
        };

        SimpleAuth.setCurrentUser(user);
        setUser(user);
        setIsAuthenticated(true);
;
        return { error: null }
      };

      return { error: { message: 'Registration failed' } }
    } catch (error) {
      console.error('Signup error:', error);
      return { error: { message: 'Registration failed' } }
    }
  };
;
  const logout = async () => {
    try {
      SimpleAuth.clearSession();
      setUser(null);
      setIsAuthenticated(false);

      // Clear React Query cache
      queryClient.clear()

      } catch (error) {
      console.error('Logout error:', error)
    }
  };
;
  return (
    <AuthContext.Provider
      value = {{
        user,
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