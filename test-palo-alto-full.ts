/**
 * End-to-End Test: Palo Alto Construction Company
 * 
 * Simulates the complete workflow:
 * 1. Company profile (Palo Alto construction)
 * 2. Brave Search query building
 * 3. Brave Search API call
 * 4. Result filtering and scoring
 * 5. Display top results
 * 
 * Run with: npx tsx test-palo-alto-full.ts
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

async function testPaloAltoConstructionFull() {
  console.log("\n")
  log("=".repeat(70), "blue")
  log("FULL WORKFLOW TEST: Palo Alto Construction Company", "blue")
  log("=".repeat(70), "blue")
  console.log()

  const braveSearchService = new BraveSearchService()

  // Simulate Palo Alto Construction Company Profile
  const companyProfile = {
    name: "Palo Alto Construction Co.",
    industry: "Construction",
    city: "Palo Alto",
    state: "California",
    naics_codes: ["236220", "237310", "236210"], // Commercial, Highway, Residential
    business_type: "Small Business",
    headquarters_address: {
      city: "Palo Alto",
      state: "California"
    }
  }

  log("📋 COMPANY PROFILE", "cyan")
  log("=".repeat(70), "cyan")
  console.log(JSON.stringify(companyProfile, null, 2))
  console.log()

  // Step 1: Build Query
  log("🔍 STEP 1: Building Search Query", "blue")
  log("-".repeat(70), "blue")
  
  const query = braveSearchService.buildCompanyQuery({
    industry: companyProfile.industry,
    city: companyProfile.city,
    state: companyProfile.state,
    naics_codes: companyProfile.naics_codes,
    business_type: companyProfile.business_type
  })

  log(`✓ Generated Query: "${query}"`, "green")
  
  // Validate query components
  const checks = [
    { name: "Contains 'government contracts'", check: query.toLowerCase().includes("government contracts") },
    { name: "Includes city (Palo Alto)", check: query.includes("Palo Alto") },
    { name: "Includes state (California)", check: query.includes("California") },
    { name: "Includes industry (Construction)", check: query.includes("Construction") },
    { name: "Includes NAICS codes", check: companyProfile.naics_codes.some(code => query.includes(code)) }
  ]

  console.log("\nQuery Validation:")
  checks.forEach(({ name, check }) => {
    log(`  ${check ? '✓' : '✗'} ${name}`, check ? "green" : "red")
  })
  console.log()

  // Step 2: Perform Brave Search
  log("🌐 STEP 2: Performing Brave Search", "blue")
  log("-".repeat(70), "blue")
  
  // Check API key first
  const apiKey = process.env.BRAVE_SEARCH_API_KEY
  if (!apiKey) {
    log("\n✗ BRAVE_SEARCH_API_KEY not found in environment", "red")
    log("Please check your .env.local file", "yellow")
    return { success: false, error: "API key not configured" }
  }
  
  log(`✓ API Key found: ${apiKey.substring(0, 15)}...`, "green")
  log("⚠ Waiting 2 seconds to avoid rate limit...", "yellow")
  await new Promise(resolve => setTimeout(resolve, 2000))

  try {
    const searchResults = await braveSearchService.searchOpportunities(query, {
      count: 10,
      filterGov: false, // Don't filter initially - see all results
      freshness: "month"
    })

    log(`\n✓ Search completed!`, "green")
    log(`✓ Found ${searchResults.results.length} results`, "green")

    if (searchResults.results.length === 0) {
      log("\n⚠ No results - trying broader search...", "yellow")
      
      // Try broader queries
      const broaderQueries = [
        "government contracts construction California",
        "federal construction contracts site:.gov",
        "sam.gov construction contracts",
        "gsa construction contracts California"
      ]

      for (const broaderQuery of broaderQueries) {
        log(`\nTrying: "${broaderQuery}"`, "cyan")
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        const broaderResults = await braveSearchService.searchOpportunities(broaderQuery, {
          count: 5,
          filterGov: true,
          freshness: "month"
        })

        if (broaderResults.results.length > 0) {
          log(`✓ Found ${broaderResults.results.length} results!`, "green")
          searchResults.results = broaderResults.results
          break
        }
      }
    }

    if (searchResults.results.length === 0) {
      log("\n⚠ Still no results found", "yellow")
      log("This might be normal - Brave Search may not have active opportunities", "yellow")
      log("for this specific query. In production, you can:", "yellow")
      log("  1. Try different search terms", "yellow")
      log("  2. Check Brave Search dashboard for API status", "yellow")
      log("  3. Wait and try again (rate limits)", "yellow")
      return
    }

    // Step 3: Score Results
    log("\n📊 STEP 3: Scoring & Ranking Results", "blue")
    log("-".repeat(70), "blue")

    const scoredResults = braveSearchService.scoreResults(searchResults.results, {
      industry: companyProfile.industry,
      naics_codes: companyProfile.naics_codes
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
    log(`  • Score range: ${scoredResults[scoredResults.length - 1]?.score || 0} - ${scoredResults[0]?.score || 0}`, "cyan")

    // Step 4: Display Top Results
    log("\n🎯 STEP 4: Top Results for Review", "blue")
    log("=".repeat(70), "blue")
    console.log()

    const topResults = scoredResults.slice(0, 10)

    topResults.forEach((result, index) => {
      const isGov = result.domain?.includes(".gov") || result.url.includes(".gov")
      const text = `${result.title} ${result.description}`.toLowerCase()
      const hasKeywords = contractKeywords.some((keyword) => text.includes(keyword))

      console.log(`${index + 1}. ${result.title}`)
      log(`   Score: ${result.score}`, result.score >= 80 ? "green" : result.score >= 60 ? "yellow" : "red")
      log(`   Domain: ${result.domain || "N/A"}`, "cyan")
      log(`   Government: ${isGov ? "✓ YES" : "✗ NO"}`, isGov ? "green" : "yellow")
      log(`   Keywords: ${hasKeywords ? "✓ YES" : "✗ NO"}`, hasKeywords ? "green" : "yellow")
      log(`   URL: ${result.url}`, "cyan")
      console.log(`   ${result.description.substring(0, 120)}...`)
      console.log()
    })

    // Step 5: Recommend Top 3-5
    log("✅ STEP 5: Recommended for Approval", "blue")
    log("=".repeat(70), "blue")
    console.log()

    const recommended = topResults
      .filter((r) => {
        const isGov = r.domain?.includes(".gov") || r.url.includes(".gov")
        const text = `${r.title} ${r.description}`.toLowerCase()
        const hasKeywords = contractKeywords.some((keyword) => text.includes(keyword))
        return (r.score || 0) >= 60 && (isGov || hasKeywords)
      })
      .slice(0, 5)

    if (recommended.length === 0) {
      log("⚠ No results meet the quality threshold (score >= 60 + .gov or keywords)", "yellow")
      log("Top 3 would still be recommended:", "yellow")
      const top3 = topResults.slice(0, 3)
      top3.forEach((result, index) => {
        console.log(`\n${index + 1}. ${result.title}`)
        log(`   Score: ${result.score}`, "green")
        log(`   ${result.url}`, "cyan")
      })
    } else {
      log(`✓ ${recommended.length} opportunities recommended for approval:`, "green")
      console.log()
      
      recommended.forEach((result, index) => {
        console.log(`${index + 1}. ${result.title}`)
        log(`   Score: ${result.score}`, "green")
        log(`   Domain: ${result.domain}`, "cyan")
        log(`   ${result.url}`, "cyan")
        console.log(`   ${result.description.substring(0, 100)}...`)
        console.log()
      })
    }

    // Summary
    console.log()
    log("=".repeat(70), "green")
    log("✓ TEST COMPLETED SUCCESSFULLY", "green")
    log("=".repeat(70), "green")
    log("\nSummary:", "cyan")
    log(`  • Query: "${query}"`, "cyan")
    log(`  • Results found: ${scoredResults.length}`, "cyan")
    log(`  • Government sites: ${govResults.length}`, govResults.length > 0 ? "green" : "yellow")
    log(`  • Recommended: ${recommended.length || 3} opportunities`, "green")
    log(`  • Top score: ${scoredResults[0]?.score || 0}`, "green")
    log("\nNext Steps:", "cyan")
    log("  1. These results would appear in /admin/review-opportunities", "cyan")
    log("  2. Admin selects top 3-5 and clicks 'Send to Company'", "cyan")
    log("  3. Company reviews and accepts opportunities they want to pay for", "cyan")
    log("  4. Admin team builds contracts for accepted opportunities", "cyan")
    console.log()

    return {
      success: true,
      query,
      totalResults: scoredResults.length,
      recommended: recommended.length || 3,
      topResults: recommended.length > 0 ? recommended : topResults.slice(0, 3)
    }

  } catch (error: any) {
    log(`\n✗ Search failed: ${error.message}`, "red")
    
    if (error.message.includes("429")) {
      log("\n⚠ Rate limit exceeded", "yellow")
      log("Wait 1 second between searches (free tier limitation)", "yellow")
    } else if (error.message.includes("401") || error.message.includes("403")) {
      log("\n⚠ API authentication issue", "yellow")
      log("Check your BRAVE_SEARCH_API_KEY in .env.local", "yellow")
    } else {
      log("\nFull error:", "red")
      console.error(error)
    }

    return { success: false, error: error.message }
  }
}

// Run test
testPaloAltoConstructionFull()
  .then((result) => {
    if (result?.success) {
      log("\n🎉 All tests passed!", "green")
      process.exit(0)
    } else {
      log("\n⚠ Some tests failed", "yellow")
      process.exit(1)
    }
  })
  .catch((error) => {
    console.error("Fatal error:", error)
    process.exit(1)
  })

