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
      accentColor: "border-l-green-500"
    },
    {
      icon: BarChart3,
      title: "Real-time Analytics",
      description: "Get instant insights on sales, profits, and customer behavior to grow faster",
      accentColor: "border-l-purple-600"
    },
    {
      icon: Users,
      title: "Customer Management",
      description: "Build stronger relationships with customer profiles and purchase history",
      accentColor: "border-l-green-500"
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
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Duka<span className="text-green-600">Fiti</span>
              </h1>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:block">
              <Button
                onClick={() => setLocation("/login")}
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Login
              </Button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                onClick={() => setLocation("/login")}
                variant="outline"
                className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Login
              </Button>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-center">
            <div className="lg:col-span-6">
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight mb-6">
                DukaFiti – <span className="text-green-600">Duka Fiti ni Duka Bora</span>
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed mb-8">
                Grow your business with intelligent inventory management, real-time sales tracking, and customer insights designed specifically for Kenyan retailers.
              </p>
              <Button
                onClick={() => setLocation("/register")}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 w-full sm:w-auto"
                size="lg"
              >
                Get Started – It's Free <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>

            <div className="lg:col-span-6 mt-12 lg:mt-0">
              <div className="relative">
                {/* Hero Graphic - SVG Illustration */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">Today's Sales</span>
                      </div>
                      <span className="text-lg font-bold text-green-600">KES 45,680</span>
                    </div>
                    <div className="flex items-center justify-between bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">Products Sold</span>
                      </div>
                      <span className="text-lg font-bold text-purple-600">127</span>
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
      <section className="py-20 lg:py-32 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Everything You Need to Grow Your Duka
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Built specifically for Kenyan retailers, with features that understand your business needs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className={`bg-white dark:bg-gray-800 border-l-4 ${feature.accentColor} shadow-lg hover:shadow-xl transition-shadow duration-300`}>
                <CardContent className="p-8">
                  <div className="mb-6">
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                      <feature.icon className="h-6 w-6 text-gray-700 dark:text-gray-300" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Additional Features Grid */}
          <div className="mt-16 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-gray-700 dark:text-gray-300">Works offline</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-gray-700 dark:text-gray-300">Mobile-first design</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-gray-700 dark:text-gray-300">KES currency support</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-gray-700 dark:text-gray-300">M-Pesa integration</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-gray-700 dark:text-gray-300">Customer credit tracking</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-gray-700 dark:text-gray-300">Free to start</span>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 lg:py-32 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Trusted by Kenyan Business Owners
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              See how DukaFiti is helping dukas across Kenya grow their business
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-white dark:bg-gray-900 border-l-4 border-l-purple-600 shadow-lg p-6">
                <CardContent className="p-0">
                  <div className="flex mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <blockquote className="text-lg text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
                    "{testimonial.quote}"
                  </blockquote>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">{testimonial.author}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{testimonial.business}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA Section */}
      <section className="bg-gradient-to-r from-green-600 to-purple-600 py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Duka?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join thousands of Kenyan retailers who are already growing with DukaFiti
          </p>
          <Button
            onClick={() => setLocation("/register")}
            className="bg-white text-green-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
            size="lg"
          >
            Get Started Now <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-2">
              Duka<span className="text-green-400">Fiti</span>
            </h3>
            <p className="text-gray-400 mb-6">
              Duka Fiti ni Duka Bora - Smart POS solutions for Kenyan businesses
            </p>
            <div className="flex justify-center space-x-6 text-sm text-gray-400">
              <span>© 2025 DukaFiti</span>
              <span>•</span>
              <span>Built for Kenya</span>
              <span>•</span>
              <span>Free to Start</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}