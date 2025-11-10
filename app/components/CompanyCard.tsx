'use client'

import Link from 'next/link'
import { ChevronRightIcon, ClockIcon, DocumentTextIcon } from '@heroicons/react/24/outline'

interface Company {
  name: string
  slug: string
  experienceCount?: number
  lastUpdated?: string
  logo?: string
  tier?: string
  category?: string
}

interface CompanyCardProps {
  company: Company
}

export default function CompanyCard({ company }: CompanyCardProps) {
  return (
    <Link href={`/company/${company.slug}`} className="block">
      <div className="sticker-card p-6 group cursor-pointer">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-ocean-400 to-mint-400 rounded-xl border-2 border-black flex items-center justify-center">
              <span className="text-white font-bold text-lg">
                {company.logo}
              </span>
            </div>
            <div>
              <h3 className="font-bold text-lg text-black group-hover:text-ocean-600 transition-colors">
                {company.name}
              </h3>
              {company.tier && (
                <span className={`text-xs px-2 py-1 rounded-full border border-black ${
                  company.tier === 'FAANG' ? 'bg-peach-200 text-peach-800' :
                  company.tier === 'Tier 1' ? 'bg-mint-200 text-mint-800' :
                  company.tier === 'Tier 2' ? 'bg-ocean-200 text-ocean-800' :
                  'bg-yellow-200 text-yellow-800'
                }`}>
                  {company.tier}
                </span>
              )}
            </div>
          </div>
          <ChevronRightIcon className="h-5 w-5 text-gray-400 group-hover:text-ocean-600 transition-colors" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-gray-600">
            <DocumentTextIcon className="h-4 w-4" />
            <span className="text-sm">
              {company.experienceCount || 0} experiences
            </span>
          </div>
          <div className="flex items-center space-x-2 text-gray-600">
            <ClockIcon className="h-4 w-4" />
            <span className="text-sm">
              Updated {company.lastUpdated || 'recently'}
            </span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t-2 border-gray-100">
          <span className="text-ocean-600 font-semibold text-sm group-hover:underline">
            View Experiences →
          </span>
        </div>
      </div>
    </Link>
  )
}