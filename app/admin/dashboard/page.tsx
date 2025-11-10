'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminNavbar from '../components/AdminNavbar'
import { adminAPI, utils } from '../../lib/api'
import { Experience } from '../../types/api'

export default function AdminDashboard() {
  const router = useRouter()
  const [experiences, setExperiences] = useState<Experience[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected'>('pending')
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0
  })
  const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    const admin = utils.getUser(true)
    if (!admin || admin.role !== 'admin') {
      router.push('/admin/login')
      return
    }
    loadExperiences()
  }, [filter])

  const loadExperiences = async () => {
    setLoading(true)
    try {
      const response = await adminAPI.getPendingExperiences({ status: filter })
      if (response.success && response.data) {
        setExperiences(response.data.experiences || [])
        
        // Calculate stats - fetch ALL experiences without status filter and high limit
        console.log('Fetching all experiences for stats...')
        const allResponse = await adminAPI.getPendingExperiences({ limit: 1000 })
        console.log('All experiences response:', allResponse)
        
        if (allResponse.success && allResponse.data) {
          const all = allResponse.data.experiences || []
          console.log('Total experiences fetched:', all.length)
          console.log('Experiences by status:', {
            pending: all.filter((e: Experience) => e.status === 'pending').length,
            approved: all.filter((e: Experience) => e.status === 'approved').length,
            rejected: all.filter((e: Experience) => e.status === 'rejected').length
          })
          
          setStats({
            pending: all.filter((e: Experience) => e.status === 'pending').length,
            approved: all.filter((e: Experience) => e.status === 'approved').length,
            rejected: all.filter((e: Experience) => e.status === 'rejected').length,
            total: all.length
          })
        }
      }
    } catch (error) {
      console.error('Error loading experiences:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id: string) => {
    if (!confirm('Approve this experience?')) return
    
    try {
      const response = await adminAPI.approveExperience(id)
      if (response.success) {
        alert('✅ Experience approved!')
        loadExperiences()
      } else {
        alert('❌ Failed to approve')
      }
    } catch (error) {
      alert('❌ Error approving experience')
    }
  }

  const handleReject = async (id: string) => {
    const reason = prompt('Reason for rejection (minimum 10 characters):')
    
    if (!reason || reason.trim().length < 10) {
      alert('❌ Rejection reason must be at least 10 characters')
      return
    }
    
    try {
      const response = await adminAPI.rejectExperience(id, reason)
      if (response.success) {
        alert('✅ Experience rejected')
        loadExperiences()
      } else {
        alert('❌ Failed to reject: ' + (response.message || 'Unknown error'))
      }
    } catch (error) {
      alert('❌ Error rejecting experience')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('⚠️ Permanently delete this experience? This cannot be undone!')) return
    
    try {
      const response = await adminAPI.deleteExperience(id)
      if (response.success) {
        alert('✅ Experience deleted')
        loadExperiences()
      } else {
        alert('❌ Failed to delete')
      }
    } catch (error) {
      alert('❌ Error deleting experience')
    }
  }

  const viewFull = async (experience: Experience) => {
    setShowModal(true)
    setSelectedExperience(experience)
    
    // Fetch full experience details
    try {
      const response = await adminAPI.getExperienceById(experience.id)
      if (response.success && response.data) {
        setSelectedExperience(response.data.experience)
      }
    } catch (error) {
      console.error('Error loading full experience:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Review and manage student interview experiences</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border-2 border-gray-200 p-6">
            <div className="text-3xl font-bold text-yellow-600 mb-2">{stats.pending}</div>
            <div className="text-gray-700 font-medium">Pending Review</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border-2 border-gray-200 p-6">
            <div className="text-3xl font-bold text-green-600 mb-2">{stats.approved}</div>
            <div className="text-gray-700 font-medium">Approved</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border-2 border-gray-200 p-6">
            <div className="text-3xl font-bold text-red-600 mb-2">{stats.rejected}</div>
            <div className="text-gray-700 font-medium">Rejected</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border-2 border-gray-200 p-6">
            <div className="text-3xl font-bold text-blue-600 mb-2">{stats.total}</div>
            <div className="text-gray-700 font-medium">Total Submissions</div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setFilter('pending')}
            className={`px-6 py-2 rounded-lg font-semibold transition-all ${
              filter === 'pending'
                ? 'bg-yellow-500 text-white'
                : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-yellow-500'
            }`}
          >
            Pending ({stats.pending})
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-6 py-2 rounded-lg font-semibold transition-all ${
              filter === 'approved'
                ? 'bg-green-500 text-white'
                : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-green-500'
            }`}
          >
            Approved ({stats.approved})
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`px-6 py-2 rounded-lg font-semibold transition-all ${
              filter === 'rejected'
                ? 'bg-red-500 text-white'
                : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-red-500'
            }`}
          >
            Rejected ({stats.rejected})
          </button>
        </div>

        {/* Experiences List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading experiences...</p>
          </div>
        ) : experiences.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border-2 border-gray-200 p-12 text-center">
            <p className="text-gray-600 text-lg">No {filter} experiences found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {experiences.map((exp) => (
              <div key={exp.id} className="bg-white rounded-lg shadow-sm border-2 border-gray-200 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {((exp.companies as any)?.logo_url || (exp.companies as any)?.logo) && (
                        <img 
                          src={(exp.companies as any)?.logo_url || (exp.companies as any)?.logo} 
                          alt={(exp.companies as any)?.name || 'Company'}
                          className="w-12 h-12 rounded-lg object-cover border-2 border-gray-300"
                        />
                      )}
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{exp.role}</h3>
                        <p className="text-gray-600">{exp.companies?.name}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <span>👤 {exp.users?.name}</span>
                      <span>• {exp.users?.course}</span>
                      <span>• {exp.users?.year}</span>
                      <span>• {new Date(exp.created_at).toLocaleDateString()}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        exp.result === 'Selected' ? 'bg-green-100 text-green-800' :
                        exp.result === 'Not Selected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {exp.result}
                      </span>
                      <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                        {exp.experience_type}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => viewFull(exp)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors"
                    >
                      👁️ View Full
                    </button>
                    {filter === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(exp.id)}
                          className="px-4 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors"
                        >
                          ✅ Approve
                        </button>
                        <button
                          onClick={() => handleReject(exp.id)}
                          className="px-4 py-2 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors"
                        >
                          ❌ Reject
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleDelete(exp.id)}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* View Full Modal */}
      {showModal && selectedExperience && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-8">
            <div className="flex justify-between items-start mb-6 pb-4 border-b-2 border-gray-200">
              <div className="flex items-center gap-4">
                {((selectedExperience.companies as any)?.logo_url || (selectedExperience.companies as any)?.logo) && (
                  <img 
                    src={(selectedExperience.companies as any)?.logo_url || (selectedExperience.companies as any)?.logo} 
                    alt={selectedExperience.companies?.name}
                    className="w-16 h-16 rounded-lg object-cover border-2 border-gray-300"
                  />
                )}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">{selectedExperience.role}</h2>
                  <p className="text-lg text-gray-600 mb-1">{selectedExperience.companies?.name}</p>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      selectedExperience.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      selectedExperience.status === 'approved' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {selectedExperience.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700 text-3xl font-bold leading-none"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {/* Student Info */}
              <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                  <span>👤</span> Student Information
                </h3>
                <div className="text-gray-700 space-y-1">
                  <p><strong>Name:</strong> {selectedExperience.users?.name}</p>
                  <p><strong>Email:</strong> {selectedExperience.users?.email}</p>
                  <p><strong>College:</strong> {selectedExperience.users?.college}</p>
                  <p><strong>Course:</strong> {selectedExperience.users?.course}</p>
                  <p><strong>Year:</strong> {selectedExperience.users?.year}</p>
                </div>
              </div>

              {/* Experience Details */}
              <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
                <h3 className="font-bold text-green-900 mb-2 flex items-center gap-2">
                  <span>📋</span> Experience Details
                </h3>
                <div className="text-gray-700 space-y-1">
                  <p><strong>Experience Type:</strong> {selectedExperience.experience_type}</p>
                  <p><strong>Result:</strong> <span className={`font-semibold ${
                    selectedExperience.result === 'Selected' ? 'text-green-600' :
                    selectedExperience.result === 'Not Selected' ? 'text-red-600' :
                    'text-yellow-600'
                  }`}>{selectedExperience.result}</span></p>
                  {selectedExperience.interview_date && (
                    <p><strong>Interview Date:</strong> {new Date(selectedExperience.interview_date).toLocaleDateString()}</p>
                  )}
                  {selectedExperience.location && (
                    <p><strong>Location:</strong> {selectedExperience.location}</p>
                  )}
                  <p><strong>Submitted:</strong> {new Date(selectedExperience.created_at).toLocaleString()}</p>
                </div>
              </div>

              {/* Overall Experience */}
              {((selectedExperience as any).overall_experience || (selectedExperience as any).rounds_overview) && (
                <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-200">
                  <h3 className="font-bold text-purple-900 mb-2 flex items-center gap-2">
                    <span>📝</span> Overall Process
                  </h3>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {(selectedExperience as any).overall_experience || (selectedExperience as any).rounds_overview}
                  </p>
                </div>
              )}

              {/* Technical Rounds */}
              {((selectedExperience as any).technical_rounds || (selectedExperience as any).technical_questions) && (
                <div className="bg-orange-50 p-4 rounded-lg border-2 border-orange-200">
                  <h3 className="font-bold text-orange-900 mb-2 flex items-center gap-2">
                    <span>💻</span> Technical / Coding Rounds
                  </h3>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {(selectedExperience as any).technical_rounds || (selectedExperience as any).technical_questions}
                  </p>
                </div>
              )}

              {/* HR Rounds */}
              {((selectedExperience as any).hr_rounds || (selectedExperience as any).hr_questions) && (
                <div className="bg-pink-50 p-4 rounded-lg border-2 border-pink-200">
                  <h3 className="font-bold text-pink-900 mb-2 flex items-center gap-2">
                    <span>🗣️</span> HR / Behavioral Rounds
                  </h3>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {(selectedExperience as any).hr_rounds || (selectedExperience as any).hr_questions}
                  </p>
                </div>
              )}

              {/* Tips & Advice */}
              {((selectedExperience as any).tips_and_advice || (selectedExperience as any).preparation_strategy || (selectedExperience as any).advice) && (
                <div className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-200">
                  <h3 className="font-bold text-yellow-900 mb-2 flex items-center gap-2">
                    <span>💡</span> Tips & Advice
                  </h3>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {(selectedExperience as any).tips_and_advice || (selectedExperience as any).preparation_strategy || (selectedExperience as any).advice}
                  </p>
                </div>
              )}

              {/* If no details provided */}
              {!(selectedExperience as any).overall_experience && 
               !(selectedExperience as any).rounds_overview &&
               !(selectedExperience as any).technical_rounds && 
               !(selectedExperience as any).technical_questions &&
               !(selectedExperience as any).hr_rounds && 
               !(selectedExperience as any).hr_questions &&
               !(selectedExperience as any).tips_and_advice &&
               !(selectedExperience as any).preparation_strategy &&
               !(selectedExperience as any).advice && (
                <div className="bg-gray-50 p-4 rounded-lg border-2 border-gray-200 text-center">
                  <p className="text-gray-600">No additional details provided by the student.</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-8">
              {selectedExperience.status === 'pending' && (
                <>
                  <button
                    onClick={() => {
                      handleApprove(selectedExperience.id)
                      setShowModal(false)
                    }}
                    className="flex-1 px-6 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600"
                  >
                    ✅ Approve
                  </button>
                  <button
                    onClick={() => {
                      handleReject(selectedExperience.id)
                      setShowModal(false)
                    }}
                    className="flex-1 px-6 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600"
                  >
                    ❌ Reject
                  </button>
                </>
              )}
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
