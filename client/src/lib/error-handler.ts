// Global error handler for the application
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorQueue: Array<{
    error: Error;
    timestamp: number;
    context?: string;
  }> = [];

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  private constructor() {
    // Setup global error listeners
    this.setupGlobalErrorHandlers();
  }

  private setupGlobalErrorHandlers() {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      console.warn('Unhandled promise rejection:', event.reason);
      this.logError(new Error(`Unhandled promise rejection: ${event.reason}`), 'promise');
      // Prevent default behavior that would crash the app
      event.preventDefault();
    });

    // Handle uncaught errors
    window.addEventListener('error', (event) => {
      console.warn('Uncaught error:', event.error);
      this.logError(event.error, 'uncaught');
    });

    // Handle resource loading errors
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        console.warn('Resource loading error:', event.target);
        this.logError(new Error(`Resource loading failed: ${event.target}`), 'resource');
      }
    }, true);
  }

  logError(error: Error, context?: string) {
    const errorEntry = {
      error,
      timestamp: Date.now(),
      context
    };

    this.errorQueue.push(errorEntry);

    // Keep only last 10 errors
    if (this.errorQueue.length > 10) {
      this.errorQueue.shift();
    }

    // Log to console in development
    if (import.meta.env.DEV) {
      console.error(`[${context || 'unknown'}] Error:`, error);
    }
  }

  getErrorHistory() {
    return this.errorQueue;
  }

  clearErrorHistory() {
    this.errorQueue = [];
  }
}

// Initialize error handler
export const errorHandler = ErrorHandler.getInstance();