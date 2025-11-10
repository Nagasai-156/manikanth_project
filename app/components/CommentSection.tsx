'use client'

import { useState, useEffect } from 'react'
import { commentAPI, utils } from '../lib/api'
import { Comment, User } from '../types/api'

interface CommentSectionProps {
  experienceId: string
}

export default function CommentSection({ experienceId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [showAllComments, setShowAllComments] = useState(false)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')

  useEffect(() => {
    const userData = utils.getUser()
    setUser(userData)
    loadComments()
    
    const interval = setInterval(() => {
      loadComments()
    }, 5000)
    
    return () => clearInterval(interval)
  }, [experienceId])

  const loadComments = async () => {
    try {
      const response = await commentAPI.getComments(experienceId)
      
      if (response.success && response.data) {
        const commentsData = response.data.comments || []
        setComments(Array.isArray(commentsData) ? commentsData : [])
      } else {
        setComments([])
      }
    } catch (error) {
      console.error('Error loading comments:', error)
      setComments([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !user) {
      if (!user) alert('Please login to comment')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await commentAPI.createComment(experienceId, {
        content: newComment.trim()
      })

      if (response.success) {
        setNewComment('')
        await loadComments()
      } else {
        alert(response.message || 'Failed to post comment')
      }
    } catch (error) {
      console.error('Error posting comment:', error)
      alert('Failed to post comment')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent.trim() || !user) {
      if (!user) alert('Please login to reply')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await commentAPI.createComment(experienceId, {
        content: replyContent.trim(),
        parentId: parentId
      } as any)

      if (response.success) {
        setReplyContent('')
        setReplyingTo(null)
        await loadComments()
      } else {
        alert(response.message || 'Failed to post reply')
      }
    } catch (error) {
      console.error('Error posting reply:', error)
      alert('Failed to post reply')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatTimestamp = (timestamp: string | undefined) => {
    if (!timestamp) return 'Just now'
    
    const date = new Date(timestamp)
    if (isNaN(date.getTime())) return 'Just now'
    
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="sticker-card p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-300 rounded w-32"></div>
          <div className="h-20 bg-gray-200 rounded-xl"></div>
          <div className="h-20 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    )
  }

  const displayedComments = comments.slice(0, 5)
  const hasMoreComments = comments.length > 5
  const totalComments = comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0)

  return (
    <>
      <div className="sticker-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-black flex items-center gap-2">
            <span className="text-2xl">💬</span>
            Comments ({totalComments})
          </h2>
        </div>

        {/* Add Comment Form */}
        {user ? (
          <form onSubmit={handleSubmitComment} className="mb-6">
            <div className="flex gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-ocean-400 to-mint-400 rounded-full border-3 border-black flex items-center justify-center flex-shrink-0 shadow-sticker">
                <span className="text-white font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  rows={2}
                  className="w-full px-4 py-2 border-3 border-black rounded-xl bg-white focus:outline-none focus:ring-4 focus:ring-ocean-200 transition-all resize-none text-sm font-medium"
                />
                <div className="flex justify-end mt-2">
                  <button
                    type="submit"
                    disabled={!newComment.trim() || isSubmitting}
                    className="px-5 py-2 bg-ocean-400 text-white rounded-lg border-3 border-black font-bold text-sm hover:bg-ocean-500 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sticker"
                  >
                    {isSubmitting ? '⏳ Posting...' : '💬 Post'}
                  </button>
                </div>
              </div>
            </div>
          </form>
        ) : (
          <div className="mb-6 p-4 bg-yellow-50 border-3 border-yellow-400 rounded-xl">
            <p className="text-yellow-800 text-sm font-bold">
              🔒 Please login to post comments
            </p>
          </div>
        )}

        {/* Comments List */}
        <div className="space-y-4">
          {!Array.isArray(comments) || comments.length === 0 ? (
            <div className="text-center py-12 bg-gradient-to-br from-mint-50 to-peach-50 rounded-xl border-3 border-black">
              <div className="text-6xl mb-3">💭</div>
              <p className="text-gray-700 font-bold text-lg mb-1">No comments yet</p>
              <p className="text-gray-600 text-sm">Be the first to share your thoughts!</p>
            </div>
          ) : (
            <>
              {displayedComments.map((comment) => {
                const commentUser = comment.users || comment.user
                const userName = commentUser?.name || 'Anonymous'
                const userInitial = userName.charAt(0).toUpperCase()
                const repliesCount = comment.replies?.length || 0
                
                return (
                  <div key={comment.id} className="space-y-3">
                    {/* Main Comment */}
                    <div className="flex gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-peach-400 to-mint-400 rounded-full border-3 border-black flex items-center justify-center flex-shrink-0 shadow-sticker">
                        <span className="text-white font-bold">
                          {userInitial}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="bg-white rounded-xl border-3 border-black p-4 shadow-sticker hover:shadow-sticker-hover transition-all">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <span className="font-bold text-black">{userName}</span>
                              {commentUser?.course && commentUser?.year && (
                                <span className="text-xs text-gray-600 ml-2">
                                  {commentUser.year} • {commentUser.course}
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-gray-500 font-medium whitespace-nowrap">
                              {formatTimestamp(comment.created_at)}
                            </span>
                          </div>
                          <p className="text-gray-800 text-sm break-words whitespace-pre-wrap mb-3">
                            {comment.content}
                          </p>
                          {user && (
                            <button
                              onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                              className="text-xs text-ocean-600 hover:text-ocean-700 font-bold flex items-center gap-1 hover:gap-2 transition-all"
                            >
                              <span>↩️</span> Reply
                            </button>
                          )}
                        </div>

                        {/* Reply Form */}
                        {replyingTo === comment.id && user && (
                          <div className="mt-3 ml-6 flex gap-2 animate-in slide-in-from-top-2 duration-200">
                            <div className="w-8 h-8 bg-gradient-to-br from-mint-400 to-ocean-400 rounded-full border-2 border-black flex items-center justify-center flex-shrink-0">
                              <span className="text-white font-bold text-sm">
                                {user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1">
                              <textarea
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                placeholder={`Reply to ${userName}...`}
                                rows={2}
                                autoFocus
                                className="w-full px-3 py-2 border-2 border-black rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-ocean-200 transition-all resize-none text-sm"
                              />
                              <div className="flex justify-end gap-2 mt-2">
                                <button
                                  onClick={() => {
                                    setReplyingTo(null)
                                    setReplyContent('')
                                  }}
                                  className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800 font-bold"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleSubmitReply(comment.id)}
                                  disabled={!replyContent.trim() || isSubmitting}
                                  className="px-4 py-1 bg-ocean-400 text-white rounded-lg border-2 border-black font-bold text-xs hover:bg-ocean-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                  {isSubmitting ? '⏳' : '↩️'} Reply
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Replies */}
                        {repliesCount > 0 && (
                          <div className="mt-3 ml-6 space-y-3 border-l-3 border-mint-300 pl-4">
                            {comment.replies?.map((reply) => {
                              const replyUser = reply.users || reply.user
                              const replyUserName = replyUser?.name || 'Anonymous'
                              const replyUserInitial = replyUserName.charAt(0).toUpperCase()
                              
                              return (
                                <div key={reply.id} className="flex gap-2">
                                  <div className="w-8 h-8 bg-gradient-to-br from-mint-400 to-peach-400 rounded-full border-2 border-black flex items-center justify-center flex-shrink-0">
                                    <span className="text-white font-bold text-sm">
                                      {replyUserInitial}
                                    </span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="bg-mint-50 rounded-lg border-2 border-mint-200 p-3">
                                      <div className="flex items-start justify-between gap-2 mb-1">
                                        <span className="font-bold text-black text-sm">
                                          {replyUserName}
                                        </span>
                                        <span className="text-xs text-gray-500 whitespace-nowrap">
                                          {formatTimestamp(reply.created_at)}
                                        </span>
                                      </div>
                                      <p className="text-gray-800 text-sm break-words whitespace-pre-wrap">
                                        {reply.content}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
              
              {hasMoreComments && (
                <div className="text-center pt-4">
                  <button
                    onClick={() => setShowAllComments(true)}
                    className="px-6 py-3 bg-gradient-to-r from-mint-400 to-ocean-400 text-white rounded-xl border-3 border-black font-bold hover:-translate-y-1 transition-all shadow-sticker hover:shadow-sticker-hover"
                  >
                    👀 View All {totalComments} Comments
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* All Comments Modal */}
      {showAllComments && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border-4 border-black shadow-sticker-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b-4 border-black bg-gradient-to-r from-mint-100 to-ocean-100">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-black flex items-center gap-2">
                  <span className="text-3xl">💬</span>
                  All Comments ({totalComments})
                </h3>
                <button
                  onClick={() => setShowAllComments(false)}
                  className="w-10 h-10 flex items-center justify-center text-2xl font-bold text-black hover:text-red-500 hover:bg-red-100 rounded-full transition-all"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {comments.map((comment) => {
                  const commentUser = comment.users || comment.user
                  const userName = commentUser?.name || 'Anonymous'
                  const userInitial = userName.charAt(0).toUpperCase()
                  
                  return (
                    <div key={comment.id} className="space-y-4">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-peach-400 to-mint-400 rounded-full border-3 border-black flex items-center justify-center flex-shrink-0 shadow-sticker">
                          <span className="text-white font-bold text-lg">
                            {userInitial}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="bg-white rounded-xl border-3 border-black p-5 shadow-sticker">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <span className="font-bold text-black text-lg">{userName}</span>
                                {commentUser?.course && commentUser?.year && (
                                  <span className="text-sm text-gray-600 ml-2">
                                    {commentUser.year} • {commentUser.course}
                                  </span>
                                )}
                              </div>
                              <span className="text-sm text-gray-500 font-medium">
                                {formatTimestamp(comment.created_at)}
                              </span>
                            </div>
                            <p className="text-gray-800 break-words whitespace-pre-wrap">
                              {comment.content}
                            </p>
                          </div>

                          {/* Replies in Modal */}
                          {comment.replies && comment.replies.length > 0 && (
                            <div className="mt-4 ml-8 space-y-3 border-l-3 border-mint-300 pl-4">
                              {comment.replies.map((reply) => {
                                const replyUser = reply.users || reply.user
                                const replyUserName = replyUser?.name || 'Anonymous'
                                const replyUserInitial = replyUserName.charAt(0).toUpperCase()
                                
                                return (
                                  <div key={reply.id} className="flex gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-mint-400 to-peach-400 rounded-full border-3 border-black flex items-center justify-center flex-shrink-0">
                                      <span className="text-white font-bold">
                                        {replyUserInitial}
                                      </span>
                                    </div>
                                    <div className="flex-1">
                                      <div className="bg-mint-50 rounded-lg border-2 border-mint-200 p-4">
                                        <div className="flex items-center justify-between mb-2">
                                          <span className="font-bold text-black">
                                            {replyUserName}
                                          </span>
                                          <span className="text-sm text-gray-500">
                                            {formatTimestamp(reply.created_at)}
                                          </span>
                                        </div>
                                        <p className="text-gray-800 break-words whitespace-pre-wrap">
                                          {reply.content}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
