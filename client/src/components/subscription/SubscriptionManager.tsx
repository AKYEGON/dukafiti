import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { CreditCard, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { supabase, functionsUrl } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

interface Subscription {
  id: string
  plan_type: 'trial' | 'monthly'
  status: 'active_trial' | 'active' | 'pending_payment' | 'expired'
  trial_start: string
  trial_end: string
  next_billing_date: string
  phone_number: string
  amount: number
}

interface SubscriptionManagerProps {
  userId: string
}

export function SubscriptionManager({ userId }: SubscriptionManagerProps) {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [processingPayment, setProcessingPayment] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchSubscription()
  }, [userId])

  const fetchSubscription = async () => {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      setSubscription(data)
    } catch (error) {
      console.error('Error fetching subscription:', error)
    }
  }

  const startTrial = async () => {
    if (!phoneNumber) {
      toast({
        title: 'Phone Number Required',
        description: 'Please enter your phone number to start your trial',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      const response = await fetch(`${functionsUrl}/subscription-billing`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          planType: 'trial',
          phoneNumber: phoneNumber.trim()
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to start trial')
      }

      setSubscription(result.subscription)
      toast({
        title: 'Trial Started!',
        description: 'Your 14-day free trial has been activated',
      })
    } catch (error) {
      console.error('Error starting trial:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to start trial',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const upgradeToMonthly = async () => {
    if (!phoneNumber) {
      toast({
        title: 'Phone Number Required',
        description: 'Please enter your M-Pesa phone number',
        variant: 'destructive',
      })
      return
    }

    setProcessingPayment(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      const response = await fetch(`${functionsUrl}/subscription-billing`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          planType: 'monthly',
          phoneNumber: phoneNumber.trim()
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to initiate payment')
      }

      toast({
        title: 'Payment Initiated',
        description: result.message || 'Please check your phone and enter your M-Pesa PIN',
      })
      
      // Refresh subscription data
      setTimeout(fetchSubscription, 2000)
    } catch (error) {
      console.error('Error upgrading subscription:', error)
      toast({
        title: 'Payment Error',
        description: error.message || 'Failed to initiate payment',
        variant: 'destructive',
      })
    } finally {
      setProcessingPayment(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active_trial: { label: 'Free Trial', variant: 'secondary' as const, icon: Clock },
      active: { label: 'Active', variant: 'default' as const, icon: CheckCircle },
      pending_payment: { label: 'Payment Pending', variant: 'outline' as const, icon: CreditCard },
      expired: { label: 'Expired', variant: 'destructive' as const, icon: AlertCircle },
    }

    const config = statusConfig[status as keyof typeof statusConfig]
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getDaysRemaining = (endDate: string) => {
    const days = Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return Math.max(0, days)
  }

  if (!subscription) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Start Your DukaFiti Journey
          </CardTitle>
          <CardDescription>
            Get started with a free 14-day trial, then continue for just KES 200/month
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number (M-Pesa)</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="07XXXXXXXX or 254XXXXXXX"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </div>
          
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">What's included:</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Complete inventory management</li>
              <li>• Sales tracking & analytics</li>
              <li>• Customer management</li>
              <li>• Offline functionality</li>
              <li>• Mobile-optimized interface</li>
            </ul>
          </div>

          <Button 
            onClick={startTrial} 
            disabled={loading || !phoneNumber}
            className="w-full"
          >
            {loading ? 'Starting Trial...' : 'Start Free Trial'}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Your Subscription</span>
          {getStatusBadge(subscription.status)}
        </CardTitle>
        <CardDescription>
          Manage your DukaFiti subscription
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {subscription.status === 'active_trial' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-blue-800 mb-2">
              <Clock className="h-4 w-4" />
              <span className="font-medium">Free Trial</span>
            </div>
            <p className="text-sm text-blue-700">
              {getDaysRemaining(subscription.trial_end)} days remaining
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Trial ends: {formatDate(subscription.trial_end)}
            </p>
          </div>
        )}

        {subscription.status === 'active' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-800 mb-2">
              <CheckCircle className="h-4 w-4" />
              <span className="font-medium">Active Subscription</span>
            </div>
            <p className="text-sm text-green-700">
              Next billing: {formatDate(subscription.next_billing_date)}
            </p>
            <p className="text-xs text-green-600 mt-1">
              KES {subscription.amount}/month
            </p>
          </div>
        )}

        {subscription.status === 'pending_payment' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-yellow-800 mb-2">
              <CreditCard className="h-4 w-4" />
              <span className="font-medium">Payment Pending</span>
            </div>
            <p className="text-sm text-yellow-700">
              Please check your phone for M-Pesa payment prompt
            </p>
          </div>
        )}

        {(subscription.status === 'active_trial' || subscription.status === 'expired') && (
          <>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number (M-Pesa)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="07XXXXXXXX or 254XXXXXXX"
                value={phoneNumber || subscription.phone_number}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>

            <Button 
              onClick={upgradeToMonthly} 
              disabled={processingPayment || !phoneNumber}
              className="w-full"
            >
              {processingPayment ? 'Processing...' : 'Subscribe - KES 200/month'}
            </Button>
          </>
        )}

        <div className="text-xs text-muted-foreground text-center">
          Secure payments powered by M-Pesa
        </div>
      </CardContent>
    </Card>
  )
}