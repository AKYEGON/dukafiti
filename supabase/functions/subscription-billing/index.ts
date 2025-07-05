import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SubscriptionRequest {
  userId: string
  planType: 'trial' | 'monthly'
  phoneNumber: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: requestBody }: { data: SubscriptionRequest } = await req.json()
    const { userId, planType, phoneNumber } = requestBody

    // Calculate billing dates
    const now = new Date()
    const trialStart = now.toISOString()
    const trialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString() // 14 days
    const nextBillingDate = planType === 'trial' ? trialEnd : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days

    // Create or update subscription
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: userId,
        plan_type: planType,
        status: planType === 'trial' ? 'active_trial' : 'pending_payment',
        trial_start: trialStart,
        trial_end: trialEnd,
        next_billing_date: nextBillingDate,
        phone_number: phoneNumber,
        amount: planType === 'trial' ? 0 : 200,
        updated_at: now.toISOString()
      })
      .select()

    if (subError) {
      throw subError
    }

    // If it's a paid subscription, initiate M-Pesa STK push
    if (planType === 'monthly') {
      // Call M-Pesa STK push function
      const mpesaResponse = await fetch(`${supabaseUrl}/functions/v1/mpesa-stk-push`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber,
          amount: 200,
          subscriptionId: subscription[0].id,
          description: 'DukaFiti Monthly Subscription'
        })
      })

      const mpesaResult = await mpesaResponse.json()
      
      if (!mpesaResponse.ok) {
        throw new Error(`M-Pesa error: ${mpesaResult.error}`)
      }

      // Update subscription with M-Pesa transaction ID
      await supabase
        .from('subscriptions')
        .update({ 
          mpesa_request_id: mpesaResult.checkoutRequestId,
          updated_at: now.toISOString()
        })
        .eq('id', subscription[0].id)

      return new Response(JSON.stringify({
        success: true,
        subscription: subscription[0],
        mpesaCheckoutRequestId: mpesaResult.checkoutRequestId,
        message: 'Please enter your M-Pesa PIN to complete payment'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // For trial subscriptions
    return new Response(JSON.stringify({
      success: true,
      subscription: subscription[0],
      message: 'Trial subscription activated successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Subscription billing error:', error)
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})