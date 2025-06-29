import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { microAlgosFromAlgos } from '../lib/algorand'

export default function AlgoTransfer({ wallet }) {
  const { user } = useAuth()
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const handleTransfer = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const amountInMicroAlgos = microAlgosFromAlgos(parseFloat(amount))
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/algo-transfer`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          recipient: recipient.trim(),
          amount: amountInMicroAlgos,
          note: note.trim()
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Transfer failed')
      }

      setResult(data)
      setRecipient('')
      setAmount('')
      setNote('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="transfer-container">
      <h3>Send ALGO</h3>
      
      <form onSubmit={handleTransfer} className="transfer-form">
        <div className="form-group">
          <label>Recipient Address</label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="Enter Algorand address..."
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label>Amount (ALGO)</label>
          <input
            type="number"
            step="0.000001"
            min="0.001"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.000000"
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label>Note (Optional)</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Transaction note..."
            maxLength={1000}
            disabled={loading}
          />
        </div>

        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Sending...' : 'Send ALGO'}
        </button>
      </form>

      {result && (
        <div className="success-message">
          <h4>✅ Transaction Successful!</h4>
          <p><strong>Transaction ID:</strong> {result.txId}</p>
          <p><strong>Amount:</strong> {amount} ALGO</p>
          <p><strong>Recipient:</strong> {recipient}</p>
        </div>
      )}

      {error && (
        <div className="error-message">
          <h4>❌ Transaction Failed</h4>
          <p>{error}</p>
        </div>
      )}
    </div>
  )
}