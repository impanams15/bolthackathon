import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('') // 'success', 'error', 'info'

  const { signUp, signIn } = useAuth()

  const setUserMessage = (msg, type = 'info') => {
    setMessage(msg)
    setMessageType(type)
  }

  const getErrorMessage = (error) => {
    if (!error) return ''
    
    const errorMessage = error.message || error
    
    // Handle specific Supabase auth errors
    if (errorMessage.includes('Invalid login credentials')) {
      return 'Invalid email or password. Please check your credentials and try again.'
    }
    
    if (errorMessage.includes('Email not confirmed')) {
      return 'Please check your email and click the confirmation link before signing in.'
    }
    
    if (errorMessage.includes('User not found')) {
      return 'No account found with this email address. Please sign up first.'
    }
    
    if (errorMessage.includes('Password should be at least')) {
      return 'Password must be at least 6 characters long.'
    }
    
    if (errorMessage.includes('Unable to validate email address')) {
      return 'Please enter a valid email address.'
    }
    
    if (errorMessage.includes('Email rate limit exceeded')) {
      return 'Too many requests. Please wait a moment before trying again.'
    }
    
    if (errorMessage.includes('Signup is disabled')) {
      return 'New user registration is currently disabled.'
    }
    
    // Default error message
    return errorMessage
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setMessageType('')

    // Basic validation
    if (!email.trim()) {
      setUserMessage('Please enter your email address.', 'error')
      setLoading(false)
      return
    }

    if (!password.trim()) {
      setUserMessage('Please enter your password.', 'error')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setUserMessage('Password must be at least 6 characters long.', 'error')
      setLoading(false)
      return
    }

    try {
      const { data, error } = isSignUp 
        ? await signUp(email.trim(), password)
        : await signIn(email.trim(), password)

      if (error) {
        const errorMsg = getErrorMessage(error)
        setUserMessage(errorMsg, 'error')
      } else if (isSignUp) {
        setUserMessage(
          'Account created successfully! You can now sign in with your credentials.',
          'success'
        )
        // Clear form and switch to sign in mode after successful signup
        setEmail('')
        setPassword('')
        setIsSignUp(false)
      } else {
        setUserMessage('Successfully signed in!', 'success')
      }
    } catch (error) {
      console.error('Auth error:', error)
      setUserMessage('An unexpected error occurred. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleModeSwitch = () => {
    setIsSignUp(!isSignUp)
    setMessage('')
    setMessageType('')
    // Clear any validation errors when switching modes
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>{isSignUp ? 'Create Account' : 'Sign In'}</h2>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              placeholder="Enter your email"
              autoComplete="email"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              minLength={6}
              placeholder={isSignUp ? "At least 6 characters" : "Enter your password"}
              autoComplete={isSignUp ? "new-password" : "current-password"}
            />
            {isSignUp && (
              <small className="password-hint">
                Password must be at least 6 characters long
              </small>
            )}
          </div>
          
          <button type="submit" disabled={loading} className="auth-button">
            {loading ? 'Please wait...' : (isSignUp ? 'Create Account' : 'Sign In')}
          </button>
        </form>
        
        {message && (
          <div className={`message ${messageType}`}>
            {message}
          </div>
        )}
        
        <p className="auth-switch">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type="button"
            onClick={handleModeSwitch}
            className="link-button"
            disabled={loading}
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>

        {isSignUp && (
          <div className="auth-help">
            <p className="help-text">
              <strong>Development Mode:</strong>
            </p>
            <ul className="help-list">
              <li>Email confirmation is disabled for testing</li>
              <li>You can sign in immediately after creating an account</li>
              <li>No email verification required in development</li>
            </ul>
          </div>
        )}

        {!isSignUp && (
          <div className="auth-help">
            <p className="help-text">
              <strong>Having trouble signing in?</strong>
            </p>
            <ul className="help-list">
              <li>Make sure your email and password are correct</li>
              <li>Try refreshing the page and signing in again</li>
              <li>Create a new account if you haven't signed up yet</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}