import { QueryClientProvider } from "@tanstack/react-query"
import { Switch, Route, useLocation } from "wouter"
import { queryClient } from "./lib/query-client"
import { AuthProvider, useAuth } from "./contexts/auth-context"
import { ThemeProvider } from "./contexts/theme-context"
import { Toaster } from "./components/ui/toaster"
import { TooltipProvider } from "./components/ui/tooltip"

// Layout Components
import { Sidebar } from "./components/layout/sidebar"
import { TopBar } from "./components/layout/top-bar"
import { ProtectedRoute } from "./components/protected-route"

// Pages
import HomePage from "./pages/home"
import LoginPage from "./pages/login"
import RegisterPage from "./pages/register"
import DashboardPage from "./pages/dashboard"
import InventoryPage from "./pages/inventory"
import SalesPage from "./pages/sales"
import CustomersPage from "./pages/customers"
import ReportsPage from "./pages/reports"
import SettingsPage from "./pages/settings"

function AuthenticatedApp() {
  const [location, setLocation] = useLocation()
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Redirect authenticated users away from auth pages
  if (isAuthenticated && (location === '/login' || location === '/register' || location === '/')) {
    setLocation('/dashboard')
  }

  return (
    <div className="min-h-screen bg-background">
      <Switch>
        {/* Public routes */}
        <Route path="/" component={HomePage} />
        <Route path="/login" component={LoginPage} />
        <Route path="/register" component={RegisterPage} />
        
        {/* Protected routes */}
        <Route path="/dashboard">
          <ProtectedRoute>
            <div className="flex h-screen">
              <Sidebar />
              <div className="flex-1 flex flex-col">
                <TopBar />
                <main className="flex-1 overflow-auto">
                  <DashboardPage />
                </main>
              </div>
            </div>
          </ProtectedRoute>
        </Route>

        <Route path="/inventory">
          <ProtectedRoute>
            <div className="flex h-screen">
              <Sidebar />
              <div className="flex-1 flex flex-col">
                <TopBar />
                <main className="flex-1 overflow-auto">
                  <InventoryPage />
                </main>
              </div>
            </div>
          </ProtectedRoute>
        </Route>

        <Route path="/sales">
          <ProtectedRoute>
            <div className="flex h-screen">
              <Sidebar />
              <div className="flex-1 flex flex-col">
                <TopBar />
                <main className="flex-1 overflow-auto">
                  <SalesPage />
                </main>
              </div>
            </div>
          </ProtectedRoute>
        </Route>

        <Route path="/customers">
          <ProtectedRoute>
            <div className="flex h-screen">
              <Sidebar />
              <div className="flex-1 flex flex-col">
                <TopBar />
                <main className="flex-1 overflow-auto">
                  <CustomersPage />
                </main>
              </div>
            </div>
          </ProtectedRoute>
        </Route>

        <Route path="/reports">
          <ProtectedRoute>
            <div className="flex h-screen">
              <Sidebar />
              <div className="flex-1 flex flex-col">
                <TopBar />
                <main className="flex-1 overflow-auto">
                  <ReportsPage />
                </main>
              </div>
            </div>
          </ProtectedRoute>
        </Route>

        <Route path="/settings">
          <ProtectedRoute>
            <div className="flex h-screen">
              <Sidebar />
              <div className="flex-1 flex flex-col">
                <TopBar />
                <main className="flex-1 overflow-auto">
                  <SettingsPage />
                </main>
              </div>
            </div>
          </ProtectedRoute>
        </Route>

        {/* 404 fallback */}
        <Route>
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">404</h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Page not found</p>
            </div>
          </div>
        </Route>
      </Switch>
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <AuthenticatedApp />
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}