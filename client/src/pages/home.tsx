import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Store, BarChart3, Users, Shield, Zap, Globe, ArrowRight, CheckCircle, Star, Menu, X } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";

export default function Home() {
  const [, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const features = [
    {
      icon: Store,
      title: "Smart Inventory",
      description: "Track stock levels, manage products, and never run out of your bestsellers",
      accentColor: "border-l-brand"
    },
    {
      icon: BarChart3,
      title: "Real-time Analytics", 
      description: "Get instant insights on sales, profits, and customer behavior to grow faster",
      accentColor: "border-l-accent-blue"
    },
    {
      icon: Users,
      title: "Customer Management",
      description: "Build stronger relationships with customer profiles and purchase history",
      accentColor: "border-l-brand"
    }
  ];

  const testimonials = [
    {
      quote: "DukaFiti helped me increase my profits by 40% in just 3 months. The inventory alerts saved me from stockouts during peak season.",
      author: "Mary Wanjiku",
      business: "Wanjiku General Store, Nairobi"
    },
    {
      quote: "Finally, a POS system built for Kenyan businesses. Easy to use, works offline, and the customer support understands our needs.",
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
              <div className="brand-logo-container mr-4">
                <img 
                  src="/assets/logo-full.png" 
                  alt="DukaFiti" 
                  className="h-8 w-auto"
                />
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 font-medium">Features</a>
              <a href="#testimonials" className="text-gray-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 font-medium">Testimonials</a>
              <Button 
                variant="outline" 
                onClick={() => setLocation('/login')}
                className="h-10 px-6 border-brand-200 text-brand-700 hover:bg-brand-50 dark:border-brand-700 dark:text-brand-300"
              >
                Log In
              </Button>
              <Button 
                onClick={() => setLocation('/register')}
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
                  onClick={() => setLocation('/login')}
                  className="w-full h-12 border-brand-200 text-brand-700 hover:bg-brand-50"
                >
                  Log In
                </Button>
                <Button 
                  onClick={() => setLocation('/register')}
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
                  Smart POS for <span className="text-brand">Kenyan Dukawalas</span>
                </h1>
                <p className="mt-6 text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                  Transform your duka with intelligent inventory management, real-time analytics, and customer insights. 
                  Built for Kenyan businesses, works offline.
                </p>
                
                <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Button 
                    size="lg" 
                    onClick={() => setLocation('/register')}
                    className="h-12 px-8 bg-brand hover:bg-brand-700 text-white font-semibold"
                  >
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline"
                    onClick={() => setLocation('/login')}
                    className="h-12 px-8 border-brand-200 text-brand-700 hover:bg-brand-50"
                  >
                    See Demo
                  </Button>
                </div>

                <div className="mt-8 flex items-center justify-center lg:justify-start text-sm text-gray-500 dark:text-gray-400">
                  <CheckCircle className="h-4 w-4 text-brand-500 mr-2" />
                  <span>Free 30-day trial • No credit card required</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 mt-12 lg:mt-0">
              <div className="relative">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between bg-brand-50 dark:bg-brand-900/20 p-4 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-brand-500 rounded-full"></div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">Today's Sales</span>
                      </div>
                      <span className="text-lg font-bold text-brand-600">KES 45,680</span>
                    </div>
                    <div className="flex items-center justify-between bg-accent-blue-50 dark:bg-accent-blue-900/20 p-4 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-accent-blue-500 rounded-full"></div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">Products Sold</span>
                      </div>
                      <span className="text-lg font-bold text-accent-blue-600">127</span>
                    </div>
                    <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">Low Stock Alert</span>
                      </div>
                      <span className="text-lg font-bold text-orange-600">3 items</span>
                    </div>
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
              Everything Your Duka Needs
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Powerful tools designed specifically for Kenyan small businesses
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
              <div className="text-2xl font-bold text-gray-900 dark:text-white">1000+</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Happy Dukas</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Trusted by Dukawalas Across Kenya
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              See how DukaFiti is transforming small businesses
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
            Join thousands of successful dukawalas who've modernized their business with DukaFiti.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => setLocation('/register')}
              className="h-12 px-8 bg-white text-brand-900 hover:bg-gray-100 font-semibold"
            >
              Start Your Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => setLocation('/login')}
              className="h-12 px-8 border-white text-white hover:bg-white hover:text-brand-900"
            >
              Schedule Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-black border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="brand-logo-container mb-6 inline-block">
              <img 
                src="/assets/slogan_1751824985940.png" 
                alt="Duka Fiti ni Duka Bora" 
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