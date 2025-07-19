import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'

export async function middleware(request: NextRequest) {
  const startTime = Date.now()
  const requestId = Math.random().toString(36).substring(7)
  
  // Log the incoming request
  console.log(`[${new Date().toISOString()}] MIDDLEWARE [REQUEST] ${request.method} ${request.url} - Request started`, {
    requestId,
    method: request.method,
    url: request.url,
    pathname: request.nextUrl.pathname,
    searchParams: Object.fromEntries(request.nextUrl.searchParams.entries()),
    headers: Object.fromEntries(request.headers.entries()),
    userAgent: request.headers.get('user-agent'),
    referer: request.headers.get('referer'),
    ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  })

  try {
    const res = NextResponse.next()
    
    // Create Supabase client using the FIXED route handler client with request cookies
    const supabase = createRouteHandlerClient(request)

    // Log authentication check
    console.log(`[${new Date().toISOString()}] MIDDLEWARE [AUTH] Checking authentication - ${requestId}`)

    // Debug: Log all cookies to see what's available
    const allCookies = request.cookies.getAll()
    console.log(`[${new Date().toISOString()}] MIDDLEWARE [DEBUG] Available cookies`, {
      requestId,
      cookieCount: allCookies.length,
      cookies: allCookies.map(c => ({ name: c.name, value: c.value.substring(0, 50) + '...' }))
    })

    // Debug: Check for specific Supabase auth cookies
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const projectId = supabaseUrl.split('//')[1].split('.')[0]
    const expectedCookieName = `sb-${projectId}-auth-token`
    
    // Find the expected cookie
    const expectedCookie = allCookies.find(c => c.name === expectedCookieName)
    
    console.log(`[${new Date().toISOString()}] MIDDLEWARE [DEBUG] Cookie analysis`, {
      requestId,
      supabaseUrl,
      projectId,
      expectedCookieName,
      hasExpectedCookie: !!expectedCookie,
      expectedCookieValue: expectedCookie ? expectedCookie.value.substring(0, 100) + '...' : 'NOT FOUND',
      supabaseCookies: allCookies.filter(c => c.name.startsWith('sb-')).map(c => ({ name: c.name, value: c.value.substring(0, 50) + '...' }))
    })

    // Try getUser() instead of getSession()
    const {
      data: { user },
      error
    } = await supabase.auth.getUser()

    // Debug: Log any auth errors
    if (error) {
      console.log(`[${new Date().toISOString()}] MIDDLEWARE [ERROR] Auth error`, {
        requestId,
        error: error.message,
        code: error.status
      })
    }

    // Debug: Log user details
    console.log(`[${new Date().toISOString()}] MIDDLEWARE [DEBUG] User details`, {
      requestId,
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      currentTime: Math.floor(Date.now() / 1000)
    })

    // Create a session object for compatibility
    const session = user ? { user } : null

    // Log authentication result
    console.log(`[${new Date().toISOString()}] MIDDLEWARE [AUTH] Authentication result`, {
      requestId,
      hasSession: !!session,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      pathname: request.nextUrl.pathname
    })

    // ENABLE MIDDLEWARE AUTH CHECK - Now that cookies are properly handled
    if (!session && request.nextUrl.pathname.startsWith('/dashboard')) {
      console.log(`[${new Date().toISOString()}] MIDDLEWARE [REDIRECT] Redirecting to login`, {
        requestId,
        pathname: request.nextUrl.pathname,
        reason: 'No session found'
      })
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Allow authenticated users to access setup-profile page
    if (session && request.nextUrl.pathname === '/setup-profile') {
      console.log(`[${new Date().toISOString()}] MIDDLEWARE [ALLOW] Allowing access to setup-profile`, {
        requestId,
        userId: session.user.id,
        reason: 'Profile setup in progress'
      })
      return NextResponse.next()
    }

    // Only redirect from login if user is authenticated AND has a profile
    // We'll let the dashboard layout handle the profile check
    if (session && request.nextUrl.pathname === '/login') {
      console.log(`[${new Date().toISOString()}] MIDDLEWARE [REDIRECT] Redirecting to dashboard`, {
        requestId,
        userId: session.user.id,
        reason: 'User already authenticated'
      })
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // ENABLE MIDDLEWARE AUTH CHECK - Now that redirect loop is fixed
    console.log(`[${new Date().toISOString()}] MIDDLEWARE [DEBUG] Processing request`, {
      requestId,
      pathname: request.nextUrl.pathname,
      hasSession: !!session,
      hasUser: !!user
    })
    
    /*
    // Check if user is authenticated
    if (!session) {
      // Log unauthenticated access attempt
      console.log(`[${new Date().toISOString()}] MIDDLEWARE [AUTH] Unauthenticated access attempt`, {
        requestId,
        pathname: request.nextUrl.pathname,
        redirectTo: '/login'
      })

      // Redirect to login if accessing protected routes
      if (request.nextUrl.pathname.startsWith('/dashboard') || 
          request.nextUrl.pathname.startsWith('/admin') ||
          request.nextUrl.pathname.startsWith('/api/protected')) {
        
        const redirectUrl = new URL('/login', request.url)
        redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
        
        console.log(`[${new Date().toISOString()}] MIDDLEWARE [REDIRECT] Redirecting to login`, {
          requestId,
          from: request.nextUrl.pathname,
          to: redirectUrl.toString()
        })

        return NextResponse.redirect(redirectUrl)
      }
    } else {
      // Log authenticated access
      console.log(`[${new Date().toISOString()}] MIDDLEWARE [AUTH] Authenticated access`, {
        requestId,
        userId: session.user.id,
        userEmail: session.user.email,
        pathname: request.nextUrl.pathname
      })

      // Check for admin routes
      if (request.nextUrl.pathname.startsWith('/admin')) {
        // Log admin access attempt
        console.log(`[${new Date().toISOString()}] MIDDLEWARE [ADMIN] Admin access attempt`, {
          requestId,
          userId: session.user.id,
          userEmail: session.user.email,
          pathname: request.nextUrl.pathname
        })

        // TODO: Add admin role check here
        // For now, allow all authenticated users to access admin routes
        // In production, you should check the user's role
      }
    }
    */

    // Add request ID to headers for tracking
    res.headers.set('x-request-id', requestId)
    res.headers.set('x-response-time', `${Date.now() - startTime}ms`)

    // Log successful middleware completion
    console.log(`[${new Date().toISOString()}] MIDDLEWARE [SUCCESS] Request processed successfully`, {
      requestId,
      method: request.method,
      pathname: request.nextUrl.pathname,
      responseTime: Date.now() - startTime,
      userId: session?.user?.id
    })

    return res
  } catch (error) {
    // Log middleware error
    console.error(`[${new Date().toISOString()}] MIDDLEWARE [ERROR] Request processing failed`, {
      requestId,
      method: request.method,
      pathname: request.nextUrl.pathname,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      responseTime: Date.now() - startTime
    })

    // Return error response
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}
