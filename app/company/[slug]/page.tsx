'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '../../components/Navbar'
import ExperienceCard from '../../components/ExperienceCard'
import { companyAPI, experienceAPI, utils } from '../../lib/api'
import { Company, Experience, User } from '../../types/api'

export default function CompanyPage() {
  const params = useParams()
  const router = useRouter()
  const companySlug = params.slug as string
  
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [company, setCompany] = useState<Company | null>(null)
  const [experiences, setExperiences] = useState<Experience[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const userData = utils.getUser()
    setUser(userData)
  }, [])

  useEffect(() => {
    if (user) {
      loadCompanyData()
    }
  }, [user, companySlug])

  const loadCompanyData = async () => {
    try {
      setLoading(true)
      
      // Get ALL experiences (backend filtering by company slug doesn't work properly)
      const expResponse = await experienceAPI.getExperiences({
        status: 'approved',
        limit: 1000
      })
      
      if (expResponse.success && expResponse.data && expResponse.data.experiences.length > 0) {
        // Filter by company slug (case-insensitive) AND user's college (case-insensitive)
        const targetSlug = companySlug.toLowerCase().trim()
        const userCollege = user?.college?.toLowerCase().trim() || ''
        
        console.log('Company Page - Target slug:', targetSlug)
        console.log('Company Page - User college:', userCollege)
        console.log('Company Page - Total experiences:', expResponse.data.experiences.length)
        
        const filteredExperiences = expResponse.data.experiences.filter((exp: any) => {
          const expSlug = exp.companies?.slug?.toLowerCase().trim() || ''
          const expCollege = exp.users?.college?.toLowerCase().trim() || ''
          
          console.log(`Checking exp ${exp.id}: slug="${expSlug}" college="${expCollege}"`)
          
          // Must match BOTH company slug AND user's college
          return expSlug === targetSlug && expCollege === userCollege
        })
        
        console.log('Company Page - Filtered experiences:', filteredExperiences.length)
        setExperiences(filteredExperiences)
        
        // Get company info from the first matching experience
        if (filteredExperiences.length > 0) {
          const firstExp = filteredExperiences[0]
          if (firstExp.companies) {
            setCompany({
              id: firstExp.companies.id,
              name: firstExp.companies.name,
              slug: firstExp.companies.slug,
              tier: firstExp.companies.tier || 'Other',
              category: firstExp.companies.category || 'Other',
              logo_url: firstExp.companies.logo_url,
              description: '',
              experienceCount: filteredExperiences.length
            } as Company)
          }
        } else {
          // No experiences found for this company from user's college
          // Try to get company info anyway
          const companyResponse = await companyAPI.getCompanyBySlug(companySlug)
          if (companyResponse.success && companyResponse.data) {
            setCompany(companyResponse.data.company)
          }
        }
      } else {
        // Try to get company info even if no experiences
        const companyResponse = await companyAPI.getCompanyBySlug(companySlug)
        if (companyResponse.success && companyResponse.data) {
          setCompany(companyResponse.data.company)
        }
      }
    } catch (error) {
      console.error('Error loading company:', error)
    } finally {
      setLoading(false)
    }
  }

  const filters = [
    { id: 'all', label: 'All', emoji: '📋' },
    { id: 'selected', label: 'Selected', emoji: '✅' },
    { id: 'not-selected', label: 'Not Selected', emoji: '❌' },
    { id: 'intern', label: 'Internships', emoji: '🎓' },
    { id: 'fulltime', label: 'Full-time', emoji: '💼' }
  ]

  const getFilteredExperiences = () => {
    return experiences.filter(exp => {
      if (selectedFilter === 'all') return true
      if (selectedFilter === 'selected') return exp.result === 'Selected'
      if (selectedFilter === 'not-selected') return exp.result === 'Not Selected'
      if (selectedFilter === 'intern') return exp.experience_type === 'Internship'
      if (selectedFilter === 'fulltime') return exp.experience_type === 'Full-Time'
      return true
    })
  }

  const filteredExperiences = getFilteredExperiences()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-mint-50 via-white to-peach-50">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="flex items-center space-x-4 mb-8">
              <div className="w-20 h-20 bg-gray-300 rounded-xl border-3 border-black"></div>
              <div className="flex-1">
                <div className="h-8 bg-gray-300 rounded-lg mb-2 border-2 border-black"></div>
                <div className="h-4 bg-gray-200 rounded-lg border-2 border-black"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-mint-50 via-white to-peach-50">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 py-16 text-center">
          <div className="sticker-card p-12">
            <div className="text-6xl mb-4">🏢</div>
            <h2 className="text-3xl font-bold text-black mb-2">Company not found</h2>
            <p className="text-gray-700 mb-6">
              The company you're looking for doesn't exist or has no experiences from your college.
            </p>
            <Link href="/dashboard" className="sticker-button">
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-mint-50 via-white to-peach-50">
      <Navbar />
      
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Company Header */}
        <div className="sticker-card p-8 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-gradient-to-br from-ocean-400 to-mint-400 rounded-xl flex items-center justify-center text-white text-3xl font-bold border-3 border-black">
                {company.name.charAt(0)}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-black mb-2">{company.name}</h1>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-1 bg-ocean-100 text-black rounded-lg border-2 border-black text-sm font-bold">
                    {company.tier}
                  </span>
                  <span className="px-3 py-1 bg-mint-100 text-black rounded-lg border-2 border-black text-sm font-bold">
                    {company.category}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {company.description && (
            <p className="text-gray-700 mb-4">{company.description}</p>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-ocean-100 rounded-lg p-4 border-2 border-black">
              <p className="text-xs text-black font-medium mb-1">Total</p>
              <p className="text-2xl font-bold text-black">{experiences.length}</p>
            </div>
            <div className="bg-mint-100 rounded-lg p-4 border-2 border-black">
              <p className="text-xs text-black font-medium mb-1">Selected</p>
              <p className="text-2xl font-bold text-black">
                {experiences.filter(e => e.result === 'Selected').length}
              </p>
            </div>
            <div className="bg-peach-100 rounded-lg p-4 border-2 border-black">
              <p className="text-xs text-black font-medium mb-1">Internships</p>
              <p className="text-2xl font-bold text-black">
                {experiences.filter(e => e.experience_type === 'Internship').length}
              </p>
            </div>
            <div className="bg-ocean-100 rounded-lg p-4 border-2 border-black">
              <p className="text-xs text-black font-medium mb-1">Full-Time</p>
              <p className="text-2xl font-bold text-black">
                {experiences.filter(e => e.experience_type === 'Full-Time').length}
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="sticker-card p-6 mb-8">
          <h2 className="text-lg font-bold text-black mb-4">Filter Experiences</h2>
          <div className="flex flex-wrap gap-3">
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setSelectedFilter(filter.id)}
                className={`px-4 py-2 rounded-xl border-3 border-black font-bold transition-all duration-200 ${
                  selectedFilter === filter.id
                    ? 'bg-ocean-400 text-white shadow-sticker'
                    : 'bg-white text-black hover:bg-mint-100 shadow-sticker hover:shadow-sticker-hover hover:-translate-y-1'
                }`}
              >
                {filter.emoji} {filter.label}
              </button>
            ))}
          </div>
          <p className="text-sm text-gray-700 mt-4 font-medium">
            Showing <span className="font-bold">{filteredExperiences.length}</span> of {experiences.length} experiences
          </p>
        </div>

        {/* Experiences */}
        {filteredExperiences.length === 0 ? (
          <div className="sticker-card p-12 text-center">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-2xl font-bold text-black mb-2">No experiences found</h3>
            <p className="text-gray-700">
              {selectedFilter !== 'all' 
                ? 'Try changing your filter to see more experiences.'
                : 'Be the first to share your experience with this company!'}
            </p>
            {selectedFilter !== 'all' && (
              <button
                onClick={() => setSelectedFilter('all')}
                className="sticker-button mt-4"
              >
                Show All Experiences
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredExperiences.map((experience) => (
              <ExperienceCard key={experience.id} experience={experience} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
