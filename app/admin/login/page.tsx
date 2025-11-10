'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Navbar from '../../components/Navbar'

export default function AdminLogin() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Import API function
      const { authAPI } = await import('../../lib/api')
      
      const response = await authAPI.adminLogin(formData)

      if (response.success) {
        alert('✅ Admin login successful! Welcome to admin panel!')
        router.push('/admin/dashboard')
      } else {
        alert('❌ ' + (response.message || 'Login failed. Please check your credentials.'))
      }
    } catch (error) {
      console.error('Admin login error:', error)
      alert('❌ Login failed. Please check your connection and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar isLoggedIn={false} user={null} />
      
      <div className="py-12 px-4">
        <div className="max-w-md mx-auto">
          <div className="sticker-card p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-peach-400 to-ocean-400 rounded-xl border-4 border-black mx-auto mb-4 flex items-center justify-center">
                <span className="text-white font-bold text-2xl">A</span>
              </div>
              <h1 className="text-3xl font-bold text-black">
                Admin Portal
              </h1>
              <p className="text-gray-600 mt-2">Placement Cell / TPO Access</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  Admin Email
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="sticker-input"
                  placeholder="admin@college.edu"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  Admin Password
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="sticker-input"
                  placeholder="Enter admin password"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full sticker-button disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Signing In...' : 'Admin Sign In'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link href="/login" className="text-sm text-gray-500 hover:text-ocean-600">
                ← Back to Student Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}