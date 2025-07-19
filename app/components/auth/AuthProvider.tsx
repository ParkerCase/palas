'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClientComponentClient } from '@/lib/supabase/client'
import type { Session, User } from '@supabase/supabase-js'
import { logger } from '@/lib/utils/logger'

interface AuthContextType {
  session: Session | null
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {}
})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
  session: Session | null
}

export default function AuthProvider({ children, session: initialSession }: AuthProviderProps) {
  // REAL AUTH MODE: Use actual authentication
  const [session, setSession] = useState<Session | null>(initialSession)
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  // Log the singleton client instance
  logger.info('AuthProvider', 'initialized', 'AuthProvider initialized', {
    hasSupabaseClient: !!supabase,
    clientId: supabase?.supabaseKey?.slice(-8) || 'unknown'
  })

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: string, session: Session | null) => {
      setSession(session)
      setLoading(false)
      
      logger.info('AuthProvider', 'auth_state_change', `Auth state changed: ${event}`, {
        event,
        hasSession: !!session,
        userId: session?.user?.id
      })
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const signOut = async () => {
    await supabase.auth.signOut()
    setSession(null)
    logger.info('AuthProvider', 'signOut', 'User signed out', {
      action: 'signOut'
    })
  }

  const value = {
    session,
    user: session?.user || null,
    loading,
    signOut
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
