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
import { useToast } from '@/hooks/use-toast';

const registerSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function Register() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { signup } = useAuth();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
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
      console.log('Attempting registration with:', data.email);
      const { error } = await signup(data.email, data.password, data.email.split('@')[0]);
      
      if (error) {
        console.error('Registration error from Supabase:', error);
        toast({
          title: "Registration failed",
          description: error.message || "Failed to create account",
          variant: "destructive",
        });
      } else {
        setSubmittedEmail(data.email);
        setIsSubmitted(true);
        toast({
          title: "Account created successfully!",
          description: "Please check your email to verify your account",
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
              Back to registration
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 sm:px-6 lg:px-8">
      <div className="bg-white dark:bg-[#1F1F1F] border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-6 sm:p-8 w-full max-w-md mx-auto my-12">
        
        {/* Logo/App Name - Enterprise Grade */}
        <div className="text-center mb-6">
          <div className="mx-auto mb-4 flex items-center justify-center">
            <div className="p-4 rounded-xl bg-brand dark:bg-brand-700">
              <img 
                src="/assets/logo plus background_1751815320608.png" 
                alt="DukaFiti - Duka Fiti ni Duka Bora" 
                className="h-12 w-auto max-w-[180px] drop-shadow-md"
              />
            </div>
          </div>
          <div className="mt-2 mb-4 flex items-center justify-center">
            <div className="px-4 py-2 rounded-lg bg-brand-50 dark:bg-brand-900/30">
              <img 
                src="/assets/slogan_1751815320627.png" 
                alt="Duka Fiti ni Duka Bora" 
                className="h-5 w-auto max-w-[160px] drop-shadow-sm"
              />
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Create your business account</p>
        </div>

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
                placeholder="Create a password (6+ characters)"
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

        {/* Secondary Action - Switch to Login */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <Link href="/login" className="text-brand hover:underline font-medium focus:outline-none focus:ring-2 focus:ring-brand rounded transition-all duration-200">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}