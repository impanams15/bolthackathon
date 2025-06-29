import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { ExternalLink, MessageCircle, TrendingUp, Users } from 'lucide-react'

export default function RedditIntegration() {
  const { user } = useAuth()
  const [posts, setPosts] = useState([])
  const [subreddit, setSubreddit] = useState('algorand')
  const [loading, setLoading] = useState(false)
  const [postTitle, setPostTitle] = useState('')
  const [postContent, setPostContent] = useState('')
  const [activeView, setActiveView] = useState('browse')

  useEffect(() => {
    loadPosts()
  }, [subreddit])

  const loadPosts = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reddit-posts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subreddit: subreddit,
          limit: 10
        })
      })

      if (response.ok) {
        const data = await response.json()
        setPosts(data.posts || [])
      }
    } catch (error) {
      console.error('Failed to load Reddit posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePost = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reddit-create-post`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          subreddit: subreddit,
          title: postTitle.trim(),
          content: postContent.trim()
        })
      })

      const data = await response.json()
      if (response.ok) {
        alert('Post created successfully!')
        setPostTitle('')
        setPostContent('')
        loadPosts()
      } else {
        alert(`Post creation failed: ${data.error}`)
      }
    } catch (error) {
      alert(`Post creation failed: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  const timeAgo = (timestamp) => {
    const now = Date.now() / 1000
    const diff = now - timestamp
    
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  return (
    <div className="reddit-integration">
      <div className="reddit-header">
        <h3>Reddit Integration</h3>
        <div className="view-tabs">
          <button
            className={`tab-button ${activeView === 'browse' ? 'active' : ''}`}
            onClick={() => setActiveView('browse')}
          >
            <TrendingUp size={16} />
            Browse
          </button>
          <button
            className={`tab-button ${activeView === 'create' ? 'active' : ''}`}
            onClick={() => setActiveView('create')}
          >
            <MessageCircle size={16} />
            Create Post
          </button>
        </div>
      </div>

      <div className="subreddit-selector">
        <label>Subreddit:</label>
        <select
          value={subreddit}
          onChange={(e) => setSubreddit(e.target.value)}
          disabled={loading}
        >
          <option value="algorand">r/algorand</option>
          <option value="cryptocurrency">r/cryptocurrency</option>
          <option value="blockchain">r/blockchain</option>
          <option value="defi">r/defi</option>
          <option value="web3">r/web3</option>
        </select>
      </div>

      {activeView === 'browse' && (
        <div className="posts-section">
          {loading ? (
            <div className="loading-posts">Loading posts...</div>
          ) : (
            <div className="posts-list">
              {posts.map((post) => (
                <div key={post.id} className="post-card">
                  <div className="post-header">
                    <h4 className="post-title">
                      <a 
                        href={`https://reddit.com${post.permalink}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {post.title}
                        <ExternalLink size={14} />
                      </a>
                    </h4>
                    <div className="post-meta">
                      <span className="author">u/{post.author}</span>
                      <span className="time">{timeAgo(post.created_utc)}</span>
                    </div>
                  </div>
                  
                  {post.selftext && (
                    <div className="post-content">
                      <p>{post.selftext.substring(0, 200)}...</p>
                    </div>
                  )}
                  
                  <div className="post-stats">
                    <span className="upvotes">
                      <TrendingUp size={14} />
                      {formatNumber(post.ups)}
                    </span>
                    <span className="comments">
                      <MessageCircle size={14} />
                      {formatNumber(post.num_comments)}
                    </span>
                    <span className="subreddit">
                      <Users size={14} />
                      r/{post.subreddit}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeView === 'create' && (
        <div className="create-post-section">
          <form onSubmit={handleCreatePost} className="post-form">
            <div className="form-group">
              <label>Post Title</label>
              <input
                type="text"
                value={postTitle}
                onChange={(e) => setPostTitle(e.target.value)}
                placeholder="Enter post title..."
                required
                disabled={loading}
                maxLength={300}
              />
            </div>

            <div className="form-group">
              <label>Post Content</label>
              <textarea
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                placeholder="Write your post content..."
                rows={8}
                required
                disabled={loading}
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Creating Post...' : 'Create Post'}
            </button>
          </form>

          <div className="post-guidelines">
            <h4>Posting Guidelines</h4>
            <ul>
              <li>Follow subreddit rules and Reddit's content policy</li>
              <li>Be respectful and constructive in discussions</li>
              <li>Avoid spam and self-promotion</li>
              <li>Use appropriate flair when available</li>
              <li>Engage with comments on your posts</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}