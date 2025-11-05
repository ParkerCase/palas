import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { braveSearchService } from '@/lib/search/brave'
import { isAdmin } from '@/lib/config/admin'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get the current user and verify admin access
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin (authorized emails only)
    if (!isAdmin(user.email)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

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
        processed_by: user.id,
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

