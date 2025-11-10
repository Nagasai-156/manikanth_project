'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '../../components/Navbar'
import { ChatBubbleLeftIcon, EnvelopeIcon, AcademicCapIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline'
import { userAPI, utils } from '../../lib/api'
import { User } from '../../types/api'

export default function UserProfilePage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.id as string
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState(utils.getUser())
  const [experiences, setExperiences] = useState<any[]>([])

  useEffect(() => {
    loadUserProfile()
  }, [userId])

  const loadUserProfile = async () => {
    try {
      setLoading(true)
      
      // Get user details
      const response = await userAPI.getUserById(userId)
      
      if (response.success && response.data) {
        setUser(response.data.user)
        
        // Get user's experiences
        if (response.data.experiences) {
          setExperiences(response.data.experiences)
        }
      } else {
        alert('User not found')
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Error loading user profile:', error)
      alert('Failed to load user profile')
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleStartChat = () => {
    if (!currentUser) {
      alert('Please login to start a chat')
      router.push('/login')
      return
    }
    router.push(`/chat/${userId}`)
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

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-mint-50 via-white to-peach-50">
        <Navbar />
        <div className="flex flex-col items-center justify-center h-screen">
          <div className="text-6xl mb-4">😕</div>
          <p className="text-gray-600 text-xl">User not found</p>
        </div>
      </div>
    )
  }

  const isOwnProfile = currentUser?.id === userId

  return (
    <div className="min-h-screen bg-gradient-to-br from-mint-50 via-white to-peach-50">
      <Navbar />
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="sticker-card p-8 mb-6">
          <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-24 h-24 bg-gradient-to-br from-ocean-400 to-mint-400 rounded-full border-4 border-black flex items-center justify-center text-white text-3xl font-bold shadow-sticker">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-black mb-1">{user.name}</h1>
                <p className="text-gray-700 font-medium">{user.email}</p>
                {user.rollNo && <p className="text-sm text-gray-600 font-medium mt-1">📝 Roll No: {user.rollNo}</p>}
              </div>
            </div>
            
            {!isOwnProfile && currentUser && (
              <button
                onClick={handleStartChat}
                className="sticker-button flex items-center gap-2"
              >
                <ChatBubbleLeftIcon className="w-5 h-5" />
                💬 Send Message
              </button>
            )}
            
            {isOwnProfile && (
              <Link href="/profile" className="sticker-button">
                ✏️ Edit Profile
              </Link>
            )}
          </div>

          {/* User Info */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 bg-ocean-50 rounded-xl border-2 border-ocean-200">
                <BuildingOfficeIcon className="w-6 h-6 text-ocean-600" />
                <div>
                  <p className="text-sm text-gray-600">College</p>
                  <p className="font-bold text-black">{user.college}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-mint-50 rounded-xl border-2 border-mint-200">
                <AcademicCapIcon className="w-6 h-6 text-mint-600" />
                <div>
                  <p className="text-sm text-gray-600">Course</p>
                  <p className="font-bold text-black">{user.course} - {user.year}</p>
                </div>
              </div>
            </div>

            {user.bio && (
              <div className="p-4 bg-peach-50 rounded-xl border-2 border-peach-200">
                <p className="text-sm text-gray-600 mb-1">Bio</p>
                <p className="text-gray-800 break-words whitespace-pre-wrap">{user.bio}</p>
              </div>
            )}

            {user.about && (
              <div className="p-4 bg-white rounded-xl border-2 border-gray-200">
                <p className="text-sm text-gray-600 mb-1">About</p>
                <p className="text-gray-800 break-words whitespace-pre-wrap">{user.about}</p>
              </div>
            )}

            {user.skills && user.skills.length > 0 && (
              <div>
                <p className="text-sm text-gray-600 mb-2">Skills</p>
                <div className="flex flex-wrap gap-2">
                  {user.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-ocean-100 text-ocean-800 rounded-full text-sm font-bold border-2 border-ocean-300"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-4">
              {user.githubUrl && (
                <a
                  href={user.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ocean-600 hover:text-ocean-700 font-bold hover:underline"
                >
                  🔗 GitHub
                </a>
              )}
              {user.linkedinUrl && (
                <a
                  href={user.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ocean-600 hover:text-ocean-700 font-bold hover:underline"
                >
                  🔗 LinkedIn
                </a>
              )}
            </div>
          </div>
        </div>

        {/* User's Experiences */}
        {experiences.length > 0 && (
          <div className="sticker-card p-6">
            <h2 className="text-2xl font-bold text-black mb-6">
              📝 {isOwnProfile ? 'My' : `${user.name.split(' ')[0]}'s`} Experiences ({experiences.length})
            </h2>
            <div className="space-y-4">
              {experiences.map((exp: any) => (
                <Link
                  key={exp.id}
                  href={`/experience/${exp.id}`}
                  className="block bg-white rounded-xl border-3 border-black p-5 hover:shadow-sticker-hover hover:-translate-y-1 transition-all duration-200"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-xl font-bold text-black mb-2">
                        {exp.companies?.name} - {exp.role}
                      </h3>
                      <div className="flex flex-wrap gap-2 text-sm">
                        <span className="px-3 py-1 bg-mint-100 text-black rounded-lg border-2 border-black font-bold">
                          {exp.experience_type}
                        </span>
                        <span className={`px-3 py-1 rounded-lg border-2 border-black font-bold ${
                          exp.result === 'Selected' ? 'bg-green-100 text-green-800' :
                          exp.result === 'Not Selected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {exp.result}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
