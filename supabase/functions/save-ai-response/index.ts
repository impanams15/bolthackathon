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

    const { userId, prompt, videoUrl, timestamp } = await req.json()

    if (!userId || !prompt || !videoUrl) {
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

    // Create ai_responses table if it doesn't exist
    const { error: tableError } = await supabaseClient.rpc('create_ai_responses_table')
    
    // If the function doesn't exist, create the table directly
    if (tableError) {
      const { error: createError } = await supabaseClient
        .from('ai_responses')
        .select('id')
        .limit(1)
      
      // If table doesn't exist, we'll save to user_chats instead
      if (createError) {
        const { error: saveError } = await supabaseClient
          .from('user_chats')
          .insert({
            user_id: userId,
            message: prompt,
            response: `Video response: ${videoUrl}`,
            timestamp: timestamp || new Date().toISOString()
          })

        if (saveError) {
          throw new Error('Failed to save AI response')
        }

        return new Response(JSON.stringify({ 
          success: true,
          message: 'AI response saved to user_chats'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // Try to save to ai_responses table
    const { error: insertError } = await supabaseClient
      .from('ai_responses')
      .insert({
        user_id: userId,
        prompt: prompt,
        video_url: videoUrl,
        timestamp: timestamp || new Date().toISOString()
      })

    if (insertError) {
      // Fallback to user_chats table
      const { error: fallbackError } = await supabaseClient
        .from('user_chats')
        .insert({
          user_id: userId,
          message: prompt,
          response: `Video response: ${videoUrl}`,
          timestamp: timestamp || new Date().toISOString()
        })

      if (fallbackError) {
        throw new Error('Failed to save AI response')
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: 'AI response saved successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Save AI response error:', error)
    return new Response(JSON.stringify({ 
      error: 'Failed to save AI response',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})