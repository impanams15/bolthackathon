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

    const { userId, recipient, amount, note } = await req.json()

    if (!userId || !recipient || !amount) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get user's wallet
    const { data: wallet, error: walletError } = await supabaseClient
      .from('algorand_wallets')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (walletError || !wallet) {
      return new Response(JSON.stringify({ error: 'Wallet not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Initialize Algorand client (testnet)
    const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '')

    // Get account from mnemonic
    const account = algosdk.mnemonicToSecretKey(wallet.mnemonic)

    // Get suggested transaction parameters
    const suggestedParams = await algodClient.getTransactionParams().do()

    // Create payment transaction
    const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      from: account.addr,
      to: recipient,
      amount: amount,
      note: note ? new Uint8Array(Buffer.from(note)) : undefined,
      suggestedParams,
    })

    // Sign the transaction
    const signedTxn = txn.signTxn(account.sk)

    // Submit the transaction
    const { txId } = await algodClient.sendRawTransaction(signedTxn).do()

    // Wait for confirmation
    await algosdk.waitForConfirmation(algodClient, txId, 4)

    return new Response(JSON.stringify({ 
      success: true, 
      txId,
      amount: amount / 1000000, // Convert back to ALGO
      recipient 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Transfer error:', error)
    return new Response(JSON.stringify({ 
      error: error.message || 'Transfer failed' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})