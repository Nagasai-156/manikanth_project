'use client'

import { useState } from 'react'
import Navbar from '../components/Navbar'
import CompanyCard from '../components/CompanyCard'
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline'

const mockUser = {
  name: 'Rohit Kumar',
  branch: 'CSE',
  year: '3rd Year'
}

const allCompanies = [
  { name: 'TCS', slug: 'tcs', experienceCount: 52, lastUpdated: '2 days ago', logo: 'T', category: 'Service', tier: 'Tier 1' },
  { name: 'Infosys', slug: 'infosys', experienceCount: 45, lastUpdated: '1 day ago', logo: 'I', category: 'Service', tier: 'Tier 1' },
  { name: 'Amazon', slug: 'amazon', experienceCount: 28, lastUpdated: '3 hours ago', logo: 'A', category: 'Product', tier: 'FAANG' },
  { name: 'Microsoft', slug: 'microsoft', experienceCount: 15, lastUpdated: '1 week ago', logo: 'M', category: 'Product', tier: 'FAANG' },
  { name: 'Google', slug: 'google', experienceCount: 12, lastUpdated: '2 days ago', logo: 'G', category: 'Product', tier: 'FAANG' },
  { name: 'Wipro', slug: 'wipro', experienceCount: 38, lastUpdated: '5 days ago', logo: 'W', category: 'Service', tier: 'Tier 1' },
  { name: 'Capgemini', slug: 'capgemini', experienceCount: 31, lastUpdated: '1 day ago', logo: 'C', category: 'Service', tier: 'Tier 1' },
  { name: 'Accenture', slug: 'accenture', experienceCount: 41, lastUpdated: '3 days ago', logo: 'A', category: 'Consulting', tier: 'Tier 1' },
  { name: 'IBM', slug: 'ibm', experienceCount: 22, lastUpdated: '1 week ago', logo: 'I', category: 'Service', tier: 'Tier 1' },
  { name: 'Oracle', slug: 'oracle', experienceCount: 18, lastUpdated: '4 days ago', logo: 'O', category: 'Product', tier: 'Tier 1' },
  { name: 'Cognizant', slug: 'cognizant', experienceCount: 35, lastUpdated: '2 days ago', logo: 'C', category: 'Service', tier: 'Tier 1' },
  { name: 'HCL', slug: 'hcl', experienceCount: 29, lastUpdated: '1 week ago', logo: 'H', category: 'Service', tier: 'Tier 2' },
  { name: 'Tech Mahindra', slug: 'tech-mahindra', experienceCount: 24, lastUpdated: '3 days ago', logo: 'T', category: 'Service', tier: 'Tier 2' },
  { name: 'L&T Infotech', slug: 'lti', experienceCount: 19, lastUpdated: '5 days ago', logo: 'L', category: 'Service', tier: 'Tier 2' },
  { name: 'Mindtree', slug: 'mindtree', experienceCount: 16, lastUpdated: '1 week ago', logo: 'M', category: 'Service', tier: 'Tier 2' },
  { name: 'Mphasis', slug: 'mphasis', experienceCount: 13, lastUpdated: '6 days ago', logo: 'M', category: 'Service', tier: 'Tier 2' },
  { name: 'Flipkart', slug: 'flipkart', experienceCount: 21, lastUpdated: '2 days ago', logo: 'F', category: 'Product', tier: 'Unicorn' },
  { name: 'Paytm', slug: 'paytm', experienceCount: 17, lastUpdated: '4 days ago', logo: 'P', category: 'Fintech', tier: 'Unicorn' },
  { name: 'Zomato', slug: 'zomato', experienceCount: 14, lastUpdated: '3 days ago', logo: 'Z', category: 'Product', tier: 'Unicorn' },
  { name: 'Swiggy', slug: 'swiggy', experienceCount: 12, lastUpdated: '5 days ago', logo: 'S', category: 'Product', tier: 'Unicorn' }
]

export default function CompaniesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedTier, setSelectedTier] = useState('all')
  const [sortBy, setSortBy] = useState('experiences')

  const categories = [
    { id: 'all', label: 'All Categories' },
    { id: 'Product', label: 'Product' },
    { id: 'Service', label: 'Service' },
    { id: 'Consulting', label: 'Consulting' },
    { id: 'Fintech', label: 'Fintech' }
  ]

  const tiers = [
    { id: 'all', label: 'All Tiers' },
    { id: 'FAANG', label: 'FAANG' },
    { id: 'Tier 1', label: 'Tier 1' },
    { id: 'Tier 2', label: 'Tier 2' },
    { id: 'Unicorn', label: 'Unicorn' }
  ]

  const getFilteredCompanies = () => {
    let filtered = allCompanies

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(company =>
        company.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(company => company.category === selectedCategory)
    }

    // Tier filter
    if (selectedTier !== 'all') {
      filtered = filtered.filter(company => company.tier === selectedTier)
    }

    // Sort
    if (sortBy === 'experiences') {
      filtered.sort((a, b) => b.experienceCount - a.experienceCount)
    } else if (sortBy === 'name') {
      filtered.sort((a, b) => a.name.localeCompare(b.name))
    } else if (sortBy === 'recent') {
      // Simple recent sort (in real app, would use actual dates)
      filtered.sort((a, b) => {
        const aRecent = a.lastUpdated.includes('hour') || a.lastUpdated.includes('day')
        const bRecent = b.lastUpdated.includes('hour') || b.lastUpdated.includes('day')
        return bRecent ? 1 : aRecent ? -1 : 0
      })
    }

    return filtered
  }

  const filteredCompanies = getFilteredCompanies()

  return (
    <div className="min-h-screen">
      <Navbar isLoggedIn={true} user={mockUser} />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-black mb-2">
            All Companies
          </h1>
          <p className="text-gray-600 text-lg">
            Explore interview experiences from {allCompanies.length}+ companies
          </p>
        </div>

        {/* Search and Filters */}
        <div className="sticker-card p-6 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search companies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="sticker-input pr-12"
                />
                <MagnifyingGlassIcon className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="sticker-input"
              >
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Tier Filter */}
            <div>
              <select
                value={selectedTier}
                onChange={(e) => setSelectedTier(e.target.value)}
                className="sticker-input"
              >
                {tiers.map(tier => (
                  <option key={tier.id} value={tier.id}>
                    {tier.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sort Options */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t-2 border-gray-100">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-semibold text-black">Sort by:</span>
              <div className="flex space-x-2">
                {[
                  { id: 'experiences', label: 'Most Experiences' },
                  { id: 'name', label: 'Name' },
                  { id: 'recent', label: 'Recently Updated' }
                ].map(option => (
                  <button
                    key={option.id}
                    onClick={() => setSortBy(option.id)}
                    className={`px-3 py-1 rounded-lg border-2 border-black text-sm font-medium transition-colors ${
                      sortBy === option.id
                        ? 'bg-ocean-400 text-white'
                        : 'bg-white text-black hover:bg-ocean-100'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="text-sm text-gray-600">
              {filteredCompanies.length} companies found
            </div>
          </div>
        </div>

        {/* Companies Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCompanies.map((company) => (
            <div key={company.slug} className="relative">
              <CompanyCard company={company} />
              {/* Company Tier Badge */}
              <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-bold border-2 border-black ${
                company.tier === 'FAANG' ? 'bg-peach-400 text-black' :
                company.tier === 'Tier 1' ? 'bg-mint-400 text-black' :
                company.tier === 'Tier 2' ? 'bg-ocean-400 text-white' :
                'bg-yellow-400 text-black'
              }`}>
                {company.tier}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredCompanies.length === 0 && (
          <div className="text-center py-12">
            <FunnelIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-black mb-2">No companies found</h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your search or filter criteria
            </p>
            <button
              onClick={() => {
                setSearchQuery('')
                setSelectedCategory('all')
                setSelectedTier('all')
              }}
              className="sticker-button"
            >
              Clear All Filters
            </button>
          </div>
        )}

        {/* Stats */}
        {filteredCompanies.length > 0 && (
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="sticker-card p-4 text-center">
              <div className="text-2xl font-bold text-ocean-600 mb-1">
                {filteredCompanies.reduce((sum, company) => sum + company.experienceCount, 0)}
              </div>
              <div className="text-sm text-gray-600">Total Experiences</div>
            </div>
            <div className="sticker-card p-4 text-center">
              <div className="text-2xl font-bold text-mint-600 mb-1">
                {filteredCompanies.filter(c => c.tier === 'FAANG').length}
              </div>
              <div className="text-sm text-gray-600">FAANG Companies</div>
            </div>
            <div className="sticker-card p-4 text-center">
              <div className="text-2xl font-bold text-peach-600 mb-1">
                {filteredCompanies.filter(c => c.category === 'Product').length}
              </div>
              <div className="text-sm text-gray-600">Product Companies</div>
            </div>
            <div className="sticker-card p-4 text-center">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {filteredCompanies.filter(c => c.tier === 'Unicorn').length}
              </div>
              <div className="text-sm text-gray-600">Unicorn Startups</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}