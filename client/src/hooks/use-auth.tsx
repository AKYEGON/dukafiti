import { createContext, useContext, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: { phone: string } | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ phone: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["/api/me"],
    queryFn: async () => {
      const response = await fetch("/api/me", { credentials: "include" });
      if (response.ok) {
        return response.json();
      }
      return null;
    },
    retry: false,
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (data && data.authenticated) {
      setIsAuthenticated(true);
      setUser(data.user);
    } else {
      setIsAuthenticated(false);
      setUser(null);
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