'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { companyAPI } from '../lib/api'

export default function CompanyChips() {
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadFeaturedCompanies()
  }, [])

  const loadFeaturedCompanies = async () => {
    try {
      const response = await companyAPI.getCompanies({
        page: 1,
        limit: 10,
        sortBy: 'name',
        sortOrder: 'asc'
      })

      if (response.success) {
        setCompanies(response.data.companies)
      }
    } catch (error) {
      console.error('Error loading companies:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-black mb-4">
          Featured Companies
        </h2>
        <p className="text-gray-600 text-center mb-12 text-lg">
          Explore interview experiences from top companies
        </p>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="sticker-card p-6 text-center animate-pulse">
                <div className="w-12 h-12 bg-gray-300 rounded-xl mx-auto mb-3"></div>
                <div className="h-4 bg-gray-300 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {companies.map((company) => (
              <Link
                key={company.slug}
                href={`/company/${company.slug}`}
                className="sticker-card p-6 text-center group cursor-pointer"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-ocean-400 to-mint-400 rounded-xl border-2 border-black mx-auto mb-3 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {company.name.charAt(0)}
                  </span>
                </div>
                <h3 className="font-semibold text-black mb-1 group-hover:text-ocean-600 transition-colors">
                  {company.name}
                </h3>
                <p className="text-sm text-gray-600">
                  {company.experienceCount || 0} experiences
                </p>
              </Link>
            ))}
          </div>
        )}

        <div className="text-center mt-12">
          <Link href="/companies" className="sticker-button-secondary">
            View All Companies
          </Link>
        </div>
      </div>
    </section>
  )
}