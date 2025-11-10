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

    // Get request data including location preferences and NAICS codes
    const { data: requestData } = await supabase
      .from('opportunity_requests')
      .select('industry_codes, target_counties, target_cities')
      .eq('id', requestId)
      .single()
    
    // Get NAICS codes - prefer from request, fallback to company profile
    let naicsCodes: string[] = []
    if (requestData?.industry_codes && Array.isArray(requestData.industry_codes) && requestData.industry_codes.length > 0) {
      naicsCodes = requestData.industry_codes
      console.log('[API] Using NAICS codes from request:', naicsCodes)
    } else if (company.profile_data?.naics_codes) {
      naicsCodes = company.profile_data.naics_codes
      console.log('[API] Using NAICS codes from company profile:', naicsCodes)
    }

    // Get location from request (preferred) or company
    let searchCity = city
    let searchState = state
    let searchCounties: string[] = []
    let searchCities: string[] = []

    // Prefer location from request if available
    if (requestData?.target_counties && requestData.target_counties.length > 0) {
      searchCounties = requestData.target_counties
      // Convert county slugs to readable names
      searchCounties = searchCounties.map(county => {
        const countyMap: { [key: string]: string } = {
          'los-angeles': 'Los Angeles',
          'orange': 'Orange County',
          'san-diego': 'San Diego',
          'riverside': 'Riverside',
          'san-bernardino': 'San Bernardino'
        }
        return countyMap[county] || county.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      })
      console.log('[API] Using counties from request:', searchCounties)
    }

    if (requestData?.target_cities && requestData.target_cities.length > 0) {
      searchCities = requestData.target_cities
      // Convert city slugs to readable names
      searchCities = searchCities.map(city => {
        const cityMap: { [key: string]: string } = {
          'los-angeles-city': 'Los Angeles',
          'anaheim': 'Anaheim',
          'san-diego': 'San Diego',
          'san-jose': 'San Jose',
          'san-francisco': 'San Francisco'
        }
        return cityMap[city] || city.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      })
      console.log('[API] Using cities from request:', searchCities)
    }

    // If no location from request, use company location
    if (searchCounties.length === 0 && searchCities.length === 0) {
      if (city && state) {
        searchCity = city
        searchState = state
      } else if (state) {
        searchState = state
      }
    } else {
      // If we have counties/cities from request, set state to California
      if (searchCounties.length > 0 || searchCities.length > 0) {
        searchState = 'California'
        if (searchCities.length > 0) {
          searchCity = searchCities[0] // Use first city
        }
      }
    }

    // Build search query with location emphasis
    const searchQuery = braveSearchService.buildCompanyQuery({
      industry: company.industry || '',
      city: searchCity,
      state: searchState,
      naics_codes: naicsCodes,
      business_type: company.business_type || '',
      counties: searchCounties,
      cities: searchCities
    })

    console.log('[API] Search query:', searchQuery)
    console.log('[API] Location data:', {
      searchCity,
      searchState,
      searchCounties,
      searchCities
    })
    console.log('[API] Company data:', {
      industry: company.industry,
      naicsCodes,
      business_type: company.business_type
    })

    // Helper function to add delay (respect rate limits)
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

    // Try search with error handling for rate limits
    let searchResults: any = { results: [] }
    let lastError: Error | null = null

    try {
      // First attempt: try a simpler, more focused query
      // Build a simpler query without all the redundancy
      const simpleQueryParts: string[] = []
      
      // Location (just one city and state)
      if (searchCities.length > 0) {
        simpleQueryParts.push(searchCities[0])
      } else if (searchCounties.length > 0) {
        simpleQueryParts.push(searchCounties[0])
      }
      if (searchState) {
        simpleQueryParts.push(searchState)
      }
      
      // Add opportunity keywords
      simpleQueryParts.push('government contract', 'solicitation')
      
      // Add industry
      if (company.industry) {
        simpleQueryParts.push(company.industry)
      }
      
      // Add NAICS if available
      if (naicsCodes.length > 0) {
        simpleQueryParts.push('NAICS', naicsCodes[0])
      }
      
      const simpleQuery = simpleQueryParts.join(' ')
      console.log('[API] Trying simple query first:', simpleQuery)
      
      searchResults = await braveSearchService.searchOpportunities(simpleQuery, {
        count: 20, // Get more results initially
        filterGov: false, // Start without gov filter to get more results
        freshness: undefined // Don't restrict by freshness initially
      })

      console.log('[API] Initial Brave Search results:', {
        total: searchResults.results?.length || 0,
        hasResults: !!searchResults.results
      })

      // Filter for actual contract opportunities (not informational pages)
      // Also filter by location to exclude results from other states
      if (searchResults.results.length > 0) {
        searchResults.results = searchResults.results.filter((result: any) => {
          const url = result.url.toLowerCase()
          const title = result.title.toLowerCase()
          const desc = result.description.toLowerCase()
          const combined = `${title} ${desc}`.toLowerCase()
          
          // Exclude informational/educational pages
          const excludeKeywords = [
            'blog', 'article', 'guide', 'how to', 'understanding', 
            'what are', '101', 'decoded', 'top codes', 'list of',
            'importance of', 'why they matter', 'naics codes by domain',
            'main page', 'homepage', 'browse opportunities', 'search opportunities'
          ]
          if (excludeKeywords.some(kw => combined.includes(kw))) {
            return false
          }
          
          // Exclude main site pages (homepage, search, browse)
          const excludePaths = ['/home', '/search', '/browse', '/index', '/main']
          if (excludePaths.some(path => url.includes(path) && !url.match(/\/opportunity\/|\/solicitation\/|\/rfp\/|\/contract\//))) {
            return false
          }
          
          // Location filtering - exclude results that clearly mention other states
          if (searchState && searchState.toLowerCase() === 'california') {
            const otherStates = ['florida', 'fl ', 'texas', 'tx ', 'new york', 'ny ', 'florida,', 'texas,', 'new york,']
            const mentionsOtherState = otherStates.some(state => combined.includes(state))
            if (mentionsOtherState && !combined.includes('california') && !combined.includes('ca ')) {
              // If it mentions another state but not California, exclude it
              return false
            }
          }
          
          // Prioritize actual opportunity sites with specific opportunity paths
          const opportunitySites = [
            'sam.gov', 'beta.sam.gov', 'grants.gov', 'usaspending.gov',
            'contracts.gov', 'fbo.gov', 'govtribe.com', 'governmentcontracts.us'
          ]
          
          // For known opportunity sites, require specific opportunity paths
          if (url.includes('sam.gov') || url.includes('beta.sam.gov')) {
            // SAM.gov - must have opportunity ID or specific path
            if (url.match(/\/opportunities\/|\/entity\/|\/view\/|\/award\/|\/contract\/|\/notice\//) || 
                url.match(/\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/)) {
              return true
            }
            return false // Exclude main SAM.gov pages
          }
          
          if (url.includes('governmentcontracts.us')) {
            // Must have a specific opportunity path
            if (url.match(/\/contract\/|\/opportunity\/|\/solicitation\/|\/rfp\//)) {
              return true
            }
            return false // Exclude main site pages
          }
          
          // For other opportunity sites, allow if they have opportunity paths
          if (opportunitySites.some(site => url.includes(site))) {
            const opportunityPaths = ['/opportunity/', '/solicitation/', '/rfp/', '/contract/', '/award/', '/notice/']
            if (opportunityPaths.some(path => url.includes(path))) {
              return true
            }
          }
          
          // Look for opportunity indicators in .gov domains (but not main pages)
          if (url.includes('.gov') && !url.match(/\/$|\/index|\/home|\/search|\/browse/)) {
            const opportunityIndicators = [
              'solicitation', 'rfp', 'rfq', 'contract opportunity',
              'pre-solicitation', 'sources sought', 'notice id',
              'opportunity id', 'award id', '/opportunity/', '/solicitation/'
            ]
            if (opportunityIndicators.some(ind => combined.includes(ind) || url.includes(ind))) {
              return true
            }
          }
          
          return false
        })
      }

      // If no results after filtering, try even simpler queries (with delay to respect rate limits)
      if (searchResults.results.length === 0) {
        console.log('[API] No results after filtering, trying simpler queries after delay...')
        await delay(2000) // Wait 2 seconds to respect rate limit (1 req/sec for free plan)
        
        // Try query with just location and NAICS
        if (naicsCodes.length > 0 && searchState) {
          const naicsQuery = `government contract ${searchState} NAICS ${naicsCodes[0]}`
          console.log('[API] Trying NAICS-focused query:', naicsQuery)
          
          searchResults = await braveSearchService.searchOpportunities(naicsQuery, {
            count: 20,
            filterGov: false
          })
          
          // Filter results
          if (searchResults.results.length > 0) {
            searchResults.results = searchResults.results.filter((result: any) => {
              const url = result.url.toLowerCase()
              const title = result.title.toLowerCase()
              const desc = result.description.toLowerCase()
              const combined = `${title} ${desc}`.toLowerCase()
              
              // Exclude main pages and other states
              if (url.match(/\/home|\/search|\/browse|\/index/)) return false
              if (searchState?.toLowerCase() === 'california') {
                if (combined.includes('florida') || combined.includes('fl ') && !combined.includes('california')) {
                  return false
                }
              }
              
              // Require opportunity indicators
              return (url.includes('/opportunity/') || url.includes('/solicitation/') || 
                      url.includes('/contract/') || url.includes('/rfp/') ||
                      (url.includes('.gov') && (combined.includes('solicitation') || combined.includes('rfp'))))
            })
          }
        }
        
        // If still no results, try location-only query
        if (searchResults.results.length === 0 && searchState) {
          await delay(2000)
          const locationQuery = `government contract ${searchState} ${company.industry || 'construction'}`
          console.log('[API] Trying location-only query:', locationQuery)
          
          searchResults = await braveSearchService.searchOpportunities(locationQuery, {
            count: 20,
            filterGov: false
          })
          
          // Filter results
          if (searchResults.results.length > 0) {
            searchResults.results = searchResults.results.filter((result: any) => {
              const url = result.url.toLowerCase()
              const title = result.title.toLowerCase()
              const desc = result.description.toLowerCase()
              const combined = `${title} ${desc}`.toLowerCase()
              
              // Exclude main pages and other states
              if (url.match(/\/home|\/search|\/browse|\/index/)) return false
              if (searchState?.toLowerCase() === 'california') {
                if (combined.includes('florida') || combined.includes('fl ') && !combined.includes('california')) {
                  return false
                }
              }
              
              // Require opportunity indicators
              return (url.includes('/opportunity/') || url.includes('/solicitation/') || 
                      url.includes('/contract/') || url.includes('/rfp/') ||
                      (url.includes('.gov') && (combined.includes('solicitation') || combined.includes('rfp'))))
            })
          }
        }
        
        // Filter for actual contract opportunities (not informational pages)
        // Apply same filtering as initial search, including location filtering
        if (searchResults.results.length > 0) {
          searchResults.results = searchResults.results.filter((result: any) => {
            const url = result.url.toLowerCase()
            const title = result.title.toLowerCase()
            const desc = result.description.toLowerCase()
            const combined = `${title} ${desc}`.toLowerCase()
            
            // Exclude informational/educational pages
            const excludeKeywords = [
              'blog', 'article', 'guide', 'how to', 'understanding', 
              'what are', '101', 'decoded', 'top codes', 'list of',
              'importance of', 'why they matter', 'naics codes by domain',
              'main page', 'homepage', 'browse opportunities', 'search opportunities'
            ]
            if (excludeKeywords.some(kw => combined.includes(kw))) {
              return false
            }
            
            // Exclude main site pages
            const excludePaths = ['/home', '/search', '/browse', '/index', '/main']
            if (excludePaths.some(path => url.includes(path) && !url.match(/\/opportunity\/|\/solicitation\/|\/rfp\/|\/contract\//))) {
              return false
            }
            
            // Location filtering - exclude results that clearly mention other states
            if (searchState && searchState.toLowerCase() === 'california') {
              const otherStates = ['florida', 'fl ', 'texas', 'tx ', 'new york', 'ny ', 'florida,', 'texas,', 'new york,']
              const mentionsOtherState = otherStates.some(state => combined.includes(state))
              if (mentionsOtherState && !combined.includes('california') && !combined.includes('ca ')) {
                return false
              }
            }
            
            // Prioritize actual opportunity sites with specific opportunity paths
            if (url.includes('sam.gov') || url.includes('beta.sam.gov')) {
              if (url.match(/\/opportunities\/|\/entity\/|\/view\/|\/award\/|\/contract\/|\/notice\//) || 
                  url.match(/\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/)) {
                return true
              }
              return false
            }
            
            if (url.includes('governmentcontracts.us')) {
              if (url.match(/\/contract\/|\/opportunity\/|\/solicitation\/|\/rfp\//)) {
                return true
              }
              return false
            }
            
            const opportunitySites = [
              'sam.gov', 'beta.sam.gov', 'grants.gov', 'usaspending.gov',
              'contracts.gov', 'fbo.gov', 'govtribe.com', 'governmentcontracts.us'
            ]
            if (opportunitySites.some(site => url.includes(site))) {
              const opportunityPaths = ['/opportunity/', '/solicitation/', '/rfp/', '/contract/', '/award/', '/notice/']
              if (opportunityPaths.some(path => url.includes(path))) {
                return true
              }
            }
            
            // Look for opportunity indicators in .gov domains (but not main pages)
            if (url.includes('.gov') && !url.match(/\/$|\/index|\/home|\/search|\/browse/)) {
              const opportunityIndicators = [
                'solicitation', 'rfp', 'rfq', 'contract opportunity',
                'pre-solicitation', 'sources sought', 'notice id',
                'opportunity id', 'award id', '/opportunity/', '/solicitation/'
              ]
              if (opportunityIndicators.some(ind => combined.includes(ind) || url.includes(ind))) {
                return true
              }
            }
            
            return false
          })
        }
      }
    } catch (error: any) {
      lastError = error
      console.error('[API] Brave Search error:', error)
      
      // Check if it's a rate limit error
      if (error.message?.includes('429') || error.message?.includes('RATE_LIMITED')) {
        return NextResponse.json(
          { 
            error: 'Rate limit exceeded',
            details: 'Brave Search API rate limit reached. Please wait a moment and try again. Free plan allows 1 request per second.',
            retry_after: 2
          },
          { status: 429 }
        )
      }
      
      // Re-throw other errors
      throw error
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

