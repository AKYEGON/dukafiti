import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/SupabaseAuthClean';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Link } from 'wouter';
import { Mail, ArrowLeft, Store, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
;
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

type LoginFormData = z.infer<typeof loginSchema>;
;
export default function Login() {;
  const [, navigate]  =  useLocation();
  const { toast }  =  useToast();
  const { login }  =  useAuth();
  const [isLoading, setIsLoading]  =  useState(false);
  const [showPassword, setShowPassword]  =  useState(false);
;
  const {
    register,
    handleSubmit,
    formState: { errors }
  }  =  useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  });
;
  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {;
      const { error }  =  await login(data.email, data.password);
;
      if (error) {
        toast({
          title: "Login failed",
          description: error.message || "Invalid email or password",
          variant: "destructive"
        })
      } else {
        toast({
          title: "Welcome back!",
          description: "You have been logged in successfully"
        });
        navigate('/dashboard')
      }
    } catch (error) {
      toast({
        title: "Login failed",
        description: "An unexpected error occurred",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  };
;
  return (
    <div className = "min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 sm:px-6 lg:px-8">
      <div className = "bg-white dark:bg-[#1F1F1F] border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-6 sm:p-8 w-full max-w-md mx-auto my-12">

        {/* Logo/App Name - Enterprise Grade */}
        <div className = "text-center mb-6">
          <div className = "mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primaryPurple shadow-lg">
            <Store className = "h-8 w-8 text-white" />
          </div>
          <h1 className = "text-3xl font-bold text-primaryPurple text-center">DukaFiti</h1>
          <p className = "text-sm text-gray-600 dark:text-gray-400 mt-2">Duka Fiti ni Duka Bora - Welcome back</p>
        </div>

        {/* Login Form */}
        <form onSubmit = {handleSubmit(onSubmit)} className = "space-y-6">
          <div className = "space-y-2">
            <Label htmlFor = "email" className = "text-sm font-medium text-gray-700 dark:text-gray-300">
              Email Address
            </Label>
            <Input
              id = "email"
              type = "email"
              placeholder = "Enter your email"
              {...register('email')}
              className = "w-full px-4 py-3 border rounded-md h-12 focus:outline-none focus:ring-2 focus:ring-primaryGreen dark:bg-[#2A2A2A] dark:border-gray-600 dark:text-white transition-all duration-200"
              aria-label = "Email address"
            />
            {errors.email && (
              <p className = "text-red-500 text-xs mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className = "space-y-2">
            <Label htmlFor = "password" className = "text-sm font-medium text-gray-700 dark:text-gray-300">
              Password
            </Label>
            <div className = "relative">
              <Input
                id = "password"
                type = {showPassword ? 'text' : 'password'}
                placeholder = "Enter your password"
                {...register('password')}
                className = "w-full px-4 py-3 border rounded-md h-12 focus:outline-none focus:ring-2 focus:ring-primaryGreen dark:bg-[#2A2A2A] dark:border-gray-600 dark:text-white transition-all duration-200 pr-12"
                aria-label = "Password"
              />
              <button
                type = "button"
                onClick = {() => setShowPassword(!showPassword)}
                className = "absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primaryGreen rounded"
                aria-label = {showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className = "h-5 w-5" /> : <Eye className = "h-5 w-5" />}
              </button>
            </div>
            {errors.password && (
              <p className = "text-red-500 text-xs mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          <Button
            type = "submit"
            disabled = {isLoading}
            className = "bg-primaryPurple hover:bg-primaryPurple-dark text-white w-full py-3 rounded-md font-semibold h-12 focus:outline-none focus:ring-2 focus:ring-primaryPurple transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label = "Log in to your account"
          >
            {isLoading ? (
              <div className = "flex items-center justify-center space-x-2">
                <div className = "w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Logging in...</span>
              </div>
            ) : (
              'Log In'
            )}
          </Button>
        </form>

        {/* Forgot Password Link */}
        <div className = "text-center mt-4">
          <button
            onClick = {() => navigate('/register')}
            className = "text-sm text-primaryGreen hover:underline font-medium focus:outline-none focus:ring-2 focus:ring-primaryGreen rounded transition-all duration-200"
          >
            Forgot your password?
          </button>
        </div>

        {/* Secondary Action - Switch to Register */}
        <div className = "text-center mt-6">
          <p className = "text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?{' '}
            <Link href = "/register" className = "text-primaryGreen hover:underline font-medium focus:outline-none focus:ring-2 focus:ring-primaryGreen rounded transition-all duration-200">
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}