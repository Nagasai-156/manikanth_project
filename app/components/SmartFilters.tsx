'use client'

import { useState } from 'react'
import { FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface FilterOption {
  id: string
  label: string
  count?: number
}

interface SmartFiltersProps {
  title?: string
  showYearFilter?: boolean
  showBranchFilter?: boolean
  showCompanyTierFilter?: boolean
  showResultFilter?: boolean
  showTypeFilter?: boolean
  onFiltersChange: (filters: any) => void
  resultCount: number
}

export default function SmartFilters({
  title = "Smart Filters",
  showYearFilter = true,
  showBranchFilter = true,
  showCompanyTierFilter = true,
  showResultFilter = false,
  showTypeFilter = false,
  onFiltersChange,
  resultCount
}: SmartFiltersProps) {
  const [selectedYear, setSelectedYear] = useState('all')
  const [selectedBranch, setSelectedBranch] = useState('all')
  const [selectedTier, setSelectedTier] = useState('all')
  const [selectedResult, setSelectedResult] = useState('all')
  const [selectedType, setSelectedType] = useState('all')
  const [isExpanded, setIsExpanded] = useState(true)

  const years: FilterOption[] = [
    { id: 'all', label: 'All Years' },
    { id: '2025', label: '2025' },
    { id: '2024', label: '2024' },
    { id: '2023', label: '2023' },
    { id: '2022', label: '2022' },
    { id: '2021', label: '2021' }
  ]

  const branches: FilterOption[] = [
    { id: 'all', label: 'All Branches' },
    { id: 'CSE', label: 'Computer Science' },
    { id: 'IT', label: 'Information Technology' },
    { id: 'ECE', label: 'Electronics & Communication' },
    { id: 'EEE', label: 'Electrical Engineering' },
    { id: 'MECH', label: 'Mechanical Engineering' },
    { id: 'CIVIL', label: 'Civil Engineering' },
    { id: 'CHEM', label: 'Chemical Engineering' },
    { id: 'BIO', label: 'Biotechnology' },
    { id: 'AERO', label: 'Aerospace Engineering' },
    { id: 'AUTO', label: 'Automobile Engineering' }
  ]

  const companyTiers: FilterOption[] = [
    { id: 'all', label: 'All Companies' },
    { id: 'FAANG', label: 'FAANG' },
    { id: 'Tier 1', label: 'Tier 1' },
    { id: 'Tier 2', label: 'Tier 2' },
    { id: 'Unicorn', label: 'Unicorn Startups' },
    { id: 'Product', label: 'Product Companies' },
    { id: 'Service', label: 'Service Companies' }
  ]

  const results: FilterOption[] = [
    { id: 'all', label: 'All Results' },
    { id: 'selected', label: 'Selected' },
    { id: 'not-selected', label: 'Not Selected' }
  ]

  const types: FilterOption[] = [
    { id: 'all', label: 'All Types' },
    { id: 'intern', label: 'Internships' },
    { id: 'fulltime', label: 'Full-time' }
  ]

  const updateFilters = (filterType: string, value: string) => {
    const newFilters = {
      year: selectedYear,
      branch: selectedBranch,
      tier: selectedTier,
      result: selectedResult,
      type: selectedType,
      [filterType]: value
    }

    // Update local state
    switch (filterType) {
      case 'year': setSelectedYear(value); break
      case 'branch': setSelectedBranch(value); break
      case 'tier': setSelectedTier(value); break
      case 'result': setSelectedResult(value); break
      case 'type': setSelectedType(value); break
    }

    onFiltersChange(newFilters)
  }

  const clearAllFilters = () => {
    setSelectedYear('all')
    setSelectedBranch('all')
    setSelectedTier('all')
    setSelectedResult('all')
    setSelectedType('all')
    
    onFiltersChange({
      year: 'all',
      branch: 'all',
      tier: 'all',
      result: 'all',
      type: 'all'
    })
  }

  const hasActiveFilters = selectedYear !== 'all' || selectedBranch !== 'all' || 
                          selectedTier !== 'all' || selectedResult !== 'all' || 
                          selectedType !== 'all'

  const FilterSection = ({ title, options, selected, onChange, colorClass }: {
    title: string
    options: FilterOption[]
    selected: string
    onChange: (value: string) => void
    colorClass: string
  }) => (
    <div className="mb-4">
      <h4 className="text-sm font-semibold text-black mb-2">{title}</h4>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => onChange(option.id)}
            className={`px-3 py-1 rounded-lg border-2 border-black text-sm font-medium transition-all duration-200 ${
              selected === option.id
                ? `${colorClass} shadow-sticker`
                : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            {option.label}
            {option.count && <span className="ml-1 text-xs">({option.count})</span>}
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <div className="sticker-card p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <FunnelIcon className="h-5 w-5 text-black" />
          <h3 className="text-lg font-semibold text-black">{title}</h3>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm text-ocean-600 hover:underline"
        >
          {isExpanded ? 'Collapse' : 'Expand'}
        </button>
      </div>

      {isExpanded && (
        <>
          {showYearFilter && (
            <FilterSection
              title="Placement Year"
              options={years}
              selected={selectedYear}
              onChange={(value) => updateFilters('year', value)}
              colorClass="bg-peach-400 text-black"
            />
          )}

          {showBranchFilter && (
            <FilterSection
              title="Branch/Course"
              options={branches}
              selected={selectedBranch}
              onChange={(value) => updateFilters('branch', value)}
              colorClass="bg-mint-400 text-black"
            />
          )}

          {showCompanyTierFilter && (
            <FilterSection
              title="Company Type"
              options={companyTiers}
              selected={selectedTier}
              onChange={(value) => updateFilters('tier', value)}
              colorClass="bg-ocean-400 text-white"
            />
          )}

          {showResultFilter && (
            <FilterSection
              title="Interview Result"
              options={results}
              selected={selectedResult}
              onChange={(value) => updateFilters('result', value)}
              colorClass="bg-purple-400 text-white"
            />
          )}

          {showTypeFilter && (
            <FilterSection
              title="Experience Type"
              options={types}
              selected={selectedType}
              onChange={(value) => updateFilters('type', value)}
              colorClass="bg-yellow-400 text-black"
            />
          )}

          {/* Results Summary */}
          <div className="pt-4 border-t-2 border-gray-100">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <span className="font-semibold">{resultCount}</span> results found
                {hasActiveFilters && (
                  <span className="ml-2">
                    • Active filters: 
                    {selectedYear !== 'all' && <span className="ml-1 px-2 py-1 bg-peach-100 rounded text-xs">{selectedYear}</span>}
                    {selectedBranch !== 'all' && <span className="ml-1 px-2 py-1 bg-mint-100 rounded text-xs">{branches.find(b => b.id === selectedBranch)?.label}</span>}
                    {selectedTier !== 'all' && <span className="ml-1 px-2 py-1 bg-ocean-100 rounded text-xs">{selectedTier}</span>}
                    {selectedResult !== 'all' && <span className="ml-1 px-2 py-1 bg-purple-100 rounded text-xs">{selectedResult}</span>}
                    {selectedType !== 'all' && <span className="ml-1 px-2 py-1 bg-yellow-100 rounded text-xs">{selectedType}</span>}
                  </span>
                )}
              </div>
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="flex items-center space-x-1 text-sm text-ocean-600 hover:underline"
                >
                  <XMarkIcon className="h-4 w-4" />
                  <span>Clear All</span>
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}