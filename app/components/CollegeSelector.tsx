'use client'

import { useState, useEffect } from 'react'
import { utils } from '../lib/api'

const colleges = [
  'Indian Institute of Technology (IIT) Delhi',
  'Indian Institute of Technology (IIT) Bombay',
  'Indian Institute of Technology (IIT) Madras',
  'Indian Institute of Technology (IIT) Kanpur',
  'Indian Institute of Technology (IIT) Kharagpur',
  'National Institute of Technology (NIT) Trichy',
  'National Institute of Technology (NIT) Warangal',
  'Birla Institute of Technology and Science (BITS) Pilani',
  'Delhi Technological University (DTU)',
  'Jadavpur University',
  'Anna University',
  'Vellore Institute of Technology (VIT)',
  'SRM Institute of Science and Technology',
  'Manipal Institute of Technology',
  'PES University',
  'RV College of Engineering',
  'BMS College of Engineering',
  'Sasi Institute of Technology & Engineering',
  'Lovely Professional University (LPU)',
  'Chandigarh University'
]

interface CollegeSelectorProps {
  onCollegeSelect: (college: string) => void
  selectedCollege?: string
}

export default function CollegeSelector({ onCollegeSelect, selectedCollege }: CollegeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentCollege, setCurrentCollege] = useState(selectedCollege || '')

  useEffect(() => {
    // If user is logged in, use their college
    const user = utils.getUser()
    if (user?.college) {
      setCurrentCollege(user.college)
      onCollegeSelect(user.college)
    }
  }, [onCollegeSelect])

  const filteredColleges = colleges.filter(college =>
    college.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCollegeSelect = (college: string) => {
    setCurrentCollege(college)
    onCollegeSelect(college)
    setIsOpen(false)
    setSearchTerm('')
  }

  // If user is logged in, don't show selector
  if (utils.isAuthenticated()) {
    return null
  }

  return (
    <div className="relative mb-6">
      <div className="sticker-card p-4">
        <h3 className="font-semibold text-black mb-3">🏫 Select Your College</h3>
        <p className="text-sm text-gray-600 mb-4">
          Choose your college to see relevant interview experiences
        </p>
        
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full sticker-input text-left flex items-center justify-between"
          >
            <span className={currentCollege ? 'text-black' : 'text-gray-500'}>
              {currentCollege || 'Select your college...'}
            </span>
            <svg
              className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border-4 border-black rounded-xl shadow-sticker z-50 max-h-64 overflow-hidden">
              <div className="p-3 border-b-2 border-gray-200">
                <input
                  type="text"
                  placeholder="Search colleges..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-ocean-200"
                />
              </div>
              <div className="max-h-48 overflow-y-auto">
                {filteredColleges.map((college) => (
                  <button
                    key={college}
                    onClick={() => handleCollegeSelect(college)}
                    className="w-full text-left px-4 py-3 hover:bg-mint-100 transition-colors border-b border-gray-100 last:border-b-0"
                  >
                    <span className="text-black">{college}</span>
                  </button>
                ))}
                {filteredColleges.length === 0 && (
                  <div className="px-4 py-3 text-gray-500 text-center">
                    No colleges found
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {currentCollege && (
          <div className="mt-3 text-sm text-mint-700">
            ✅ Showing experiences from {currentCollege}
          </div>
        )}
      </div>
    </div>
  )
}