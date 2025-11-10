'use client'

import { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import HeroSection from './components/HeroSection'
import CompanyChips from './components/CompanyChips'
import CollegeSelector from './components/CollegeSelector'

export default function Home() {
  const [selectedCollege, setSelectedCollege] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <HeroSection />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />
      <div className="max-w-6xl mx-auto px-4">
        <CollegeSelector 
          onCollegeSelect={setSelectedCollege}
          selectedCollege={selectedCollege}
        />
      </div>
      <CompanyChips />
    </div>
  )
}