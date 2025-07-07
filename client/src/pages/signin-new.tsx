import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/SupabaseAuth";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { useTheme } from "next-themes";
const templateBgImage = "/assets/form_2@2x_1751868360028.png";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  remember: z.boolean().default(false),
});

type LoginFormData = z.infer<typeof loginSchema>;

function SignInNew() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const { theme } = useTheme();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      remember: false
    }
  });

  const watchRemember = watch("remember");

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const { error } = await login(data.email, data.password);
      
      if (error) {
        toast({
          title: "Sign In Failed",
          description: error.message || "Invalid email or password",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Welcome back!",
          description: "You have been signed in successfully",
        });
        navigate('/dashboard');
      }
    } catch (error) {
      toast({
        title: "Sign In Failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (email: string) => {
    // TODO: Implement forgot password functionality
    toast({
      title: "Password Reset",
      description: "Password reset functionality will be available soon",
    });
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <div className="w-full max-w-md space-y-8">
          {/* Back Button */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-brand hover:text-brand-700 dark:text-brand-300 dark:hover:text-brand-200 mb-6 text-lg font-medium p-2 transition-colors duration-200"
            aria-label="Go back to home page"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </button>

          {/* Header */}
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Sign In to Your
            </h2>
            <h3 className="text-3xl font-bold text-brand mb-6">
              DukaFiti Account
            </h3>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Removed Name Field for Sign In */}

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                EMAIL
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Your email"
                {...register('email')}
                className="w-full px-4 py-4 border-0 rounded-lg h-14 bg-gray-100 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-brand dark:text-white transition-all duration-200 placeholder:text-gray-500"
                aria-label="Email address"
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                PASSWORD
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Your password"
                  {...register('password')}
                  className="w-full px-4 py-4 pr-12 border-0 rounded-lg h-14 bg-gray-100 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-brand dark:text-white transition-all duration-200 placeholder:text-gray-500"
                  aria-label="Password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
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

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={watchRemember}
                  onCheckedChange={(checked) => setValue('remember', checked as boolean)}
                  className="rounded border-gray-300 text-brand focus:ring-brand"
                />
                <Label 
                  htmlFor="remember" 
                  className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer"
                >
                  Remember me
                </Label>
              </div>
              
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-brand hover:text-brand-700 dark:text-brand-300 dark:hover:text-brand-200 transition-colors"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full py-4 rounded-lg font-semibold h-14 focus:outline-none focus:ring-2 focus:ring-brand transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-teal-500 hover:bg-teal-600 text-white"
              aria-label="Sign in to your account"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          {/* Removed Terms for Sign In */}

          {/* Secondary Action - Switch to Register */}
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Don't have an account?{' '}
              <button 
                onClick={() => navigate('/register')}
                className="text-brand hover:underline font-medium focus:outline-none focus:ring-2 focus:ring-brand rounded transition-all duration-200"
              >
                Create Account
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Background Image */}
      <div className="hidden lg:block flex-1 relative">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${templateBgImage})`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-pink-600/20"></div>
        </div>
      </div>
    </div>
  );
}

export default SignInNew;