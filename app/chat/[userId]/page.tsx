'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '../../components/Navbar'
import { PaperAirplaneIcon, ArrowLeftIcon, PhotoIcon, PaperClipIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { chatAPI, userAPI, utils } from '../../lib/api'
import { User } from '../../types/api'

interface Message {
  id: string
  content: string
  sender_id: string
  created_at: string
  is_read: boolean
  message_type?: string
  file_url?: string
}

export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.userId as string
  
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [otherUser, setOtherUser] = useState<User | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pollingInterval = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const user = utils.getUser()
    if (!user) {
      router.push('/login')
      return
    }
    setCurrentUser(user)
    initializeChat()

    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current)
      }
    }
  }, [userId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const initializeChat = async () => {
    try {
      setLoading(true)
      
      // Get other user's details
      const userResponse = await userAPI.getUserById(userId)
      if (userResponse.success && userResponse.data) {
        setOtherUser(userResponse.data.user)
      } else {
        alert('User not found')
        router.push('/dashboard')
        return
      }

      // Start or get conversation
      const convResponse = await chatAPI.startConversation(userId)
      if (convResponse.success && convResponse.data) {
        setConversationId(convResponse.data.conversation.id)
        
        // Load messages
        await loadMessages(convResponse.data.conversation.id)
        
        // Start polling for new messages every 2 seconds
        pollingInterval.current = setInterval(() => {
          loadMessages(convResponse.data.conversation.id, true)
        }, 2000)
      }
    } catch (error) {
      console.error('Error initializing chat:', error)
      alert('Failed to start conversation')
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (convId: string, silent: boolean = false) => {
    try {
      const response = await chatAPI.getMessages(convId, 1)
      if (response.success && response.data) {
        setMessages(response.data.messages || [])
        
        // Mark messages as read
        if (!silent) {
          await chatAPI.markAsRead(convId).catch(err => console.log('Mark as read failed:', err))
        }
      }
    } catch (error) {
      if (!silent) {
        console.error('Error loading messages:', error)
      }
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }

    setSelectedFile(file)

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFilePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setFilePreview(null)
    }
  }

  const clearFile = () => {
    setSelectedFile(null)
    setFilePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const compressImage = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height
          
          // Resize if too large (max 800px on longest side)
          const maxSize = 800
          if (width > height && width > maxSize) {
            height = (height * maxSize) / width
            width = maxSize
          } else if (height > maxSize) {
            width = (width * maxSize) / height
            height = maxSize
          }
          
          canvas.width = width
          canvas.height = height
          
          const ctx = canvas.getContext('2d')
          ctx?.drawImage(img, 0, 0, width, height)
          
          // Compress to JPEG with 0.7 quality
          const compressedData = canvas.toDataURL('image/jpeg', 0.7)
          resolve(compressedData)
        }
        img.onerror = reject
        img.src = e.target?.result as string
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!newMessage.trim() && !selectedFile) || !conversationId || sending) return

    setSending(true)
    const messageContent = newMessage.trim()
    const file = selectedFile
    
    setNewMessage('')
    clearFile()

    try {
      let response

      if (file) {
        let fileData: string
        
        if (file.type.startsWith('image/')) {
          // Compress image before sending
          fileData = await compressImage(file)
        } else {
          // For non-images, convert to base64
          const reader = new FileReader()
          fileData = await new Promise<string>((resolve, reject) => {
            reader.onloadend = () => resolve(reader.result as string)
            reader.onerror = reject
            reader.readAsDataURL(file)
          })
        }

        // Send file message
        response = await chatAPI.sendMessage(conversationId, messageContent || file.name, {
          messageType: file.type.startsWith('image/') ? 'image' : 'file',
          fileUrl: fileData,
          fileName: file.name
        })
      } else {
        // Send text message
        response = await chatAPI.sendMessage(conversationId, messageContent)
      }

      if (response.success) {
        // Immediately load messages to show the new one
        await loadMessages(conversationId, true)
      } else {
        alert('Failed to send message')
        setNewMessage(messageContent) // Restore message
        if (file) setSelectedFile(file)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message')
      setNewMessage(messageContent) // Restore message
      if (file) setSelectedFile(file)
    } finally {
      setSending(false)
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
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

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

  if (!otherUser || !currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-mint-50 via-white to-peach-50">
        <Navbar />
        <div className="flex flex-col items-center justify-center h-screen">
          <div className="text-6xl mb-4">😕</div>
          <p className="text-gray-600 text-xl mb-4">User not found</p>
          <button
            onClick={() => router.back()}
            className="sticker-button"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-mint-50 via-white to-peach-50">
      <Navbar />
      
      <div className="max-w-5xl mx-auto px-4 py-4">
        <div className="sticker-card h-[calc(100vh-180px)] flex flex-col">
          {/* Chat Header */}
          <div className="flex items-center space-x-4 p-4 border-b-3 border-black bg-gradient-to-r from-mint-100 to-ocean-100">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-white rounded-lg transition-colors border-2 border-black"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => router.push(`/user/${userId}`)}
              className="flex items-center space-x-3 hover:bg-white p-2 rounded-lg transition-colors flex-1"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-ocean-400 to-mint-400 rounded-full border-3 border-black flex items-center justify-center shadow-sticker">
                <span className="text-white font-bold text-lg">
                  {otherUser.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="text-left">
                <h2 className="font-bold text-black text-lg">{otherUser.name}</h2>
                <p className="text-sm text-gray-600">{otherUser.year} • {otherUser.course}</p>
              </div>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-br from-mint-50/30 to-peach-50/30">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="text-6xl mb-4">💬</div>
                <p className="text-gray-600 font-medium">No messages yet</p>
                <p className="text-gray-500 text-sm">Start the conversation!</p>
              </div>
            ) : (
              messages.map((message) => {
                const isMe = message.sender_id === currentUser.id
                const isImage = message.message_type === 'image'
                const isFile = message.message_type === 'file'
                
                return (
                  <div
                    key={message.id}
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-200`}
                  >
                    <div className={`max-w-xs lg:max-w-md rounded-2xl border-3 border-black shadow-sticker overflow-hidden ${
                      isMe
                        ? 'bg-ocean-400 text-white'
                        : 'bg-white text-black'
                    }`}>
                      {isImage && message.file_url && (
                        <div className="relative">
                          <img 
                            src={message.file_url} 
                            alt="Shared image"
                            className="w-full h-auto max-h-96 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => window.open(message.file_url, '_blank')}
                          />
                        </div>
                      )}
                      {isFile && message.file_url && (
                        <a
                          href={message.file_url}
                          download={message.content}
                          className={`flex items-center gap-3 p-4 hover:opacity-80 transition-opacity ${
                            isMe ? 'bg-ocean-500' : 'bg-gray-50'
                          }`}
                        >
                          <PaperClipIcon className="w-6 h-6" />
                          <div className="flex-1 min-w-0">
                            <p className="font-bold truncate">{message.content}</p>
                            <p className={`text-xs ${isMe ? 'text-ocean-100' : 'text-gray-500'}`}>
                              Click to download
                            </p>
                          </div>
                        </a>
                      )}
                      {message.content && !isFile && (
                        <div className="px-4 py-3">
                          <p className="break-words whitespace-pre-wrap">{message.content}</p>
                        </div>
                      )}
                      <p className={`text-xs px-4 pb-2 ${isMe ? 'text-ocean-100' : 'text-gray-500'}`}>
                        {formatTimestamp(message.created_at)}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <form onSubmit={handleSendMessage} className="p-4 border-t-3 border-black bg-white">
            {/* File Preview */}
            {selectedFile && (
              <div className="mb-3 p-3 bg-gray-50 rounded-xl border-2 border-gray-300 flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {filePreview ? (
                    <img src={filePreview} alt="Preview" className="w-16 h-16 object-cover rounded-lg border-2 border-black" />
                  ) : (
                    <div className="w-16 h-16 bg-gray-200 rounded-lg border-2 border-black flex items-center justify-center">
                      <PaperClipIcon className="w-6 h-6 text-gray-600" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={clearFile}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            )}

            <div className="flex space-x-2">
              {/* File Upload Buttons */}
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                accept="image/*,.pdf,.doc,.docx,.txt"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={sending || !!selectedFile}
                className="p-3 bg-mint-100 hover:bg-mint-200 border-3 border-black rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                title="Upload image or file"
              >
                <PhotoIcon className="w-5 h-5 text-mint-700" />
              </button>

              {/* Text Input */}
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={selectedFile ? "Add a caption (optional)..." : "Type a message..."}
                className="flex-1 px-4 py-3 border-3 border-black rounded-xl focus:outline-none focus:ring-4 focus:ring-ocean-200 transition-all font-medium"
                disabled={sending}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage(e)
                  }
                }}
              />

              {/* Send Button */}
              <button
                type="submit"
                disabled={(!newMessage.trim() && !selectedFile) || sending}
                className="px-6 py-3 bg-ocean-400 text-white rounded-xl border-3 border-black font-bold hover:bg-ocean-500 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sticker flex items-center gap-2"
              >
                {sending ? '⏳' : <PaperAirplaneIcon className="h-5 w-5" />}
                {sending ? 'Sending...' : 'Send'}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              💡 Press Enter to send • Max file size: 5MB
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
