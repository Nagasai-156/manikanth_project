'use client'

import Link from 'next/link'
import { CalendarIcon, MapPinIcon, EyeIcon, HeartIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline'
import { Experience } from '../types/api'

interface ExperienceCardProps {
  experience: Experience
}

export default function ExperienceCard({ experience }: ExperienceCardProps) {
  const resultColors = {
    'Selected': 'bg-green-100 text-green-800 border-green-300',
    'Not Selected': 'bg-red-100 text-red-800 border-red-300',
    'Pending': 'bg-yellow-100 text-yellow-800 border-yellow-300'
  }

  const typeColors = {
    'Internship': 'bg-blue-100 text-blue-800',
    'Full-Time': 'bg-purple-100 text-purple-800',
    'Apprenticeship': 'bg-orange-100 text-orange-800'
  }

  return (
    <Link href={`/experience/${experience.id}`}>
      <div className="sticker-card p-6 hover:scale-[1.02] transition-transform cursor-pointer">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {experience.companies?.logo_url && (
                <img 
                  src={experience.companies.logo_url} 
                  alt={experience.companies.name}
                  className="w-10 h-10 rounded-lg object-cover border-2 border-black"
                />
              )}
              <div>
                <h3 className="text-2xl font-bold text-black">
                  {experience.role}
                </h3>
                <p className="text-lg text-gray-700 font-semibold">
                  {experience.companies?.name || 'Company'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-2 items-end">
            <span className={`px-3 py-1 rounded-full border-2 border-black text-sm font-bold ${resultColors[experience.result]}`}>
              {experience.result === 'Selected' ? '✅' : experience.result === 'Not Selected' ? '❌' : '⏳'} {experience.result}
            </span>
            <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${typeColors[experience.experience_type]}`}>
              {experience.experience_type}
            </span>
          </div>
        </div>

        {/* Author Info */}
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-4 pb-4 border-b-2 border-gray-200">
          <div className="flex items-center gap-1">
            <span className="font-semibold">{experience.users?.name || 'Anonymous'}</span>
          </div>
          {experience.users?.course && (
            <span>• {experience.users.course}</span>
          )}
          {experience.users?.year && (
            <span>• {experience.users.year}</span>
          )}
          {experience.interview_date && (
            <div className="flex items-center gap-1">
              <CalendarIcon className="h-4 w-4" />
              <span>{new Date(experience.interview_date).toLocaleDateString()}</span>
            </div>
          )}
          {experience.location && (
            <div className="flex items-center gap-1">
              <MapPinIcon className="h-4 w-4" />
              <span>{experience.location}</span>
            </div>
          )}
        </div>

        {/* Preview Content */}
        <div className="space-y-3 mb-4">
          {experience.overall_experience && (
            <div>
              <span className="font-bold text-black">📋 Process: </span>
              <span className="text-gray-700 line-clamp-2">
                {experience.overall_experience.substring(0, 150)}
                {experience.overall_experience.length > 150 ? '...' : ''}
              </span>
            </div>
          )}
          
          {experience.technical_rounds && (
            <div>
              <span className="font-bold text-black">💻 Technical: </span>
              <span className="text-gray-700 line-clamp-2">
                {experience.technical_rounds.substring(0, 150)}
                {experience.technical_rounds.length > 150 ? '...' : ''}
              </span>
            </div>
          )}
        </div>

        {/* Footer Stats */}
        <div className="flex items-center justify-between pt-4 border-t-2 border-gray-200">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <EyeIcon className="h-4 w-4" />
              <span>{experience.views_count || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <HeartIcon className="h-4 w-4" />
              <span>{experience.likes_count || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <ChatBubbleLeftIcon className="h-4 w-4" />
              <span>{experience.comments_count || 0}</span>
            </div>
          </div>
          
          <span className="text-xs text-gray-500">
            {new Date(experience.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>
    </Link>
  )
}
