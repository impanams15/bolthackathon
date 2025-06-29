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

    const { text, userId, userPrompt } = await req.json()

    if (!text || !userId) {
      return new Response(JSON.stringify({ error: 'Text and userId are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const TAVUS_API_KEY = Deno.env.get('TAVUS_API_KEY')
    
    if (!TAVUS_API_KEY) {
      return new Response(JSON.stringify({ error: 'Tavus API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Create Tavus video with AI response
    const response = await fetch('https://tavusapi.com/v2/videos', {
      method: 'POST',
      headers: {
        'x-api-key': TAVUS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        replica_id: 'r7c3c5b8e-4f8e-4b8e-8f8e-4b8e8f8e4b8e', // Default Tavus replica
        script: text,
        background_url: 'https://images.pexels.com/photos/1103970/pexels-photo-1103970.jpeg', // Professional background
        callback_url: null, // Optional webhook for completion
        properties: {
          voice_settings: {
            stability: 0.7,
            similarity_boost: 0.8,
            style: 0.2,
            use_speaker_boost: true
          },
          video_settings: {
            resolution: '720p',
            fps: 30,
            codec: 'h264'
          }
        }
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Tavus API error:', errorText)
      
      // Return a fallback response if Tavus fails
      return new Response(JSON.stringify({ 
        error: 'Video generation service temporarily unavailable. Please try again later.',
        fallback: true
      }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const data = await response.json()

    // Save the interaction to database
    try {
      await supabaseClient
        .from('user_chats')
        .insert({
          user_id: userId,
          message: userPrompt || text,
          response: text,
          timestamp: new Date().toISOString()
        })
    } catch (dbError) {
      console.error('Database save error:', dbError)
      // Continue even if database save fails
    }

    // Check if video is immediately available or needs processing
    if (data.download_url || data.video_url) {
      return new Response(JSON.stringify({ 
        videoUrl: data.download_url || data.video_url,
        videoId: data.video_id,
        status: 'ready',
        message: 'Video generated successfully'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    } else {
      return new Response(JSON.stringify({ 
        videoId: data.video_id,
        status: 'processing',
        message: 'Video is being generated, please wait...'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

  } catch (error) {
    console.error('Tavus video generation error:', error)
    return new Response(JSON.stringify({ 
      error: 'Failed to generate video response. Please try again.',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})