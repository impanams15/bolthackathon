import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { 
  Home, 
  MessageCircle, 
  Heart, 
  Award, 
  User, 
  Smile,
  Menu,
  X,
  LogOut
} from 'lucide-react'

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()
  const { signOut } = useAuth()

  const navigation = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Chat', href: '/chat', icon: MessageCircle },
    { name: 'Donate', href: '/donate', icon: Heart },
    { name: 'Certificate', href: '/certificate', icon: Award },
    { name: 'Profile', href: '/profile', icon: User },
    { name: 'Bonus', href: '/bonus', icon: Smile },
  ]

  const handleSignOut = async () => {
    await signOut()
  }

  const isActive = (href) => {
    return location.pathname === href
  }

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-blue-100 fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <span className="font-bold text-xl text-gray-900">AlgoDApp</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                      isActive(item.href)
                        ? 'bg-primary-100 text-primary-700 shadow-sm'
                        : 'text-gray-600 hover:text-primary-600 hover:bg-primary-50'
                    }`}
                  >
                    <Icon size={16} />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Desktop Sign Out */}
          <div className="hidden md:block">
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-lg text-gray-600 hover:text-primary-600 hover:bg-primary-50 transition-all duration-200"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 bg-white/95 backdrop-blur-md border-t border-blue-100">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`block px-3 py-2 rounded-lg text-base font-medium transition-all duration-200 flex items-center space-x-3 ${
                    isActive(item.href)
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:text-primary-600 hover:bg-primary-50'
                  }`}
                >
                  <Icon size={20} />
                  <span>{item.name}</span>
                </Link>
              )
            })}
            <button
              onClick={handleSignOut}
              className="w-full text-left px-3 py-2 rounded-lg text-base font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 transition-all duration-200 flex items-center space-x-3"
            >
              <LogOut size={20} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}