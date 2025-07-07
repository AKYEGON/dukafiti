import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/SupabaseAuth";
import { useLocation } from "wouter";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { useTheme } from "@/contexts/theme-context";
import brandLightImage from '@assets/slogan and title in white background_1751876041697.png';
import brandDarkImage from '@assets/title and slogan in black backgr_1751876041710.png';

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
        <div className="max-w-lg w-full bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700">
          {/* Logo inside card - Brand images */}
          <div className="mb-6 flex justify-center">
            <div className="p-3 rounded-xl bg-white dark:bg-gray-700 shadow-sm border border-gray-100 dark:border-gray-600">
              <img 
                src={theme === 'dark' ? brandDarkImage : brandLightImage}
                alt="DukaFiti - Duka Bora Ni Duka Fiti" 
                className="h-16 w-auto object-contain block"
                style={{ minHeight: '50px', maxWidth: '280px' }}
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
                    <h2 class="text-2xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 dark:from-blue-400 dark:via-purple-400 dark:to-blue-200 bg-clip-text text-transparent tracking-wide">
                      DUKAFITI
                    </h2>
                    <p class="text-sm font-semibold text-blue-600 dark:text-blue-300 mt-1 tracking-widest">
                      DUKA BORA NI DUKA FITI
                    </p>
                  `;
                  e.target.parentElement.appendChild(fallback);
                }}
              />
            </div>
          </div>
          {/* Form header */}
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-brand-600 to-brand-700 bg-clip-text text-transparent mb-2">
              {isLogin ? "Welcome Back" : "Create Account"}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-base">
              {isLogin ? "Sign in to your DukaFiti account" : "Start your journey with DukaFiti"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-2">
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
                  className="h-12 px-4 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-brand focus:ring-brand focus:ring-2 focus:ring-brand/20 transition-all duration-200 text-base"
                />
              </div>
            )}
            
            <div className="space-y-2">
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
                className="h-12 px-4 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-brand focus:ring-brand focus:ring-2 focus:ring-brand/20 transition-all duration-200 text-base"
              />
            </div>
            
            <div className="space-y-2">
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
                  className="h-12 px-4 pr-12 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-brand focus:ring-brand focus:ring-2 focus:ring-brand/20 transition-all duration-200 text-base"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full text-gray-500 dark:text-gray-400"
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
              className="w-full h-12 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] mt-6"
              disabled={isLoading}
            >
              {isLoading ? "Please wait..." : (isLogin ? "Sign In" : "Create Account")}
            </Button>
            
            {/* Divider */}
            <div className="flex items-center my-4">
              <div className="flex-1 border-t border-gray-200 dark:border-gray-600"></div>
              <span className="px-4 text-sm text-gray-500 dark:text-gray-400 font-medium">or</span>
              <div className="flex-1 border-t border-gray-200 dark:border-gray-600"></div>
            </div>
            
            {/* Google Sign In Button */}
            <Button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              variant="outline"
              className="w-full h-12 text-base font-semibold border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-3"
            >
              <FcGoogle className="h-7 w-7" />
              {isLogin ? "Sign in with Google" : "Sign up with Google"}
            </Button>
            
            <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 rounded-xl">
              <p className="text-sm text-blue-800 dark:text-blue-300 text-center">
                <span className="font-semibold">Note:</span> Google OAuth requires additional setup. Use email/password authentication for immediate access.
              </p>
            </div>
          </form>

          <div className="mt-5 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
            </p>
            <Button
              variant="link"
              className="text-brand hover:text-brand-700 font-bold text-base transition-colors duration-200"
              onClick={() => {
                setIsLogin(!isLogin);
                setFormData({ email: "", password: "", name: "" });
              }}
            >
              {isLogin ? "Create Account" : "Sign In"}
            </Button>
          </div>

          {!isLogin && (
            <div className="mt-3 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                By signing up you agree to Our Terms and Privacy Policy
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
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