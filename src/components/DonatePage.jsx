import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Heart, CheckCircle, AlertCircle, Home, Award, ExternalLink } from 'lucide-react'

export default function DonatePage() {
  const { user } = useAuth()
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [certificateLoading, setCertificateLoading] = useState(false)
  const [certificateResult, setCertificateResult] = useState(null)
  const [certificateError, setCertificateError] = useState('')

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
      const { data: wallet, error: walletError } = await supabase
        .from('algorand_wallets')
        .select('address, mnemonic')
        .eq('user_id', user.id)
        .single()

      if (walletError || !wallet) {
        throw new Error('Wallet not found for user. Please set up your wallet first.')
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sendDonation`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          userId: user.id,
          walletAddr: wallet.address,
          mnemonic: wallet.mnemonic,
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

  const handleMintCertificate = async () => {
    if (!result || !result.amount) {
      setCertificateError('No donation data available for certificate minting')
      return
    }

    setCertificateLoading(true)
    setCertificateError('')
    setCertificateResult(null)

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mintCertificate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          donationAmount: result.amount
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Certificate minting failed')
      }

      setCertificateResult(data)
    } catch (err) {
      setCertificateError(err.message)
    } finally {
      setCertificateLoading(false)
    }
  }

  const handleBackToHome = () => {
    setShowSuccess(false)
    setResult(null)
    setError('')
    setCertificateResult(null)
    setCertificateError('')
  }

  const getAlgoExplorerUrl = (assetId) => {
    return `https://testnet.algoexplorer.io/asset/${assetId}`
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

          {!certificateResult && (
            <div className="certificate-section">
              <div className="certificate-info">
                <Award size={32} style={{ color: '#f39c12', marginBottom: '1rem' }} />
                <h3>Get Your Donation Certificate</h3>
                <p>Mint a unique blockchain certificate to commemorate your donation!</p>
              </div>

              <button
                onClick={handleMintCertificate}
                disabled={certificateLoading}
                className="mint-certificate-button"
              >
                {certificateLoading ? (
                  <>
                    <div className="loading-spinner-small"></div>
                    Minting Certificate...
                  </>
                ) : (
                  <>
                    🪙 Mint Certificate
                  </>
                )}
              </button>

              {certificateError && (
                <div className="error-message" style={{ marginTop: '1rem' }}>
                  <AlertCircle size={20} />
                  <span>{certificateError}</span>
                </div>
              )}
            </div>
          )}

          {certificateResult && (
            <div className="certificate-success">
              <div className="certificate-success-header">
                <Award size={48} style={{ color: '#f39c12' }} />
                <h3>Certificate Minted! 🎉</h3>
                <p>Your unique donation certificate has been created on the Algorand blockchain</p>
              </div>

              <div className="certificate-details">
                <div className="detail-item">
                  <strong>Certificate Name:</strong>
                  <span>UsheGuard Certificate (UGC)</span>
                </div>
                <div className="detail-item">
                  <strong>ASA ID:</strong>
                  <span>{certificateResult.asaId}</span>
                </div>
                <div className="detail-item">
                  <strong>Transaction Hash:</strong>
                  <code className="tx-hash">{certificateResult.txHash}</code>
                </div>
              </div>

              <div className="certificate-actions">
                <a
                  href={getAlgoExplorerUrl(certificateResult.asaId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="view-certificate-button"
                >
                  <ExternalLink size={20} />
                  View on AlgoExplorer
                </a>
              </div>

              <div className="certificate-message">
                <p>🏆 Your certificate is a unique ASA token that proves your donation on the blockchain. It's permanently recorded and can be viewed by anyone!</p>
              </div>
            </div>
          )}

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
            <h4>Get a Certificate</h4>
            <p>Receive a unique blockchain certificate (ASA token) to commemorate your donation.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
