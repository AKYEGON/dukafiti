import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MPesaRequest {
  phoneNumber: string
  amount: number
  subscriptionId: string
  description: string
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

    // Get M-Pesa credentials from environment
    const consumerKey = Deno.env.get('MPESA_CONSUMER_KEY')!
    const consumerSecret = Deno.env.get('MPESA_CONSUMER_SECRET')!
    const businessShortCode = Deno.env.get('MPESA_BUSINESS_SHORTCODE')!
    const passkey = Deno.env.get('MPESA_PASSKEY')!
    const baseUrl = Deno.env.get('MPESA_BASE_URL') || 'https://sandbox.safaricom.co.ke'

    if (!consumerKey || !consumerSecret || !businessShortCode || !passkey) {
      throw new Error('Missing M-Pesa configuration')
    }

    const requestBody: MPesaRequest = await req.json()
    const { phoneNumber, amount, subscriptionId, description } = requestBody

    // Format phone number (ensure it starts with 254)
    const formattedPhone = phoneNumber.startsWith('254') 
      ? phoneNumber 
      : phoneNumber.startsWith('0') 
        ? `254${phoneNumber.slice(1)}`
        : `254${phoneNumber}`

    // Generate timestamp
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14)
    
    // Generate password (Base64 encode BusinessShortCode + Passkey + Timestamp)
    const password = btoa(`${businessShortCode}${passkey}${timestamp}`)

    // Step 1: Get OAuth token
    const credentials = btoa(`${consumerKey}:${consumerSecret}`)
    const tokenResponse = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${credentials}`,
      },
    })

    if (!tokenResponse.ok) {
      throw new Error('Failed to get M-Pesa OAuth token')
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    // Step 2: Initiate STK Push
    const stkPushPayload = {
      BusinessShortCode: businessShortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: formattedPhone,
      PartyB: businessShortCode,
      PhoneNumber: formattedPhone,
      CallBackURL: `${supabaseUrl}/functions/v1/mpesa-callback`,
      AccountReference: `DukaFiti-${subscriptionId}`,
      TransactionDesc: description
    }

    const stkResponse = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(stkPushPayload),
    })

    const stkData = await stkResponse.json()

    if (!stkResponse.ok || stkData.ResponseCode !== '0') {
      throw new Error(`M-Pesa STK Push failed: ${stkData.errorMessage || stkData.ResponseDescription}`)
    }

    // Store transaction for tracking
    await supabase
      .from('mpesa_transactions')
      .insert({
        checkout_request_id: stkData.CheckoutRequestID,
        merchant_request_id: stkData.MerchantRequestID,
        subscription_id: subscriptionId,
        phone_number: formattedPhone,
        amount: amount,
        status: 'pending',
        created_at: new Date().toISOString()
      })

    return new Response(JSON.stringify({
      success: true,
      checkoutRequestId: stkData.CheckoutRequestID,
      merchantRequestId: stkData.MerchantRequestID,
      responseDescription: stkData.ResponseDescription,
      customerMessage: stkData.CustomerMessage
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('M-Pesa STK Push error:', error)
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})