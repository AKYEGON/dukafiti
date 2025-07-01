import { createContext, useContext, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: { phone: string; email?: string; name?: string } | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ phone: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["/api/me"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/me", { credentials: "include" });
        if (response.ok) {
          return response.json();
        }
        // For 401/403, return unauthenticated state instead of throwing
        if (response.status === 401 || response.status === 403) {
          return { authenticated: false };
        }
        // For other errors, still throw
        throw new Error(`${response.status}: ${response.statusText}`);
      } catch (error) {
        // On network errors or other failures, assume unauthenticated
        console.warn('Auth check failed:', error);
        return { authenticated: false };
      }
    },
    retry: false,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    staleTime: 0,
    gcTime: 0,
  });

  useEffect(() => {
    if (data) {
      if (data.authenticated) {
        setIsAuthenticated(true);
        setUser(data.user);
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    }
  }, [data]);

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}