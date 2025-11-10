'use client'

import { useState } from 'react'
import { EyeIcon, CheckIcon, XMarkIcon, TrashIcon, CalendarIcon, UserIcon } from '@heroicons/react/24/outline'

interface Experience {
  id: number
  company: string
  role: string
  author: string
  authorBranch: string
  authorYear: string
  submittedDate: string
  experienceType: string
  result: string
  status: string
  approvedDate?: string
  rejectionReason?: string
}

interface PendingExperienceCardProps {
  experience: Experience
  onApprove: (id: number) => void
  onReject: (id: number, reason: string) => void
  onDelete: (id: number, tab: string) => void
  currentTab: string
}

export default function PendingExperienceCard({ 
  experience, 
  onApprove, 
  onReject, 
  onDelete, 
  currentTab 
}: PendingExperienceCardProps) {
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [showFullView, setShowFullView] = useState(false)

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason')
      return
    }
    onReject(experience.id, rejectionReason)
    setShowRejectModal(false)
    setRejectionReason('')
  }

  const handleViewFull = () => {
    setShowFullView(true)
    // In a real app, this would open a modal or navigate to a detailed view
    alert(`Viewing full experience for ${experience.company} - ${experience.role}`)
  }

  return (
    <>
      <div className="sticker-card p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-ocean-400 to-mint-400 rounded-xl border-2 border-black flex items-center justify-center">
              <span className="text-white font-bold text-lg">
                {experience.company.charAt(0)}
              </span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-black">
                {experience.company} - {experience.role}
              </h3>
              <div className="flex items-center space-x-4 text-gray-600 text-sm mt-1">
                <div className="flex items-center space-x-1">
                  <UserIcon className="h-4 w-4" />
                  <span>
                    {experience.author} ({experience.authorYear} {experience.authorBranch})
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <CalendarIcon className="h-4 w-4" />
                  <span>{experience.submittedDate}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full border-2 border-black text-sm font-semibold ${
              experience.result === 'Selected' 
                ? 'bg-mint-200 text-mint-800' 
                : 'bg-peach-200 text-peach-800'
            }`}>
              {experience.result}
            </span>
            <span className="px-3 py-1 rounded-full border-2 border-black text-sm font-semibold bg-ocean-200 text-ocean-800">
              {experience.experienceType}
            </span>
          </div>
        </div>

        {/* Status-specific information */}
        {experience.status === 'approved' && experience.approvedDate && (
          <div className="mb-4 p-3 bg-mint-100 border-2 border-mint-300 rounded-lg">
            <span className="text-mint-800 font-semibold">
              ✅ Approved on {experience.approvedDate}
            </span>
          </div>
        )}

        {experience.status === 'rejected' && experience.rejectionReason && (
          <div className="mb-4 p-3 bg-peach-100 border-2 border-peach-300 rounded-lg">
            <div className="text-peach-800 font-semibold mb-1">❌ Rejected</div>
            <div className="text-peach-700 text-sm">
              Reason: {experience.rejectionReason}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleViewFull}
            className="flex items-center space-x-2 bg-ocean-400 text-white px-4 py-2 rounded-lg border-2 border-black font-semibold hover:bg-ocean-500 transition-colors"
          >
            <EyeIcon className="h-4 w-4" />
            <span>View Full</span>
          </button>

          {currentTab === 'pending' && (
            <>
              <button
                onClick={() => onApprove(experience.id)}
                className="flex items-center space-x-2 bg-mint-400 text-black px-4 py-2 rounded-lg border-2 border-black font-semibold hover:bg-mint-500 transition-colors"
              >
                <CheckIcon className="h-4 w-4" />
                <span>Approve</span>
              </button>
              <button
                onClick={() => setShowRejectModal(true)}
                className="flex items-center space-x-2 bg-peach-400 text-black px-4 py-2 rounded-lg border-2 border-black font-semibold hover:bg-peach-500 transition-colors"
              >
                <XMarkIcon className="h-4 w-4" />
                <span>Reject</span>
              </button>
            </>
          )}

          <button
            onClick={() => onDelete(experience.id, currentTab)}
            className="flex items-center space-x-2 bg-red-400 text-white px-4 py-2 rounded-lg border-2 border-black font-semibold hover:bg-red-500 transition-colors"
          >
            <TrashIcon className="h-4 w-4" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="sticker-card p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-black mb-4">
              Reject Experience
            </h3>
            <p className="text-gray-600 mb-4">
              Please provide a reason for rejecting this experience:
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
              className="sticker-input resize-none mb-4"
              placeholder="Enter rejection reason..."
            />
            <div className="flex space-x-3">
              <button
                onClick={handleReject}
                className="flex-1 bg-peach-400 text-black px-4 py-2 rounded-lg border-2 border-black font-semibold hover:bg-peach-500 transition-colors"
              >
                Reject
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(false)
                  setRejectionReason('')
                }}
                className="flex-1 bg-gray-200 text-black px-4 py-2 rounded-lg border-2 border-black font-semibold hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}