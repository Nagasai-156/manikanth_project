'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '../components/Navbar'
import AuthGuard from '../components/AuthGuard'
import { experienceAPI, companyAPI } from '../lib/api'
import { Company } from '../types/api'

export default function PostExperience() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [companies, setCompanies] = useState<Company[]>([])
  const [formData, setFormData] = useState({
    companyId: '',
    customCompany: '',
    title: '',
    role: '',
    experienceType: '',
    campusType: '',
    result: '',
    interviewDate: '',
    location: '',
    overallExperience: '',
    technicalRounds: '',
    hrRounds: '',
    tipsAndAdvice: ''
  })

  useEffect(() => {
    loadCompanies()
  }, [])

  const loadCompanies = async () => {
    try {
      const response = await companyAPI.getCompanies({ limit: 100 })
      if (response.success && response.data) {
        setCompanies(response.data.companies)
      }
    } catch (error) {
      console.error('Error loading companies:', error)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validation
      if (!formData.companyId) {
        alert('Please select a company')
        setIsSubmitting(false)
        return
      }
      
      if (formData.companyId === 'other' && !formData.customCompany?.trim()) {
        alert('Please enter the company name')
        setIsSubmitting(false)
        return
      }
      
      if (!formData.title?.trim()) {
        alert('Please enter the experience title')
        setIsSubmitting(false)
        return
      }

      if (!formData.role?.trim()) {
        alert('Please enter the role')
        setIsSubmitting(false)
        return
      }
      
      if (!formData.experienceType) {
        alert('Please select experience type')
        setIsSubmitting(false)
        return
      }

      if (!formData.campusType) {
        alert('Please select campus type')
        setIsSubmitting(false)
        return
      }
      
      if (!formData.result) {
        alert('Please select result')
        setIsSubmitting(false)
        return
      }

      const response = await experienceAPI.createExperience(formData)

      if (response.success) {
        alert('✅ Experience submitted successfully!\n\nYour experience will be reviewed by admins before being published.')
        router.push('/dashboard')
      } else {
        // Handle validation errors
        if (response.error && typeof response.error === 'object' && 'errors' in response.error) {
          const errors = (response.error as any).errors
          const errorMessages = errors.map((err: any) => `• ${err.field}: ${err.message}`).join('\n')
          alert('❌ Validation Error:\n\n' + errorMessages)
        } else {
          alert('❌ ' + (response.message || 'Failed to submit experience'))
        }
      }
    } catch (error: any) {
      console.error('Error:', error)
      alert('❌ Failed to submit. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthGuard requireAuth={true}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
      
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Share Your Interview Experience
            </h1>
            <p className="text-lg text-gray-600">
              Help your peers by sharing your journey
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-2xl">📋</span>
                Basic Information
              </h2>
              
              <div className="space-y-4">
                {/* Company */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Company *
                  </label>
                  <select
                    name="companyId"
                    required
                    value={formData.companyId}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a company</option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                    <option value="other">Other (I'll type it)</option>
                  </select>
                </div>

                {/* Custom Company */}
                {formData.companyId === 'other' && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      name="customCompany"
                      required
                      value={formData.customCompany}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Startup XYZ"
                    />
                  </div>
                )}

                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Experience Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Software Engineer Interview at Google"
                  />
                </div>

                {/* Role */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Role / Position *
                  </label>
                  <input
                    type="text"
                    name="role"
                    required
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Software Engineer, Data Analyst"
                  />
                </div>

                {/* Experience Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Experience Type *
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {['Internship', 'Full-Time', 'Apprenticeship'].map((type) => (
                      <label
                        key={type}
                        className={`cursor-pointer p-3 rounded-lg border-2 text-center font-medium transition-all ${
                          formData.experienceType === type
                            ? 'bg-blue-500 text-white border-blue-600'
                            : 'bg-white border-gray-300 hover:border-blue-400'
                        }`}
                      >
                        <input
                          type="radio"
                          name="experienceType"
                          value={type}
                          checked={formData.experienceType === type}
                          onChange={handleChange}
                          className="hidden"
                        />
                        {type}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Campus Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Campus Type *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {['On-Campus', 'Off-Campus'].map((type) => (
                      <label
                        key={type}
                        className={`cursor-pointer p-3 rounded-lg border-2 text-center font-medium transition-all ${
                          formData.campusType === type
                            ? 'bg-green-500 text-white border-green-600'
                            : 'bg-white border-gray-300 hover:border-green-400'
                        }`}
                      >
                        <input
                          type="radio"
                          name="campusType"
                          value={type}
                          checked={formData.campusType === type}
                          onChange={handleChange}
                          className="hidden"
                        />
                        {type}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Result */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Result *
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'Selected', emoji: '✅', color: 'green' },
                      { value: 'Not Selected', emoji: '❌', color: 'red' },
                      { value: 'Pending', emoji: '⏳', color: 'yellow' }
                    ].map(({ value, emoji, color }) => (
                      <label
                        key={value}
                        className={`cursor-pointer p-3 rounded-lg border-2 text-center font-medium transition-all ${
                          formData.result === value
                            ? `bg-${color}-500 text-white border-${color}-600`
                            : 'bg-white border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <input
                          type="radio"
                          name="result"
                          value={value}
                          checked={formData.result === value}
                          onChange={handleChange}
                          className="hidden"
                        />
                        <div className="text-xl mb-1">{emoji}</div>
                        {value}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Optional Details Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-2xl">📅</span>
                Additional Details
                <span className="text-sm text-gray-500 font-normal ml-auto">(Optional)</span>
              </h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Interview Date
                  </label>
                  <input
                    type="date"
                    name="interviewDate"
                    value={formData.interviewDate}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Bangalore, Remote"
                  />
                </div>
              </div>
            </div>

            {/* Experience Details Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-2xl">📝</span>
                Your Experience
                <span className="text-sm text-gray-500 font-normal ml-auto">(Optional but helpful!)</span>
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Overall Process
                  </label>
                  <textarea
                    name="overallExperience"
                    value={formData.overallExperience}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Describe the interview process..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Technical / Coding Rounds
                  </label>
                  <textarea
                    name="technicalRounds"
                    value={formData.technicalRounds}
                    onChange={handleChange}
                    rows={5}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="What technical questions were asked?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    HR / Behavioral Rounds
                  </label>
                  <textarea
                    name="hrRounds"
                    value={formData.hrRounds}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="What HR questions were asked?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tips & Advice
                  </label>
                  <textarea
                    name="tipsAndAdvice"
                    value={formData.tipsAndAdvice}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Share your preparation tips..."
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="text-center pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold px-12 py-4 rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isSubmitting ? '⏳ Submitting...' : '🚀 Submit Experience'}
              </button>
              <p className="text-sm text-gray-600 mt-3">
                Your experience will be reviewed by admins before being published
              </p>
            </div>
          </form>
        </div>
      </div>
    </AuthGuard>
  )
}
