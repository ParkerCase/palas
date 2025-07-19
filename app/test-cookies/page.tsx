'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { createClientComponentClient } from '@/lib/supabase/client'
import { logger } from '@/lib/utils/logger'

export default function TestCookiesPage() {
  const [cookies, setCookies] = useState<string[]>([])
  const [authState, setAuthState] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const supabase = createClientComponentClient()

  useEffect(() => {
    // Check current cookies
    const allCookies = document.cookie.split(';').map(c => c.trim())
    setCookies(allCookies)
    
    // Check auth state
    checkAuthState()
  }, [])

  const checkAuthState = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      setAuthState({ session, error })
      
      logger.info('TestCookies', 'auth_check', 'Auth state checked', {
        hasSession: !!session,
        userId: session?.user?.id,
        error: error?.message
      })
    } catch (error) {
      setAuthState({ error: String(error) })
    }
  }

  const signIn = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'ParkerE.Case@gmail.com',
        password: 'January_0119!'
      })

      if (error) {
        setAuthState({ error: error.message })
      } else {
        setAuthState({ session: data.session, user: data.user })
        
        // Refresh cookies after sign in
        setTimeout(() => {
          const allCookies = document.cookie.split(';').map(c => c.trim())
          setCookies(allCookies)
        }, 1000)
      }
    } catch (error) {
      setAuthState({ error: String(error) })
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    setLoading(true)
    try {
      await supabase.auth.signOut()
      setAuthState({ session: null, user: null })
      
      // Refresh cookies after sign out
      setTimeout(() => {
        const allCookies = document.cookie.split(';').map(c => c.trim())
        setCookies(allCookies)
      }, 1000)
    } catch (error) {
      setAuthState({ error: String(error) })
    } finally {
      setLoading(false)
    }
  }

  const testServerAuth = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/debug-auth')
      const data = await response.json()
      setAuthState({ serverResponse: data })
    } catch (error) {
      setAuthState({ serverError: String(error) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Cookie and Auth Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Current Cookies</h2>
          <div className="bg-gray-100 p-4 rounded">
            {cookies.length > 0 ? (
              <ul className="space-y-2">
                {cookies.map((cookie, index) => (
                  <li key={index} className="text-sm font-mono break-all">
                    {cookie}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No cookies found</p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Auth State</h2>
          <div className="bg-gray-100 p-4 rounded">
            <pre className="text-sm overflow-auto">
              {JSON.stringify(authState, null, 2)}
            </pre>
          </div>
        </div>
      </div>

      <div className="mt-6 space-x-4">
        <Button onClick={signIn} disabled={loading}>
          Sign In
        </Button>
        <Button onClick={signOut} disabled={loading} variant="outline">
          Sign Out
        </Button>
        <Button onClick={checkAuthState} disabled={loading} variant="secondary">
          Check Auth
        </Button>
        <Button onClick={testServerAuth} disabled={loading} variant="destructive">
          Test Server Auth
        </Button>
      </div>

      {loading && <p className="mt-4 text-blue-600">Loading...</p>}
    </div>
  )
} 