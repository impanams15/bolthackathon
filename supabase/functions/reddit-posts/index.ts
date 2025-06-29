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

    const { subreddit, limit = 10 } = await req.json()

    if (!subreddit) {
      return new Response(JSON.stringify({ error: 'Subreddit is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Fetch posts from Reddit API
    const response = await fetch(`https://www.reddit.com/r/${subreddit}/hot.json?limit=${limit}`, {
      headers: {
        'User-Agent': 'AlgorandDApp/1.0.0'
      }
    })

    if (!response.ok) {
      return new Response(JSON.stringify({ error: 'Failed to fetch Reddit posts' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const data = await response.json()
    const posts = data.data.children.map((child: any) => ({
      id: child.data.id,
      title: child.data.title,
      author: child.data.author,
      subreddit: child.data.subreddit,
      selftext: child.data.selftext,
      url: child.data.url,
      permalink: child.data.permalink,
      ups: child.data.ups,
      num_comments: child.data.num_comments,
      created_utc: child.data.created_utc,
      thumbnail: child.data.thumbnail
    }))

    return new Response(JSON.stringify({ posts }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Reddit API error:', error)
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch Reddit posts' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})