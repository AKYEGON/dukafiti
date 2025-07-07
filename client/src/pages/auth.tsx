import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/SupabaseAuth";
import { useLocation } from "wouter";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
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
  const { login, signup } = useAuth();
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

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 py-12 bg-white dark:bg-gray-900">
        {/* Back Button */}
        <div className="absolute top-6 left-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/")}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>

        {/* Logo */}
        <div className="mb-8 flex justify-center lg:justify-start">
          <img 
            src={theme === 'dark' ? "/assets/logo-title-black.png" : "/assets/logo-title-white.png"}
            alt="DukaFiti - Duka Bora Ni Duka Fiti" 
            className="h-16 w-auto object-contain"
          />
        </div>

        {/* Form */}
        <div className="max-w-md mx-auto lg:mx-0 w-full">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {isLogin ? "Welcome Back" : "Sign Up to Discover DukaFiti Features"}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {isLogin ? "Sign in to your DukaFiti account" : "Join DukaFiti and start managing your business efficiently"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  NAME
                </Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Your name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required={!isLogin}
                  className="h-14 px-4 rounded-full border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-brand focus:ring-brand"
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                EMAIL
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Your email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="h-14 px-4 rounded-full border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-brand focus:ring-brand"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                PASSWORD
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Your password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="h-14 px-4 pr-12 rounded-full border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-brand focus:ring-brand"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent text-gray-500 dark:text-gray-400"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-14 rounded-full bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-500 hover:to-cyan-600 text-white font-semibold text-lg shadow-lg transition-all duration-200"
              disabled={isLoading}
            >
              {isLoading ? "Please wait..." : (isLogin ? "Sign In" : "Sign Up")}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
            </p>
            <Button
              variant="link"
              className="text-brand hover:text-brand-700 font-medium"
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