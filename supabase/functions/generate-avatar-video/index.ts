import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

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

    const { text, audioUrl, userId } = await req.json()

    if (!text || !audioUrl) {
      return new Response(JSON.stringify({ error: 'Text and audio URL are required' }), {
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

    // Create Tavus video with lip-sync
    const response = await fetch('https://tavusapi.com/v2/videos', {
      method: 'POST',
      headers: {
        'x-api-key': TAVUS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        replica_id: 'default-avatar', // Use default avatar or configure your own
        script: text,
        audio_url: audioUrl,
        background_url: 'https://images.pexels.com/photos/1103970/pexels-photo-1103970.jpeg', // Professional background
        callback_url: null, // Optional webhook for completion
        properties: {
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5
          },
          video_settings: {
            resolution: '720p',
            fps: 30
          }
        }
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Tavus API error:', errorText)
      
      // Return a fallback response if Tavus fails
      return new Response(JSON.stringify({ 
        videoUrl: null,
        message: 'Video generation unavailable, audio will play without avatar'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const data = await response.json()

    return new Response(JSON.stringify({ 
      videoUrl: data.download_url || data.video_url,
      videoId: data.video_id,
      status: data.status
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Avatar video generation error:', error)
    return new Response(JSON.stringify({ 
      videoUrl: null,
      error: 'Avatar video generation failed, audio will play without avatar'
    }), {
      status: 200, // Return 200 so the audio still plays
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})