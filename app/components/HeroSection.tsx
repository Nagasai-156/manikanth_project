'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRightIcon, SparklesIcon } from '@heroicons/react/24/outline'
import { utils } from '../lib/api'

export default function HeroSection() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    setIsLoggedIn(utils.isAuthenticated())
  }, [])

  const handleBrowseClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (isLoggedIn) {
      router.push('/dashboard')
    } else {
      router.push('/login')
    }
  }

  return (
    <section className="relative overflow-hidden py-20 px-4 bg-gradient-to-br from-mint-50 via-white to-peach-50">
      {/* Background Shapes */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-10 w-20 h-20 bg-mint-300 rounded-full border-4 border-black animate-float"></div>
        <div className="absolute top-32 right-20 w-16 h-16 bg-peach-300 rounded-xl border-4 border-black animate-bounce-gentle"></div>
        <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-ocean-300 rounded-full border-4 border-black animate-float"></div>
        <div className="absolute top-1/2 right-10 w-24 h-24 bg-mint-200 rounded-2xl border-4 border-black animate-bounce-gentle"></div>
        <div className="absolute bottom-32 right-1/3 w-14 h-14 bg-peach-200 rounded-full border-4 border-black animate-float"></div>
      </div>

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-ocean-100 border-3 border-black rounded-full mb-6 animate-bounce-gentle">
          <SparklesIcon className="w-5 h-5 text-ocean-600" />
          <span className="text-sm font-bold text-ocean-800">Your Success Story Starts Here</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold text-black mb-6 leading-tight">
          Share Your{' '}
          <span className="text-ocean-600">Interview</span>{' '}
          Experience.
        </h1>
        <h2 className="text-3xl md:text-5xl font-bold text-black mb-8">
          Learn From{' '}
          <span className="text-mint-600">Others.</span>
        </h2>
        
        <p className="text-xl text-gray-700 mb-12 max-w-2xl mx-auto font-medium">
          Connect with fellow students, share your interview journeys, and help each other succeed in placements and internships.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          {!isLoggedIn ? (
            <>
              <Link 
                href="/register" 
                className="px-8 py-4 bg-gradient-to-r from-mint-400 to-ocean-400 text-white rounded-xl border-4 border-black font-bold text-lg hover:shadow-sticker-hover hover:-translate-y-1 transition-all flex items-center gap-2"
              >
                <span>Get Started Free</span>
                <ArrowRightIcon className="h-5 w-5" />
              </Link>
              <button
                onClick={handleBrowseClick}
                className="px-8 py-4 bg-white text-black rounded-xl border-4 border-black font-bold text-lg hover:shadow-sticker-hover hover:-translate-y-1 transition-all"
              >
                Browse Experiences
              </button>
            </>
          ) : (
            <>
              <Link 
                href="/dashboard" 
                className="px-8 py-4 bg-gradient-to-r from-mint-400 to-ocean-400 text-white rounded-xl border-4 border-black font-bold text-lg hover:shadow-sticker-hover hover:-translate-y-1 transition-all flex items-center gap-2"
              >
                <span>View Dashboard</span>
                <ArrowRightIcon className="h-5 w-5" />
              </Link>
              <Link
                href="/post-experience"
                className="px-8 py-4 bg-white text-black rounded-xl border-4 border-black font-bold text-lg hover:shadow-sticker-hover hover:-translate-y-1 transition-all"
              >
                Share Your Experience
              </Link>
            </>
          )}
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="sticker-card p-6">
            <div className="text-3xl font-bold text-ocean-600 mb-2">500+</div>
            <div className="text-gray-700">Experiences Shared</div>
          </div>
          <div className="sticker-card p-6">
            <div className="text-3xl font-bold text-mint-600 mb-2">50+</div>
            <div className="text-gray-700">Companies Covered</div>
          </div>
          <div className="sticker-card p-6">
            <div className="text-3xl font-bold text-peach-600 mb-2">1000+</div>
            <div className="text-gray-700">Students Helped</div>
          </div>
        </div>
      </div>
    </section>
  )
}