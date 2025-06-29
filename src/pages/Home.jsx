import { Link } from 'react-router-dom'
import { MessageCircle, Sparkles, Shield, Zap } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto text-center">
        {/* Hero Section */}
        <div className="mb-12">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-2xl">A</span>
            </div>
          </div>
          
          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6">
            Welcome to{' '}
            <span className="bg-gradient-to-r from-primary-600 to-cyan-600 bg-clip-text text-transparent">
              AlgoDApp
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Your intelligent companion for Algorand blockchain operations. 
            Chat with AI, make donations, earn certificates, and explore the future of decentralized applications.
          </p>
          
          <Link
            to="/chat"
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-xl hover:from-primary-700 hover:to-primary-800 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <MessageCircle className="mr-3" size={20} />
            Get Started
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 mx-auto">
              <Sparkles className="text-white" size={24} />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">AI Assistant</h3>
            <p className="text-gray-600">
              Interact with our intelligent AI that understands blockchain operations and can guide you through complex processes.
            </p>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-4 mx-auto">
              <Shield className="text-white" size={24} />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Secure Donations</h3>
            <p className="text-gray-600">
              Make secure, transparent donations using Algorand's fast and eco-friendly blockchain technology.
            </p>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 mx-auto">
              <Zap className="text-white" size={24} />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Earn Certificates</h3>
            <p className="text-gray-600">
              Complete blockchain activities and earn verifiable certificates that showcase your Web3 achievements.
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-white/40 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600 mb-2">Fast</div>
              <div className="text-sm text-gray-600">4.5s Finality</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600 mb-2">Green</div>
              <div className="text-sm text-gray-600">Carbon Negative</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600 mb-2">Secure</div>
              <div className="text-sm text-gray-600">Pure PoS</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600 mb-2">Smart</div>
              <div className="text-sm text-gray-600">AI Powered</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}