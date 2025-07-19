import { createRouteHandlerClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

// Auth helper for API routes that can handle request cookies
export async function getAuthUserFromRequest(request: NextRequest) {
  try {
    console.log('[API AUTH] Request cookies:', request.cookies.getAll().map(c => c.name))
    
    // Create Supabase client with request cookies using our fixed client
    const supabase = createRouteHandlerClient(request)

    // Get the authenticated user
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error('[API AUTH] Auth error:', error)
      return null
    }
    
    if (!user) {
      console.log('[API AUTH] No authenticated user found')
      return null
    }

    console.log('[API AUTH] User authenticated:', user.id, user.email)
    return user
  } catch (error) {
    console.error('[API AUTH] Unexpected error:', error)
    return null
  }
}

// Helper to check if user is authenticated in API routes
export async function requireApiAuth(request: NextRequest) {
  const user = await getAuthUserFromRequest(request)
  
  if (!user) {
    throw new Error('Unauthorized')
  }
  
  return user
} 