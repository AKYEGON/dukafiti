import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/SupabaseAuth";
import { useLocation } from "wouter";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { useTheme } from "next-themes";
// Logo imports will be handled via public assets

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: ""
  });
  
  const { toast } = useToast();
  const { login, signup, signInWithGoogle } = useAuth();
  const { theme } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let result;
      if (isLogin) {
        result = await login(formData.email, formData.password);
      } else {
        result = await signup(formData.email, formData.password, formData.name);
      }

      if (result.error) {
        toast({
          title: isLogin ? "Login Failed" : "Registration Failed",
          description: result.error.message || "Please try again",
          variant: "destructive",
        });
      } else {
        toast({
          title: isLogin ? "Welcome back!" : "Account created successfully!",
          description: isLogin ? "You have been logged in." : "Please check your email to verify your account.",
        });
        
        if (isLogin) {
          setLocation("/dashboard");
        }
      }
    } catch (error) {
      console.error("Auth error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithGoogle();
      if (result.error) {
        toast({
          title: "Google Sign-In Failed",
          description: result.error.message || "Please try again",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Google sign-in error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16 bg-gray-50 dark:bg-gray-900 relative">
        {/* Back Button - Fixed positioning outside card */}
        <div className="absolute top-8 left-8 z-20">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/")}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 shadow-sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>

        {/* Single unified card */}
        <div className="max-w-lg w-full bg-white dark:bg-gray-800 p-12 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700">
          {/* Logo inside card */}
          <div className="mb-10 flex justify-center">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 p-6 rounded-2xl">
              <img 
                src={theme === 'dark' ? "/assets/banner-dark.png" : "/assets/banner-light.png"}
                alt="DukaFiti - Duka Bora Ni Duka Fiti" 
                className="h-20 w-auto object-contain"
              />
            </div>
          </div>
          {/* Form header */}
          <div className="mb-10 text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-brand-600 to-brand-700 bg-clip-text text-transparent mb-3">
              {isLogin ? "Welcome Back" : "Create Account"}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              {isLogin ? "Sign in to your DukaFiti account" : "Start your journey with DukaFiti"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {!isLogin && (
              <div className="space-y-3">
                <Label htmlFor="name" className="text-sm font-semibold text-gray-700 dark:text-gray-300 tracking-wide">
                  FULL NAME
                </Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required={!isLogin}
                  className="h-16 px-6 rounded-2xl border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-brand focus:ring-brand focus:ring-2 focus:ring-brand/20 transition-all duration-200 text-lg"
                />
              </div>
            )}
            
            <div className="space-y-3">
              <Label htmlFor="email" className="text-sm font-semibold text-gray-700 dark:text-gray-300 tracking-wide">
                EMAIL ADDRESS
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email address"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="h-16 px-6 rounded-2xl border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-brand focus:ring-brand focus:ring-2 focus:ring-brand/20 transition-all duration-200 text-lg"
              />
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="password" className="text-sm font-semibold text-gray-700 dark:text-gray-300 tracking-wide">
                PASSWORD
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="h-16 px-6 pr-16 rounded-2xl border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-brand focus:ring-brand focus:ring-2 focus:ring-brand/20 transition-all duration-200 text-lg"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-4 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full text-gray-500 dark:text-gray-400"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-16 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white font-bold text-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] mt-8"
              disabled={isLoading}
            >
              {isLoading ? "Please wait..." : (isLogin ? "Sign In" : "Create Account")}
            </Button>
            
            {/* Divider */}
            <div className="flex items-center my-8">
              <div className="flex-1 border-t border-gray-200 dark:border-gray-600"></div>
              <span className="px-6 text-sm text-gray-500 dark:text-gray-400 font-medium">or</span>
              <div className="flex-1 border-t border-gray-200 dark:border-gray-600"></div>
            </div>
            
            {/* Google Sign In Button */}
            <Button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              variant="outline"
              className="w-full h-16 text-lg font-semibold border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-2xl transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-4"
            >
              <FcGoogle className="h-7 w-7" />
              {isLogin ? "Sign in with Google" : "Sign up with Google"}
            </Button>
            
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 rounded-2xl">
              <p className="text-sm text-blue-800 dark:text-blue-300 text-center">
                <span className="font-semibold">Note:</span> Google OAuth requires additional setup. Use email/password authentication for immediate access.
              </p>
            </div>
          </form>

          <div className="mt-8 text-center">
            <p className="text-base text-gray-600 dark:text-gray-400 mb-2">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
            </p>
            <Button
              variant="link"
              className="text-brand hover:text-brand-700 font-bold text-lg transition-colors duration-200"
              onClick={() => {
                setIsLogin(!isLogin);
                setFormData({ email: "", password: "", name: "" });
              }}
            >
              {isLogin ? "Create Account" : "Sign In"}
            </Button>
          </div>

          {!isLogin && (
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                By signing up you agree to Our Terms and Privacy Policy
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Free 14-day trial • No credit card required
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Visual */}
      <div className="hidden lg:block w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400">
          <div className="absolute inset-0 bg-gradient-to-t from-purple-900/50 to-transparent"></div>
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] bg-[length:20px_20px]"></div>
          
          {/* Futuristic Hallway Effect */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-64 h-96 perspective-1000">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/20 to-transparent transform rotate-12 skew-y-6"></div>
              <div className="absolute inset-4 bg-gradient-to-b from-transparent via-white/10 to-transparent transform -rotate-6 skew-y-3"></div>
              <div className="absolute inset-8 bg-gradient-to-b from-transparent via-white/5 to-transparent"></div>
            </div>
          </div>
          
          {/* Floating Elements */}
          <div className="absolute top-20 left-20 w-2 h-2 bg-white/30 rounded-full animate-pulse"></div>
          <div className="absolute top-40 right-32 w-1 h-1 bg-white/40 rounded-full animate-ping"></div>
          <div className="absolute bottom-32 left-16 w-3 h-3 bg-white/20 rounded-full animate-bounce"></div>
          <div className="absolute bottom-20 right-20 w-1 h-1 bg-white/50 rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}