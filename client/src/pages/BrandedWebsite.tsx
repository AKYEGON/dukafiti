import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Menu, 
  X, 
  ChevronRight, 
  Store, 
  BarChart3, 
  Users, 
  Smartphone,
  Shield,
  Zap,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';

export default function BrandedWebsite() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log('Form submitted:', formData);
    // Reset form
    setFormData({ name: '', email: '', message: '' });
    alert('Thank you for your message! We will get back to you soon.');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-[#1A3C6D] text-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-4">
              <img 
                src="/assets/logo-cube-only.png" 
                alt="DUKAFITI Cube Logo" 
                className="h-10 w-10 object-contain"
              />
              <div>
                <h1 className="text-2xl font-bold">DUKAFITI</h1>
                <p className="text-sm text-blue-200">DUKA BORA NI DUKA FITI</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#home" className="hover:text-blue-200 transition-colors">Home</a>
              <a href="#about" className="hover:text-blue-200 transition-colors">About</a>
              <a href="#services" className="hover:text-blue-200 transition-colors">Services</a>
              <a href="#contact" className="hover:text-blue-200 transition-colors">Contact</a>
              <Button 
                className="bg-[#4B0082] hover:bg-[#3A0066] text-white"
                onClick={() => window.location.href = '/login'}
              >
                Get Started
              </Button>
            </nav>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <nav className="md:hidden mt-4 pb-4 border-t border-blue-500/20">
              <div className="flex flex-col space-y-3 pt-4">
                <a href="#home" className="hover:text-blue-200 transition-colors">Home</a>
                <a href="#about" className="hover:text-blue-200 transition-colors">About</a>
                <a href="#services" className="hover:text-blue-200 transition-colors">Services</a>
                <a href="#contact" className="hover:text-blue-200 transition-colors">Contact</a>
                <Button 
                  className="bg-[#4B0082] hover:bg-[#3A0066] text-white w-full"
                  onClick={() => window.location.href = '/login'}
                >
                  Get Started
                </Button>
              </div>
            </nav>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section id="home" className="py-20 bg-gradient-to-r from-[#1A3C6D] to-[#008080]">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <img 
              src="/assets/logo-brand-colored.png" 
              alt="DUKAFITI Brand Logo" 
              className="mx-auto mb-8 h-32 object-contain"
            />
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Smart Business Management for Modern Dukas
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Streamline your shop operations with our comprehensive POS system, inventory management, and customer tracking - all in one powerful platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-[#4B0082] hover:bg-[#3A0066] text-white px-8 py-4 text-lg"
                onClick={() => window.location.href = '/register'}
              >
                Start Free Trial
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-white hover:bg-white hover:text-[#1A3C6D] px-8 py-4 text-lg"
                onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-8">
              Why Choose DUKAFITI?
            </h2>
            <p className="text-xl text-gray-600 mb-12">
              We understand the unique challenges of running a business in Kenya. 
              Our platform is designed specifically for local entrepreneurs who need 
              reliable, affordable, and easy-to-use business management tools.
            </p>
            
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-[#4B0082] p-3 rounded-full">
                    <Store className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Built for Local Business</h3>
                    <p className="text-gray-600">Designed with Kenyan shop owners in mind, supporting local currencies and business practices.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="bg-[#4B0082] p-3 rounded-full">
                    <Smartphone className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Mobile-First Design</h3>
                    <p className="text-gray-600">Access your business data anywhere, anytime with our responsive mobile interface.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="bg-[#4B0082] p-3 rounded-full">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Secure & Reliable</h3>
                    <p className="text-gray-600">Your business data is protected with enterprise-grade security and regular backups.</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-[#4B0082] to-[#1A3C6D] p-8 rounded-2xl text-white">
                <h3 className="text-2xl font-bold mb-4">Start Your Success Story</h3>
                <p className="text-blue-100 mb-6">
                  Join thousands of successful business owners who trust DUKAFITI to manage their operations efficiently.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span>30-day free trial</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span>No setup fees</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span>24/7 customer support</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Everything You Need to Run Your Business
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                From inventory management to customer tracking, we've got all the tools you need to grow your business.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="bg-[#4B0082] text-white border-0 hover:shadow-xl transition-shadow">
                <CardHeader>
                  <BarChart3 className="h-12 w-12 text-white mb-4" />
                  <CardTitle className="text-white">Sales & POS</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-blue-100">
                    Fast and intuitive point-of-sale system with real-time sales tracking, receipt printing, and payment processing.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="bg-[#4B0082] text-white border-0 hover:shadow-xl transition-shadow">
                <CardHeader>
                  <Store className="h-12 w-12 text-white mb-4" />
                  <CardTitle className="text-white">Inventory Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-blue-100">
                    Keep track of your stock levels, set low-stock alerts, and manage product categories with ease.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="bg-[#4B0082] text-white border-0 hover:shadow-xl transition-shadow">
                <CardHeader>
                  <Users className="h-12 w-12 text-white mb-4" />
                  <CardTitle className="text-white">Customer Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-blue-100">
                    Track customer purchases, manage credit sales, and build stronger relationships with your customers.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="bg-[#4B0082] text-white border-0 hover:shadow-xl transition-shadow">
                <CardHeader>
                  <BarChart3 className="h-12 w-12 text-white mb-4" />
                  <CardTitle className="text-white">Reports & Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-blue-100">
                    Get detailed insights into your business performance with comprehensive reports and analytics.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="bg-[#4B0082] text-white border-0 hover:shadow-xl transition-shadow">
                <CardHeader>
                  <Zap className="h-12 w-12 text-white mb-4" />
                  <CardTitle className="text-white">Real-time Notifications</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-blue-100">
                    Stay informed with instant alerts for low stock, payment reminders, and important business updates.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="bg-[#4B0082] text-white border-0 hover:shadow-xl transition-shadow">
                <CardHeader>
                  <Smartphone className="h-12 w-12 text-white mb-4" />
                  <CardTitle className="text-white">Mobile App</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-blue-100">
                    Access your business from anywhere with our Progressive Web App that works offline.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-[#1A3C6D] text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">Get in Touch</h2>
              <p className="text-xl text-blue-200">
                Ready to transform your business? We're here to help you get started.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12">
              <div className="space-y-8">
                <div>
                  <h3 className="text-2xl font-bold mb-6">Contact Information</h3>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <Mail className="h-6 w-6 text-blue-200" />
                      <div>
                        <p className="font-semibold">Email</p>
                        <p className="text-blue-200">support@dukafiti.com</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Phone className="h-6 w-6 text-blue-200" />
                      <div>
                        <p className="font-semibold">Phone</p>
                        <p className="text-blue-200">+254 700 000 000</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <MapPin className="h-6 w-6 text-blue-200" />
                      <div>
                        <p className="font-semibold">Location</p>
                        <p className="text-blue-200">Nairobi, Kenya</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-[#4B0082] p-6 rounded-xl">
                  <h4 className="text-xl font-bold mb-4">Why DUKAFITI?</h4>
                  <p className="text-blue-100 mb-4">
                    "DUKA BORA NI DUKA FITI" - A good shop is a well-managed shop. 
                    Our platform helps you achieve excellence in business management.
                  </p>
                  <Button 
                    className="bg-white text-[#4B0082] hover:bg-blue-50"
                    onClick={() => window.location.href = '/register'}
                  >
                    Start Your Free Trial
                  </Button>
                </div>
              </div>

              <div className="bg-white p-8 rounded-xl text-gray-900">
                <h3 className="text-2xl font-bold mb-6">Send us a Message</h3>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      rows={4}
                      className="mt-1"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-[#4B0082] hover:bg-[#3A0066] text-white"
                  >
                    Send Message
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center space-x-4 mb-8">
              <img 
                src="/assets/logo-cube-only.png" 
                alt="DUKAFITI Cube Logo" 
                className="h-8 w-8 object-contain"
              />
              <div>
                <h3 className="text-xl font-bold">DUKAFITI</h3>
                <p className="text-sm text-gray-400">DUKA BORA NI DUKA FITI</p>
              </div>
            </div>
            <div className="border-t border-gray-800 pt-8">
              <p className="text-gray-400">
                © 2025 DUKAFITI. All rights reserved. | 
                <a href="/privacy" className="hover:text-white ml-1">Privacy Policy</a> | 
                <a href="/terms" className="hover:text-white ml-1">Terms of Service</a>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}