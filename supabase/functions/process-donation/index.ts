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

    const { userId, recipient, amount, message, isAnonymous } = await req.json()

    if (!userId || !recipient || !amount) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

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

    // Process ALGO transfer
    const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '')
    const account = algosdk.mnemonicToSecretKey(wallet.mnemonic)
    const suggestedParams = await algodClient.getTransactionParams().do()

    const amountInMicroAlgos = Math.round(amount * 1000000)
    const donationNote = `Donation: ${message || 'Anonymous donation'}`

    const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      from: account.addr,
      to: recipient,
      amount: amountInMicroAlgos,
      note: new Uint8Array(Buffer.from(donationNote)),
      suggestedParams,
    })

    const signedTxn = txn.signTxn(account.sk)
    const { txId } = await algodClient.sendRawTransaction(signedTxn).do()
    await algosdk.waitForConfirmation(algodClient, txId, 4)

    // Store donation record
    await supabaseClient
      .from('donations')
      .insert({
        user_id: userId,
        recipient: recipient,
        amount: amount,
        message: message,
        is_anonymous: isAnonymous,
        transaction_id: txId,
        status: 'completed'
      })

    return new Response(JSON.stringify({ 
      success: true, 
      txId,
      amount,
      recipient 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Donation error:', error)
    return new Response(JSON.stringify({ 
      error: error.message || 'Donation failed' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})