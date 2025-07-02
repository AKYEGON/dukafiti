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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="bg-white dark:bg-[#1F1F1F] border border-gray-200 dark:border-gray-700 rounded-lg shadow-md dark:shadow-lg p-8 w-full max-w-sm">
        {/* Logo/App Name */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-purple-600">
            <Store className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-purple-600">DukaSmart</h1>
        </div>

        {/* Login Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700 dark:text-gray-300 font-medium">
                    Email
                  </FormLabel>
                  <FormControl>
                    <Input 
                      type="email"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600 bg-white dark:bg-[#1F1F1F] text-gray-900 dark:text-white min-h-[44px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage className="text-red-500 text-sm" />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700 dark:text-gray-300 font-medium">
                    Password
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        type={showPassword ? "text" : "password"}
                        className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600 bg-white dark:bg-[#1F1F1F] text-gray-900 dark:text-white min-h-[44px]"
                        {...field} 
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage className="text-red-500 text-sm" />
                  <div className="text-left mt-2">
                    <button
                      type="button"
                      className="text-xs text-purple-600 hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                </FormItem>
              )}
            />
            
            <Button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full py-3 font-semibold rounded-md bg-green-600 hover:bg-green-700 text-white min-h-[44px] focus:outline-none focus:ring-2 focus:ring-green-600"
            >
              {loginMutation.isPending ? "Logging in..." : "Log In"}
            </Button>
          </form>
        </Form>

        {/* Switch to Sign Up */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?{" "}
            <button
              onClick={() => setLocation("/register")}
              className="text-green-600 hover:underline font-medium"
            >
              Register
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}