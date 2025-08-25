'use client'

import { useAuth } from '../../components/auth/AuthProvider'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import AICommandCenter from '@/components/ai/AICommandCenter'

// List of authorized email addresses
const AUTHORIZED_EMAILS = [
  'parker@parkercase.co',
  'parker@parkercase.com',
  // Add any other authorized emails here
]

export default function ExecOnlyPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Redirect to login if not authenticated
        router.push('/login')
        return
      }

      // Check if user's email is authorized
      const userEmail = user.email?.toLowerCase()
      const authorized = AUTHORIZED_EMAILS.some(email => 
        email.toLowerCase() === userEmail
      )

      if (!authorized) {
        // Redirect unauthorized users to dashboard
        router.push('/dashboard')
        return
      }

      setIsAuthorized(true)
      setCheckingAuth(false)
    }
  }, [user, loading, router])

  if (loading || checkingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!isAuthorized) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Executive Header */}
      <header className="bg-gradient-to-r from-purple-900 to-blue-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold">🔐 Executive Access</h1>
              <span className="text-sm bg-purple-700 px-3 py-1 rounded-full">
                {user?.email}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-white hover:text-purple-200 transition-colors"
              >
                ← Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* AI Command Center */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            AI Command Center
          </h2>
          <p className="text-gray-600">
            Advanced AI-powered insights and analysis for executive decision making
          </p>
        </div>
        
        <AICommandCenter />
      </main>
    </div>
  )
}
