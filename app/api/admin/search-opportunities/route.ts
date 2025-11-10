import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { braveSearchService } from '@/lib/search/brave'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    console.log('[API] /api/admin/search-opportunities called')
    
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

    console.log('[API] Request data:', { requestId, companyId })

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
      console.error('[API] Company not found:', companyError)
      return NextResponse.json(
        { error: 'Company not found', details: companyError?.message },
        { status: 404 }
      )
    }

    console.log('[API] Company found:', company.name)

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

    // Get NAICS codes - prefer from request, fallback to company profile
    let naicsCodes: string[] = []
    
    // First try to get NAICS codes from the opportunity request
    const { data: requestData } = await supabase
      .from('opportunity_requests')
      .select('industry_codes')
      .eq('id', requestId)
      .single()
    
    if (requestData?.industry_codes && Array.isArray(requestData.industry_codes) && requestData.industry_codes.length > 0) {
      naicsCodes = requestData.industry_codes
      console.log('[API] Using NAICS codes from request:', naicsCodes)
    } else if (company.profile_data?.naics_codes) {
      naicsCodes = company.profile_data.naics_codes
      console.log('[API] Using NAICS codes from company profile:', naicsCodes)
    }

    // Build search query
    const searchQuery = braveSearchService.buildCompanyQuery({
      industry: company.industry || '',
      city: city,
      state: state,
      naics_codes: naicsCodes,
      business_type: company.business_type || ''
    })

    console.log('[API] Search query:', searchQuery)
    console.log('[API] Company data:', {
      industry: company.industry,
      city,
      state,
      naicsCodes,
      business_type: company.business_type
    })

    // Try multiple search strategies if first one fails
    let searchResults = await braveSearchService.searchOpportunities(searchQuery, {
      count: 10,
      filterGov: true,
      freshness: 'month'
    })

    console.log('[API] Initial Brave Search results:', {
      total: searchResults.results?.length || 0,
      hasResults: !!searchResults.results
    })

    // If no results, try broader search without freshness filter
    if (searchResults.results.length === 0) {
      console.log('[API] No results with freshness filter, trying without freshness...')
      searchResults = await braveSearchService.searchOpportunities(searchQuery, {
        count: 10,
        filterGov: true
      })
    }

    // If still no results, try without gov filter
    if (searchResults.results.length === 0) {
      console.log('[API] No results with gov filter, trying without gov filter...')
      searchResults = await braveSearchService.searchOpportunities(searchQuery, {
        count: 20,
        filterGov: false
      })
      // Filter manually after getting results
      if (searchResults.results.length > 0) {
        searchResults.results = searchResults.results.filter(result => 
          result.domain?.includes('.gov') || 
          result.url.includes('.gov') ||
          result.title.toLowerCase().includes('government') ||
          result.title.toLowerCase().includes('contract') ||
          result.description.toLowerCase().includes('government') ||
          result.description.toLowerCase().includes('contract')
        )
      }
    }

    // If still no results, try a more generic query
    if (searchResults.results.length === 0) {
      console.log('[API] No results with specific query, trying generic government contracts search...')
      const genericQuery = naicsCodes.length > 0
        ? `government contracts ${company.industry || ''} NAICS ${naicsCodes.slice(0, 2).join(' ')}`
        : `government contracts ${company.industry || ''} small business`
      
      searchResults = await braveSearchService.searchOpportunities(genericQuery, {
        count: 20,
        filterGov: false
      })
      
      // Filter for government-related results
      if (searchResults.results.length > 0) {
        searchResults.results = searchResults.results.filter(result => 
          result.domain?.includes('.gov') || 
          result.url.includes('.gov') ||
          result.title.toLowerCase().includes('government') ||
          result.title.toLowerCase().includes('contract') ||
          result.description.toLowerCase().includes('government') ||
          result.description.toLowerCase().includes('contract') ||
          result.description.toLowerCase().includes('solicitation') ||
          result.description.toLowerCase().includes('rfp')
        )
      }
    }

    console.log('[API] Final Brave Search results:', {
      total: searchResults.results?.length || 0,
      hasResults: !!searchResults.results
    })

    // Score and rank results
    const scoredResults = braveSearchService.scoreResults(searchResults.results || [], {
      industry: company.industry || '',
      naics_codes: naicsCodes
    })

    console.log('[API] Scored results:', scoredResults.length)

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

