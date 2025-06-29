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
    
    if (context === 'charity_advisor') {
      aiResponse = generateCharityAdvisorResponse(message)
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

function generateCharityAdvisorResponse(message: string): string {
  const lowerMessage = message.toLowerCase()
  
  if (lowerMessage.includes('charity') || lowerMessage.includes('donate') || lowerMessage.includes('donation')) {
    return "I can help you find trustworthy charities! When choosing a charity, look for organizations with high transparency ratings, clear impact metrics, and efficient fund allocation. Popular platforms like Charity Navigator, GuideStar, and GiveWell provide excellent charity evaluations. Would you like me to help you find charities for a specific cause?"
  }
  
  if (lowerMessage.includes('blockchain') || lowerMessage.includes('crypto') || lowerMessage.includes('algorand')) {
    return "Blockchain donations offer unique advantages: complete transparency, lower fees, faster transfers, and immutable records. With Algorand, your donations are processed in 4.5 seconds with minimal environmental impact. You can track exactly where your funds go and receive blockchain-verified certificates of your charitable giving."
  }
  
  if (lowerMessage.includes('impact') || lowerMessage.includes('effective')) {
    return "Effective giving focuses on maximizing positive impact per dollar donated. Consider charities that: 1) Address urgent, neglected problems, 2) Have strong evidence of effectiveness, 3) Can scale their impact with additional funding. Organizations like GiveWell research the most cost-effective charities globally."
  }
  
  if (lowerMessage.includes('tax') || lowerMessage.includes('deduction')) {
    return "Charitable donations can provide tax benefits! In the US, donations to qualified 501(c)(3) organizations are tax-deductible. Keep records of all donations, including blockchain transaction IDs. Our platform automatically generates donation receipts and certificates that you can use for tax purposes."
  }
  
  if (lowerMessage.includes('scam') || lowerMessage.includes('fraud') || lowerMessage.includes('trust')) {
    return "Great question about charity safety! Red flags include: high-pressure tactics, vague descriptions of work, excessive administrative costs, lack of financial transparency, and no verifiable impact data. Always verify charity registration, check ratings on Charity Navigator, and look for clear mission statements and annual reports."
  }
  
  if (lowerMessage.includes('certificate') || lowerMessage.includes('proof')) {
    return "Yes! Our platform issues blockchain-verified certificates for all donations. These certificates are permanently recorded on the Algorand blockchain and serve as immutable proof of your charitable giving. You can download, share, and use these certificates for tax purposes or to showcase your philanthropic impact."
  }
  
  if (lowerMessage.includes('wallet') || lowerMessage.includes('setup')) {
    return "To start donating, you'll need an Algorand wallet. Go to your Profile page to create a new wallet or import an existing one. Your wallet is securely encrypted and stored. Once set up, you can make instant, transparent donations to any Algorand address with full transaction tracking."
  }
  
  if (lowerMessage.includes('environment') || lowerMessage.includes('climate') || lowerMessage.includes('green')) {
    return "Environmental charities are crucial for our planet's future! Top-rated environmental organizations include The Nature Conservancy, Environmental Defense Fund, and Cool Earth. Algorand itself is carbon-negative, so your blockchain donations actually help the environment. Would you like specific recommendations for climate-focused charities?"
  }
  
  if (lowerMessage.includes('education') || lowerMessage.includes('school') || lowerMessage.includes('children')) {
    return "Education charities create lasting impact! Highly effective organizations include Room to Read, Teach for America, and DonorsChoose. When evaluating education charities, look for measurable outcomes like graduation rates, test score improvements, and long-term student success tracking."
  }
  
  if (lowerMessage.includes('health') || lowerMessage.includes('medical') || lowerMessage.includes('disease')) {
    return "Health charities save and improve lives globally! Top organizations include Against Malaria Foundation, GiveDirectly, and Doctors Without Borders. These charities have proven track records of cost-effective interventions. Many focus on preventable diseases where small donations can have enormous impact."
  }
  
  return "I'm your AI charity advisor, here to help you make informed, impactful donations! I can assist with finding trustworthy charities, understanding their effectiveness, setting up blockchain donations, and maximizing your philanthropic impact. What specific area of charitable giving interests you most?"
}

function generateGeneralResponse(message: string): string {
  const responses = [
    "That's an interesting question! As your charity advisor, I'm here to help you make meaningful donations and find trustworthy organizations. How can I assist with your philanthropic goals?",
    "I specialize in charitable giving and blockchain donations. Whether you're looking for effective charities, want to understand impact metrics, or need help with secure donations, I'm here to help!",
    "Great question! I can help you navigate the world of charitable giving, from finding the right organizations to making secure blockchain donations. What would you like to explore?",
    "I'm designed to help you become a more effective philanthropist. I can recommend charities, explain impact measurement, and guide you through blockchain donations. How can I assist you today?",
    "Thanks for reaching out! I'm your AI charity advisor, focused on helping you make informed, impactful donations. What aspect of charitable giving would you like to discuss?"
  ]
  
  return responses[Math.floor(Math.random() * responses.length)]
}