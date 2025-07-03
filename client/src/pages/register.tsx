import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Store, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function Register() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: Omit<RegisterForm, 'confirmPassword'>) => {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Registration failed");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Account Created!",
        description: "Welcome to DukaSmart. You can now sign in.",
      });
      setLocation("/login");
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Please check your information and try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RegisterForm) => {
    const { confirmPassword, ...registerData } = data;
    registerMutation.mutate(registerData);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 sm:px-6 lg:px-8">
      {/* Centered Card Layout */}
      <div className="bg-white dark:bg-[#1F1F1F] border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-6 sm:p-8 w-full max-w-md mx-auto my-12">
        
        {/* Logo/App Name - Enterprise Grade */}
        <div className="text-center mb-6">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primaryPurple shadow-lg">
            <Store className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-primaryPurple text-center">DukaSmart</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Create your business account</p>
        </div>

        {/* Register Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            {/* Name Field */}
            <FormField
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Full Name
                  </FormLabel>
                  <FormControl>
                    <Input 
                      type="text"
                      placeholder="Enter your full name"
                      className={`w-full px-4 py-3 border rounded-md h-12 focus:outline-none focus:ring-2 focus:ring-primaryGreen dark:bg-[#2A2A2A] dark:border-gray-600 dark:text-white transition-all duration-200 ${
                        fieldState.error 
                          ? 'border-red-500 focus:ring-red-500' 
                          : 'border-gray-300 focus:border-primaryGreen'
                      }`}
                      aria-label="Full name"
                      {...field} 
                    />
                  </FormControl>
                  {fieldState.error && (
                    <FormMessage className="text-red-500 text-xs mt-1" />
                  )}
                </FormItem>
              )}
            />

            {/* Email Field */}
            <FormField
              control={form.control}
              name="email"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email Address
                  </FormLabel>
                  <FormControl>
                    <Input 
                      type="email"
                      placeholder="Enter your email"
                      className={`w-full px-4 py-3 border rounded-md h-12 focus:outline-none focus:ring-2 focus:ring-primaryGreen dark:bg-[#2A2A2A] dark:border-gray-600 dark:text-white transition-all duration-200 ${
                        fieldState.error 
                          ? 'border-red-500 focus:ring-red-500' 
                          : 'border-gray-300 focus:border-primaryGreen'
                      }`}
                      aria-label="Email address"
                      {...field} 
                    />
                  </FormControl>
                  {fieldState.error && (
                    <FormMessage className="text-red-500 text-xs mt-1" />
                  )}
                </FormItem>
              )}
            />
            
            {/* Password Field */}
            <FormField
              control={form.control}
              name="password"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Password
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a password"
                        className={`w-full px-4 py-3 pr-12 border rounded-md h-12 focus:outline-none focus:ring-2 focus:ring-primaryGreen dark:bg-[#2A2A2A] dark:border-gray-600 dark:text-white transition-all duration-200 ${
                          fieldState.error 
                            ? 'border-red-500 focus:ring-red-500' 
                            : 'border-gray-300 focus:border-primaryGreen'
                        }`}
                        aria-label="Password"
                        {...field} 
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primaryGreen rounded p-1 transition-colors duration-200"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  {fieldState.error && (
                    <FormMessage className="text-red-500 text-xs mt-1" />
                  )}
                </FormItem>
              )}
            />

            {/* Confirm Password Field */}
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Confirm Password
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        className={`w-full px-4 py-3 pr-12 border rounded-md h-12 focus:outline-none focus:ring-2 focus:ring-primaryGreen dark:bg-[#2A2A2A] dark:border-gray-600 dark:text-white transition-all duration-200 ${
                          fieldState.error 
                            ? 'border-red-500 focus:ring-red-500' 
                            : 'border-gray-300 focus:border-primaryGreen'
                        }`}
                        aria-label="Confirm password"
                        {...field} 
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primaryGreen rounded p-1 transition-colors duration-200"
                        aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  {fieldState.error && (
                    <FormMessage className="text-red-500 text-xs mt-1" />
                  )}
                </FormItem>
              )}
            />
            
            {/* Primary Action Button */}
            <Button
              type="submit"
              disabled={registerMutation.isPending}
              className="bg-primaryPurple hover:bg-primaryPurple-dark text-white w-full py-3 rounded-md font-semibold h-12 focus:outline-none focus:ring-2 focus:ring-primaryPurple transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Create your account"
            >
              {registerMutation.isPending ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating account...</span>
                </div>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>
        </Form>

        {/* Secondary Action - Switch to Login */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{" "}
            <button
              onClick={() => setLocation("/login")}
              className="text-primaryGreen hover:underline font-medium focus:outline-none focus:ring-2 focus:ring-primaryGreen rounded transition-all duration-200"
              aria-label="Go to login page"
            >
              Log in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}