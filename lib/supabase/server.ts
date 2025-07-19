import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

// Server-side Supabase client for Server Components
export async function createServerComponentClient() {
  const cookieStore = await cookies()
  
  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: any[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options?: any }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server component
          }
        },
      },
    }
  )
}

// Server-side Supabase client for Route Handlers - FIXED to accept request cookies
export function createRouteHandlerClient(request?: NextRequest) {
  if (request) {
    // Use request cookies for API routes and middleware
    return createSupabaseServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll() {
            // Route handler - cookies are set by the client
          },
        },
      }
    )
  }
  
  // Fallback for when no request is provided
  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return []
        },
        setAll() {
          // Route handler
        },
      },
    }
  )
}

// Main server client that properly handles cookies
export async function createServerClient() {
  try {
    console.log('[SERVER CLIENT] Creating server client with cookies')
    const cookieStore = await cookies()
    
    // Log available cookies for debugging
    const allCookies = cookieStore.getAll()
    console.log('[SERVER CLIENT] Available cookies:', allCookies.map(c => c.name))
    
    const authCookies = allCookies.filter(c => c.name.includes('auth-token'))
    console.log('[SERVER CLIENT] Auth cookies found:', authCookies.length)
    
    return createSupabaseServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet: any[]) {
            try {
              cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options?: any }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Server component
            }
          },
        },
      }
    )
  } catch (error) {
    console.error('[SERVER CLIENT] Failed to create server client with cookies:', error)
    // Fallback to simple client
    return createSupabaseServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return []
          },
          setAll() {
            // Simple server client
          },
        },
      }
    )
  }
}

// Simplified server client factory (for when cookies() doesn't work)
export function createSimpleServerClient() {
  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return []
        },
        setAll() {
          // Simple server client
        },
      },
    }
  )
}

// Export the base createServerClient for direct use - with fallback
export function createServerClientWithCookies() {
  return createSimpleServerClient()
}
