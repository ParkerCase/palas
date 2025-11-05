/**
 * Test Script: Construction Company in Palo Alto (Broader Search)
 * 
 * Tests with broader queries to get actual results
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
  log("TEST: Construction Company in Palo Alto - BROADER SEARCH", "blue")
  log("=".repeat(70), "blue")
  console.log()

  const braveSearchService = new BraveSearchService()

  // Test with broader queries
  const queries = [
    "government contracts construction California",
    "federal construction contracts site:.gov",
    "construction contracts Palo Alto site:.gov",
    "sam.gov construction contracts California",
    "gsa construction contracts California"
  ]

  let allResults: any[] = []

  for (const query of queries) {
    log(`\nSearching: "${query}"`, "cyan")
    await new Promise(resolve => setTimeout(resolve, 1000)) // Rate limit delay

    try {
      const results = await braveSearchService.searchOpportunities(query, {
        count: 5,
        filterGov: true,
        freshness: "month",
      })

      if (results.results.length > 0) {
        log(`✓ Found ${results.results.length} results`, "green")
        allResults.push(...results.results)
      } else {
        log("✗ No results", "yellow")
      }
    } catch (error: any) {
      if (error.message.includes("429")) {
        log("⚠ Rate limited - waiting...", "yellow")
        await new Promise(resolve => setTimeout(resolve, 2000))
      } else {
        log(`✗ Error: ${error.message}`, "red")
      }
    }
  }

  if (allResults.length === 0) {
    log("\n⚠ No results found with any query", "yellow")
    log("This might be normal if there are no active opportunities", "yellow")
    return
  }

  // Remove duplicates by URL
  const uniqueResults = Array.from(
    new Map(allResults.map(r => [r.url, r])).values()
  )

  log(`\n✓ Total unique results: ${uniqueResults.length}`, "green")

  // Score results
  const scoredResults = braveSearchService.scoreResults(uniqueResults, {
    industry: "Construction",
    naics_codes: ["236220", "237310"],
  })

  // Sort by score
  scoredResults.sort((a, b) => (b.score || 0) - (a.score || 0))

  // Display top results
  log("\n" + "=".repeat(70), "blue")
  log("TOP RESULTS FOR PALO ALTO CONSTRUCTION COMPANY", "blue")
  log("=".repeat(70), "blue")
  console.log()

  const topResults = scoredResults.slice(0, 10)
  
  topResults.forEach((result, index) => {
    const isGov = result.domain?.includes(".gov") || result.url.includes(".gov")
    console.log(`${index + 1}. ${result.title}`)
    log(`   Score: ${result.score}`, result.score >= 80 ? "green" : result.score >= 60 ? "yellow" : "red")
    log(`   Domain: ${result.domain || "N/A"}`, "cyan")
    log(`   Government: ${isGov ? "✓ YES" : "✗ NO"}`, isGov ? "green" : "yellow")
    log(`   URL: ${result.url}`, "cyan")
    console.log(`   ${result.description.substring(0, 120)}...`)
    console.log()
  })

  // Recommend top 5
  const recommended = topResults
    .filter((r) => {
      const isGov = r.domain?.includes(".gov") || r.url.includes(".gov")
      return (r.score || 0) >= 60 && isGov
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

  log("\n✓ Test completed!", "green")
}

testPaloAltoConstruction()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error("Fatal error:", error)
    process.exit(1)
  })

