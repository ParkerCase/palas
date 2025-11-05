/**
 * Test Script: Construction Company in Palo Alto
 * 
 * Tests Brave Search with specific company profile
 * Run with: npx tsx test-palo-alto-construction.ts
 */

// Load environment variables FIRST
import { config } from 'dotenv'
config({ path: '.env.local' })

import { BraveSearchService } from './lib/search/brave'

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

async function testPaloAltoConstruction() {
  console.log("\n")
  log("=".repeat(70), "blue")
  log("TEST: Construction Company in Palo Alto", "blue")
  log("=".repeat(70), "blue")
  console.log()

  const braveSearchService = new BraveSearchService()

  // Test company profile
  const testCompany = {
    industry: "Construction",
    city: "Palo Alto",
    state: "California",
    naics_codes: ["236220", "237310", "236210"], // Commercial construction, highway construction, residential
    business_type: "Small Business",
  }

  log("Company Profile:", "cyan")
  console.log(JSON.stringify(testCompany, null, 2))
  console.log()

  // Build search query
  log("Building search query...", "cyan")
  const query = braveSearchService.buildCompanyQuery(testCompany)
  log(`✓ Query: "${query}"`, "green")
  console.log()

  // Perform search
  log("Performing Brave Search...", "cyan")
  log("⚠ Waiting 1 second to avoid rate limit...", "yellow")
  await new Promise(resolve => setTimeout(resolve, 1000))

  try {
    const results = await braveSearchService.searchOpportunities(query, {
      count: 10,
      filterGov: true,
      freshness: "month",
    })

    log(`\n✓ Search completed!`, "green")
    log(`✓ Found ${results.results.length} total results`, "green")
    console.log()

    if (results.results.length === 0) {
      log("⚠ No results found - trying broader search...", "yellow")
      
      // Try broader search
      const broaderQuery = "government contracts construction Palo Alto California"
      log(`\nTrying broader query: "${broaderQuery}"`, "cyan")
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const broaderResults = await braveSearchService.searchOpportunities(broaderQuery, {
        count: 10,
        filterGov: true,
        freshness: "month",
      })

      if (broaderResults.results.length > 0) {
        log(`✓ Broader search found ${broaderResults.results.length} results`, "green")
        results.results = broaderResults.results
      }
    }

    // Score results
    log("\nScoring and ranking results...", "cyan")
    const scoredResults = braveSearchService.scoreResults(results.results, {
      industry: testCompany.industry,
      naics_codes: testCompany.naics_codes,
    })

    // Analyze results
    const govResults = scoredResults.filter(
      (r) => r.domain?.includes(".gov") || r.url.includes(".gov")
    )

    const contractKeywords = ["contract", "solicitation", "rfp", "rfq", "bid", "procurement"]
    const keywordResults = scoredResults.filter((r) => {
      const text = `${r.title} ${r.description}`.toLowerCase()
      return contractKeywords.some((keyword) => text.includes(keyword))
    })

    log("\nResult Analysis:", "cyan")
    log(`  • Total results: ${scoredResults.length}`, "cyan")
    log(`  • .gov domains: ${govResults.length}`, govResults.length > 0 ? "green" : "yellow")
    log(`  • Contract keywords: ${keywordResults.length}`, keywordResults.length > 0 ? "green" : "yellow")
    log(`  • Average score: ${Math.round(scoredResults.reduce((sum, r) => sum + (r.score || 0), 0) / scoredResults.length)}`, "cyan")
    log(`  • Top score: ${scoredResults[0]?.score || 0}`, "green")

    // Display top 5 results
    log("\n" + "=".repeat(70), "blue")
    log("TOP 5 RESULTS FOR REVIEW", "blue")
    log("=".repeat(70), "blue")
    console.log()

    scoredResults.slice(0, 5).forEach((result, index) => {
      console.log(`${index + 1}. ${result.title}`)
      log(`   Score: ${result.score}`, result.score >= 80 ? "green" : result.score >= 60 ? "yellow" : "red")
      log(`   Domain: ${result.domain || "N/A"}`, "cyan")
      log(`   URL: ${result.url}`, "cyan")
      
      // Check if it's a government site
      const isGov = result.domain?.includes(".gov") || result.url.includes(".gov")
      log(`   Government Site: ${isGov ? "✓ YES" : "✗ NO"}`, isGov ? "green" : "yellow")
      
      // Check for contract keywords
      const text = `${result.title} ${result.description}`.toLowerCase()
      const hasKeywords = contractKeywords.some((keyword) => text.includes(keyword))
      log(`   Contract Keywords: ${hasKeywords ? "✓ YES" : "✗ NO"}`, hasKeywords ? "green" : "yellow")
      
      console.log(`   Description: ${result.description.substring(0, 150)}...`)
      console.log()
    })

    // Show which ones should be approved
    const recommended = scoredResults
      .filter((r) => {
        const isGov = r.domain?.includes(".gov") || r.url.includes(".gov")
        const text = `${r.title} ${r.description}`.toLowerCase()
        const hasKeywords = contractKeywords.some((keyword) => text.includes(keyword))
        return (r.score || 0) >= 60 && (isGov || hasKeywords)
      })
      .slice(0, 5)

    log("\n" + "=".repeat(70), "green")
    log(`RECOMMENDED TO APPROVE: ${recommended.length} opportunities`, "green")
    log("=".repeat(70), "green")
    console.log()

    recommended.forEach((result, index) => {
      console.log(`${index + 1}. ${result.title}`)
      log(`   Score: ${result.score}`, "green")
      log(`   ${result.url}`, "cyan")
      console.log()
    })

    log("\n✓ Test completed successfully!", "green")
    log("\nThese results would be sent to admin for review and approval.", "cyan")
    log("Admin can then select the best 3-5 and push them to the company.", "cyan")

    return {
      success: true,
      query,
      totalResults: scoredResults.length,
      recommended: recommended.length,
      topResults: recommended,
    }
  } catch (error: any) {
    log(`\n✗ Search failed: ${error.message}`, "red")
    if (error.message.includes("429")) {
      log("\n⚠ Rate limit - wait 1 second and try again", "yellow")
    }
    return { success: false, error: error.message }
  }
}

// Run test
testPaloAltoConstruction()
  .then((result) => {
    if (result.success) {
      log("\n✓ All tests passed!", "green")
      process.exit(0)
    } else {
      log("\n✗ Tests failed", "red")
      process.exit(1)
    }
  })
  .catch((error) => {
    console.error("Fatal error:", error)
    process.exit(1)
  })

