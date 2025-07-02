import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/layout/sidebar";
import { UniversalSearch } from "@/components/layout/universal-search";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { useWebSocket } from "@/hooks/use-websocket";
import { ThemeProvider } from "@/contexts/theme-context";
import { OfflineIndicator } from "@/components/offline-indicator";
import { ErrorBoundary } from "@/components/error-boundary";

import Dashboard from "@/pages/dashboard";
import Inventory from "@/pages/inventory";
import Sales from "@/pages/sales";
import Customers from "@/pages/customers";
import Reports from "@/pages/reports";
import Home from "@/pages/home";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Onboarding from "@/pages/onboarding";
import NotFound from "@/pages/not-found";
import SettingsPage from "@/pages/settings";

function AuthenticatedApp() {
  // Initialize WebSocket connection for real-time notifications
  useWebSocket();
  
  
  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex-1 flex flex-col main-content">
        <UniversalSearch />
        <main className="flex-1 overflow-auto bg-background">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/inventory" component={Inventory} />
            <Route path="/sales" component={Sales} />
            <Route path="/customers" component={Customers} />
            <Route path="/reports" component={Reports} />
            <Route path="/settings" component={SettingsPage} />
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
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
  const { isAuthenticated, isLoading } = useAuth();
  const [location, setLocation] = useLocation();

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Handle onboarding route
  if (location === "/onboarding") {
    return <Onboarding />;
  }

  // Protected routes - redirect to login if not authenticated
  const protectedRoutes = ['/dashboard', '/inventory', '/sales', '/customers', '/reports', '/settings'];
  if (protectedRoutes.includes(location) && !isAuthenticated) {
    setLocation('/login');
    return null;
  }

  // Redirect authenticated users from login/register pages to dashboard
  if (isAuthenticated && (location === '/login' || location === '/register')) {
    setLocation('/dashboard');
    return null;
  }

  // Redirect logic based on authentication
  if (isAuthenticated) {
    return <AuthenticatedApp />;
  } else {
    return <UnauthenticatedApp />;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <TooltipProvider>
              <Router />
              <OfflineIndicator />
              <Toaster />
            </TooltipProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
