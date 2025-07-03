import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface User {
  id: number;
  email: string;
  username?: string;
  phone?: string;
  storeProfile?: any;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ error?: any }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
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
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const queryClient = useQueryClient();

  // Query to check authentication status
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/me'],
    queryFn: async () => {
      const response = await fetch('/api/me', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Not authenticated');
      }
      
      return response.json();
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update auth state when query data changes
  useEffect(() => {
    if (data && data.authenticated) {
      setUser(data.user);
      setIsAuthenticated(true);
    } else {
      setUser(null);
      setIsAuthenticated(false);
    }
  }, [data]);

  // Clear auth state on error
  useEffect(() => {
    if (error) {
      setUser(null);
      setIsAuthenticated(false);
    }
  }, [error]);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData.user);
        setIsAuthenticated(true);
        // Invalidate and refetch user data
        queryClient.invalidateQueries({ queryKey: ['/api/me'] });
        return { error: null };
      } else {
        const errorData = await response.json();
        return { error: { message: errorData.error || 'Login failed' } };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { error: { message: 'Network error occurred' } };
    }
  };

  const logout = async () => {
    try {
      const response = await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include',
      });
      
      if (response.ok) {
        // Clear user state
        setUser(null);
        setIsAuthenticated(false);
        
        // Clear React Query cache
        queryClient.clear();
        
        // Navigate to home page
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const checkAuth = async () => {
    await refetch();
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};