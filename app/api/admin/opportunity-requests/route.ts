import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

/**
 * Admin endpoint to fetch all opportunity requests
 * Uses service role to bypass RLS restrictions
 */
export async function GET(request: NextRequest) {
  try {
    // Use service role client to bypass RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    if (!supabaseServiceKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY is not configured')
      // Fallback to regular client - will use admin view
      const { createRouteHandlerClient } = await import('@/lib/supabase/server')
      const supabase = createRouteHandlerClient(request)
      
      // Try using the admin view
      const { data: requestsData, error } = await supabase
        .from('admin_opportunity_requests_view')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching from admin view:', error)
        // Fallback: try direct query
        const { data: directData, error: directError } = await supabase
          .from('opportunity_requests')
          .select(`
            *,
            profiles!opportunity_requests_user_id_fkey(email, full_name),
            companies!opportunity_requests_company_id_fkey(name)
          `)
          .order('created_at', { ascending: false })
        
        if (directError) {
          return NextResponse.json(
            { error: 'Failed to fetch requests', details: directError.message },
            { status: 500 }
          )
        }
        
        const transformedRequests = (directData || []).map((req: any) => ({
          ...req,
          user_email: req.profiles?.email,
          user_name: req.profiles?.full_name,
          company_name: req.companies?.name
        }))
        
        return NextResponse.json({ requests: transformedRequests })
      }

      return NextResponse.json({ requests: requestsData || [] })
    }

    // Use service role client
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    
    const { data: requestsData, error } = await supabase
      .from('opportunity_requests')
      .select(`
        *,
        profiles!opportunity_requests_user_id_fkey(email, full_name),
        companies!opportunity_requests_company_id_fkey(name)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching opportunity requests:', error)
      return NextResponse.json(
        { error: 'Failed to fetch requests', details: error.message },
        { status: 500 }
      )
    }

    // Transform the data to include user and company info
    const transformedRequests = (requestsData || []).map((req: any) => ({
      ...req,
      user_email: req.profiles?.email,
      user_name: req.profiles?.full_name,
      company_name: req.companies?.name
    }))

    return NextResponse.json({ requests: transformedRequests })
  } catch (error) {
    console.error('Error in GET /api/admin/opportunity-requests:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

