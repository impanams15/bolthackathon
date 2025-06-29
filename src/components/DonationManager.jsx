import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Heart, Gift, TrendingUp } from 'lucide-react'

export default function DonationManager({ wallet }) {
  const { user } = useAuth()
  const [donations, setDonations] = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeView, setActiveView] = useState('donate')

  // Donation form state
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [message, setMessage] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)

  // Campaign form state
  const [campaignTitle, setCampaignTitle] = useState('')
  const [campaignDescription, setCampaignDescription] = useState('')
  const [campaignGoal, setCampaignGoal] = useState('')
  const [campaignDuration, setCampaignDuration] = useState('30')

  useEffect(() => {
    loadDonations()
    loadCampaigns()
  }, [user])

  const loadDonations = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-donations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id })
      })

      if (response.ok) {
        const data = await response.json()
        setDonations(data.donations || [])
      }
    } catch (error) {
      console.error('Failed to load donations:', error)
    }
  }

  const loadCampaigns = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-campaigns`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id })
      })

      if (response.ok) {
        const data = await response.json()
        setCampaigns(data.campaigns || [])
      }
    } catch (error) {
      console.error('Failed to load campaigns:', error)
    }
  }

  const handleDonate = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-donation`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          recipient: recipient.trim(),
          amount: parseFloat(amount),
          message: message.trim(),
          isAnonymous
        })
      })

      const data = await response.json()
      if (response.ok) {
        alert(`Donation successful! Transaction ID: ${data.txId}`)
        setRecipient('')
        setAmount('')
        setMessage('')
        setIsAnonymous(false)
        loadDonations()
      } else {
        alert(`Donation failed: ${data.error}`)
      }
    } catch (error) {
      alert(`Donation failed: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCampaign = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-campaign`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          title: campaignTitle.trim(),
          description: campaignDescription.trim(),
          goal: parseFloat(campaignGoal),
          duration: parseInt(campaignDuration)
        })
      })

      const data = await response.json()
      if (response.ok) {
        alert('Campaign created successfully!')
        setCampaignTitle('')
        setCampaignDescription('')
        setCampaignGoal('')
        setCampaignDuration('30')
        loadCampaigns()
      } else {
        alert(`Campaign creation failed: ${data.error}`)
      }
    } catch (error) {
      alert(`Campaign creation failed: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="donation-manager">
      <div className="donation-header">
        <h3>Donation Manager</h3>
        <div className="view-tabs">
          <button
            className={`tab-button ${activeView === 'donate' ? 'active' : ''}`}
            onClick={() => setActiveView('donate')}
          >
            <Heart size={16} />
            Donate
          </button>
          <button
            className={`tab-button ${activeView === 'campaigns' ? 'active' : ''}`}
            onClick={() => setActiveView('campaigns')}
          >
            <TrendingUp size={16} />
            Campaigns
          </button>
          <button
            className={`tab-button ${activeView === 'history' ? 'active' : ''}`}
            onClick={() => setActiveView('history')}
          >
            <Gift size={16} />
            History
          </button>
        </div>
      </div>

      {activeView === 'donate' && (
        <div className="donate-section">
          <form onSubmit={handleDonate} className="donation-form">
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
              <label>Message (Optional)</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add a personal message..."
                rows={3}
                disabled={loading}
              />
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  disabled={loading}
                />
                Make this donation anonymous
              </label>
            </div>

            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Processing...' : 'Send Donation'}
            </button>
          </form>
        </div>
      )}

      {activeView === 'campaigns' && (
        <div className="campaigns-section">
          <form onSubmit={handleCreateCampaign} className="campaign-form">
            <h4>Create Fundraising Campaign</h4>
            
            <div className="form-group">
              <label>Campaign Title</label>
              <input
                type="text"
                value={campaignTitle}
                onChange={(e) => setCampaignTitle(e.target.value)}
                placeholder="Enter campaign title..."
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={campaignDescription}
                onChange={(e) => setCampaignDescription(e.target.value)}
                placeholder="Describe your campaign..."
                rows={4}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>Goal (ALGO)</label>
              <input
                type="number"
                step="0.000001"
                min="1"
                value={campaignGoal}
                onChange={(e) => setCampaignGoal(e.target.value)}
                placeholder="100.000000"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>Duration (Days)</label>
              <select
                value={campaignDuration}
                onChange={(e) => setCampaignDuration(e.target.value)}
                disabled={loading}
              >
                <option value="7">7 days</option>
                <option value="14">14 days</option>
                <option value="30">30 days</option>
                <option value="60">60 days</option>
                <option value="90">90 days</option>
              </select>
            </div>

            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Creating...' : 'Create Campaign'}
            </button>
          </form>

          <div className="campaigns-list">
            <h4>Your Campaigns</h4>
            {campaigns.length === 0 ? (
              <p>No campaigns created yet.</p>
            ) : (
              campaigns.map((campaign) => (
                <div key={campaign.id} className="campaign-card">
                  <h5>{campaign.title}</h5>
                  <p>{campaign.description}</p>
                  <div className="campaign-stats">
                    <span>Goal: {campaign.goal} ALGO</span>
                    <span>Raised: {campaign.raised || 0} ALGO</span>
                    <span>Status: {campaign.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeView === 'history' && (
        <div className="history-section">
          <h4>Donation History</h4>
          {donations.length === 0 ? (
            <p>No donations yet.</p>
          ) : (
            <div className="donations-list">
              {donations.map((donation) => (
                <div key={donation.id} className="donation-card">
                  <div className="donation-info">
                    <span className="amount">{donation.amount} ALGO</span>
                    <span className="recipient">To: {donation.recipient}</span>
                    <span className="date">{new Date(donation.created_at).toLocaleDateString()}</span>
                  </div>
                  {donation.message && (
                    <p className="donation-message">"{donation.message}"</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}