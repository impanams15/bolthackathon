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

    const { userId, title, description, goal, duration } = await req.json()

    if (!userId || !title || !description || !goal) {
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

    // Calculate end date
    const endsAt = new Date()
    endsAt.setDate(endsAt.getDate() + (duration || 30))

    // Create campaign
    const { data: campaign, error } = await supabaseClient
      .from('campaigns')
      .insert({
        user_id: userId,
        title: title,
        description: description,
        goal: goal,
        duration_days: duration || 30,
        ends_at: endsAt.toISOString(),
        status: 'active'
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return new Response(JSON.stringify({ 
      success: true,
      campaign: campaign
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Create campaign error:', error)
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to create campaign' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})