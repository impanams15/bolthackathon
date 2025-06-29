import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

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

    const { message, userId, context } = await req.json()

    if (!message || !userId) {
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

    // Generate AI response based on context
    let aiResponse = ''
    
    if (context === 'algorand_dapp') {
      aiResponse = generateAlgorandResponse(message)
    } else {
      aiResponse = generateGeneralResponse(message)
    }

    // Store conversation in database
    await supabaseClient
      .from('chat_conversations')
      .insert({
        user_id: userId,
        message: message,
        response: aiResponse,
        context: context
      })

    return new Response(JSON.stringify({ 
      response: aiResponse,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('AI Chat error:', error)
    return new Response(JSON.stringify({ 
      error: 'Failed to generate response' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

function generateAlgorandResponse(message: string): string {
  const lowerMessage = message.toLowerCase()
  
  if (lowerMessage.includes('wallet') || lowerMessage.includes('create')) {
    return "I can help you with Algorand wallet operations! You can create a new wallet or import an existing one using your 25-word mnemonic phrase. Your wallet will be securely stored and encrypted in our database."
  }
  
  if (lowerMessage.includes('send') || lowerMessage.includes('transfer') || lowerMessage.includes('algo')) {
    return "To send ALGO tokens, go to the 'Send ALGO' tab. You'll need the recipient's Algorand address and the amount you want to send. The minimum transaction is 0.001 ALGO, and there's a small network fee for each transaction."
  }
  
  if (lowerMessage.includes('mint') || lowerMessage.includes('asa') || lowerMessage.includes('token')) {
    return "You can mint your own ASA (Algorand Standard Asset) tokens! Go to the 'Mint ASA' tab to create custom tokens. You can set the name, symbol, total supply, decimals, and even add a URL for token metadata."
  }
  
  if (lowerMessage.includes('balance') || lowerMessage.includes('account')) {
    return "Your account balance and assets are displayed in the wallet section. The balance updates automatically every 10 seconds. You can see both your ALGO balance and any ASA tokens you hold."
  }
  
  if (lowerMessage.includes('testnet') || lowerMessage.includes('network')) {
    return "This application is configured to use Algorand TestNet by default, which means you can safely test all features without using real ALGO. You can get free TestNet ALGO from the Algorand faucet."
  }
  
  if (lowerMessage.includes('donation') || lowerMessage.includes('donate')) {
    return "The donation feature allows you to send ALGO to support causes or individuals. You can add personal messages and choose to make donations anonymous. You can also create fundraising campaigns for specific goals."
  }
  
  if (lowerMessage.includes('reddit')) {
    return "The Reddit integration lets you browse cryptocurrency-related subreddits and create posts directly from the app. You can view trending posts from r/algorand, r/cryptocurrency, and other blockchain communities."
  }
  
  return "I'm your Algorand blockchain assistant! I can help you with wallet management, ALGO transfers, ASA token minting, donations, and Reddit integration. What would you like to know more about?"
}

function generateGeneralResponse(message: string): string {
  const responses = [
    "That's an interesting question! How can I help you with your Algorand DApp needs?",
    "I'm here to assist you with blockchain operations and general questions. What would you like to explore?",
    "Thanks for your message! I specialize in Algorand blockchain operations, but I'm happy to help with other topics too.",
    "I understand you're looking for information. Let me know if you need help with wallet operations, token transfers, or ASA minting!",
    "Great question! I'm designed to help with Algorand blockchain features, but I can assist with general inquiries as well."
  ]
  
  return responses[Math.floor(Math.random() * responses.length)]
}