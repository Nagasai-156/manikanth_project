'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '../components/Navbar'
import { MagnifyingGlassIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'
import { chatAPI, utils } from '../lib/api'
import { User } from '../types/api'

interface Conversation {
  id: string
  otherParticipant: {
    id: string
    name: string
    college: string
    course: string
    year: string
    profilePicture?: string
  }
  lastMessage: {
    id: string
    content: string
    message_type: string
    created_at: string
    sender_id: string
  } | null
  unreadCount: number
  lastMessageAt: string
}

export default function ChatsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const pollingInterval = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const userData = utils.getUser()
    if (!userData) {
      router.push('/login')
      return
    }
    setUser(userData)
    loadConversations()

    // Poll for new messages every 3 seconds
    pollingInterval.current = setInterval(() => {
      loadConversations(true)
    }, 3000)

    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current)
      }
    }
  }, [])

  const loadConversations = async (silent: boolean = false) => {
    try {
      if (!silent) setLoading(true)
      
      const response = await chatAPI.getConversations()
      if (response.success && response.data) {
        setConversations(response.data.conversations || [])
      }
    } catch (error) {
      if (!silent) {
        console.error('Error loading conversations:', error)
      }
    } finally {
      if (!silent) setLoading(false)
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  const getLastMessagePreview = (conv: Conversation) => {
    if (!conv.lastMessage) return 'No messages yet'
    
    const isMe = conv.lastMessage.sender_id === user?.id
    const prefix = isMe ? 'You: ' : ''
    
    if (conv.lastMessage.message_type === 'image') {
      return `${prefix}📷 Photo`
    } else if (conv.lastMessage.message_type === 'file') {
      return `${prefix}📎 File`
    }
    
    return `${prefix}${conv.lastMessage.content}`
  }

  const filteredConversations = conversations.filter(conv =>
    conv.otherParticipant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.otherParticipant.course.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalUnread = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-mint-50 via-white to-peach-50">
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ocean-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-mint-50 via-white to-peach-50">
      <Navbar />
      
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="sticker-card p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-black flex items-center gap-3">
                <ChatBubbleLeftRightIcon className="w-8 h-8" />
                Messages
              </h1>
              {totalUnread > 0 && (
                <p className="text-gray-600 mt-1">
                  {totalUnread} unread message{totalUnread > 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-12 pr-4 py-3 border-3 border-black rounded-xl focus:outline-none focus:ring-4 focus:ring-ocean-200 transition-all font-medium"
              />
            </div>
          </div>

          {/* Conversations List */}
          <div className="space-y-3">
            {filteredConversations.length === 0 ? (
              <div className="text-center py-16 bg-gradient-to-br from-mint-50 to-peach-50 rounded-xl border-3 border-black">
                <div className="text-7xl mb-4">💬</div>
                <h3 className="text-xl font-bold text-black mb-2">
                  {searchQuery ? 'No conversations found' : 'No messages yet'}
                </h3>
                <p className="text-gray-700 font-medium mb-4">
                  {searchQuery 
                    ? 'Try a different search term' 
                    : 'Start a conversation by visiting someone\'s profile'}
                </p>
                {!searchQuery && (
                  <Link href="/dashboard" className="sticker-button">
                    🔍 Explore Experiences
                  </Link>
                )}
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <Link
                  key={conv.id}
                  href={`/chat/${conv.otherParticipant.id}`}
                  className="block bg-white rounded-xl border-3 border-black p-4 hover:shadow-sticker-hover hover:-translate-y-1 transition-all duration-200"
                >
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="relative">
                      <div className="w-14 h-14 bg-gradient-to-br from-ocean-400 to-mint-400 rounded-full border-3 border-black flex items-center justify-center shadow-sticker flex-shrink-0">
                        <span className="text-white font-bold text-lg">
                          {conv.otherParticipant.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      {conv.unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 border-2 border-black rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">
                            {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <div>
                          <h3 className={`font-bold text-black ${conv.unreadCount > 0 ? 'text-lg' : ''}`}>
                            {conv.otherParticipant.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {conv.otherParticipant.year} • {conv.otherParticipant.course}
                          </p>
                        </div>
                        <span className="text-xs text-gray-500 font-medium whitespace-nowrap ml-2">
                          {formatTimestamp(conv.lastMessageAt)}
                        </span>
                      </div>
                      <p className={`text-sm truncate ${
                        conv.unreadCount > 0 ? 'text-black font-bold' : 'text-gray-600'
                      }`}>
                        {getLastMessagePreview(conv)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
