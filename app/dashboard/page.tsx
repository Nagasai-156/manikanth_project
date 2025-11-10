'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '../components/Navbar'
import { experienceAPI, utils } from '../lib/api'
import { User } from '../types/api'
import { BuildingOfficeIcon, BriefcaseIcon, UserGroupIcon } from '@heroicons/react/24/outline'

interface CompanyExperienceCount {
  companyId: string
  companyName: string
  companySlug: string
  companyLogo?: string
  companyTier: string
  companyCategory: string
  experienceCount: number
  internshipCount: number
  fullTimeCount: number
  selectedCount: number
}

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [companies, setCompanies] = useState<CompanyExperienceCount[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTier, setSelectedTier] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')

  useEffect(() => {
    if (!utils.isAuthenticated()) {
      router.push('/login')
      return
    }

    const userData = utils.getUser()
    setUser(userData)
  }, [router])

  useEffect(() => {
    if (user) {
      loadCompanyExperiences()
    }
  }, [user])

  const loadCompanyExperiences = async () => {
    try {
      setLoading(true)
      const response = await experienceAPI.getExperiences({ 
        limit: 1000,
        status: 'approved'
      })

      console.log('Dashboard - Total approved experiences:', response.data?.experiences?.length)

      if (response.success && response.data) {
        // Filter experiences by user's college (case-insensitive)
        let filteredExperiences = response.data.experiences
        
        if (user?.college) {
          const userCollege = user.college.toLowerCase().trim()
          console.log('Dashboard - User college:', userCollege)
          
          filteredExperiences = response.data.experiences.filter((exp: any) => {
            const expCollege = exp.users?.college?.toLowerCase().trim() || ''
            return expCollege === userCollege
          })
          
          console.log('Dashboard - Filtered experiences by college:', filteredExperiences.length)
        }
        
        const companyMap = new Map<string, CompanyExperienceCount>()
        
        filteredExperiences.forEach((exp: any) => {
          if (!exp.companies) {
            console.log('Dashboard - Experience without company:', exp.id)
            return
          }
          
          const companyId = exp.companies.id
          if (!companyMap.has(companyId)) {
            companyMap.set(companyId, {
              companyId,
              companyName: exp.companies.name,
              companySlug: exp.companies.slug,
              companyLogo: exp.companies.logo_url,
              companyTier: exp.companies.tier || 'Other',
              companyCategory: exp.companies.category || 'Other',
              experienceCount: 0,
              internshipCount: 0,
              fullTimeCount: 0,
              selectedCount: 0
            })
          }
          
          const company = companyMap.get(companyId)!
          company.experienceCount++
          
          if (exp.experience_type === 'Internship') {
            company.internshipCount++
          } else if (exp.experience_type === 'Full-Time') {
            company.fullTimeCount++
          }
          
          if (exp.result === 'Selected') {
            company.selectedCount++
          }
        })
        
        const companiesArray = Array.from(companyMap.values())
          .sort((a, b) => b.experienceCount - a.experienceCount)
        
        console.log('Dashboard - Companies found:', companiesArray.length)
        setCompanies(companiesArray)
      }
    } catch (error) {
      console.error('Error loading experiences:', error)
    } finally {
      setLoading(false)
    }
  }

  const getFilteredCompanies = () => {
    return companies.filter(company => {
      const matchesSearch = company.companyName.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesTier = selectedTier === 'all' || company.companyTier === selectedTier
      const matchesType = selectedType === 'all' || company.companyCategory === selectedType
      return matchesSearch && matchesTier && matchesType
    })
  }

  const getTierBadge = (tier: string) => {
    const badges: any = {
      'FAANG': { bg: 'bg-peach-400', text: 'text-black', label: 'FAANG' },
      'Tier 1': { bg: 'bg-mint-400', text: 'text-black', label: 'Tier 1' },
      'Tier 2': { bg: 'bg-ocean-300', text: 'text-black', label: 'Tier 2' },
      'Unicorn': { bg: 'bg-peach-300', text: 'text-black', label: 'Unicorn' }
    }
    return badges[tier] || { bg: 'bg-gray-200', text: 'text-black', label: tier }
  }

  const filteredCompanies = getFilteredCompanies()

  return (
    <div className="min-h-screen bg-gradient-to-br from-mint-50 via-white to-peach-50">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-4xl font-bold text-black mb-2">
                Welcome back, {user?.name}! 👋
              </h1>
              <p className="text-lg text-gray-700">
                Explore interview experiences from your college
              </p>
            </div>
            <button
              onClick={() => loadCompanyExperiences()}
              className="sticker-button"
              disabled={loading}
            >
              {loading ? '🔄 Loading...' : '🔄 Refresh'}
            </button>
          </div>
          {user?.college && (
            <div className="mt-4 inline-flex items-center px-4 py-2 bg-mint-100 border-3 border-black rounded-xl shadow-sticker">
              <BuildingOfficeIcon className="w-5 h-5 mr-2 text-black" />
              <span className="text-black font-semibold">{user.college}</span>
            </div>
          )}
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="sticker-card bg-ocean-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-black mb-1 font-medium">Total Companies</p>
                <p className="text-4xl font-bold text-black">{companies.length}</p>
              </div>
              <div className="w-14 h-14 bg-ocean-400 rounded-xl flex items-center justify-center border-3 border-black">
                <BuildingOfficeIcon className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>
          
          <div className="sticker-card bg-mint-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-black mb-1 font-medium">Total Experiences</p>
                <p className="text-4xl font-bold text-black">
                  {companies.reduce((sum, c) => sum + c.experienceCount, 0)}
                </p>
              </div>
              <div className="w-14 h-14 bg-mint-400 rounded-xl flex items-center justify-center border-3 border-black">
                <BriefcaseIcon className="w-7 h-7 text-black" />
              </div>
            </div>
          </div>
          
          <div className="sticker-card bg-peach-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-black mb-1 font-medium">Success Stories</p>
                <p className="text-4xl font-bold text-black">
                  {companies.reduce((sum, c) => sum + c.selectedCount, 0)}
                </p>
              </div>
              <div className="w-14 h-14 bg-peach-400 rounded-xl flex items-center justify-center border-3 border-black">
                <UserGroupIcon className="w-7 h-7 text-black" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="sticker-card p-6 mb-8">
          <h2 className="text-xl font-bold text-black mb-4">🔍 Find Companies</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-black mb-2">Search Companies</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by company name..."
                className="w-full px-4 py-2 border-3 border-black rounded-lg focus:ring-4 focus:ring-ocean-200 focus:outline-none font-medium"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-black mb-2">Company Tier</label>
              <select
                value={selectedTier}
                onChange={(e) => setSelectedTier(e.target.value)}
                className="w-full px-4 py-2 border-3 border-black rounded-lg focus:ring-4 focus:ring-ocean-200 focus:outline-none font-medium"
              >
                <option value="all">All Tiers</option>
                <option value="FAANG">FAANG</option>
                <option value="Tier 1">Tier 1</option>
                <option value="Tier 2">Tier 2</option>
                <option value="Unicorn">Unicorn</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-black mb-2">Company Type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-4 py-2 border-3 border-black rounded-lg focus:ring-4 focus:ring-ocean-200 focus:outline-none font-medium"
              >
                <option value="all">All Types</option>
                <option value="Product">Product</option>
                <option value="Service">Service</option>
                <option value="Consulting">Consulting</option>
                <option value="Fintech">Fintech</option>
              </select>
            </div>
          </div>
          
          {(searchQuery || selectedTier !== 'all' || selectedType !== 'all') && (
            <div className="mt-4 flex items-center justify-between pt-4 border-t-2 border-gray-200">
              <p className="text-sm text-black font-medium">
                Showing <span className="font-bold">{filteredCompanies.length}</span> of {companies.length} companies
              </p>
              <button
                onClick={() => {
                  setSearchQuery('')
                  setSelectedTier('all')
                  setSelectedType('all')
                }}
                className="text-sm text-ocean-600 hover:underline font-semibold"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>

        {/* Company Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="sticker-card p-6 animate-pulse">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-16 h-16 bg-gray-300 rounded-xl"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-300 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredCompanies.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold text-black mb-2">No companies found</h3>
            <p className="text-gray-700">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCompanies.map((company) => {
              const tierBadge = getTierBadge(company.companyTier)
              return (
                <Link
                  key={company.companyId}
                  href={`/company/${company.companySlug}`}
                  className="sticker-card p-6 hover:shadow-sticker-hover hover:-translate-y-1 transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-14 h-14 bg-gradient-to-br from-ocean-400 to-mint-400 rounded-xl flex items-center justify-center text-white text-2xl font-bold border-3 border-black">
                        {company.companyName.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-black break-words">
                          {company.companyName}
                        </h3>
                        <span className={`inline-block px-2 py-1 rounded-lg text-xs font-bold border-2 border-black ${tierBadge.bg} ${tierBadge.text}`}>
                          {tierBadge.label}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2 border-t-2 border-gray-200">
                      <span className="text-sm text-black font-medium">Total Experiences</span>
                      <span className="text-2xl font-bold text-ocean-600">{company.experienceCount}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-mint-100 rounded-lg p-3 border-2 border-black">
                        <p className="text-xs text-black font-medium mb-1">Internships</p>
                        <p className="text-xl font-bold text-black">{company.internshipCount}</p>
                      </div>
                      <div className="bg-peach-100 rounded-lg p-3 border-2 border-black">
                        <p className="text-xs text-black font-medium mb-1">Full-Time</p>
                        <p className="text-xl font-bold text-black">{company.fullTimeCount}</p>
                      </div>
                    </div>
                    
                    <div className="bg-ocean-100 rounded-lg p-3 border-2 border-black">
                      <p className="text-xs text-black font-medium mb-1">Success Rate</p>
                      <p className="text-xl font-bold text-black">
                        {company.experienceCount > 0 
                          ? Math.round((company.selectedCount / company.experienceCount) * 100)
                          : 0}%
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t-2 border-gray-200">
                    <span className="text-ocean-600 font-bold text-sm">
                      View All Experiences →
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
