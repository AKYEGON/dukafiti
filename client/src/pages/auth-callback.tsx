import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Loader, Store } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AuthCallback() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the URL hash fragment which contains the auth tokens
        const hashFragment = window.location.hash;
        if (!hashFragment) {
          throw new Error('No authentication data found in URL');
        }

        // Parse the hash fragment to extract auth data
        const params = new URLSearchParams(hashFragment.substring(1));
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        
        if (!accessToken) {
          throw new Error('Invalid authentication link');
        }

        // Get the session using the access token
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }

        if (session?.user) {
          setStatus('success');
          toast({
            title: "Successfully logged in!",
            description: "Welcome to DukaFiti",
          });
          
          // Redirect to dashboard after a short delay
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
        } else {
          throw new Error('Failed to establish session');
        }
      } catch (err: any) {
        console.error('Auth callback error:', err);
        setStatus('error');
        setError(err.message || 'Authentication failed');
        
        toast({
          title: "Authentication failed",
          description: err.message || "Please try logging in again",
          variant: "destructive",
        });
      }
    };

    handleAuthCallback();
  }, [navigate, toast]);

  const handleRetry = () => {
    navigate('/login');
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-[#1F1F1F] border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-6 sm:p-8 w-full max-w-md mx-auto my-12">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
              <Loader className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Verifying your account
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Please wait while we log you in...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-[#1F1F1F] border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-6 sm:p-8 w-full max-w-md mx-auto my-12">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome to DukaFiti!
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              You have been successfully logged in. Redirecting to your dashboard...
            </p>
            
            <div className="mt-6">
              <Button
                onClick={() => navigate('/dashboard')}
                className="bg-primaryPurple hover:bg-primaryPurple-dark text-white w-full py-3 rounded-md font-semibold h-12"
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 sm:px-6 lg:px-8">
      <div className="bg-white dark:bg-[#1F1F1F] border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-6 sm:p-8 w-full max-w-md mx-auto my-12">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
            <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Verification failed
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            We couldn't verify your account. This could be because:
          </p>
          
          <Alert className="mb-6 text-left">
            <AlertDescription className="text-sm">
              <ul className="list-disc list-inside space-y-1">
                <li>The link has expired</li>
                <li>The link has already been used</li>
                <li>The link is invalid or corrupted</li>
              </ul>
            </AlertDescription>
          </Alert>

          {error && (
            <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-300">
                Error: {error}
              </p>
            </div>
          )}
          
          <div className="space-y-3">
            <Button
              onClick={handleRetry}
              className="bg-primaryPurple hover:bg-primaryPurple-dark text-white w-full py-3 rounded-md font-semibold h-12"
            >
              Try logging in again
            </Button>
            
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              className="w-full h-12"
            >
              Go to home page
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}