'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { utils } from '../lib/api'

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  requireAdmin?: boolean
  redirectTo?: string
}

export default function AuthGuard({ 
  children, 
  requireAuth = true, 
  requireAdmin = false,
  redirectTo = '/login' 
}: AuthGuardProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    const checkAuth = () => {
      const isAuthenticated = utils.isAuthenticated()
      const user = utils.getUser()
      const isAdmin = utils.isAdmin()

      if (requireAuth && !isAuthenticated) {
        router.push(redirectTo)
        return
      }

      if (requireAdmin && !isAdmin) {
        router.push('/login')
        return
      }

      setIsAuthorized(true)
      setIsLoading(false)
    }

    checkAuth()
  }, [requireAuth, requireAdmin, redirectTo, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ocean-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    return null
  }

  return <>{children}</>
}