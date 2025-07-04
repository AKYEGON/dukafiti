// Simple authentication fallback for development/testing
export const authFallback = {
  // Test user credentials
  testUser: {
    email: 'test@dukafiti.com',
    password: 'password123'
  },
  
  // Mock user data for development
  mockUser: {
    id: 'test-user-id',
    email: 'test@dukafiti.com',
    username: 'testuser',
    phone: '+254712345678'
  },
  
  // Check if we're in development mode
  isDevelopment: () => {
    return import.meta.env.DEV || process.env.NODE_ENV === 'development';
  },
  
  // Simulate authentication success
  simulateAuth: () => {
    if (authFallback.isDevelopment()) {
      localStorage.setItem('dukafiti_auth_fallback', JSON.stringify({
        user: authFallback.mockUser,
        timestamp: Date.now()
      }));
      return true;
    }
    return false;
  },
  
  // Get fallback user
  getFallbackUser: () => {
    if (authFallback.isDevelopment()) {
      const stored = localStorage.getItem('dukafiti_auth_fallback');
      if (stored) {
        try {
          const data = JSON.parse(stored);
          // Check if timestamp is within 24 hours
          if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
            return data.user;
          }
        } catch (e) {
          }
      }
    }
    return null;
  },
  
  // Clear fallback auth
  clearFallback: () => {
    localStorage.removeItem('dukafiti_auth_fallback');
  }
};