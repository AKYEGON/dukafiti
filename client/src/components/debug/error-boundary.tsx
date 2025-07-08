/**
 * Enhanced Error Boundary with Real-time Debugging
 * Catches and displays React errors with context for debugging
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Bug } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  showDetails?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

class EnhancedErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: Date.now().toString(),
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: Date.now().toString(),
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 Error Boundary caught an error:', error);
    console.error('📍 Error Info:', errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Log to console with context
    console.group('🔍 Error Boundary Details');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('Component Stack:', errorInfo.componentStack);
    console.groupEnd();
  }

  handleRetry = () => {
    // Clear error state and force re-render
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: Date.now().toString(),
    });
    
    // Force full page reload if error persists
    setTimeout(() => {
      if (this.state.hasError) {
        window.location.reload();
      }
    }, 100);
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const { fallback, showDetails = true } = this.props;
      const { error, errorInfo } = this.state;

      if (fallback) {
        return fallback;
      }

      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Something went wrong
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  The application encountered an error and couldn't continue.
                </p>
              </div>
            </div>

            {showDetails && error && (
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <Bug className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Error Details
                  </span>
                </div>
                <code className="text-xs text-red-600 dark:text-red-400 block">
                  {error.message}
                </code>
                {process.env.NODE_ENV === 'development' && (
                  <details className="mt-2">
                    <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                      Stack Trace
                    </summary>
                    <pre className="text-xs text-gray-600 dark:text-gray-400 mt-1 overflow-auto max-h-32">
                      {error.stack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <Button onClick={this.handleRetry} className="flex-1" variant="default">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              <Button onClick={this.handleReload} variant="outline">
                Reload Page
              </Button>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">
              If this error persists, please refresh the page or contact support.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export { EnhancedErrorBoundary };