import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import algosdk from 'npm:algosdk@3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Project-owned testnet wallet (for demo purposes)
const PROJECT_WALLET_MNEMONIC = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon'

// Fixed charity wallet address (testnet)
const CHARITY_WALLET_ADDRESS = 'CHARITYWALLETADDRESSFORTESTNETDONATIONSEXAMPLE123456789'

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

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Initialize Algorand client (testnet)
    const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '')

    // Get project account from mnemonic
    const projectAccount = algosdk.mnemonicToSecretKey(PROJECT_WALLET_MNEMONIC)

    // Convert ALGO to microAlgos
    const amountInMicroAlgos = Math.round(amount * 1000000)

    // Get suggested transaction parameters
    const suggestedParams = await algodClient.getTransactionParams().do()

    // Create payment transaction from project wallet to charity wallet
    const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      from: projectAccount.addr,
      to: CHARITY_WALLET_ADDRESS,
      amount: amountInMicroAlgos,
      note: new Uint8Array(Buffer.from(`Donation from user: ${userId}`)),
      suggestedParams,
    })

    // Sign the transaction
    const signedTxn = txn.signTxn(projectAccount.sk)

    // Submit the transaction
    const { txId } = await algodClient.sendRawTransaction(signedTxn).do()

    // Wait for confirmation
    await algosdk.waitForConfirmation(algodClient, txId, 4)

    // Save donation record to Supabase
    const { error: dbError } = await supabaseClient
      .from('donations')
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
        message: 'Donation successful! Transaction recorded on blockchain.',
        warning: 'Database recording failed but donation was processed.'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ 
      success: true,
      txHash: txId,
      amount: amount,
      message: 'Thank you for your generous donation! Your contribution has been successfully sent to the charity wallet.'
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

    return new Response(JSON.stringify({ 
      error: error.message || 'Donation processing failed' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})