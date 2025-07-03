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

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Login failed");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Welcome back!",
        description: "You have been logged in successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      setTimeout(() => {
        setLocation("/dashboard");
      }, 100);
    },
    onError: (error: any) => {
      toast({
        title: "Login Failed",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoginForm) => {
    loginMutation.mutate(data);
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
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Smart POS for Kenyan Dukawalas</p>
        </div>

        {/* Login Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
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
                        placeholder="Enter your password"
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
                  
                  {/* Forgot Password Link */}
                  <div className="text-left mt-2">
                    <button
                      type="button"
                      className="text-xs text-primaryPurple hover:underline focus:outline-none focus:ring-2 focus:ring-primaryPurple rounded transition-all duration-200"
                      aria-label="Forgot password"
                    >
                      Forgot password?
                    </button>
                  </div>
                </FormItem>
              )}
            />
            
            {/* Primary Action Button */}
            <Button
              type="submit"
              disabled={loginMutation.isPending}
              className="bg-primaryGreen hover:bg-primaryGreen-dark text-white w-full py-3 rounded-md font-semibold h-12 focus:outline-none focus:ring-2 focus:ring-primaryGreen transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Log in to your account"
            >
              {loginMutation.isPending ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Logging in...</span>
                </div>
              ) : (
                "Log In"
              )}
            </Button>
          </form>
        </Form>

        {/* Secondary Action - Switch to Sign Up */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?{" "}
            <button
              onClick={() => setLocation("/register")}
              className="text-primaryPurple hover:underline font-medium focus:outline-none focus:ring-2 focus:ring-primaryPurple rounded transition-all duration-200"
              aria-label="Go to registration page"
            >
              Register
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}