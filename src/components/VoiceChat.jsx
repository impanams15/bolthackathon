import { useState, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Mic, Play, Pause, Volume2 } from 'lucide-react'

export default function VoiceChat() {
  const { user } = useAuth()
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(false)
  const [audioUrl, setAudioUrl] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [error, setError] = useState('')
  const [lastText, setLastText] = useState('')
  
  const audioRef = useRef(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!inputText.trim()) {
      setError('Please enter some text to convert to speech')
      return
    }

    setLoading(true)
    setError('')
    setAudioUrl(null)

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/text-to-speech`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: inputText.trim(),
          voice: 'Rachel', // Default voice
          userId: user.id
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate speech')
      }

      // Get the audio blob
      const audioBlob = await response.blob()
      const audioObjectUrl = URL.createObjectURL(audioBlob)
      
      setAudioUrl(audioObjectUrl)
      setLastText(inputText.trim())
      setInputText('') // Clear input after successful generation
      
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePlayPause = () => {
    if (!audioRef.current || !audioUrl) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  const handleAudioEnded = () => {
    setIsPlaying(false)
  }

  const handleAudioError = () => {
    setError('Failed to play audio')
    setIsPlaying(false)
  }

  return (
    <div className="voice-chat-container">
      <div className="voice-chat-header">
        <div className="voice-chat-icon">
          <Volume2 size={48} style={{ color: '#667eea' }} />
        </div>
        <h2>Voice Chat with AuraGuard</h2>
        <p>Enter text and hear it spoken by our AI voice assistant</p>
      </div>

      <div className="voice-chat-form-container">
        <form onSubmit={handleSubmit} className="voice-chat-form">
          <div className="form-group">
            <label htmlFor="text-input">Enter Text to Speak</label>
            <textarea
              id="text-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type your message here and AuraGuard will speak it aloud..."
              rows={4}
              required
              disabled={loading}
              className="text-input"
            />
            <small className="input-help">
              Enter any text and our AI will convert it to natural-sounding speech
            </small>
          </div>

          <button 
            type="submit" 
            disabled={loading || !inputText.trim()} 
            className="ask-button"
          >
            {loading ? (
              <>
                <div className="loading-spinner-small"></div>
                Generating Speech...
              </>
            ) : (
              <>
                <Mic size={20} />
                🎙️ Ask AuraGuard
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

      {audioUrl && lastText && (
        <div className="audio-player-container">
          <div className="audio-content">
            <h3>Generated Speech</h3>
            <div className="text-display">
              <p>"{lastText}"</p>
            </div>
            
            <div className="audio-controls">
              <button 
                onClick={handlePlayPause}
                className="play-button"
                disabled={!audioUrl}
              >
                {isPlaying ? (
                  <>
                    <Pause size={20} />
                    Pause
                  </>
                ) : (
                  <>
                    <Play size={20} />
                    Play Audio
                  </>
                )}
              </button>
              
              <audio
                ref={audioRef}
                src={audioUrl}
                onEnded={handleAudioEnded}
                onError={handleAudioError}
                preload="auto"
              />
            </div>
          </div>
        </div>
      )}

      <div className="voice-chat-info">
        <h3>About Voice Chat</h3>
        <div className="info-grid">
          <div className="info-item">
            <h4>Natural Voice</h4>
            <p>Powered by ElevenLabs AI for realistic, human-like speech synthesis.</p>
          </div>
          <div className="info-item">
            <h4>Multiple Languages</h4>
            <p>Support for various languages and accents to suit your preferences.</p>
          </div>
          <div className="info-item">
            <h4>High Quality</h4>
            <p>Crystal clear audio output optimized for the best listening experience.</p>
          </div>
        </div>
      </div>
    </div>
  )
}