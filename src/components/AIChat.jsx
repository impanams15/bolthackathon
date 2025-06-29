import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Send, Volume2, VolumeX, Mic, MicOff } from 'lucide-react'

export default function AIChat() {
  const { user } = useAuth()
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: 'Hello! I\'m your AI charity advisor. I can help you find trustworthy charities, understand their impact, and guide you through secure blockchain donations. How can I assist you today?',
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isListening, setIsListening] = useState(false)
  
  const messagesEndRef = useRef(null)
  const audioRef = useRef(null)
  const recognitionRef = useRef(null)

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false
      recognitionRef.current.lang = 'en-US'

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        setInputMessage(transcript)
        setIsListening(false)
      }

      recognitionRef.current.onerror = () => {
        setIsListening(false)
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
      }
    }
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const toggleVoiceRecognition = () => {
    if (!recognitionRef.current) return

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  const generateAIResponse = async (userMessage) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          userId: user.id,
          context: 'charity_advisor'
        })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error)

      return data.response
    } catch (error) {
      console.error('AI response error:', error)
      return "I apologize, but I'm having trouble processing your request right now. Please try again later."
    }
  }

  const generateSpeech = async (text) => {
    if (isMuted) return null

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/text-to-speech`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          voice: 'Rachel',
          userId: user.id
        })
      })

      if (!response.ok) throw new Error('TTS generation failed')

      const audioBlob = await response.blob()
      return URL.createObjectURL(audioBlob)
    } catch (error) {
      console.error('TTS error:', error)
      return null
    }
  }

  const playAudioWithAvatar = async (audioUrl, text) => {
    if (!audioUrl || isMuted) return

    try {
      setIsPlaying(true)

      // Generate Tavus video with lip-sync
      const videoResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-avatar-video`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          audioUrl: audioUrl,
          userId: user.id
        })
      })

      // Play audio regardless of video generation
      if (audioRef.current) {
        audioRef.current.src = audioUrl
        audioRef.current.play()
        
        audioRef.current.onended = () => {
          setIsPlaying(false)
          URL.revokeObjectURL(audioUrl)
        }
      }
    } catch (error) {
      console.error('Audio/Video playback error:', error)
      setIsPlaying(false)
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!inputMessage.trim() || isLoading) return

    const userMessage = inputMessage.trim()
    setInputMessage('')
    setIsLoading(true)

    // Add user message
    const newUserMessage = {
      id: Date.now(),
      type: 'user',
      content: userMessage,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, newUserMessage])

    try {
      // Generate AI response
      const aiResponse = await generateAIResponse(userMessage)
      
      // Add AI message
      const newAIMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: aiResponse,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, newAIMessage])

      // Generate and play speech
      const audioUrl = await generateSpeech(aiResponse)
      if (audioUrl) {
        await playAudioWithAvatar(audioUrl, aiResponse)
      }
    } catch (error) {
      console.error('Message handling error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
    if (isPlaying && audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
  }

  return (
    <div className="ai-chat-container">
      <div className="chat-header">
        <h3>AI Charity Advisor</h3>
        <div className="chat-controls">
          <button
            onClick={toggleMute}
            className={`control-button ${isMuted ? 'muted' : ''}`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
          {recognitionRef.current && (
            <button
              onClick={toggleVoiceRecognition}
              className={`control-button ${isListening ? 'listening' : ''}`}
              title={isListening ? 'Stop listening' : 'Start voice input'}
            >
              {isListening ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
          )}
        </div>
      </div>

      <div className="avatar-container">
        <div className="w-32 h-32 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
          <span className="text-white text-4xl">🤖</span>
        </div>
        {isPlaying && <div className="speaking-indicator">Speaking...</div>}
      </div>

      <div className="messages-container">
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.type}`}>
            <div className="message-content">
              <p>{message.content}</p>
              <span className="message-time">
                {message.timestamp.toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message ai">
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="message-input-form">
        <div className="input-container">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={isListening ? 'Listening...' : 'Ask about charities, donations, or blockchain giving...'}
            disabled={isLoading || isListening}
            className={isListening ? 'listening' : ''}
          />
          <button
            type="submit"
            disabled={isLoading || !inputMessage.trim()}
            className="send-button"
          >
            <Send size={20} />
          </button>
        </div>
      </form>

      <audio ref={audioRef} style={{ display: 'none' }} />
    </div>
  )
}