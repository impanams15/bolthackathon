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

    const { userId, subreddit, title, content } = await req.json()

    if (!userId || !subreddit || !title || !content) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Note: This is a mock implementation since Reddit API requires OAuth
    // In a real implementation, you would need to:
    // 1. Set up Reddit OAuth flow
    // 2. Store user's Reddit credentials securely
    // 3. Use Reddit API to create posts

    // For now, we'll simulate a successful post creation
    const mockPostId = `post_${Date.now()}`
    
    return new Response(JSON.stringify({ 
      success: true,
      postId: mockPostId,
      message: 'Post created successfully (simulated)',
      url: `https://reddit.com/r/${subreddit}/comments/${mockPostId}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Reddit post creation error:', error)
    return new Response(JSON.stringify({ 
      error: 'Failed to create Reddit post' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})