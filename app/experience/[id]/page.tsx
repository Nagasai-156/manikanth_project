'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '../../components/Navbar'
import CommentSection from '../../components/CommentSection'
import { experienceAPI, utils } from '../../lib/api'
import { Experience } from '../../types/api'
import { 
  CalendarIcon, 
  MapPinIcon, 
  EyeIcon, 
  HeartIcon, 
  BookmarkIcon,
  ShareIcon,
  ChatBubbleLeftIcon 
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolid, BookmarkIcon as BookmarkSolid } from '@heroicons/react/24/solid'

export default function ExperienceView() {
  const params = useParams()
  const router = useRouter()
  const experienceId = params.id as string
  
  const [experience, setExperience] = useState<Experience | null>(null)
  const [loading, setLoading] = useState(true)
  const [isLiked, setIsLiked] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [user, setUser] = useState(utils.getUser())

  useEffect(() => {
    loadExperience()
  }, [experienceId])

  const loadExperience = async () => {
    try {
      const response = await experienceAPI.getExperience(experienceId)
      
      if (response.success && response.data && response.data.experience) {
        setExperience(response.data.experience)
      } else {
        console.error('Experience load failed:', response)
        alert(response.message || 'Experience not found')
        router.push('/dashboard')
      }
    } catch (error: any) {
      console.error('Error loading experience:', error)
      alert(error?.message || 'Failed to load experience')
    } finally {
      setLoading(false)
    }
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    alert('✅ Link copied to clipboard!')
  }

  const handleChat = () => {
    if (!user) {
      alert('Please login to chat')
      router.push('/login')
      return
    }
    if (experience?.users?.id) {
      router.push(`/chat/${experience.users.id}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading experience...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!experience) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 py-12">
          <div className="text-center">
            <p className="text-2xl text-gray-600">Experience not found</p>
          </div>
        </div>
      </div>
    )
  }

  const resultColors = {
    'Selected': 'bg-green-100 text-green-800 border-green-300',
    'Not Selected': 'bg-red-100 text-red-800 border-red-300',
    'Pending': 'bg-yellow-100 text-yellow-800 border-yellow-300'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navbar />
      
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-lg border-4 border-black p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start gap-4 flex-1">
              {experience.companies?.logo_url && (
                <img 
                  src={experience.companies.logo_url} 
                  alt={experience.companies.name}
                  className="w-20 h-20 rounded-xl object-cover border-3 border-black"
                />
              )}
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                  {experience.role}
                </h1>
                <p className="text-2xl text-gray-700 font-semibold mb-3">
                  {experience.companies?.name}
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => router.push(`/user/${experience.users?.id}`)}
                    className="flex items-center gap-2 text-ocean-600 hover:text-ocean-700 font-semibold hover:underline transition-colors"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-ocean-400 to-mint-400 rounded-full border-2 border-black flex items-center justify-center">
                      <span className="text-white font-bold text-xs">
                        {experience.users?.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    {experience.users?.name}
                  </button>
                  {experience.users?.course && <span className="text-gray-600">• {experience.users.course}</span>}
                  {experience.users?.year && <span className="text-gray-600">• {experience.users.year}</span>}
                </div>
              </div>
            </div>
            
            <span className={`px-4 py-2 rounded-full border-3 border-black text-lg font-bold ${resultColors[experience.result]}`}>
              {experience.result === 'Selected' ? '✅' : experience.result === 'Not Selected' ? '❌' : '⏳'} {experience.result}
            </span>
          </div>

          {/* Meta Info */}
          <div className="flex items-center gap-6 text-gray-600 mb-6 pb-6 border-b-2 border-gray-200">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Type:</span>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-sm font-semibold">
                {experience.experience_type}
              </span>
            </div>
            {experience.interview_date && (
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                <span>{new Date(experience.interview_date).toLocaleDateString()}</span>
              </div>
            )}
            {experience.location && (
              <div className="flex items-center gap-2">
                <MapPinIcon className="h-5 w-5" />
                <span>{experience.location}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <EyeIcon className="h-5 w-5" />
              <span>{experience.views_count || 0} views</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg border-2 border-black font-semibold hover:bg-blue-600 transition-colors"
            >
              <ShareIcon className="h-5 w-5" />
              Share
            </button>
            
            {user && experience.users?.id !== user.id && (
              <button
                onClick={handleChat}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg border-2 border-black font-semibold hover:bg-green-600 transition-colors"
              >
                <ChatBubbleLeftIcon className="h-5 w-5" />
                Chat with {experience.users?.name}
              </button>
            )}
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-6">
          {/* Overall Experience */}
          {experience.overall_experience && (
            <div className="bg-white rounded-2xl shadow-lg border-4 border-black p-8">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">📋</span>
                <h2 className="text-2xl font-bold text-gray-900">Overall Interview Process</h2>
              </div>
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap text-lg leading-relaxed">
                  {experience.overall_experience}
                </p>
              </div>
            </div>
          )}

          {/* Technical Rounds */}
          {experience.technical_rounds && (
            <div className="bg-white rounded-2xl shadow-lg border-4 border-black p-8">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">💻</span>
                <h2 className="text-2xl font-bold text-gray-900">Technical / Coding Rounds</h2>
              </div>
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap text-lg leading-relaxed">
                  {experience.technical_rounds}
                </p>
              </div>
            </div>
          )}

          {/* HR Rounds */}
          {experience.hr_rounds && (
            <div className="bg-white rounded-2xl shadow-lg border-4 border-black p-8">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">👥</span>
                <h2 className="text-2xl font-bold text-gray-900">HR / Behavioral Rounds</h2>
              </div>
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap text-lg leading-relaxed">
                  {experience.hr_rounds}
                </p>
              </div>
            </div>
          )}

          {/* Tips & Advice */}
          {experience.tips_and_advice && (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl shadow-lg border-4 border-black p-8">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">💡</span>
                <h2 className="text-2xl font-bold text-gray-900">Tips & Advice</h2>
              </div>
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap text-lg leading-relaxed">
                  {experience.tips_and_advice}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Comments Section */}
        <div className="mt-8">
          <CommentSection experienceId={experienceId} />
        </div>
      </div>
    </div>
  )
}
