import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { generateAccount, getAccountFromMnemonic, getAccountInfo, formatAlgoAmount } from '../lib/algorand'

export default function AlgorandWallet() {
  const { user } = useAuth()
  const [wallet, setWallet] = useState(null)
  const [accountInfo, setAccountInfo] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showMnemonic, setShowMnemonic] = useState(false)

  useEffect(() => {
    if (user) {
      loadWallet()
    }
  }, [user])

  useEffect(() => {
    if (wallet) {
      fetchAccountInfo()
      const interval = setInterval(fetchAccountInfo, 10000) // Refresh every 10 seconds
      return () => clearInterval(interval)
    }
  }, [wallet])

  const loadWallet = async () => {
    try {
      const { data, error } = await supabase
        .from('algorand_wallets')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (data) {
        setWallet(data)
      }
    } catch (err) {
      // Wallet doesn't exist yet
    }
  }

  const fetchAccountInfo = async () => {
    if (!wallet) return

    try {
      const info = await getAccountInfo(wallet.address)
      setAccountInfo(info)
    } catch (err) {
      console.error('Failed to fetch account info:', err)
    }
  }

  const createWallet = async () => {
    setLoading(true)
    setError('')

    try {
      const newAccount = generateAccount()
      
      const { data, error } = await supabase
        .from('algorand_wallets')
        .insert({
          user_id: user.id,
          address: newAccount.address,
          mnemonic: newAccount.privateKey
        })
        .select()
        .single()

      if (error) throw error

      setWallet(data)
      setShowMnemonic(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const importWallet = async (mnemonic) => {
    setLoading(true)
    setError('')

    try {
      const account = getAccountFromMnemonic(mnemonic)
      
      const { data, error } = await supabase
        .from('algorand_wallets')
        .upsert({
          user_id: user.id,
          address: account.address,
          mnemonic: mnemonic
        })
        .select()
        .single()

      if (error) throw error

      setWallet(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!wallet) {
    return <WalletSetup onCreateWallet={createWallet} onImportWallet={importWallet} loading={loading} error={error} />
  }

  return (
    <div className="wallet-container">
      <div className="wallet-header">
        <h3>Algorand Wallet</h3>
        <div className="wallet-address">
          <strong>Address:</strong> {wallet.address}
        </div>
      </div>

      {accountInfo && (
        <div className="account-info">
          <div className="balance">
            <h4>Balance: {formatAlgoAmount(accountInfo.amount)} ALGO</h4>
          </div>
          
          {accountInfo.assets && accountInfo.assets.length > 0 && (
            <div className="assets">
              <h4>Assets:</h4>
              <div className="asset-list">
                {accountInfo.assets.map((asset) => (
                  <div key={asset['asset-id']} className="asset-item">
                    <span>Asset ID: {asset['asset-id']}</span>
                    <span>Amount: {asset.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {showMnemonic && (
        <div className="mnemonic-display">
          <h4>⚠️ Save Your Recovery Phrase</h4>
          <p>Write down these words in order and keep them safe:</p>
          <div className="mnemonic-words">
            {wallet.mnemonic}
          </div>
          <button onClick={() => setShowMnemonic(false)} className="btn-primary">
            I've Saved It
          </button>
        </div>
      )}
    </div>
  )
}

function WalletSetup({ onCreateWallet, onImportWallet, loading, error }) {
  const [importMode, setImportMode] = useState(false)
  const [mnemonic, setMnemonic] = useState('')

  const handleImport = (e) => {
    e.preventDefault()
    onImportWallet(mnemonic.trim())
  }

  return (
    <div className="wallet-setup">
      <h3>Setup Algorand Wallet</h3>
      
      {!importMode ? (
        <div className="setup-options">
          <button onClick={onCreateWallet} disabled={loading} className="btn-primary">
            {loading ? 'Creating...' : 'Create New Wallet'}
          </button>
          <button onClick={() => setImportMode(true)} className="btn-secondary">
            Import Existing Wallet
          </button>
        </div>
      ) : (
        <form onSubmit={handleImport} className="import-form">
          <div className="form-group">
            <label>Recovery Phrase (25 words)</label>
            <textarea
              value={mnemonic}
              onChange={(e) => setMnemonic(e.target.value)}
              placeholder="Enter your 25-word recovery phrase..."
              rows={4}
              required
            />
          </div>
          <div className="form-actions">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Importing...' : 'Import Wallet'}
            </button>
            <button type="button" onClick={() => setImportMode(false)} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      )}

      {error && <div className="error-message">{error}</div>}
    </div>
  )
}