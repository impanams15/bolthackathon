import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Send, Volume2, VolumeX, Mic, MicOff, Bot, User } from 'lucide-react'

export default function Chat() {
  const { user } = useAuth()
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: 'Hello! I\'m your AI assistant for Algorand blockchain operations. How can I help you today?',
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
          context: 'algorand_dapp'
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
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 mb-6 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                <Bot className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">AI Assistant</h1>
                <p className="text-gray-600">Your blockchain companion</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleMute}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  isMuted 
                    ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              
              {recognitionRef.current && (
                <button
                  onClick={toggleVoiceRecognition}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    isListening 
                      ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title={isListening ? 'Stop listening' : 'Start voice input'}
                >
                  {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Chat Container */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 overflow-hidden">
          {/* Messages */}
          <div className="h-96 overflow-y-auto p-6 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start space-x-3 max-w-xs lg:max-w-md ${
                  message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.type === 'user' 
                      ? 'bg-primary-500 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {message.type === 'user' ? <User size={16} /> : <Bot size={16} />}
                  </div>
                  
                  <div className={`rounded-2xl px-4 py-3 ${
                    message.type === 'user'
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    <p className="text-sm">{message.content}</p>
                    <span className={`text-xs mt-1 block ${
                      message.type === 'user' ? 'text-primary-100' : 'text-gray-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-start space-x-3 max-w-xs lg:max-w-md">
                  <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center flex-shrink-0">
                    <Bot size={16} />
                  </div>
                  <div className="bg-gray-100 rounded-2xl px-4 py-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <div className="border-t border-gray-200 p-4">
            <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={isListening ? 'Listening...' : 'Ask about Algorand, blockchain, or anything else...'}
                disabled={isLoading || isListening}
                className={`flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 ${
                  isListening ? 'bg-green-50 border-green-200' : 'bg-white'
                }`}
              />
              <button
                type="submit"
                disabled={isLoading || !inputMessage.trim()}
                className="px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl hover:from-primary-600 hover:to-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2"
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>
      </div>

      <audio ref={audioRef} style={{ display: 'none' }} />
    </div>
  )
}