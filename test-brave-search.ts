/**
 * Direct Brave Search API Test
 * 
 * Tests the Brave Search integration directly without authentication
 * 
 * Run with: npx tsx test-brave-search.ts
 */

// Load environment variables FIRST, before any imports
import { config } from 'dotenv'
config({ path: '.env.local' })

// Import AFTER environment is loaded
import { BraveSearchService } from './lib/search/brave'

// Create service instance AFTER env is loaded
const braveSearchService = new BraveSearchService()

const colors = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  reset: "\x1b[0m",
}

function log(message: string, color: keyof typeof colors = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

async function testBraveSearch() {
  console.log('\n' + '='.repeat(60))
  log('BRAVE SEARCH API TEST', 'blue')
  console.log('='.repeat(60) + '\n')

  // Check if API key is set
  const apiKey = process.env.BRAVE_SEARCH_API_KEY
  
  if (!apiKey) {
    log('❌ BRAVE_SEARCH_API_KEY not set in environment', 'red')
    log('\nAdd to .env.local:', 'yellow')
    log('  BRAVE_SEARCH_API_KEY=your_api_key_here\n')
    process.exit(1)
  }

  log('✓ BRAVE_SEARCH_API_KEY is set', 'green')
  log(`  Key preview: ${apiKey.substring(0, 10)}...\n`, 'cyan')

  // Test company profile
  const testCompany = {
    industry: 'Construction',
    city: 'Los Angeles',
    state: 'California',
    naics_codes: ['236220', '237310'],
    business_type: 'Small Business'
  }

  log('Test Company Profile:', 'blue')
  console.log(JSON.stringify(testCompany, null, 2))
  console.log()

  // Build search query
  log('Building search query...', 'cyan')
  const query = braveSearchService.buildCompanyQuery(testCompany)
  log(`✓ Query: "${query}"`, 'green')
  console.log()

  // Verify query includes location
  if (query.includes(testCompany.city) && query.includes(testCompany.state)) {
    log('✓ Query includes both city AND state', 'green')
  } else {
    log('⚠ Query may be missing city or state', 'yellow')
  }

  // Verify query includes NAICS codes
  if (testCompany.naics_codes.some(code => query.includes(code))) {
    log('✓ Query includes NAICS codes', 'green')
  } else {
    log('⚠ Query missing NAICS codes', 'yellow')
  }
  console.log()

  // Perform search
  log('Performing Brave Search...', 'cyan')
  try {
    const results = await braveSearchService.searchOpportunities(query, {
      count: 10,
      filterGov: true,
      freshness: 'month'
    })

    log('✓ Search completed successfully!', 'green')
    log(`\nFound ${results.results.length} results:\n`, 'cyan')

    // Display results
    results.results.forEach((result, index) => {
      console.log(`${index + 1}. ${result.title}`)
      log(`   URL: ${result.url}`, 'cyan')
      log(`   Domain: ${result.domain || 'N/A'}`, 'cyan')
      if (result.rank) log(`   Rank: ${result.rank}`, 'cyan')
      console.log(`   Description: ${result.description.substring(0, 100)}...`)
      console.log()
    })

    // Analyze results
    log('Result Analysis:', 'blue')
    console.log('='.repeat(60))

    const govResults = results.results.filter(r => 
      r.domain?.includes('.gov') || r.url.includes('.gov')
    )
    
    if (govResults.length > 0) {
      log(`✓ ${govResults.length}/${results.results.length} results are from .gov domains`, 'green')
    } else {
      log(`⚠ No .gov domain results found`, 'yellow')
      log('  This might be expected if no government sites match the query', 'yellow')
    }

    // Check for contract-related keywords
    const contractKeywords = ['contract', 'solicitation', 'rfp', 'rfq', 'bid', 'procurement']
    const resultsWithKeywords = results.results.filter(r => {
      const text = `${r.title} ${r.description}`.toLowerCase()
      return contractKeywords.some(keyword => text.includes(keyword))
    })

    if (resultsWithKeywords.length > 0) {
      log(`✓ ${resultsWithKeywords.length}/${results.results.length} results contain contract keywords`, 'green')
    }

    // Score results
    log('\nScoring results...', 'cyan')
    const scoredResults = braveSearchService.scoreResults(results.results, {
      industry: testCompany.industry,
      naics_codes: testCompany.naics_codes
    })

    log('\nTop 3 Scored Results:', 'blue')
    console.log('='.repeat(60))
    scoredResults.slice(0, 3).forEach((result, index) => {
      console.log(`\n${index + 1}. ${result.title}`)
      log(`   Score: ${result.score}`, 'green')
      log(`   Domain: ${result.domain}`, 'cyan')
      log(`   URL: ${result.url}`, 'cyan')
    })

    // Success summary
    console.log('\n' + '='.repeat(60))
    log('✓ BRAVE SEARCH TEST PASSED', 'green')
    console.log('='.repeat(60))
    log('\nKey Findings:', 'blue')
    log(`  • Total results: ${results.results.length}`)
    log(`  • Government (.gov) results: ${govResults.length}`)
    log(`  • Results with contract keywords: ${resultsWithKeywords.length}`)
    log(`  • Top match score: ${scoredResults[0]?.score || 0}`)
    console.log()

    return { success: true, results: results.results }

  } catch (error) {
    log('\n❌ BRAVE SEARCH FAILED', 'red')
    console.log('='.repeat(60))
    
    if (error instanceof Error) {
      log(`Error: ${error.message}`, 'red')
      
      if (error.message.includes('401') || error.message.includes('403')) {
        log('\nPossible issues:', 'yellow')
        log('  1. Invalid API key', 'yellow')
        log('  2. API key not activated', 'yellow')
        log('  3. Subscription expired', 'yellow')
        log('\nVerify your API key at: https://brave.com/search/api/', 'cyan')
      } else if (error.message.includes('ENOTFOUND') || error.message.includes('network')) {
        log('\nNetwork error - check your internet connection', 'yellow')
      } else if (error.message.includes('429')) {
        log('\nRate limit exceeded - wait a moment and try again', 'yellow')
      }
    }
    
    console.error('\nFull error:', error)
    return { success: false, error }
  }
}

// Test query builder separately
function testQueryBuilder() {
  console.log('\n' + '='.repeat(60))
  log('QUERY BUILDER TEST', 'blue')
  console.log('='.repeat(60) + '\n')

  const testCases = [
    {
      name: 'Full Profile',
      profile: {
        industry: 'Construction',
        city: 'Los Angeles',
        state: 'California',
        naics_codes: ['236220', '237310'],
        business_type: 'Small Business'
      }
    },
    {
      name: 'Missing City',
      profile: {
        industry: 'Healthcare',
        state: 'Texas',
        naics_codes: ['621111'],
        business_type: 'Corporation'
      }
    },
    {
      name: 'No NAICS Codes',
      profile: {
        industry: 'IT Services',
        city: 'Austin',
        state: 'Texas',
        business_type: 'Small Business'
      }
    }
  ]

  testCases.forEach(test => {
    log(`\n${test.name}:`, 'cyan')
    const query = braveSearchService.buildCompanyQuery(test.profile)
    log(`  Query: "${query}"`, 'green')
    
    // Validate
    if (test.profile.city && test.profile.state) {
      if (query.includes(test.profile.city) && query.includes(test.profile.state)) {
        log('  ✓ Includes city and state', 'green')
      } else {
        log('  ✗ Missing city or state', 'red')
      }
    }
    
    if (test.profile.naics_codes && test.profile.naics_codes.length > 0) {
      if (test.profile.naics_codes.some(code => query.includes(code))) {
        log('  ✓ Includes NAICS codes', 'green')
      } else {
        log('  ✗ Missing NAICS codes', 'red')
      }
    }
  })

  console.log()
}

// Run tests
async function main() {
  // Test 1: Query builder
  testQueryBuilder()

  // Test 2: Actual API call
  const result = await testBraveSearch()

  if (result.success) {
    log('\n✓ All tests passed!', 'green')
    process.exit(0)
  } else {
    log('\n✗ Tests failed', 'red')
    process.exit(1)
  }
}

main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})

