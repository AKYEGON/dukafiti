import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const callbackData = await req.json()
    console.log('M-Pesa Callback received:', callbackData)

    const { Body: { stkCallback } } = callbackData

    const merchantRequestId = stkCallback.MerchantRequestID
    const checkoutRequestId = stkCallback.CheckoutRequestID
    const resultCode = stkCallback.ResultCode
    const resultDesc = stkCallback.ResultDesc

    // Update transaction status
    const transactionUpdate: any = {
      merchant_request_id: merchantRequestId,
      status: resultCode === 0 ? 'completed' : 'failed',
      result_code: resultCode,
      result_description: resultDesc,
      updated_at: new Date().toISOString()
    }

    // If payment was successful, extract payment details
    if (resultCode === 0 && stkCallback.CallbackMetadata) {
      const metadata = stkCallback.CallbackMetadata.Item
      
      // Extract payment details from metadata
      const amount = metadata.find((item: any) => item.Name === 'Amount')?.Value
      const mpesaReceiptNumber = metadata.find((item: any) => item.Name === 'MpesaReceiptNumber')?.Value
      const transactionDate = metadata.find((item: any) => item.Name === 'TransactionDate')?.Value
      const phoneNumber = metadata.find((item: any) => item.Name === 'PhoneNumber')?.Value

      transactionUpdate.amount = amount
      transactionUpdate.mpesa_receipt_number = mpesaReceiptNumber
      transactionUpdate.transaction_date = transactionDate?.toString()
      transactionUpdate.phone_number = phoneNumber?.toString()
    }

    // Update the transaction record
    const { data: transaction, error: updateError } = await supabase
      .from('mpesa_transactions')
      .update(transactionUpdate)
      .eq('checkout_request_id', checkoutRequestId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating transaction:', updateError)
      throw updateError
    }

    // If payment was successful, update the subscription
    if (resultCode === 0 && transaction) {
      const { error: subError } = await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          payment_status: 'paid',
          updated_at: new Date().toISOString()
        })
        .eq('id', transaction.subscription_id)

      if (subError) {
        console.error('Error updating subscription:', subError)
      }

      // Create a notification for successful payment
      await supabase
        .from('notifications')
        .insert({
          title: 'Payment Successful',
          message: `Your DukaFiti subscription payment of KES ${transaction.amount} has been confirmed.`,
          type: 'success',
          created_at: new Date().toISOString()
        })
    } else {
      // Create a notification for failed payment
      await supabase
        .from('notifications')
        .insert({
          title: 'Payment Failed',
          message: `Your DukaFiti subscription payment failed: ${resultDesc}`,
          type: 'error',
          created_at: new Date().toISOString()
        })
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Callback processed successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('M-Pesa callback error:', error)
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})