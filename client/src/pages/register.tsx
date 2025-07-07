import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/SupabaseAuth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Link } from 'wouter';
import { Mail, ArrowLeft, Store, Eye, EyeOff } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/contexts/theme-context';
import brandLightImage from '@assets/slogan and title in white background_1751878651581.png';
import brandDarkImage from '@assets/title and slogan in black backgr_1751878651610.png';

const registerSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function Register() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { signUp, signInWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const { theme } = useTheme();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      const { error } = await signUp(data.email, data.password);
      
      if (error) {
        toast({
          title: "Registration failed",
          description: error.message || "Unable to create account",
          variant: "destructive",
        });
      } else {
        setSubmittedEmail(data.email);
        setIsSubmitted(true);
        toast({
          title: "Check your email",
          description: "We've sent you a verification link",
        });
      }
    } catch (error) {
      toast({
        title: "Registration failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      setIsLoading(true);
      const { error } = await signInWithGoogle();
      
      if (error) {
        toast({
          title: "Google sign-up failed",
          description: error.message || "Unable to sign up with Google",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Google sign-up failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-[#1F1F1F] border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-6 sm:p-8 w-full max-w-md mx-auto my-12">
          <div className="text-center mb-6">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-900/20">
              <Mail className="h-8 w-8 text-brand-600 dark:text-brand-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Check your email
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              We've sent a verification link to
            </p>
          </div>
          
          <div className="space-y-6">
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm font-medium text-gray-900 dark:text-white text-center">
                {submittedEmail}
              </p>
            </div>
            
            <Alert>
              <AlertDescription className="text-sm">
                Click the link in the email to verify your account and complete registration.
                The link will expire in 24 hours.
              </AlertDescription>
            </Alert>
            
            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
              <p>Didn't receive the email? Check your spam folder.</p>
              <p className="mt-2">After verifying your email, you can log in with your password.</p>
            </div>

            <Button
              onClick={() => setIsSubmitted(false)}
              variant="outline"
              className="w-full h-12"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Registration
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 sm:px-6 lg:px-8">
      <div className="bg-white dark:bg-[#1F1F1F] border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg w-full max-w-md mx-auto my-12 overflow-hidden">
        
        {/* Back Button */}
        <div className="absolute top-8 left-8 z-10">
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-brand hover:text-brand-700 dark:text-brand-300 dark:hover:text-brand-200 text-lg font-medium p-2 transition-colors duration-200 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm"
            aria-label="Go back to home page"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </button>
        </div>

        {/* Brand Header - integrated seamlessly */}
        <div className="bg-gradient-to-r from-brand-50 to-brand-100 dark:from-brand-900/30 dark:to-brand-800/30 px-8 py-12 text-center">
          <img 
            src={theme === 'dark' ? brandDarkImage : brandLightImage}
            alt="DukaFiti - Duka Bora Ni Duka Fiti" 
            className="h-28 w-auto object-contain mx-auto drop-shadow-lg"
            style={{ minHeight: '100px', maxWidth: '380px' }}
            onLoad={(e) => {
              console.log('Brand image loaded successfully:', e.target.src);
            }}
            onError={(e) => {
              console.error('Brand image failed to load:', e.target.src);
              // Fallback to text if image fails
              e.target.style.display = 'none';
              const fallback = document.createElement('div');
              fallback.className = 'text-center';
              fallback.innerHTML = `
                <h2 class="text-3xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 dark:from-blue-400 dark:via-purple-400 dark:to-blue-200 bg-clip-text text-transparent tracking-wide">
                  DUKAFITI
                </h2>
                <p class="text-base font-semibold text-blue-600 dark:text-blue-300 mt-2 tracking-widest">
                  DUKA BORA NI DUKA FITI
                </p>
              `;
              e.target.parentElement.appendChild(fallback);
            }}
          />
        </div>

        {/* Form Content */}
        <div className="p-6 sm:p-8">
          {/* Register Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                {...register('email')}
                className="w-full px-4 py-3 border rounded-md h-12 focus:outline-none focus:ring-2 focus:ring-brand dark:bg-[#2A2A2A] dark:border-gray-600 dark:text-white transition-all duration-200"
                aria-label="Email address"
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a password"
                  {...register('password')}
                  className="w-full px-4 py-3 border rounded-md h-12 focus:outline-none focus:ring-2 focus:ring-brand dark:bg-[#2A2A2A] dark:border-gray-600 dark:text-white transition-all duration-200 pr-12"
                  aria-label="Password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand rounded"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button 
              type="submit" 
              disabled={isLoading}
              className="bg-brand hover:bg-brand-700 text-white w-full py-3 rounded-md font-semibold h-12 focus:outline-none focus:ring-2 focus:ring-brand transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Create your account"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating account...</span>
                </div>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-1 border-t border-gray-200 dark:border-gray-600"></div>
            <span className="px-4 text-sm text-gray-500 dark:text-gray-400 font-medium">or</span>
            <div className="flex-1 border-t border-gray-200 dark:border-gray-600"></div>
          </div>

          {/* Google Sign Up Button */}
          <Button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={isLoading}
            variant="outline"
            className="w-full h-12 text-base font-semibold border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-md transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-3"
          >
            <FcGoogle className="h-6 w-6" />
            Continue with Google
          </Button>

          {/* OAuth Setup Notice */}
          <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 rounded-md">
            <p className="text-sm text-blue-800 dark:text-blue-300 text-center">
              <span className="font-semibold">Note:</span> Google OAuth requires additional setup in Supabase dashboard.
            </p>
          </div>

          {/* Secondary Action - Switch to Login */}
          <div className="text-center mt-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <Link href="/login" className="text-brand hover:underline font-medium focus:outline-none focus:ring-2 focus:ring-brand rounded transition-all duration-200">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}