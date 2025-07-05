import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, CreditCard, Star, Smartphone, BarChart3, Users, Package, Wifi } from 'lucide-react'
import { SubscriptionManager } from '@/components/subscription/SubscriptionManager'
import { useAuth } from '@/contexts/auth-context'

export default function PricingPage() {
  const { user } = useAuth()

  const features = [
    {
      icon: Package,
      title: 'Complete Inventory Management',
      description: 'Track stock, set alerts, manage categories'
    },
    {
      icon: BarChart3,
      title: 'Advanced Analytics',
      description: 'Sales reports, trends, and business insights'
    },
    {
      icon: Users,
      title: 'Customer Management',
      description: 'Track customers, credit sales, payment history'
    },
    {
      icon: CreditCard,
      title: 'M-Pesa Integration',
      description: 'Accept mobile payments directly in-app'
    },
    {
      icon: Smartphone,
      title: 'Mobile-First Design',
      description: 'Optimized for smartphones and tablets'
    },
    {
      icon: Wifi,
      title: 'Offline Functionality',
      description: 'Continue working without internet connection'
    }
  ]

  const testimonials = [
    {
      name: 'Mary Wanjiku',
      business: 'Wanjiku General Store',
      location: 'Nairobi',
      text: 'DukaFiti has transformed how I manage my shop. The offline feature is perfect for when network is poor.',
      rating: 5
    },
    {
      name: 'John Kamau',
      business: 'Kamau Electronics',
      location: 'Mombasa',
      text: 'The M-Pesa integration makes payments so easy. My customers love it and sales have increased by 30%.',
      rating: 5
    },
    {
      name: 'Grace Akinyi',
      business: 'Mama Grace Supplies',
      location: 'Kisumu',
      text: 'Best investment for my business. The inventory tracking helps me avoid stockouts completely.',
      rating: 5
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            🚀 Limited Time: 14-Day Free Trial
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Simple Pricing for
            <span className="text-green-600"> Every Dukawala</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Start your digital transformation journey with our free trial, then continue for just KES 200 per month.
            Everything you need to manage and grow your business.
          </p>
        </div>

        {/* Pricing Card */}
        <div className="max-w-lg mx-auto mb-16">
          {user ? (
            <SubscriptionManager userId={user.id} />
          ) : (
            <Card className="border-2 border-green-200 shadow-xl">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">DukaFiti Pro</CardTitle>
                <CardDescription>Everything you need to run your business</CardDescription>
                <div className="flex items-center justify-center gap-2 mt-4">
                  <span className="text-3xl font-bold">KES 200</span>
                  <span className="text-gray-500">/month</span>
                </div>
                <Badge variant="secondary" className="w-fit mx-auto mt-2">
                  14-day free trial
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {[
                    'Complete inventory management',
                    'Sales tracking & analytics',
                    'Customer management',
                    'M-Pesa payment integration',
                    'Offline functionality',
                    'Mobile-optimized interface',
                    'Free updates & support'
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
                <Button className="w-full mt-6" size="lg">
                  Start Free Trial
                </Button>
                <p className="text-xs text-center text-gray-500">
                  No credit card required • Cancel anytime
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Features Grid */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">
            Everything Your Business Needs
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-green-100 p-3 rounded-lg">
                      <feature.icon className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">{feature.title}</h3>
                      <p className="text-gray-600 text-sm">{feature.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Testimonials */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">
            Trusted by Kenyan Business Owners
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-md">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-4">"{testimonial.text}"</p>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.business}</p>
                    <p className="text-xs text-gray-400">{testimonial.location}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {[
              {
                question: 'How does the free trial work?',
                answer: 'You get full access to all DukaFiti features for 14 days completely free. No credit card required to start. After the trial, continue for just KES 200/month.'
              },
              {
                question: 'How do I pay after the trial?',
                answer: 'We use M-Pesa for convenient mobile payments. You\'ll receive an STK push notification on your phone to complete payment securely.'
              },
              {
                question: 'Can I use DukaFiti offline?',
                answer: 'Yes! DukaFiti works offline, so you can continue recording sales and managing inventory even without internet. Data syncs automatically when you\'re back online.'
              },
              {
                question: 'What happens if I cancel?',
                answer: 'You can cancel anytime. Your data will remain accessible for 30 days after cancellation, giving you time to export if needed.'
              },
              {
                question: 'Do you offer customer support?',
                answer: 'Yes! We provide customer support via phone and WhatsApp. Our team understands Kenyan businesses and is here to help you succeed.'
              }
            ].map((faq, index) => (
              <Card key={index} className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-3">{faq.question}</h3>
                  <p className="text-gray-600">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16 py-16 bg-gradient-to-r from-green-600 to-purple-600 rounded-2xl text-white">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of successful Kenyan entrepreneurs using DukaFiti
          </p>
          <Button size="lg" variant="secondary" className="text-green-600">
            Start Your Free Trial Today
          </Button>
          <p className="text-sm mt-4 opacity-75">
            No setup fees • No contracts • Cancel anytime
          </p>
        </div>
      </div>
    </div>
  )
}