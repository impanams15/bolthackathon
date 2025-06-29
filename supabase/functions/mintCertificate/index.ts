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

    const { userId, donationAmount } = await req.json()

    if (!userId || !donationAmount) {
      return new Response(JSON.stringify({ error: 'Missing required fields: userId and donationAmount' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get environment variables
    const SENDER_MNEMONIC = Deno.env.get('SENDER_MNEMONIC')
    const ALGOD_API = Deno.env.get('ALGOD_API') || 'https://testnet-api.algonode.cloud'

    if (!SENDER_MNEMONIC) {
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

    // Get suggested transaction parameters
    const suggestedParams = await algodClient.getTransactionParams().do()

    // Create metadata for the certificate
    const metadata = JSON.stringify({
      user_id: userId,
      donation_amount: donationAmount,
      certificate_type: "UsheGuard Donation Certificate",
      issued_by: "UsheGuard Platform",
      issue_date: new Date().toISOString(),
      description: `Certificate of donation for ${donationAmount} ALGO to charity`
    })

    // Create asset creation transaction for the certificate
    const assetCreateTxn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
      from: projectAccount.addr,
      total: 1, // Unique certificate - only 1 exists
      decimals: 0, // No fractional units
      assetName: "UsheGuard Certificate",
      unitName: "UGC",
      assetURL: `https://usheguard.app/certificate/${userId}`, // URL to certificate details
      assetMetadataHash: new Uint8Array(Buffer.from(metadata).slice(0, 32)), // First 32 bytes of metadata
      defaultFrozen: false,
      freeze: projectAccount.addr, // Project can freeze if needed
      manager: projectAccount.addr, // Project manages the asset
      clawback: projectAccount.addr, // Project can clawback if needed
      reserve: projectAccount.addr, // Project holds reserves
      suggestedParams,
    })

    // Sign the transaction
    const signedAssetCreateTxn = assetCreateTxn.signTxn(projectAccount.sk)

    // Submit the transaction
    const { txId } = await algodClient.sendRawTransaction(signedAssetCreateTxn).do()

    // Wait for confirmation
    const confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 4)

    // Get the asset ID from the confirmed transaction
    const assetId = confirmedTxn['asset-index']

    if (!assetId) {
      throw new Error('Failed to retrieve asset ID from transaction')
    }

    // Now transfer the certificate to the user (if they have an Algorand address)
    // For now, we'll keep it in the project wallet and record the ownership in the database

    // Save certificate record to Supabase
    const { error: dbError } = await supabaseClient
      .from('donation_certificates')
      .insert({
        user_id: userId,
        asa_id: assetId.toString(),
        issue_date: new Date().toISOString(),
        tx_hash: txId
      })

    if (dbError) {
      console.error('Database error:', dbError)
      // Certificate was minted but database save failed
      return new Response(JSON.stringify({ 
        success: true,
        asaId: assetId,
        txHash: txId,
        warning: 'Certificate minted successfully but database recording failed.'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ 
      success: true,
      asaId: assetId,
      txHash: txId,
      assetName: "UsheGuard Certificate",
      unitName: "UGC",
      metadata: metadata,
      message: 'Certificate minted successfully! Your unique donation certificate has been created on the Algorand blockchain.'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Certificate minting error:', error)
    
    // Handle specific Algorand errors
    if (error.message.includes('insufficient funds')) {
      return new Response(JSON.stringify({ 
        error: 'Insufficient funds in project wallet for certificate minting. Please contact support.' 
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
      error: error.message || 'Certificate minting failed. Please try again.' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})