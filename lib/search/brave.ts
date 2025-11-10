/**
 * Brave Search API Integration
 * Used for discovering government contract opportunities
 */

export interface BraveSearchResult {
  title: string
  url: string
  description: string
  snippet?: string
  domain?: string
  published_date?: string
  rank?: number
}

export interface BraveSearchResponse {
  query: string
  results: BraveSearchResult[]
  total_results?: number
}

export class BraveSearchService {
  private apiKey: string
  private baseUrl = 'https://api.search.brave.com/res/v1/web/search'

  constructor() {
    this.apiKey = process.env.BRAVE_SEARCH_API_KEY || ''
    if (!this.apiKey) {
      console.warn('BRAVE_SEARCH_API_KEY not configured')
    }
  }

  /**
   * Search for government contract opportunities
   * @param query - Search query string
   * @param options - Additional search options
   */
  async searchOpportunities(
    query: string,
    options: {
      count?: number
      filterGov?: boolean
      freshness?: 'day' | 'week' | 'month' | 'year'
    } = {}
  ): Promise<BraveSearchResponse> {
    const {
      count = 10,
      filterGov = true,
      freshness
    } = options

    if (!this.apiKey) {
      throw new Error('Brave Search API key not configured')
    }

    try {
      // Build search query
      let searchQuery = query
      
      // Add government site filter if requested
      if (filterGov) {
        searchQuery += ' (site:.gov OR site:.mil OR "government contracts")'
      }

      // Build URL parameters
      const params = new URLSearchParams({
        q: searchQuery,
        count: count.toString(),
        text_decorations: 'false',
        search_lang: 'en',
        country: 'US'
      })

      if (freshness) {
        params.append('freshness', freshness)
      }

      const url = `${this.baseUrl}?${params.toString()}`

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip',
          'X-Subscription-Token': this.apiKey
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Brave Search API error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()

      // Debug: log structure if no results
      if (!data.web?.results || data.web.results.length === 0) {
        console.warn('Brave Search: No web results found. Response structure:', {
          hasWeb: !!data.web,
          hasResults: !!data.web?.results,
          resultCount: data.web?.results?.length || 0,
          keys: Object.keys(data)
        })
      }

      // Parse and filter results
      const results: BraveSearchResult[] = (data.web?.results || []).map((result: any, index: number) => ({
        title: result.title || '',
        url: result.url || '',
        description: result.description || '',
        snippet: result.description || '',
        domain: this.extractDomain(result.url || ''),
        published_date: result.published_date || result.age || '',
        rank: index + 1
      }))

      // Filter for government-related results if requested
      let filteredResults = results
      if (filterGov) {
        // First, prioritize actual opportunity sites
        const opportunitySites = results.filter(result => 
          this.isActualOpportunity(result)
        )
        
        if (opportunitySites.length > 0) {
          filteredResults = opportunitySites
        } else {
          // Fallback: get .gov results
          const govResults = results.filter(result => 
            result.domain?.includes(".gov") || result.url.includes(".gov")
          )
          
          if (govResults.length > 0) {
            filteredResults = govResults
          } else {
            // Last resort: use all results with contract keywords
            filteredResults = results.filter(result => 
              this.isGovernmentRelated(result)
            )
          }
        }
      }

      return {
        query: searchQuery,
        results: filteredResults,
        total_results: filteredResults.length
      }

    } catch (error) {
      console.error('Brave Search error:', error)
      throw error
    }
  }

  /**
   * Build a dynamic search query from company profile
   * Focuses on actual contract opportunities, not informational pages
   */
  buildCompanyQuery(companyProfile: {
    industry: string
    city?: string
    state?: string
    naics_codes?: string[]
    business_type?: string
    counties?: string[]
    cities?: string[]
  }): string {
    // Start with opportunity-focused keywords
    const parts: string[] = ['government contract opportunity', 'solicitation', 'RFP']

    // Add location FIRST (most important for filtering)
    // Prioritize cities, then counties, then city/state
    if (companyProfile.cities && companyProfile.cities.length > 0) {
      parts.push(...companyProfile.cities.slice(0, 2)) // Add up to 2 cities
    }
    if (companyProfile.counties && companyProfile.counties.length > 0) {
      parts.push(...companyProfile.counties.slice(0, 2)) // Add up to 2 counties
    }
    if (companyProfile.city && companyProfile.state) {
      parts.push(companyProfile.city)
      parts.push(companyProfile.state)
    } else if (companyProfile.state) {
      parts.push(companyProfile.state)
    }

    // Add industry
    if (companyProfile.industry) {
      parts.push(companyProfile.industry)
    }

    // Add NAICS codes
    if (companyProfile.naics_codes && companyProfile.naics_codes.length > 0) {
      parts.push('NAICS')
      parts.push(...companyProfile.naics_codes.slice(0, 3)) // Limit to first 3 codes
    }

    // Add business type keywords
    if (companyProfile.business_type) {
      parts.push(companyProfile.business_type)
    }

    return parts.join(' ')
  }

  /**
   * Check if a result is an actual contract opportunity (not informational)
   * Also excludes main site pages, only includes individual opportunity pages
   */
  private isActualOpportunity(result: BraveSearchResult): boolean {
    const opportunityDomains = [
      'sam.gov',
      'beta.sam.gov',
      'grants.gov',
      'usaspending.gov',
      'contracts.gov',
      'fbo.gov',
      'govtribe.com',
      'governmentcontracts.us'
    ]
    
    const opportunityPaths = [
      '/opportunity/',
      '/solicitation/',
      '/rfp/',
      '/rfq/',
      '/contract/',
      '/award/',
      '/notice/',
      '/pre-solicitation',
      '/sources-sought',
      '/view/',
      '/details/',
      '/contract-opportunity/',
      '/solicitation-details/'
    ]
    
    // Exclude main site pages (homepage, search, browse, etc.)
    const excludePaths = [
      '/home',
      '/search',
      '/browse',
      '/index',
      '/main',
      '/about',
      '/contact',
      '/help',
      '/faq',
      '/blog',
      '/news',
      '/resources',
      '/guides',
      '/naics-codes',
      '/top-codes',
      '/list'
    ]
    
    const excludeKeywords = [
      'blog',
      'article',
      'guide',
      'how to',
      'understanding',
      'what are',
      '101',
      'decoded',
      'top codes',
      'list of',
      'importance of',
      'why they matter',
      'naics codes by domain',
      'main page',
      'homepage',
      'browse opportunities',
      'search opportunities'
    ]

    const url = result.url.toLowerCase()
    const title = result.title.toLowerCase()
    const description = result.description.toLowerCase()
    const combinedText = `${title} ${description}`.toLowerCase()

    // Exclude informational/educational pages
    if (excludeKeywords.some(keyword => combinedText.includes(keyword))) {
      return false
    }

    // Exclude main site pages (homepage, search pages, etc.)
    if (excludePaths.some(path => url.includes(path) && !url.match(/\/opportunity\/|\/solicitation\/|\/rfp\/|\/contract\//))) {
      return false
    }

    // Check for opportunity domains with specific opportunity paths
    if (opportunityDomains.some(domain => url.includes(domain))) {
      // For known opportunity sites, require a specific opportunity path
      if (url.includes('sam.gov') || url.includes('beta.sam.gov')) {
        // SAM.gov - look for opportunity IDs or specific paths
        if (url.match(/\/opportunities\/|\/entity\/|\/view\/|\/award\/|\/contract\/|\/notice\//) || 
            url.match(/\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/)) {
          return true
        }
        return false // Exclude main SAM.gov pages
      }
      if (url.includes('governmentcontracts.us')) {
        // Must have a specific opportunity path
        if (opportunityPaths.some(path => url.includes(path)) || url.match(/\/contract\/|\/opportunity\//)) {
          return true
        }
        return false // Exclude main site pages
      }
      // For other domains, allow if they have opportunity paths
      if (opportunityPaths.some(path => url.includes(path))) {
        return true
      }
    }

    // Check for opportunity paths in URL (individual opportunity pages)
    if (opportunityPaths.some(path => url.includes(path))) {
      return true
    }

    // Check for .gov domains with opportunity indicators (but not main pages)
    if (url.includes('.gov') && !url.match(/\/$|\/index|\/home|\/search|\/browse/)) {
      const opportunityIndicators = [
        'solicitation',
        'rfp',
        'rfq',
        'contract opportunity',
        'pre-solicitation',
        'sources sought',
        'notice id',
        'opportunity id',
        'award id',
        'contract number',
        'solicitation number'
      ]
      if (opportunityIndicators.some(indicator => combinedText.includes(indicator))) {
        // Make sure it's not a main listing page
        if (!url.match(/\/list|\/search|\/browse|\/index/)) {
          return true
        }
      }
    }

    return false
  }

  /**
   * Check if a result is government-related
   */
  private isGovernmentRelated(result: BraveSearchResult): boolean {
    const govDomains = ['.gov', '.mil', '.state.', '.county.', '.city.']
    const govKeywords = [
      'government',
      'federal',
      'contract',
      'solicitation',
      'rfp',
      'rfq',
      'bid',
      'procurement',
      'sam.gov',
      'grants.gov',
      'usaspending',
      'gsa'
    ]

    // Check domain
    if (result.domain && govDomains.some(domain => result.domain?.includes(domain))) {
      return true
    }

    // Check URL
    if (govDomains.some(domain => result.url.toLowerCase().includes(domain))) {
      return true
    }

    // Check title and description for keywords
    const textToCheck = `${result.title} ${result.description}`.toLowerCase()
    return govKeywords.some(keyword => textToCheck.includes(keyword))
  }

  /**
   * Extract domain from URL
   */
  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname
    } catch {
      return ''
    }
  }

  /**
   * Score/rank results based on relevance
   */
  scoreResults(
    results: BraveSearchResult[],
    companyProfile: {
      industry: string
      naics_codes?: string[]
    }
  ): Array<BraveSearchResult & { score: number }> {
    return results.map(result => {
      let score = 100

      // Boost .gov domains
      if (result.domain?.includes('.gov')) {
        score += 20
      }

      // Boost if industry mentioned
      if (companyProfile.industry) {
        const textToCheck = `${result.title} ${result.description}`.toLowerCase()
        if (textToCheck.includes(companyProfile.industry.toLowerCase())) {
          score += 15
        }
      }

      // Boost if NAICS codes mentioned
      if (companyProfile.naics_codes && companyProfile.naics_codes.length > 0) {
        const textToCheck = `${result.title} ${result.description}`.toLowerCase()
        for (const code of companyProfile.naics_codes) {
          if (textToCheck.includes(code)) {
            score += 10
            break
          }
        }
      }

      // Penalize by rank (lower rank = better position in results)
      if (result.rank) {
        score -= (result.rank - 1) * 2
      }

      return {
        ...result,
        score: Math.max(0, score)
      }
    }).sort((a, b) => b.score - a.score)
  }
}

export const braveSearchService = new BraveSearchService()

