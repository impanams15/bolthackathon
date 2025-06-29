/*
 * sendDonation Supabase Edge Function
 * 
 * Required Environment Variables:
 * - SENDER_MNEMONIC: 25-word mnemonic phrase for the project wallet that sends donations
 * - CHARITY_ADDRESS: Algorand address of the charity wallet that receives donations
 * - SUPABASE_URL: Supabase project URL
 * - SUPABASE_SERVICE_ROLE_KEY: Supabase service role key for database operations
 * 
 * Optional Environment Variables:
 * - ALGOD_API: Algorand node API endpoint (defaults to https://testnet-api.algonode.cloud)
 */

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
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ 
        error: 'Method not allowed. Only POST requests are supported.' 
      }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Validate required environment variables
    const SENDER_MNEMONIC = Deno.env.get('SENDER_MNEMONIC')
    const CHARITY_ADDRESS = Deno.env.get('CHARITY_ADDRESS')
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    // Optional environment variable with default
    const ALGOD_API = Deno.env.get('ALGOD_API') || 'https://testnet-api.algonode.cloud'

    // Check for missing required environment variables
    if (!SENDER_MNEMONIC) {
      return new Response(JSON.stringify({ 
        error: 'Server configuration error: Missing SENDER_MNEMONIC' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!CHARITY_ADDRESS) {
      return new Response(JSON.stringify({ 
        error: 'Server configuration error: Missing CHARITY_ADDRESS' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!SUPABASE_URL) {
      return new Response(JSON.stringify({ 
        error: 'Server configuration error: Missing SUPABASE_URL' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ 
        error: 'Server configuration error: Missing SUPABASE_SERVICE_ROLE_KEY' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Parse and validate request body
    let requestBody
    try {
      requestBody = await req.json()
    } catch (error) {
      return new Response(JSON.stringify({ 
        error: 'Invalid JSON body. Please provide valid JSON data.' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { amount, userId } = requestBody

    // Validate required fields
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      return new Response(JSON.stringify({ 
        error: 'Invalid or missing userId. Please provide a valid user ID.' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return new Response(JSON.stringify({ 
        error: 'Invalid amount. Amount must be a positive number.' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (amount < 0.001) {
      return new Response(JSON.stringify({ 
        error: 'Minimum donation amount is 0.001 ALGO.' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Initialize Supabase client
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Initialize Algorand client
    const algodClient = new algosdk.Algodv2('', ALGOD_API, '')

    // Get project account from mnemonic
    let projectAccount
    try {
      projectAccount = algosdk.mnemonicToSecretKey(SENDER_MNEMONIC)
    } catch (error) {
      return new Response(JSON.stringify({ 
        error: 'Server configuration error: Invalid SENDER_MNEMONIC format.' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Validate charity address format
    try {
      algosdk.decodeAddress(CHARITY_ADDRESS)
    } catch (error) {
      return new Response(JSON.stringify({ 
        error: 'Server configuration error: Invalid CHARITY_ADDRESS format.' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Convert ALGO to microAlgos (1 ALGO = 1,000,000 microAlgos)
    const amountInMicroAlgos = Math.round(amount * 1000000)

    // Get suggested transaction parameters from the network
    let suggestedParams
    try {
      suggestedParams = await algodClient.getTransactionParams().do()
    } catch (error) {
      return new Response(JSON.stringify({ 
        error: 'Failed to connect to Algorand network. Please try again later.' 
      }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Create payment transaction from project wallet to charity wallet
    const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      from: projectAccount.addr,
      to: CHARITY_ADDRESS,
      amount: amountInMicroAlgos,
      note: new Uint8Array(Buffer.from(`Donation from user: ${userId}`)),
      suggestedParams,
    })

    // Sign the transaction with project wallet's private key
    const signedTxn = txn.signTxn(projectAccount.sk)

    // Submit the transaction to the network
    let txId
    try {
      const submitResult = await algodClient.sendRawTransaction(signedTxn).do()
      txId = submitResult.txId
    } catch (error) {
      // Handle specific Algorand transaction errors
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

      console.error('Transaction submission error:', error)
      return new Response(JSON.stringify({ 
        error: 'Failed to submit transaction to blockchain. Please try again.' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Wait for transaction confirmation (up to 4 rounds)
    let confirmedTxn
    try {
      confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 4)
    } catch (error) {
      console.error('Transaction confirmation error:', error)
      return new Response(JSON.stringify({ 
        error: 'Transaction submitted but confirmation failed. Please check transaction status manually.' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get the confirmed round for additional verification
    const confirmedRound = confirmedTxn['confirmed-round']

    // Save donation record to Supabase database
    const { error: dbError } = await supabaseClient
      .from('user_donations')
      .insert({
        user_id: userId,
        amount: amount,
        tx_hash: txId,
        timestamp: new Date().toISOString()
      })

    // Prepare success response
    const successResponse = {
      success: true,
      txHash: txId,
      confirmedRound: confirmedRound,
      amount: amount,
      message: 'Thank you for your generous donation! Your contribution has been successfully sent to the charity wallet.'
    }

    // If database save failed, still return success but with a warning
    if (dbError) {
      console.error('Database save error:', dbError)
      successResponse.warning = 'Donation was processed successfully but database recording failed. Transaction is confirmed on blockchain.'
    } else {
      successResponse.message += ' Your donation has been recorded in our database.'
    }

    return new Response(JSON.stringify(successResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    // Handle any unexpected errors
    console.error('Unexpected donation processing error:', error)
    
    return new Response(JSON.stringify({ 
      error: 'An unexpected error occurred while processing your donation. Please try again later.',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})