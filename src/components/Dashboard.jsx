import { useAuth } from '../contexts/AuthContext'
import AlgorandWallet from './AlgorandWallet'
import AlgoTransfer from './AlgoTransfer'
import AsaMinter from './AsaMinter'
import AIChat from './AIChat'
import DonationManager from './DonationManager'
import RedditIntegration from './RedditIntegration'
import DonatePage from './DonatePage'
import Footer from './Footer'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const [wallet, setWallet] = useState(null)
  const [activeTab, setActiveTab] = useState('wallet')

  useEffect(() => {
    if (user) {
      loadWallet()
    }
  }, [user])

  const loadWallet = async () => {
    try {
      const { data } = await supabase
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

  const handleSignOut = async () => {
    const { error } = await signOut()
    if (error) {
      console.error('Error signing out:', error.message)
    }
  }

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard">
        <div className="dashboard-header">
          <h1>Algorand DApp Dashboard</h1>
          <button onClick={handleSignOut} className="sign-out-button">
            Sign Out
          </button>
        </div>
        
        <div className="user-info">
          <h2>User Information</h2>
          <p><strong>Email:</strong> {user?.email}</p>
          <p><strong>User ID:</strong> {user?.id}</p>
          <p><strong>Created:</strong> {new Date(user?.created_at).toLocaleDateString()}</p>
        </div>
        
        <div className="dashboard-tabs">
          <button 
            className={`tab-button ${activeTab === 'wallet' ? 'active' : ''}`}
            onClick={() => setActiveTab('wallet')}
          >
            Wallet
          </button>
          <button 
            className={`tab-button ${activeTab === 'transfer' ? 'active' : ''}`}
            onClick={() => setActiveTab('transfer')}
            disabled={!wallet}
          >
            Send ALGO
          </button>
          <button 
            className={`tab-button ${activeTab === 'mint' ? 'active' : ''}`}
            onClick={() => setActiveTab('mint')}
            disabled={!wallet}
          >
            Mint ASA
          </button>
          <button 
            className={`tab-button ${activeTab === 'donate' ? 'active' : ''}`}
            onClick={() => setActiveTab('donate')}
          >
            Donate
          </button>
          <button 
            className={`tab-button ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            AI Chat
          </button>
          <button 
            className={`tab-button ${activeTab === 'donations' ? 'active' : ''}`}
            onClick={() => setActiveTab('donations')}
            disabled={!wallet}
          >
            Donations
          </button>
          <button 
            className={`tab-button ${activeTab === 'reddit' ? 'active' : ''}`}
            onClick={() => setActiveTab('reddit')}
          >
            Reddit
          </button>
        </div>

        <div className="dashboard-content">
          {activeTab === 'wallet' && (
            <AlgorandWallet onWalletCreated={setWallet} />
          )}
          
          {activeTab === 'transfer' && wallet && (
            <AlgoTransfer wallet={wallet} />
          )}
          
          {activeTab === 'mint' && wallet && (
            <AsaMinter wallet={wallet} />
          )}
          
          {activeTab === 'donate' && (
            <DonatePage />
          )}
          
          {activeTab === 'chat' && (
            <AIChat />
          )}
          
          {activeTab === 'donations' && wallet && (
            <DonationManager wallet={wallet} />
          )}
          
          {activeTab === 'reddit' && (
            <RedditIntegration />
          )}
        </div>
      </div>
      
      <Footer />
    </div>
  )
}