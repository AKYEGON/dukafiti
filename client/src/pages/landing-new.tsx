import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useTheme } from "next-themes";
import { 
  ArrowRight, 
  Menu, 
  X, 
  Package, 
  BarChart3, 
  Users, 
  Store,
  CheckCircle,
  Star,
  Shield,
  Clock,
  Smartphone
} from "lucide-react";
const templateHeroImage = "/assets/header_9_sm@2x_1751868360029.png";

function LandingNew() {
  const [, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme } = useTheme();

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const features = [
    {
      icon: Package,
      title: "Easy Inventory",
      description: "Real-time stock tracking with automated low-stock alerts. Never run out of bestsellers again.",
      highlights: ["Low-stock alerts", "Product search", "Category management"]
    },
    {
      icon: BarChart3,
      title: "Instant Sales",
      description: "Support Cash, Credit & M-Pesa payments with instant transaction processing.",
      highlights: ["Multiple payment methods", "Receipt generation", "Sales analytics"]
    },
    {
      icon: Users,
      title: "Credit Management",
      description: "Track customer credit, payment reminders, and build stronger customer relationships.",
      highlights: ["Customer profiles", "Payment tracking", "Credit reminders"]
    }
  ];

  const testimonials = [
    {
      quote: "DukaFiti saved me hours every week! The inventory alerts prevent stockouts and the credit tracking helps me manage customer relationships better.",
      author: "Mary Wanjiku",
      business: "Wanjiku General Store, Nairobi",
      rating: 5
    },
    {
      quote: "Finally, a POS system built for Kenyan businesses. Works offline, easy to use, and the customer support understands our needs perfectly.",
      author: "John Kamau", 
      business: "Kamau Electronics, Nakuru",
      rating: 5
    }
  ];

  const steps = [
    {
      number: "1",
      title: "How DukaFiti Framework works?",
      description: "DukaFiti is an online tool that helps you export ready-made business templates ready to work as your future POS system. It helps you combine sales, inventory and customer management and export it as a set of comprehensive business tools."
    },
    {
      number: "2", 
      title: "Twenty five awesome samples",
      description: "The most important part of DukaFiti is the samples. The samples form a set of 25 usable pages you can use as is or you can add new features from our toolkit. By choosing one of the 25 configurations of the future POS, the process of setup is simple and easy."
    },
    {
      number: "3",
      title: "Variety of designs", 
      description: "You can decide whether to create your duka using our toolkit blocks or samples. The blocks can merge together in various combinations."
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 backdrop-blur-md bg-opacity-90 dark:bg-opacity-90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="mr-4 relative">
                <img 
                  src="/assets/title-light.png"
                  alt="DukaFiti" 
                  className="h-10 w-auto object-contain dark:hidden"
                />
                <img 
                  src="/assets/title-dark.png"
                  alt="DukaFiti" 
                  className="h-10 w-auto object-contain hidden dark:block"
                />
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <button 
                onClick={() => scrollToSection('features')}
                className="text-gray-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 font-medium transition-colors"
              >
                Features
              </button>
              <button 
                onClick={() => scrollToSection('how-it-works')}
                className="text-gray-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 font-medium transition-colors"
              >
                How It Works
              </button>
              <button 
                onClick={() => scrollToSection('testimonials')}
                className="text-gray-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 font-medium transition-colors"
              >
                About
              </button>
              <Button 
                variant="outline" 
                onClick={() => setLocation('/signin')}
                className="h-10 px-6 border-brand-200 text-brand-700 hover:bg-brand-50 dark:border-brand-700 dark:text-brand-300"
              >
                Login
              </Button>
              <Button 
                onClick={() => setLocation('/signup')}
                className="h-10 px-6 bg-brand hover:bg-brand-700 text-white"
              >
                Sign Up
              </Button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="h-10 w-10 p-0"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-col space-y-4">
                <button 
                  onClick={() => scrollToSection('features')}
                  className="text-left text-gray-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 font-medium"
                >
                  Features
                </button>
                <button 
                  onClick={() => scrollToSection('how-it-works')}
                  className="text-left text-gray-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 font-medium"
                >
                  How It Works
                </button>
                <button 
                  onClick={() => scrollToSection('testimonials')}
                  className="text-left text-gray-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 font-medium"
                >
                  About
                </button>
                <div className="flex flex-col space-y-2 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setLocation('/signin')}
                    className="justify-center"
                  >
                    Login
                  </Button>
                  <Button 
                    onClick={() => setLocation('/signup')}
                    className="justify-center bg-brand hover:bg-brand-700"
                  >
                    Sign Up
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section - Based on Template */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="lg:grid lg:grid-cols-12 lg:gap-12 items-center">
            <div className="lg:col-span-6">
              <div className="text-center lg:text-left">
                <Badge className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-brand/10 text-brand-700 dark:bg-brand/20 dark:text-brand-300 mb-6">
                  <Smartphone className="h-4 w-4 mr-2" />
                  Free 30-day trial • No credit card required
                </Badge>
                
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
                  Smart POS for <br />
                  <span className="text-brand">Kenyan Duka</span>
                </h1>
                
                <p className="mt-6 text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                  Transform your duka with intelligent inventory management, real-time analytics, and customer insights. Built for Kenyan businesses, works offline.
                </p>
                
                <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Button 
                    size="lg" 
                    onClick={() => setLocation('/signup')}
                    className="h-12 px-8 bg-brand hover:bg-brand-700 text-white font-semibold"
                  >
                    Get Started (Free 14-day Trial)
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline"
                    onClick={() => scrollToSection('features')}
                    className="h-12 px-8 border-brand-200 text-brand-700 hover:bg-brand-50 dark:border-brand-700 dark:text-brand-300"
                  >
                    Watch Demo
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="lg:col-span-6 mt-12 lg:mt-0">
              <div className="relative">
                <img 
                  src={templateHeroImage}
                  alt="DukaFiti Dashboard Preview" 
                  className="w-full h-auto rounded-lg shadow-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Spend Less Time Coding
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Everything you need to run your duka efficiently, from inventory to customer management
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-0 bg-brand/5 dark:bg-brand/10">
                <CardContent className="p-8">
                  <div className="bg-brand/10 dark:bg-brand/20 rounded-lg p-4 w-fit mb-6">
                    <feature.icon className="h-8 w-8 text-brand" />
                  </div>
                  
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    {feature.title}
                  </h3>
                  
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {feature.description}
                  </p>
                  
                  <ul className="space-y-2">
                    {feature.highlights.map((highlight, idx) => (
                      <li key={idx} className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                        <CheckCircle className="h-4 w-4 text-brand mr-2 flex-shrink-0" />
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section - Based on Template */}
      <section id="how-it-works" className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Easy steps
            </h2>
          </div>

          <div className="space-y-12">
            {steps.map((step, index) => (
              <div key={index} className="flex flex-col lg:flex-row gap-8 items-start">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-brand text-white rounded-full flex items-center justify-center text-xl font-bold">
                    {step.number}
                  </div>
                </div>
                
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {step.description}
                  </p>
                  
                  {index === 1 && (
                    <div className="mt-6 flex items-center gap-4 p-4 bg-white dark:bg-gray-700 rounded-lg border">
                      <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-purple-600 rounded-lg flex-shrink-0"></div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">FELL OUR DESIGN</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          DukaFiti Design Framework contains components which can easily be integrated into almost any design.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Button 
              onClick={() => setLocation('/signup')}
              className="bg-teal-500 hover:bg-teal-600 text-white px-8 py-3 rounded-full font-semibold"
            >
              Get Started
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Trusted by Kenyan Business Owners
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Join thousands of duka owners who are growing their business with DukaFiti
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-gray-50 dark:bg-gray-800 border-0">
                <CardContent className="p-8">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  
                  <blockquote className="text-lg text-gray-700 dark:text-gray-300 mb-6 italic">
                    "{testimonial.quote}"
                  </blockquote>
                  
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {testimonial.author}
                    </div>
                    <div className="text-gray-600 dark:text-gray-400 text-sm">
                      {testimonial.business}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-brand text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Ready to Transform Your Duka?
          </h2>
          <p className="text-xl mb-8 text-brand-100">
            Start your free 14-day trial today. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              onClick={() => setLocation('/signup')}
              className="h-12 px-8 bg-white text-brand hover:bg-gray-100 font-semibold"
            >
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg"
              variant="outline"
              onClick={() => setLocation('/signin')}
              className="h-12 px-8 border-white text-white hover:bg-white/10"
            >
              I Already Have an Account
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <img 
                src="/assets/slogan-light.png"
                alt="DukaFiti - Duka Fiti ni Duka Bora" 
                className="h-12 w-auto mb-4"
              />
              <p className="text-gray-400 mb-4">
                Smart POS solution designed specifically for Kenyan retailers. 
                Manage inventory, track sales, and grow your business.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-gray-400">
                <li><button onClick={() => setLocation('/dashboard')} className="hover:text-white transition-colors">Dashboard</button></li>
                <li><button onClick={() => setLocation('/reports')} className="hover:text-white transition-colors">Reports</button></li>
                <li><button onClick={() => setLocation('/settings')} className="hover:text-white transition-colors">Settings</button></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="mailto:support@dukafiti.com" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><button onClick={() => scrollToSection('how-it-works')} className="hover:text-white transition-colors">Help Center</button></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 DukaFiti. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingNew;