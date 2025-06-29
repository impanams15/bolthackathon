import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import algosdk from 'npm:algosdk@3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { amount, userId } = await req.json()

    if (!amount || !userId || amount <= 0) {
      return new Response(JSON.stringify({ error: 'Invalid amount or user ID' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (amount < 0.001) {
      return new Response(JSON.stringify({ error: 'Minimum donation amount is 0.001 ALGO' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get environment variables
    const SENDER_MNEMONIC = Deno.env.get('SENDER_MNEMONIC')
    const CHARITY_ADDRESS = Deno.env.get('CHARITY_ADDRESS')
    const ALGOD_API = Deno.env.get('ALGOD_API') || 'https://testnet-api.algonode.cloud'

    if (!SENDER_MNEMONIC || !CHARITY_ADDRESS) {
      return new Response(JSON.stringify({ error: 'Server configuration error: Missing wallet credentials' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Initialize Algorand client
    const algodClient = new algosdk.Algodv2('', ALGOD_API, '')

    // Get project account from mnemonic
    const projectAccount = algosdk.mnemonicToSecretKey(SENDER_MNEMONIC)

    // Convert ALGO to microAlgos
    const amountInMicroAlgos = Math.round(amount * 1000000)

    // Get suggested transaction parameters
    const suggestedParams = await algodClient.getTransactionParams().do()

    // Create payment transaction from project wallet to charity wallet
    const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      from: projectAccount.addr,
      to: CHARITY_ADDRESS,
      amount: amountInMicroAlgos,
      note: new Uint8Array(Buffer.from(`Donation from user: ${userId}`)),
      suggestedParams,
    })

    // Sign the transaction
    const signedTxn = txn.signTxn(projectAccount.sk)

    // Submit the transaction
    const { txId } = await algodClient.sendRawTransaction(signedTxn).do()

    // Wait for confirmation
    const confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 4)

    // Get the confirmed round for additional verification
    const confirmedRound = confirmedTxn['confirmed-round']

    // Save donation record to Supabase
    const { error: dbError } = await supabaseClient
      .from('user_donations')
      .insert({
        user_id: userId,
        amount: amount,
        tx_hash: txId,
        timestamp: new Date().toISOString()
      })

    if (dbError) {
      console.error('Database error:', dbError)
      // Transaction succeeded but database save failed
      return new Response(JSON.stringify({ 
        success: true,
        txHash: txId,
        amount: amount,
        confirmedRound: confirmedRound,
        message: 'Thank you for your generous donation! Your contribution has been successfully sent to the charity wallet.',
        warning: 'Database recording failed but donation was processed successfully.'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ 
      success: true,
      txHash: txId,
      amount: amount,
      confirmedRound: confirmedRound,
      message: 'Thank you for your generous donation! Your contribution has been successfully sent to the charity wallet and recorded in our database.'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Donation error:', error)
    
    // Handle specific Algorand errors
    if (error.message.includes('insufficient funds')) {
      return new Response(JSON.stringify({ 
        error: 'Insufficient funds in project wallet. Please contact support.' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (error.message.includes('invalid address')) {
      return new Response(JSON.stringify({ 
        error: 'Invalid wallet address configuration. Please contact support.' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (error.message.includes('account does not exist')) {
      return new Response(JSON.stringify({ 
        error: 'Project wallet account not found. Please contact support.' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ 
      error: error.message || 'Donation processing failed. Please try again.' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})