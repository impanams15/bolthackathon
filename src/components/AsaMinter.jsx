import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function AsaMinter({ wallet }) {
  const { user } = useAuth()
  const [assetName, setAssetName] = useState('')
  const [unitName, setUnitName] = useState('')
  const [totalSupply, setTotalSupply] = useState('')
  const [decimals, setDecimals] = useState('0')
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const handleMint = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mint-asa`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          assetName: assetName.trim(),
          unitName: unitName.trim(),
          totalSupply: parseInt(totalSupply),
          decimals: parseInt(decimals),
          url: url.trim()
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Minting failed')
      }

      setResult(data)
      setAssetName('')
      setUnitName('')
      setTotalSupply('')
      setDecimals('0')
      setUrl('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mint-container">
      <h3>Mint ASA Token</h3>
      
      <form onSubmit={handleMint} className="mint-form">
        <div className="form-group">
          <label>Asset Name</label>
          <input
            type="text"
            value={assetName}
            onChange={(e) => setAssetName(e.target.value)}
            placeholder="My Token"
            maxLength={32}
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label>Unit Name</label>
          <input
            type="text"
            value={unitName}
            onChange={(e) => setUnitName(e.target.value)}
            placeholder="MTK"
            maxLength={8}
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label>Total Supply</label>
          <input
            type="number"
            min="1"
            value={totalSupply}
            onChange={(e) => setTotalSupply(e.target.value)}
            placeholder="1000000"
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label>Decimals</label>
          <select
            value={decimals}
            onChange={(e) => setDecimals(e.target.value)}
            disabled={loading}
          >
            <option value="0">0</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
            <option value="6">6</option>
          </select>
        </div>

        <div className="form-group">
          <label>URL (Optional)</label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/token-info"
            maxLength={96}
            disabled={loading}
          />
        </div>

        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Minting...' : 'Mint ASA Token'}
        </button>
      </form>

      {result && (
        <div className="success-message">
          <h4>✅ ASA Token Created!</h4>
          <p><strong>Asset ID:</strong> {result.assetId}</p>
          <p><strong>Transaction ID:</strong> {result.txId}</p>
          <p><strong>Asset Name:</strong> {assetName}</p>
          <p><strong>Unit Name:</strong> {unitName}</p>
          <p><strong>Total Supply:</strong> {totalSupply}</p>
        </div>
      )}

      {error && (
        <div className="error-message">
          <h4>❌ Minting Failed</h4>
          <p>{error}</p>
        </div>
      )}
    </div>
  )
}