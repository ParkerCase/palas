import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { braveSearchService } from '@/lib/search/brave'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Use service role client to bypass RLS (page is password-protected)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    // Create Supabase client with service role or fallback to regular client
    const supabase = supabaseServiceKey
      ? createClient(supabaseUrl, supabaseServiceKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        })
      : (await import('@/lib/supabase/server')).createRouteHandlerClient(request)

    // Get request data
    const body = await request.json()
    const { requestId, companyId } = body

    if (!requestId || !companyId) {
      return NextResponse.json(
        { error: 'Request ID and Company ID are required' },
        { status: 400 }
      )
    }

    // Get company profile
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single()

    if (companyError || !company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      )
    }

    // Extract location from headquarters_address
    let city = ''
    let state = ''
    if (company.headquarters_address) {
      if (typeof company.headquarters_address === 'object') {
        const addr = company.headquarters_address as any
        city = addr.city || ''
        state = addr.state || ''
      } else if (typeof company.headquarters_address === 'string') {
        // Try to parse string address
        const parts = company.headquarters_address.split(',').map((p: string) => p.trim())
        if (parts.length >= 2) {
          city = parts[0]
          state = parts[1]
        }
      }
    }

    // Get NAICS codes from profile_data
    let naicsCodes: string[] = []
    if (company.profile_data?.naics_codes) {
      naicsCodes = company.profile_data.naics_codes
    }

    // Build search query
    const searchQuery = braveSearchService.buildCompanyQuery({
      industry: company.industry || '',
      city: city,
      state: state,
      naics_codes: naicsCodes,
      business_type: company.business_type || ''
    })

    // Perform Brave Search
    const searchResults = await braveSearchService.searchOpportunities(searchQuery, {
      count: 10,
      filterGov: true,
      freshness: 'month' // Get results from last month
    })

    // Score and rank results
    const scoredResults = braveSearchService.scoreResults(searchResults.results, {
      industry: company.industry || '',
      naics_codes: naicsCodes
    })

    // Update the opportunity request with search results
    const { error: updateError } = await supabase
      .from('opportunity_requests')
      .update({
        status: 'processing',
        search_query_used: searchQuery,
        search_results: {
          query: searchQuery,
          results: scoredResults,
          searched_at: new Date().toISOString(),
          total_results: scoredResults.length
        },
        processed_by: null, // No user ID since we're using password auth
        processed_at: new Date().toISOString()
      })
      .eq('id', requestId)

    if (updateError) {
      console.error('Error updating opportunity request:', updateError)
      return NextResponse.json(
        { error: 'Failed to save search results' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      query: searchQuery,
      results: scoredResults,
      total_results: scoredResults.length,
      message: `Found ${scoredResults.length} opportunities`
    })

  } catch (error) {
    console.error('Error in opportunity search:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

