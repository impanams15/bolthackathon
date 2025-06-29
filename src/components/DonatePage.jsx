import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Heart, CheckCircle, AlertCircle, Home } from 'lucide-react'

export default function DonatePage() {
  const { user } = useAuth()
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)

  const handleDonate = async (e) => {
    e.preventDefault()
    
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid donation amount')
      return
    }

    if (parseFloat(amount) < 0.001) {
      setError('Minimum donation amount is 0.001 ALGO')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sendDonation`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          userId: user.id
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Donation failed')
      }

      setResult(data)
      setAmount('')
      setShowSuccess(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleBackToHome = () => {
    setShowSuccess(false)
    setResult(null)
    setError('')
  }

  if (showSuccess && result) {
    return (
      <div className="donate-page">
        <div className="success-page">
          <div className="success-header">
            <div className="success-icon">
              <CheckCircle size={64} className="success-check" />
            </div>
            <h2>Thank you for donating!</h2>
            <p>Your generous contribution has been successfully processed</p>
          </div>

          <div className="success-details">
            <h3>Transaction Details</h3>
            <div className="detail-item">
              <strong>Amount Donated:</strong>
              <span>{result.amount} ALGO</span>
            </div>
            <div className="detail-item">
              <strong>Transaction Hash:</strong>
              <code className="tx-hash">{result.txHash}</code>
            </div>
            <div className="detail-item">
              <strong>Status:</strong>
              <span className="status-confirmed">✅ Confirmed on Blockchain</span>
            </div>
          </div>

          <div className="success-message-box">
            <p>{result.message}</p>
          </div>

          <button onClick={handleBackToHome} className="back-home-button">
            <Home size={20} />
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="donate-page">
      <div className="donate-header">
        <div className="donate-icon">
          <Heart size={48} className="heart-icon" />
        </div>
        <h2>Make a Donation</h2>
        <p>Support our cause by donating ALGO to help those in need</p>
      </div>

      <div className="donate-form-container">
        <form onSubmit={handleDonate} className="donate-form">
          <div className="form-group">
            <label htmlFor="amount">Donation Amount (ALGO)</label>
            <div className="amount-input-container">
              <input
                id="amount"
                type="number"
                step="0.000001"
                min="0.001"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.000000"
                required
                disabled={loading}
                className="amount-input"
              />
              <span className="currency-label">ALGO</span>
            </div>
            <small className="input-help">Minimum donation: 0.001 ALGO</small>
          </div>

          <button 
            type="submit" 
            disabled={loading || !amount} 
            className="donate-button"
          >
            {loading ? (
              <>
                <div className="loading-spinner-small"></div>
                Processing Donation...
              </>
            ) : (
              <>
                <Heart size={20} />
                Donate Now
              </>
            )}
          </button>
        </form>

        {error && (
          <div className="error-result">
            <div className="error-icon">
              <AlertCircle size={24} />
            </div>
            <h3>Donation Failed</h3>
            <p>{error}</p>
          </div>
        )}
      </div>

      <div className="donation-info">
        <h3>About Your Donation</h3>
        <div className="info-grid">
          <div className="info-item">
            <h4>Secure & Transparent</h4>
            <p>All donations are processed on the Algorand blockchain, ensuring transparency and security.</p>
          </div>
          <div className="info-item">
            <h4>Direct Impact</h4>
            <p>Your donation goes directly to verified charity wallets to maximize impact.</p>
          </div>
          <div className="info-item">
            <h4>Low Fees</h4>
            <p>Algorand's low transaction fees mean more of your donation reaches those in need.</p>
          </div>
        </div>
      </div>
    </div>
  )
}