'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { utils, authAPI } from '../../lib/api'

export default function AdminNavbar() {
  const router = useRouter()
  const [adminName, setAdminName] = useState('Admin')

  useEffect(() => {
    // Get admin info from localStorage (separate from user)
    const admin = utils.getUser(true)
    if (admin) {
      setAdminName(admin.name || 'Admin')
    } else {
      // If no admin logged in, redirect to login
      router.push('/admin/login')
    }
  }, [])

  const handleLogout = async () => {
    try {
      await authAPI.adminLogout()
      alert('✅ Logged out successfully')
      router.push('/admin/login')
    } catch (error) {
      console.error('Logout error:', error)
      router.push('/admin/login')
    }
  }

  return (
    <nav className="bg-orange-500 border-b-4 border-black">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white rounded-lg border-2 border-black flex items-center justify-center">
              <span className="text-xl font-bold">A</span>
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">Admin Panel</h1>
              <p className="text-orange-100 text-sm">👤 {adminName}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="text-white font-semibold hover:text-orange-100 transition-colors"
            >
              Dashboard
            </button>
            <button
              onClick={handleLogout}
              className="bg-white text-orange-600 px-4 py-2 rounded-lg border-2 border-black font-semibold hover:bg-orange-50 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
