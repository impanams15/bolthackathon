import { ExternalLink } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="app-footer">
      <div className="footer-content">
        <div className="footer-section">
          <h4>Algorand DApp</h4>
          <p>Secure blockchain operations with AI assistance</p>
        </div>
        
        <div className="footer-section">
          <h4>Features</h4>
          <ul>
            <li>ALGO Transfers</li>
            <li>ASA Token Minting</li>
            <li>AI Chat Assistant</li>
            <li>Voice Interactions</li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h4>Technology</h4>
          <ul>
            <li>Algorand Blockchain</li>
            <li>Supabase Backend</li>
            <li>ElevenLabs TTS</li>
            <li>Tavus Video Avatar</li>
          </ul>
        </div>
        
        <div className="footer-section">
          <div className="built-with-bolt">
            <a 
              href="https://bolt.new" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bolt-badge"
            >
              <span className="bolt-icon">⚡</span>
              Built with Bolt.new
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>&copy; 2025 Algorand DApp. Powered by AI and blockchain technology.</p>
      </div>
    </footer>
  )
}