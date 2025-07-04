// Simple authentication system that works reliably in all environments
export interface SimpleUser {
  id: string;
  email: string;
  username?: string;
  phone?: string;
}

export class SimpleAuth {
  private static STORAGE_KEY = 'dukafiti_user_session';
  
  // Get current user from localStorage
  static getCurrentUser(): SimpleUser | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        // Check if session is still valid (within 30 days)
        if (Date.now() - data.timestamp < 30 * 24 * 60 * 60 * 1000) {
          return data.user;
        } else {
          // Session expired, clear it
          this.clearSession();
        }
      }
    } catch (error) {
      this.clearSession();
    }
    return null;
  }
  
  // Set current user in localStorage
  static setCurrentUser(user: SimpleUser): void {
    try {
      const sessionData = {
        user,
        timestamp: Date.now()
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessionData));
    } catch (error) {
      console.error('Error saving auth session:', error);
    }
  }
  
  // Clear session
  static clearSession(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
  
  // Check if user is authenticated
  static isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }
  
  // Create a demo user for development
  static createDemoUser(): SimpleUser {
    return {
      id: 'demo-user-123',
      email: 'demo@dukafiti.com',
      username: 'Demo User',
      phone: '+254712345678'
    };
  }
  
  // Auto-login with demo user in development
  static autoLoginDemo(): boolean {
    if (import.meta.env.DEV) {
      const demoUser = this.createDemoUser();
      this.setCurrentUser(demoUser);
      return true;
    }
    return false;
  }
}