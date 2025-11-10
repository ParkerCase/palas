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
      
      // Try using the admin view first
      const { data: viewData, error: viewError } = await supabase
        .from('admin_opportunity_requests_view')
        .select('*')
        .order('created_at', { ascending: false })

      if (!viewError && viewData) {
        // Transform view data to match expected format
        const transformedRequests = (viewData || []).map((req: any) => ({
          id: req.id,
          user_id: req.user_id,
          company_id: req.company_id,
          requested_by: req.requested_by,
          request_type: req.request_type,
          target_counties: req.target_counties,
          target_cities: req.target_cities,
          industry_codes: req.industry_codes,
          budget_min: req.budget_min,
          budget_max: req.budget_max,
          status: req.status,
          notes: req.notes,
          created_at: req.created_at,
          updated_at: req.updated_at,
          email_sent: req.email_sent,
          email_sent_at: req.email_sent_at,
          processed_by: req.processed_by,
          processed_at: req.processed_at,
          search_query_used: req.search_query_used,
          search_results: req.search_results,
          user_email: req.user_email,
          user_name: req.user_name,
          company_name: req.company_name
        }))
        return NextResponse.json({ requests: transformedRequests })
      }

      // Fallback: Query opportunity_requests and join manually
      const { data: directData, error: directError } = await supabase
        .from('opportunity_requests')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (directError) {
        return NextResponse.json(
          { error: 'Failed to fetch requests', details: directError.message },
          { status: 500 }
        )
      }
      
      // Get user and company info separately
      const userIds = [...new Set((directData || []).map((r: any) => r.user_id).filter(Boolean))]
      const companyIds = [...new Set((directData || []).map((r: any) => r.company_id).filter(Boolean))]

      const [profilesResult, companiesResult] = await Promise.all([
        userIds.length > 0 ? supabase
          .from('profiles')
          .select('id, email, full_name')
          .in('id', userIds) : { data: [], error: null },
        companyIds.length > 0 ? supabase
          .from('companies')
          .select('id, name')
          .in('id', companyIds) : { data: [], error: null }
      ])

      const profilesMap = new Map((profilesResult.data || []).map((p: any) => [p.id, p]))
      const companiesMap = new Map((companiesResult.data || []).map((c: any) => [c.id, c]))
      
      const transformedRequests = (directData || []).map((req: any) => {
        const profile = profilesMap.get(req.user_id)
        const company = companiesMap.get(req.company_id)
        
        return {
          ...req,
          user_email: profile?.email,
          user_name: profile?.full_name,
          company_name: company?.name
        }
      })
      
      return NextResponse.json({ requests: transformedRequests })
    }

    // Use service role client
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    
    // First try using the admin view (if it exists)
    const { data: viewData, error: viewError } = await supabase
      .from('admin_opportunity_requests_view')
      .select('*')
      .order('created_at', { ascending: false })

    if (!viewError && viewData) {
      // Transform view data to match expected format
      const transformedRequests = (viewData || []).map((req: any) => ({
        id: req.id,
        user_id: req.user_id,
        company_id: req.company_id,
        requested_by: req.requested_by,
        request_type: req.request_type,
        target_counties: req.target_counties,
        target_cities: req.target_cities,
        industry_codes: req.industry_codes,
        budget_min: req.budget_min,
        budget_max: req.budget_max,
        status: req.status,
        notes: req.notes,
        created_at: req.created_at,
        updated_at: req.updated_at,
        email_sent: req.email_sent,
        email_sent_at: req.email_sent_at,
        processed_by: req.processed_by,
        processed_at: req.processed_at,
        search_query_used: req.search_query_used,
        search_results: req.search_results,
        user_email: req.user_email,
        user_name: req.user_name,
        company_name: req.company_name
      }))
      return NextResponse.json({ requests: transformedRequests })
    }

    // Fallback: Query opportunity_requests and join manually
    const { data: requestsData, error } = await supabase
      .from('opportunity_requests')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching opportunity requests:', error)
      return NextResponse.json(
        { error: 'Failed to fetch requests', details: error.message },
        { status: 500 }
      )
    }

    // Get user and company info separately
    const userIds = [...new Set((requestsData || []).map((r: any) => r.user_id).filter(Boolean))]
    const companyIds = [...new Set((requestsData || []).map((r: any) => r.company_id).filter(Boolean))]

    const [profilesResult, companiesResult] = await Promise.all([
      userIds.length > 0 ? supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', userIds) : { data: [], error: null },
      companyIds.length > 0 ? supabase
        .from('companies')
        .select('id, name')
        .in('id', companyIds) : { data: [], error: null }
    ])

    const profilesMap = new Map((profilesResult.data || []).map((p: any) => [p.id, p]))
    const companiesMap = new Map((companiesResult.data || []).map((c: any) => [c.id, c]))

    // Transform the data to include user and company info
    const transformedRequests = (requestsData || []).map((req: any) => {
      const profile = profilesMap.get(req.user_id)
      const company = companiesMap.get(req.company_id)
      
      return {
        ...req,
        user_email: profile?.email,
        user_name: profile?.full_name,
        company_name: company?.name
      }
    })

    return NextResponse.json({ requests: transformedRequests })
  } catch (error) {
    console.error('Error in GET /api/admin/opportunity-requests:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

