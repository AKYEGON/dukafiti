import { useState, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { TopBar } from "@/components/TopBar";
import { config } from "./lib/config";

import { AuthProvider, useAuth } from "@/contexts/SimpleAuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useWebSocket } from "@/hooks/use-websocket";
import { useSupabaseRealtime } from "@/hooks/useSupabaseRealtime";
import { ThemeProvider } from "@/contexts/theme-context";
import { OfflineBanner } from "@/components/OfflineBanner";
import { ErrorBoundary } from "@/components/error-boundary";

import Dashboard from "@/pages/dashboard";
import Inventory from "@/pages/inventory";
import Sales from "@/pages/sales";
import Customers from "@/pages/customers";
import Reports from "@/pages/reports";
import NotificationsPage from "@/pages/notifications";
import Home from "@/pages/home";
import Login from "@/pages/login";
import Register from "@/pages/register";
import AuthCallback from "@/pages/auth-callback";
import Onboarding from "@/pages/onboarding";
import NotFound from "@/pages/not-found";
import SettingsPage from "@/pages/settings";

function AuthenticatedApp() {
  // Initialize WebSocket connection for real-time notifications
  useWebSocket();
  
  // Initialize Supabase real-time subscriptions
  useSupabaseRealtime();
  
  // Console log environment variables for debugging
  useEffect(() => {
    console.log('API Base URL:', config.api.baseUrl);
    console.log('Supabase URL:', config.supabase.url);
    console.log('Environment:', config.app.isDevelopment ? 'Development' : 'Production');
  }, []);
  
  // Sidebar collapse state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const toggleSidebar = () => {
    setSidebarCollapsed(prev => !prev);
  };
  
  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar - hidden on mobile, visible on tablet and desktop */}
      <div className="hidden md:block">
        <Sidebar collapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
      </div>
      
      <div className="flex-1 flex flex-col main-content min-w-0">
        <TopBar onToggleSidebar={toggleSidebar} isSidebarCollapsed={sidebarCollapsed} />
        <main className="flex-1 overflow-y-auto bg-background pb-16 md:pb-0">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/inventory" component={Inventory} />
            <Route path="/sales" component={Sales} />
            <Route path="/customers" component={Customers} />
            <Route path="/reports" component={Reports} />
            <Route path="/notifications" component={NotificationsPage} />
            <Route path="/settings" component={SettingsPage} />
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
      
      {/* Mobile Bottom Navigation - shown only on mobile */}
      <MobileBottomNav />
    </div>
  );
}

function UnauthenticatedApp() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/onboarding" component={Onboarding} />
      <Route component={NotFound} />
    </Switch>
  );
}

function Router() {
  const { user, isLoading } = useAuth();
  const [location, setLocation] = useLocation();

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Checking session...</p>
        </div>
      </div>
    );
  }

  // Redirect authenticated users from auth pages to dashboard
  if (user && (location === '/login' || location === '/register')) {
    setLocation('/dashboard');
    return null;
  }

  // Main routing logic
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={user ? () => { setLocation('/dashboard'); return null; } : Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/auth/callback" component={AuthCallback} />
      <Route path="/onboarding" component={Onboarding} />
      
      {/* Protected routes */}
      <Route path="/dashboard">
        <ProtectedRoute>
          <AuthenticatedApp />
        </ProtectedRoute>
      </Route>
      <Route path="/inventory">
        <ProtectedRoute>
          <AuthenticatedApp />
        </ProtectedRoute>
      </Route>
      <Route path="/sales">
        <ProtectedRoute>
          <AuthenticatedApp />
        </ProtectedRoute>
      </Route>
      <Route path="/customers">
        <ProtectedRoute>
          <AuthenticatedApp />
        </ProtectedRoute>
      </Route>
      <Route path="/reports">
        <ProtectedRoute>
          <AuthenticatedApp />
        </ProtectedRoute>
      </Route>
      <Route path="/settings">
        <ProtectedRoute>
          <AuthenticatedApp />
        </ProtectedRoute>
      </Route>
      <Route path="/notifications">
        <ProtectedRoute>
          <AuthenticatedApp />
        </ProtectedRoute>
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <TooltipProvider>
              <Router />
              <OfflineBanner />
              <Toaster />
            </TooltipProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
