import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Video, Send, Loader, Play, Pause } from 'lucide-react'

export default function UsheGuardAI() {
  const { user } = useAuth()
  const [inputMessage, setInputMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [videoUrl, setVideoUrl] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [error, setError] = useState('')
  const [lastPrompt, setLastPrompt] = useState('')
  const [videoId, setVideoId] = useState(null)
  const [videoStatus, setVideoStatus] = useState(null)
  
  const videoRef = useRef(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!inputMessage.trim()) {
      setError('Please enter a message to talk to UsheGuard')
      return
    }

    setLoading(true)
    setError('')
    setVideoUrl(null)
    setVideoStatus('generating')

    try {
      // First, generate an AI response to the user's message
      const aiResponse = await generateAIResponse(inputMessage.trim())
      
      // Then create a Tavus video with that response
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-tavus-video`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: aiResponse,
          userId: user.id,
          userPrompt: inputMessage.trim()
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate video response')
      }

      const data = await response.json()
      
      if (data.videoUrl) {
        setVideoUrl(data.videoUrl)
        setVideoStatus('ready')
      } else if (data.videoId) {
        setVideoId(data.videoId)
        setVideoStatus('processing')
        // Poll for video completion
        pollVideoStatus(data.videoId)
      }
      
      setLastPrompt(inputMessage.trim())
      setInputMessage('') // Clear input after successful generation
      
    } catch (err) {
      setError(err.message)
      setVideoStatus('error')
    } finally {
      setLoading(false)
    }
  }

  const generateAIResponse = async (userMessage) => {
    // Generate a contextual AI response based on the user's message
    const lowerMessage = userMessage.toLowerCase()
    
    if (lowerMessage.includes('donate') || lowerMessage.includes('donation')) {
      return "I'm UsheGuard, your AI assistant for charitable giving. I can help you make secure donations using Algorand blockchain technology. Your donations are transparent, traceable, and go directly to verified charity wallets. Would you like to learn more about our donation process or make a contribution?"
    }
    
    if (lowerMessage.includes('blockchain') || lowerMessage.includes('algorand')) {
      return "Great question about blockchain technology! UsheGuard uses the Algorand blockchain for all transactions because it's fast, secure, and environmentally friendly. Every donation is recorded permanently on the blockchain, ensuring complete transparency. You can even receive a unique certificate as an ASA token to commemorate your donation."
    }
    
    if (lowerMessage.includes('certificate') || lowerMessage.includes('token')) {
      return "Our donation certificates are unique ASA tokens minted on the Algorand blockchain. Each certificate is a permanent, verifiable record of your charitable contribution. It includes details about your donation amount and timestamp, making it a meaningful digital keepsake that proves your impact."
    }
    
    if (lowerMessage.includes('help') || lowerMessage.includes('how')) {
      return "I'm here to help you navigate charitable giving with blockchain technology. You can ask me about making donations, understanding blockchain benefits, getting donation certificates, or any questions about our platform. What would you like to know more about?"
    }
    
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return "Hello! I'm UsheGuard, your AI-powered assistant for charitable giving. I'm here to help you make secure, transparent donations using Algorand blockchain technology. How can I assist you with your charitable giving today?"
    }
    
    // Default response
    return `Thank you for your message: "${userMessage}". I'm UsheGuard, your AI assistant for charitable giving and blockchain donations. I can help you understand our donation process, blockchain technology, and how to make a positive impact through secure giving. What would you like to explore?`
  }

  const pollVideoStatus = async (videoId) => {
    const maxAttempts = 30 // Poll for up to 5 minutes (30 * 10 seconds)
    let attempts = 0

    const poll = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-tavus-status`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ videoId })
        })

        if (response.ok) {
          const data = await response.json()
          
          if (data.status === 'completed' && data.videoUrl) {
            setVideoUrl(data.videoUrl)
            setVideoStatus('ready')
            return
          } else if (data.status === 'failed') {
            setError('Video generation failed')
            setVideoStatus('error')
            return
          }
        }

        attempts++
        if (attempts < maxAttempts) {
          setTimeout(poll, 10000) // Poll every 10 seconds
        } else {
          setError('Video generation timed out')
          setVideoStatus('error')
        }
      } catch (err) {
        setError('Failed to check video status')
        setVideoStatus('error')
      }
    }

    poll()
  }

  const handlePlayPause = () => {
    if (!videoRef.current || !videoUrl) return

    if (isPlaying) {
      videoRef.current.pause()
      setIsPlaying(false)
    } else {
      videoRef.current.play()
      setIsPlaying(true)
    }
  }

  const handleVideoEnded = () => {
    setIsPlaying(false)
  }

  const handleVideoError = () => {
    setError('Failed to play video')
    setIsPlaying(false)
  }

  const saveToDatabase = async (prompt, videoUrl) => {
    try {
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/save-ai-response`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          prompt: prompt,
          videoUrl: videoUrl,
          timestamp: new Date().toISOString()
        })
      })
    } catch (err) {
      console.error('Failed to save to database:', err)
    }
  }

  useEffect(() => {
    if (videoUrl && lastPrompt) {
      saveToDatabase(lastPrompt, videoUrl)
    }
  }, [videoUrl, lastPrompt])

  return (
    <div className="voice-chat-container">
      <div className="voice-chat-header">
        <div className="voice-chat-icon">
          <Video size={48} style={{ color: '#667eea' }} />
        </div>
        <h2>UsheGuardAI Video Chat</h2>
        <p>Chat with our AI assistant and get personalized video responses</p>
      </div>

      <div className="voice-chat-form-container">
        <form onSubmit={handleSubmit} className="voice-chat-form">
          <div className="form-group">
            <label htmlFor="message-input">Your Message</label>
            <textarea
              id="message-input"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask UsheGuard about donations, blockchain technology, certificates, or anything else..."
              rows={4}
              required
              disabled={loading}
              className="text-input"
            />
            <small className="input-help">
              Ask any question and UsheGuard will respond with a personalized video message
            </small>
          </div>

          <button 
            type="submit" 
            disabled={loading || !inputMessage.trim()} 
            className="ask-button"
          >
            {loading ? (
              <>
                <Loader size={20} className="loading-spinner-small" />
                Generating Video Response...
              </>
            ) : (
              <>
                <Video size={20} />
                🎥 Talk to UsheGuard
              </>
            )}
          </button>
        </form>

        {error && (
          <div className="error-message">
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Loading Animation */}
      {loading && (
        <div className="audio-player-container">
          <div className="audio-content">
            <h3>Generating Your Video Response</h3>
            <div className="text-display">
              <p>UsheGuard is creating a personalized video response to: "{inputMessage}"</p>
            </div>
            <div className="audio-controls">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Loader size={24} className="loading-spinner-small" />
                <span>Please wait while we generate your video...</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Video Status */}
      {videoStatus === 'processing' && !loading && (
        <div className="audio-player-container">
          <div className="audio-content">
            <h3>Processing Video</h3>
            <div className="text-display">
              <p>Your video is being processed. This may take a few minutes...</p>
            </div>
            <div className="audio-controls">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Loader size={24} className="loading-spinner-small" />
                <span>Video processing in progress...</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Video Player */}
      {videoUrl && videoStatus === 'ready' && lastPrompt && (
        <div className="audio-player-container">
          <div className="audio-content">
            <h3>UsheGuard's Video Response</h3>
            <div className="text-display">
              <p><strong>Your question:</strong> "{lastPrompt}"</p>
            </div>
            
            <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
              <video
                ref={videoRef}
                width="400"
                height="300"
                controls
                onEnded={handleVideoEnded}
                onError={handleVideoError}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                style={{ 
                  borderRadius: '12px', 
                  border: '2px solid #e1e5e9',
                  maxWidth: '100%',
                  height: 'auto'
                }}
              >
                <source src={videoUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
            
            <div className="audio-controls">
              <button 
                onClick={handlePlayPause}
                className="play-button"
                disabled={!videoUrl}
              >
                {isPlaying ? (
                  <>
                    <Pause size={20} />
                    Pause Video
                  </>
                ) : (
                  <>
                    <Play size={20} />
                    Play Video
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="voice-chat-info">
        <h3>About UsheGuardAI</h3>
        <div className="info-grid">
          <div className="info-item">
            <h4>AI-Powered Responses</h4>
            <p>Get intelligent, contextual answers about donations, blockchain, and charitable giving.</p>
          </div>
          <div className="info-item">
            <h4>Video Avatar</h4>
            <p>Experience personalized video responses with realistic AI avatars powered by Tavus technology.</p>
          </div>
          <div className="info-item">
            <h4>Saved Conversations</h4>
            <p>All your interactions are saved to help provide better, more personalized assistance over time.</p>
          </div>
        </div>
      </div>
    </div>
  )
}