'use client'

import { useState, useEffect } from 'react'
import { ChatBubbleLeftIcon, UserIcon, Bars3Icon, XMarkIcon, HomeIcon, PlusCircleIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { utils, authAPI } from '../lib/api'

interface NavbarProps {
  isLoggedIn?: boolean
  user?: any
}

export default function Navbar({ isLoggedIn: propIsLoggedIn, user: propUser }: NavbarProps) {
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(propIsLoggedIn || false)
  const [user, setUser] = useState(propUser || null)

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = utils.isAuthenticated()
      const userData = utils.getUser()
      setIsLoggedIn(authenticated)
      setUser(userData)
    }

    checkAuth()
    
    const handleStorageChange = () => {
      checkAuth()
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const handleLogout = async () => {
    try {
      await authAPI.logout()
      setIsLoggedIn(false)
      setUser(null)
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <nav className="bg-white border-b-4 border-black sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href={isLoggedIn ? "/dashboard" : "/"} className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 bg-gradient-to-br from-mint-400 to-ocean-400 rounded-xl border-3 border-black flex items-center justify-center shadow-sticker">
              <span className="text-white font-bold text-lg">IE</span>
            </div>
            <span className="font-bold text-xl text-black hidden sm:block">InterviewExp</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            {isLoggedIn ? (
              <>
                <Link 
                  href="/dashboard" 
                  className="flex items-center gap-2 px-4 py-2 text-black hover:bg-ocean-50 rounded-lg font-medium transition-all"
                >
                  <HomeIcon className="w-5 h-5" />
                  Dashboard
                </Link>
                <Link 
                  href="/chats" 
                  className="flex items-center gap-2 px-4 py-2 text-black hover:bg-mint-50 rounded-lg font-medium transition-all"
                >
                  <ChatBubbleLeftIcon className="w-5 h-5" />
                  Messages
                </Link>
                <Link 
                  href="/post-experience" 
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-mint-400 to-ocean-400 text-white rounded-lg border-3 border-black font-bold hover:shadow-sticker transition-all"
                >
                  <PlusCircleIcon className="w-5 h-5" />
                  Post Experience
                </Link>
                
                {/* User Menu */}
                <div className="relative group">
                  <button className="flex items-center gap-2 px-4 py-2 bg-peach-100 hover:bg-peach-200 rounded-lg border-2 border-black font-medium transition-all">
                    <div className="w-8 h-8 bg-gradient-to-br from-ocean-400 to-mint-400 rounded-full border-2 border-black flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    <span className="hidden lg:block">{user?.name || 'User'}</span>
                  </button>
                  
                  {/* Dropdown */}
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl border-3 border-black shadow-sticker opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <Link 
                      href="/profile" 
                      className="block px-4 py-3 text-black hover:bg-ocean-50 font-medium border-b-2 border-gray-200 rounded-t-xl"
                    >
                      👤 My Profile
                    </Link>
                    <button 
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 font-medium rounded-b-xl"
                    >
                      🚪 Logout
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link 
                  href="/login" 
                  className="px-6 py-2 text-black hover:bg-gray-100 rounded-lg font-bold border-2 border-black transition-all"
                >
                  Login
                </Link>
                <Link 
                  href="/register" 
                  className="px-6 py-2 bg-gradient-to-r from-mint-400 to-ocean-400 text-white rounded-lg border-3 border-black font-bold hover:shadow-sticker transition-all"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {isMenuOpen ? (
              <XMarkIcon className="h-6 w-6 text-black" />
            ) : (
              <Bars3Icon className="h-6 w-6 text-black" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t-2 border-black bg-white">
          <div className="px-4 py-4 space-y-2">
            {isLoggedIn ? (
              <>
                <Link 
                  href="/dashboard" 
                  className="block px-4 py-3 text-black hover:bg-ocean-50 rounded-lg font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  🏠 Dashboard
                </Link>
                <Link 
                  href="/chats" 
                  className="block px-4 py-3 text-black hover:bg-mint-50 rounded-lg font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  💬 Messages
                </Link>
                <Link 
                  href="/post-experience" 
                  className="block px-4 py-3 bg-gradient-to-r from-mint-400 to-ocean-400 text-white rounded-lg border-3 border-black font-bold text-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  ➕ Post Experience
                </Link>
                <Link 
                  href="/profile" 
                  className="block px-4 py-3 text-black hover:bg-peach-50 rounded-lg font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  👤 My Profile
                </Link>
                <button 
                  onClick={() => {
                    handleLogout()
                    setIsMenuOpen(false)
                  }}
                  className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg font-medium"
                >
                  🚪 Logout
                </button>
              </>
            ) : (
              <>
                <Link 
                  href="/login" 
                  className="block px-4 py-3 text-center text-black hover:bg-gray-100 rounded-lg font-bold border-2 border-black"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
                <Link 
                  href="/register" 
                  className="block px-4 py-3 text-center bg-gradient-to-r from-mint-400 to-ocean-400 text-white rounded-lg border-3 border-black font-bold"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
