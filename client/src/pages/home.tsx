import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Store, BarChart3, Users, Shield, Zap, Globe, ArrowRight, CheckCircle, Star, Menu, X } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
import { useTheme } from "next-themes";

export default function Home() {
  const [, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme } = useTheme();

  const features = [
    {
      icon: Store,
      title: "Inventory Management",
      description: "Track stock levels, manage products with SKU codes, set low-stock alerts, and handle unknown quantities for items sold by measurement",
      accentColor: "border-l-brand"
    },
    {
      icon: BarChart3,
      title: "Sales & Reports", 
      description: "Process cash, mobile money, and credit sales. Generate detailed reports with trends, top products, and customer analytics",
      accentColor: "border-l-accent-blue"
    },
    {
      icon: Users,
      title: "Customer Credit Management",
      description: "Track customer credit balances, record repayments, and manage customer information with automatic notifications",
      accentColor: "border-l-brand"
    }
  ];

  const testimonials = [
    {
      quote: "DukaFiti helps me track my inventory perfectly. The low-stock alerts prevent me from running out of popular items, and the sales reports show exactly which products are making money.",
      author: "Mary Wanjiku",
      business: "Wanjiku General Store, Nairobi"
    },
    {
      quote: "Managing customer credit was a nightmare before DukaFiti. Now I can easily track who owes what, send reminders, and record payments. The offline feature is perfect for our location.",
      author: "John Kamau",
      business: "Kamau Electronics, Nakuru"
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="mr-4 relative">
                {/* Light mode title */}
                <img 
                  src="/assets/title-light.png"
                  alt="DukaFiti" 
                  className="h-10 w-auto object-contain dark:hidden"
                />
                {/* Dark mode title */}
                <img 
                  src="/assets/title-dark.png"
                  alt="DukaFiti" 
                  className="h-10 w-auto object-contain hidden dark:block"
                />
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 font-medium">Features</a>
              <a href="#testimonials" className="text-gray-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 font-medium">Testimonials</a>
              <Button 
                variant="outline" 
                onClick={() => setLocation('/auth')}
                className="h-10 px-6 border-brand-200 text-brand-700 hover:bg-brand-50 dark:border-brand-700 dark:text-brand-300"
              >
                Log In
              </Button>
              <Button 
                onClick={() => setLocation('/auth')}
                className="h-10 px-6 bg-brand hover:bg-brand-700 text-white"
              >
                Get Started
              </Button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="h-10 w-10"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-col space-y-4">
                <a href="#features" className="text-gray-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 font-medium">Features</a>
                <a href="#testimonials" className="text-gray-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 font-medium">Testimonials</a>
                <Button 
                  variant="outline" 
                  onClick={() => setLocation('/auth')}
                  className="w-full h-12 border-brand-200 text-brand-700 hover:bg-brand-50"
                >
                  Log In
                </Button>
                <Button 
                  onClick={() => setLocation('/auth')}
                  className="w-full h-12 bg-brand hover:bg-brand-700 text-white"
                >
                  Get Started
                </Button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-center">
            <div className="lg:col-span-6">
              <div className="text-center lg:text-left">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
                  Complete Business Management for <span className="text-brand">Kenyan Duka</span>
                </h1>
                <p className="mt-6 text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                  Manage your inventory, track sales, handle customer credit, and generate reports. 
                  Built for Kenyan businesses with offline capabilities and real-time notifications.
                </p>
                
                <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Button 
                    size="lg" 
                    onClick={() => setLocation('/auth')}
                    className="h-12 px-8 bg-brand hover:bg-brand-700 text-white font-semibold"
                  >
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>

                </div>

                <div className="mt-8 flex items-center justify-center lg:justify-start text-sm text-gray-500 dark:text-gray-400">
                  <CheckCircle className="h-4 w-4 text-brand-500 mr-2" />
                  <span>Free 14-day trial • No credit card required</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 mt-12 lg:mt-0">
              <div className="relative">
                {/* Dashboard Preview with Professional Backlighting and Hover Effects */}
                <div className="dashboard-preview-container group cursor-pointer bg-gradient-to-br from-brand-100 to-accent-blue-100 dark:from-brand-900 dark:to-accent-blue-900 p-3">
                  {/* Professional backlighting glow */}
                  <div className="dashboard-preview-glow"></div>
                  
                  {/* Dashboard Preview Image Container */}
                  <div className="dashboard-preview-image dark:bg-gray-900">
                    <img 
                      src="/assets/dashboard-preview.png" 
                      alt="DukaFiti Dashboard - Complete Business Management Interface" 
                      className="w-full h-auto object-cover"
                    />
                    
                    {/* Professional overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-end justify-center pb-6">
                      <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-xl px-6 py-3 shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                        <p className="text-sm text-gray-700 dark:text-gray-300 font-semibold text-center">
                          Complete Inventory, Sales & Customer Management
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">
                          Built for Kenyan Duka
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Feature Highlights */}
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="bg-brand-50 dark:bg-brand-900/20 p-4 rounded-lg">
                    <div className="text-xs text-brand-600 dark:text-brand-400 font-medium">Revenue Tracking</div>
                    <div className="text-lg font-bold text-brand-700 dark:text-brand-300">KES 4,680</div>
                  </div>
                  <div className="bg-accent-blue-50 dark:bg-accent-blue-900/20 p-4 rounded-lg">
                    <div className="text-xs text-accent-blue-600 dark:text-accent-blue-400 font-medium">Active Customers</div>
                    <div className="text-lg font-bold text-accent-blue-700 dark:text-accent-blue-300">9</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 lg:py-32 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Complete Business Management Suite
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              All the tools you need to run your duka efficiently, from inventory to customer management
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <Card key={index} className={`border-l-4 ${feature.accentColor} hover:shadow-lg transition-shadow duration-200`}>
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                      <div className="p-2 bg-brand-50 dark:bg-brand-900/20 rounded-lg mr-4">
                        <IconComponent className="h-6 w-6 text-brand-600 dark:text-brand-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {feature.title}
                      </h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Trust Indicators Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="flex items-center justify-center mb-2">
                <Shield className="h-8 w-8 text-brand-500" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">Bank-Level</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Security</div>
            </div>
            <div>
              <div className="flex items-center justify-center mb-2">
                <Zap className="h-8 w-8 text-brand-500" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">99.9%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Uptime</div>
            </div>
            <div>
              <div className="flex items-center justify-center mb-2">
                <Globe className="h-8 w-8 text-brand-500" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">Offline</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Ready</div>
            </div>
            <div>
              <div className="flex items-center justify-center mb-2">
                <Users className="h-8 w-8 text-brand-500" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">24/7</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Trusted by Duka Across Kenya
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Real feedback from duka owners using DukaFiti
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                <CardContent className="p-8">
                  <div className="flex mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <blockquote className="text-lg text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
                    "{testimonial.quote}"
                  </blockquote>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {testimonial.author}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
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
      <section className="py-20 bg-brand-900 dark:bg-brand-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Duka?
          </h2>
          <p className="text-xl text-brand-200 mb-8 max-w-2xl mx-auto">
            Start managing your inventory, sales, and customer credit efficiently with DukaFiti.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => setLocation('/auth')}
              className="h-12 px-8 bg-white text-brand-900 hover:bg-gray-100 font-semibold"
            >
              Start Your Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-black border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="mb-6">
              <img 
                src="/assets/slogan-only-white.png"
                alt="Duka Bora Ni Duka Fiti" 
                className="h-8 w-auto opacity-80"
              />
            </div>
            <p className="text-gray-400 text-sm">
              © 2025 DukaFiti. All rights reserved. Built for Kenyan businesses.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}