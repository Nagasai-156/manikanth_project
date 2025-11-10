'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '../components/Navbar'
import { PencilIcon, TrashIcon, EyeIcon, CheckCircleIcon, ClockIcon, XCircleIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { userAPI, experienceAPI, utils } from '../lib/api'
import { User, Company } from '../types/api'

// Profile Experience type matching backend response
interface ProfileExperience {
  id: string
  title: string
  role: string
  experienceType: string
  result: string
  interviewDate?: string
  status: string
  views: number
  createdAt: string
  updatedAt: string
  company: {
    id: string
    name: string
    slug: string
  }
}

// Edit form data
interface EditExperienceData {
  role: string
  experienceType: string
  result: string
  interviewDate?: string
  location?: string
  overallExperience?: string
  technicalRounds?: string
  hrRounds?: string
  tipsAndAdvice?: string
}

export default function ProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [editedUser, setEditedUser] = useState<Partial<User>>({})
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [experiences, setExperiences] = useState<ProfileExperience[]>([])
  const [stats, setStats] = useState({ postsPublished: 0, commentsMade: 0, totalViews: 0 })
  const [newSkill, setNewSkill] = useState('')
  const [saving, setSaving] = useState(false)
  
  // Experience edit/delete modals
  const [editingExperience, setEditingExperience] = useState<ProfileExperience | null>(null)
  const [editFormData, setEditFormData] = useState<EditExperienceData | null>(null)
  const [deletingExperience, setDeletingExperience] = useState<ProfileExperience | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (!utils.isAuthenticated()) {
      router.push('/login')
      return
    }
    loadProfileData()
  }, [router])

  const loadProfileData = async () => {
    try {
      setLoading(true)
      
      // Load profile data with individual error handling
      const profileRes = await userAPI.getProfile().catch(err => {
        console.error('Profile API error:', err)
        return { success: false, message: 'Failed to load profile', error: err, data: null }
      })

      console.log('Profile response:', profileRes)

      if (profileRes.success && profileRes.data) {
        setUser(profileRes.data.user)
        setEditedUser(profileRes.data.user)
      } else {
        console.error('Failed to load profile:', profileRes.message)
        // If profile load fails, user might be logged out
        if (profileRes.error === 'Unauthorized' || profileRes.message?.includes('token')) {
          alert('Session expired. Please login again.')
          router.push('/login')
          return
        }
        // Don't return here, try to load other data
      }

      // Load stats (non-critical)
      try {
        const statsRes = await userAPI.getProfileStats()
        if (statsRes.success && statsRes.data) {
          setStats(statsRes.data)
        }
      } catch (error) {
        console.log('Stats not available:', error)
      }

      // Load experiences (non-critical)
      try {
        const experiencesRes = await userAPI.getProfileExperiences()
        if (experiencesRes.success && experiencesRes.data) {
          setExperiences(experiencesRes.data.experiences as any)
        }
      } catch (error) {
        console.log('Experiences not available:', error)
      }

    } catch (error) {
      console.error('Error loading profile:', error)
      alert('Failed to load profile. Please try refreshing the page.')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    try {
      setSaving(true)
      const allowedFields = {
        name: editedUser.name?.trim(),
        rollNo: editedUser.rollNo?.trim(),
        college: editedUser.college?.trim(),
        degree: editedUser.degree?.trim(),
        course: editedUser.course?.trim(),
        year: editedUser.year,
        bio: editedUser.bio?.trim(),
        about: editedUser.about?.trim(),
        skills: editedUser.skills || [],
        githubUrl: editedUser.githubUrl?.trim(),
        linkedinUrl: editedUser.linkedinUrl?.trim(),
        phone: editedUser.phone?.trim()
      }

      const response = await userAPI.updateProfile(allowedFields)
      
      if (response.success && response.data) {
        setUser(response.data.user)
        setEditedUser(response.data.user)
        setIsEditingProfile(false)
        alert('Profile updated successfully!')
      } else {
        alert(response.message || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleAddSkill = () => {
    if (newSkill.trim() && editedUser.skills) {
      if (!editedUser.skills.includes(newSkill.trim())) {
        setEditedUser({
          ...editedUser,
          skills: [...editedUser.skills, newSkill.trim()]
        })
      }
      setNewSkill('')
    }
  }

  const handleRemoveSkill = (skillToRemove: string) => {
    if (editedUser.skills) {
      setEditedUser({
        ...editedUser,
        skills: editedUser.skills.filter(skill => skill !== skillToRemove)
      })
    }
  }

  const handleEditExperience = (exp: ProfileExperience) => {
    if (exp.status === 'approved') {
      alert('Approved experiences cannot be edited. If you need to make changes, please contact an administrator.')
      return
    }
    setEditingExperience(exp)
    // We need to fetch the full experience data first
    loadFullExperience(exp.id)
  }

  const loadFullExperience = async (id: string) => {
    try {
      setActionLoading(true)
      const response = await experienceAPI.getExperience(id)
      if (response.success && response.data && response.data.experience) {
        const exp = response.data.experience
        setEditFormData({
          role: exp.role,
          experienceType: exp.experience_type,
          result: exp.result,
          interviewDate: exp.interview_date || '',
          location: exp.location || '',
          overallExperience: exp.overall_experience || '',
          technicalRounds: exp.technical_rounds || '',
          hrRounds: exp.hr_rounds || '',
          tipsAndAdvice: exp.tips_and_advice || ''
        })
      }
    } catch (error) {
      console.error('Error loading experience:', error)
      alert('Failed to load experience details')
    } finally {
      setActionLoading(false)
    }
  }

  const handleSaveExperience = async () => {
    if (!editingExperience || !editFormData) return

    try {
      setActionLoading(true)
      const response = await experienceAPI.updateExperience(editingExperience.id, editFormData)
      
      if (response.success) {
        alert('Experience updated successfully!')
        setEditingExperience(null)
        setEditFormData(null)
        loadProfileData() // Reload all data
      } else {
        alert(response.message || 'Failed to update experience')
      }
    } catch (error) {
      console.error('Error updating experience:', error)
      alert('Failed to update experience')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteExperience = async () => {
    if (!deletingExperience) return

    try {
      setActionLoading(true)
      const response = await experienceAPI.deleteExperience(deletingExperience.id)
      
      if (response.success) {
        alert('Experience deleted successfully!')
        setDeletingExperience(null)
        // Remove from local state immediately
        setExperiences(experiences.filter(exp => exp.id !== deletingExperience.id))
        // Reload stats
        const statsRes = await userAPI.getProfileStats()
        if (statsRes.success && statsRes.data) {
          setStats(statsRes.data)
        }
      } else {
        alert(response.message || 'Failed to delete experience')
      }
    } catch (error) {
      console.error('Error deleting experience:', error)
      alert('Failed to delete experience')
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="w-4 h-4 mr-1" />
            Approved
          </span>
        )
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <ClockIcon className="w-4 h-4 mr-1" />
            Pending
          </span>
        )
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircleIcon className="w-4 h-4 mr-1" />
            Rejected
          </span>
        )
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex flex-col items-center justify-center h-screen">
          <div className="text-6xl mb-4">😕</div>
          <p className="text-gray-600 text-xl mb-4">Unable to load profile</p>
          <p className="text-gray-500 mb-6">Please check your connection and try again</p>
          <div className="flex gap-4">
            <button
              onClick={() => {
                setLoading(true)
                loadProfileData()
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
            <Link
              href="/dashboard"
              className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-mint-50 via-white to-peach-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="sticker-card p-8 mb-6">
          <div className="flex justify-between items-start mb-6 flex-wrap gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-24 h-24 bg-gradient-to-br from-ocean-400 to-mint-400 rounded-full border-4 border-black flex items-center justify-center text-white text-3xl font-bold shadow-sticker">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-black mb-1">{user.name}</h1>
                <p className="text-gray-700 font-medium">{user.email}</p>
                {user.rollNo && <p className="text-sm text-gray-600 font-medium mt-1">📝 Roll No: {user.rollNo}</p>}
              </div>
            </div>
            <button
              onClick={() => setIsEditingProfile(!isEditingProfile)}
              className="sticker-button"
            >
              {isEditingProfile ? '❌ Cancel' : '✏️ Edit Profile'}
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-ocean-100 rounded-xl border-3 border-black p-5 shadow-sticker">
              <p className="text-sm text-black font-bold mb-1">📊 Posts Published</p>
              <p className="text-3xl font-bold text-black">{stats.postsPublished}</p>
            </div>
            <div className="bg-mint-100 rounded-xl border-3 border-black p-5 shadow-sticker">
              <p className="text-sm text-black font-bold mb-1">👁️ Total Views</p>
              <p className="text-3xl font-bold text-black">{stats.totalViews}</p>
            </div>
            <div className="bg-peach-100 rounded-xl border-3 border-black p-5 shadow-sticker">
              <p className="text-sm text-black font-bold mb-1">💬 Comments Made</p>
              <p className="text-3xl font-bold text-black">{stats.commentsMade}</p>
            </div>
          </div>

          {/* Profile Information */}
          {isEditingProfile ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={editedUser.name || ''}
                    onChange={(e) => setEditedUser({ ...editedUser, name: e.target.value })}
                    className="w-full px-4 py-3 border-3 border-black rounded-xl focus:ring-4 focus:ring-ocean-200 focus:outline-none font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Roll Number</label>
                  <input
                    type="text"
                    value={editedUser.rollNo || ''}
                    onChange={(e) => setEditedUser({ ...editedUser, rollNo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">College</label>
                  <input
                    type="text"
                    value={editedUser.college || ''}
                    onChange={(e) => setEditedUser({ ...editedUser, college: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Degree</label>
                  <input
                    type="text"
                    value={editedUser.degree || ''}
                    onChange={(e) => setEditedUser({ ...editedUser, degree: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                  <input
                    type="text"
                    value={editedUser.course || ''}
                    onChange={(e) => setEditedUser({ ...editedUser, course: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                  <input
                    type="text"
                    value={editedUser.year || ''}
                    onChange={(e) => setEditedUser({ ...editedUser, year: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={editedUser.phone || ''}
                    onChange={(e) => setEditedUser({ ...editedUser, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GitHub URL</label>
                  <input
                    type="url"
                    value={editedUser.githubUrl || ''}
                    onChange={(e) => setEditedUser({ ...editedUser, githubUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL</label>
                  <input
                    type="url"
                    value={editedUser.linkedinUrl || ''}
                    onChange={(e) => setEditedUser({ ...editedUser, linkedinUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea
                  value={editedUser.bio || ''}
                  onChange={(e) => setEditedUser({ ...editedUser, bio: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="A short bio about yourself..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">About</label>
                <textarea
                  value={editedUser.about || ''}
                  onChange={(e) => setEditedUser({ ...editedUser, about: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Tell us more about yourself..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Add a skill..."
                  />
                  <button
                    onClick={handleAddSkill}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {editedUser.skills?.map((skill, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                    >
                      {skill}
                      <button
                        onClick={() => handleRemoveSkill(skill)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => {
                    setEditedUser(user)
                    setIsEditingProfile(false)
                  }}
                  className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">College</p>
                  <p className="font-medium break-words">{user.college}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Degree</p>
                  <p className="font-medium break-words">{user.degree || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Course</p>
                  <p className="font-medium break-words">{user.course}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Year</p>
                  <p className="font-medium break-words">{user.year}</p>
                </div>
                {user.phone && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Phone</p>
                    <p className="font-medium break-words">{user.phone}</p>
                  </div>
                )}
              </div>

              {user.bio && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Bio</p>
                  <p className="text-gray-800 break-words whitespace-pre-wrap">{user.bio}</p>
                </div>
              )}

              {user.about && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">About</p>
                  <p className="text-gray-800 break-words whitespace-pre-wrap">{user.about}</p>
                </div>
              )}

              {user.skills && user.skills.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {user.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                {user.githubUrl && (
                  <a
                    href={user.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    GitHub
                  </a>
                )}
                {user.linkedinUrl && (
                  <a
                    href={user.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    LinkedIn
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Experiences Section */}
        <div className="sticker-card p-6 mb-6">
          <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
            <h2 className="text-2xl font-bold text-black">📝 My Experiences</h2>
            <Link
              href="/post-experience"
              className="sticker-button"
            >
              ➕ Post New Experience
            </Link>
          </div>

          {experiences.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <p className="text-gray-700 font-medium mb-4">You haven't posted any experiences yet.</p>
              <Link
                href="/post-experience"
                className="sticker-button"
              >
                ✨ Post Your First Experience
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {experiences.map((exp) => (
                <div
                  key={exp.id}
                  className="bg-white rounded-xl border-3 border-black p-5 hover:shadow-sticker-hover hover:-translate-y-1 transition-all duration-200"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="text-xl font-bold text-black break-words">
                          {exp.company?.name} - {exp.role}
                        </h3>
                        {getStatusBadge(exp.status)}
                      </div>
                      <div className="flex flex-wrap gap-2 text-sm">
                        <span className="px-3 py-1 bg-mint-100 text-black rounded-lg border-2 border-black font-bold">
                          {exp.experienceType}
                        </span>
                        <span className={`px-3 py-1 rounded-lg border-2 border-black font-bold ${
                          exp.result === 'Selected' ? 'bg-green-100 text-green-800' :
                          exp.result === 'Not Selected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {exp.result}
                        </span>
                        {exp.interviewDate && (
                          <span className="px-3 py-1 bg-peach-100 text-black rounded-lg border-2 border-black font-bold">
                            📅 {new Date(exp.interviewDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="flex items-center text-sm text-black font-bold bg-ocean-100 px-3 py-1 rounded-lg border-2 border-black">
                        <EyeIcon className="w-4 h-4 mr-1" />
                        {exp.views || 0}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/experience/${exp.id}`}
                      className="sticker-button-secondary text-sm"
                    >
                      👁️ View Details
                    </Link>
                    <button
                      onClick={() => handleEditExperience(exp)}
                      disabled={exp.status === 'approved'}
                      className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm whitespace-nowrap ${
                        exp.status === 'approved'
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-yellow-600 text-white hover:bg-yellow-700'
                      }`}
                      title={exp.status === 'approved' ? 'Approved experiences cannot be edited' : 'Edit experience'}
                    >
                      <PencilIcon className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => setDeletingExperience(exp)}
                      className="flex items-center gap-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm whitespace-nowrap"
                    >
                      <TrashIcon className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Experience Modal */}
      {editingExperience && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Edit Experience</h3>
              <button
                onClick={() => {
                  setEditingExperience(null)
                  setEditFormData(null)
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {actionLoading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading...</p>
              </div>
            ) : editFormData ? (
              <div className="p-6 space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> You can only edit pending experiences. Once approved, experiences cannot be edited.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                  <input
                    type="text"
                    value={editFormData.role}
                    onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Experience Type *</label>
                    <select
                      value={editFormData.experienceType}
                      onChange={(e) => setEditFormData({ ...editFormData, experienceType: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="Internship">Internship</option>
                      <option value="Full-Time">Full-Time</option>
                      <option value="Apprenticeship">Apprenticeship</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Result *</label>
                    <select
                      value={editFormData.result}
                      onChange={(e) => setEditFormData({ ...editFormData, result: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="Selected">Selected</option>
                      <option value="Not Selected">Not Selected</option>
                      <option value="Pending">Pending</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Interview Date</label>
                    <input
                      type="date"
                      value={editFormData.interviewDate}
                      onChange={(e) => setEditFormData({ ...editFormData, interviewDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input
                      type="text"
                      value={editFormData.location}
                      onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Bangalore, Remote"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Overall Interview Process</label>
                  <textarea
                    value={editFormData.overallExperience}
                    onChange={(e) => setEditFormData({ ...editFormData, overallExperience: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe the overall interview process..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Technical / Coding Rounds</label>
                  <textarea
                    value={editFormData.technicalRounds}
                    onChange={(e) => setEditFormData({ ...editFormData, technicalRounds: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe technical rounds, questions asked, etc..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">HR / Behavioral Rounds</label>
                  <textarea
                    value={editFormData.hrRounds}
                    onChange={(e) => setEditFormData({ ...editFormData, hrRounds: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe HR rounds, behavioral questions, etc..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tips & Advice</label>
                  <textarea
                    value={editFormData.tipsAndAdvice}
                    onChange={(e) => setEditFormData({ ...editFormData, tipsAndAdvice: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Share your tips and advice for future candidates..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleSaveExperience}
                    disabled={actionLoading}
                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-medium"
                  >
                    {actionLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={() => {
                      setEditingExperience(null)
                      setEditFormData(null)
                    }}
                    className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingExperience && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Delete Experience</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete your experience at <strong>{deletingExperience.company?.name}</strong> for the role of <strong>{deletingExperience.role}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDeleteExperience}
                disabled={actionLoading}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 font-medium"
              >
                {actionLoading ? 'Deleting...' : 'Delete'}
              </button>
              <button
                onClick={() => setDeletingExperience(null)}
                disabled={actionLoading}
                className="flex-1 px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
