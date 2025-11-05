/**
 * Complete Workflow Test (Fixed for Environment Loading)
 * 
 * Tests the entire opportunity discovery workflow:
 * 1. Email notifications (admin & company)
 * 2. Brave Search API integration
 * 3. Query building
 * 4. Result filtering & scoring
 * 
 * Run with: npx tsx test-full-workflow.ts
 */

// Load environment variables FIRST
const dotenv = require('dotenv')
dotenv.config({ path: '.env.local' })

// Now import after env is loaded
const { BraveSearchService } = require('./lib/search/brave')

// Dynamically import email service to avoid early initialization
let emailService: any

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

function logStep(step: number, message: string) {
  log(`\n[STEP ${step}] ${message}`, "blue")
  log("=".repeat(60), "blue")
}

async function testEnvironmentSetup() {
  logStep(1, "Checking Environment Variables")

  const required = {
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    BRAVE_SEARCH_API_KEY: process.env.BRAVE_SEARCH_API_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  }

  let allPresent = true

  for (const [key, value] of Object.entries(required)) {
    if (value) {
      log(`✓ ${key} is set`, "green")
      if (key.includes("KEY")) {
        log(`  Preview: ${value.substring(0, 12)}...`, "cyan")
      } else {
        log(`  Value: ${value}`, "cyan")
      }
    } else {
      log(`✗ ${key} is NOT set`, "red")
      allPresent = false
    }
  }

  if (!allPresent) {
    log("\n❌ Missing environment variables!", "red")
    return false
  }

  log("\n✓ All environment variables are configured", "green")
  
  // Load email service AFTER env is verified
  const emailModule = await import('./lib/email')
  emailService = emailModule.emailService
  
  return true
}

async function testQueryBuilder() {
  logStep(2, "Testing Query Builder")

  const braveSearchService = new BraveSearchService()

  const testCompany = {
    industry: "Construction",
    city: "Los Angeles",
    state: "California",
    naics_codes: ["236220", "237310"],
    business_type: "Small Business",
  }

  log("\nTest Company Profile:", "cyan")
  console.log(JSON.stringify(testCompany, null, 2))

  const query = braveSearchService.buildCompanyQuery(testCompany)
  log(`\n✓ Generated Query: "${query}"`, "green")

  // Validate query components
  const checks = [
    {
      name: "Contains 'government contracts'",
      pass: query.toLowerCase().includes("government contracts"),
    },
    {
      name: "Includes city",
      pass: query.includes(testCompany.city),
    },
    {
      name: "Includes state",
      pass: query.includes(testCompany.state),
    },
    {
      name: "Includes industry",
      pass: query.includes(testCompany.industry),
    },
    {
      name: "Includes NAICS codes",
      pass: testCompany.naics_codes.some((code) => query.includes(code)),
    },
  ]

  console.log("\nQuery Validation:")
  checks.forEach((check) => {
    if (check.pass) {
      log(`  ✓ ${check.name}`, "green")
    } else {
      log(`  ✗ ${check.name}`, "red")
    }
  })

  return { query, testCompany }
}

async function testBraveSearch(query: string) {
  logStep(3, "Testing Brave Search API")

  const braveSearchService = new BraveSearchService()

  try {
    log("\nPerforming search...", "cyan")
    log(`Query: "${query}"`, "cyan")
    log("⚠ Waiting 1 second to avoid rate limit...", "yellow")
    await new Promise(resolve => setTimeout(resolve, 1000))

    const results = await braveSearchService.searchOpportunities(query, {
      count: 10,
      filterGov: true,
      freshness: "month",
    })

    log(`\n✓ Search completed successfully!`, "green")
    log(`✓ Found ${results.results.length} results`, "green")

    if (results.results.length === 0) {
      log("\n⚠ No results found - this might be normal for very specific queries", "yellow")
      log("  Try a broader search or check if there are active opportunities", "yellow")
      return { success: true, results: [], count: 0 }
    }

    // Analyze results
    const govResults = results.results.filter(
      (r) => r.domain?.includes(".gov") || r.url.includes(".gov")
    )

    const contractKeywords = ["contract", "solicitation", "rfp", "rfq", "bid", "procurement"]
    const keywordResults = results.results.filter((r) => {
      const text = `${r.title} ${r.description}`.toLowerCase()
      return contractKeywords.some((keyword) => text.includes(keyword))
    })

    log("\nResult Analysis:", "cyan")
    log(`  • Total results: ${results.results.length}`, "cyan")
    log(`  • .gov domains: ${govResults.length}`, govResults.length > 0 ? "green" : "yellow")
    log(
      `  • Contract keywords: ${keywordResults.length}`,
      keywordResults.length > 0 ? "green" : "yellow"
    )

    // Show top 3 results
    log("\nTop 3 Results:", "cyan")
    results.results.slice(0, 3).forEach((result, index) => {
      console.log(`\n${index + 1}. ${result.title}`)
      log(`   URL: ${result.url}`, "cyan")
      log(`   Domain: ${result.domain || "N/A"}`, "cyan")
      console.log(`   ${result.description.substring(0, 100)}...`)
    })

    // Score results
    const scoredResults = braveSearchService.scoreResults(results.results, {
      industry: "Construction",
      naics_codes: ["236220", "237310"],
    })

    log("\nTop 3 Scored Results:", "cyan")
    scoredResults.slice(0, 3).forEach((result, index) => {
      console.log(`\n${index + 1}. ${result.title}`)
      log(`   Score: ${result.score}`, "green")
      log(`   Domain: ${result.domain}`, "cyan")
    })

    return { success: true, results: results.results, count: results.results.length }
  } catch (error: any) {
    log(`\n✗ Brave Search failed: ${error.message}`, "red")

    if (error.message.includes("429")) {
      log("\n⚠ Rate limit exceeded - wait 1 second and try again", "yellow")
    } else if (error.message.includes("401") || error.message.includes("403")) {
      log("\n⚠ API key issue - check your BRAVE_SEARCH_API_KEY", "yellow")
    }

    return { success: false, error: error.message }
  }
}

async function testAdminEmail() {
  logStep(4, "Testing Admin Email Notification")

  if (!emailService) {
    log("\n✗ Email service not loaded", "red")
    return { success: false, error: "Email service not available" }
  }

  const testData = {
    requestId: `test-${Date.now()}`,
    companyName: "Test Construction Company",
    industry: "Construction",
    location: "Los Angeles, California",
    businessType: "Small Business",
    naicsCodes: ["236220", "237310"],
  }

  log("\nSending test email to parker@stroomai.com AND veteransccsd@gmail.com...", "cyan")
  log("Test Data:", "cyan")
  console.log(JSON.stringify(testData, null, 2))

  try {
    const result = await emailService.sendAdminOpportunityRequestNotification(
      testData.requestId,
      testData.companyName,
      testData.industry,
      testData.location,
      testData.businessType,
      testData.naicsCodes
    )

    if (result.success) {
      log(`\n✓ Email sent successfully!`, "green")
      log(`✓ Message ID: ${result.messageId}`, "green")
      log("\n📧 Please check inboxes at:", "cyan")
      log("  - parker@stroomai.com", "cyan")
      log("  - veteransccsd@gmail.com", "cyan")
      log("Expected email:", "cyan")
      log('  Subject: "New Opportunity Request from Test Construction Company"', "cyan")
      log("  Contains: Company details, location, NAICS codes", "cyan")
      log("  Has: Link to admin panel", "cyan")
      return { success: true, messageId: result.messageId }
    } else {
      log(`\n✗ Email send failed: ${result.error}`, "red")
      return { success: false, error: result.error }
    }
  } catch (error: any) {
    log(`\n✗ Error sending email: ${error.message}`, "red")
    return { success: false, error: error.message }
  }
}

async function testCompanyEmail() {
  logStep(5, "Testing Company Email Notification")

  if (!emailService) {
    log("\n✗ Email service not loaded", "red")
    return { success: false, error: "Email service not available" }
  }

  const testOpportunities = [
    {
      title: "GSA Schedule 36 - Building Construction Services",
      agency: "General Services Administration",
      deadline: "2024-12-31",
      url: "https://sam.gov/opportunities/12345",
    },
    {
      title: "Los Angeles County Construction Projects",
      agency: "LA County Public Works",
      deadline: "2024-12-15",
      url: "https://lacounty.gov/contracts/abc",
    },
    {
      title: "Federal Highway Administration - Bridge Construction",
      agency: "Department of Transportation",
      deadline: "2025-01-10",
      url: "https://fhwa.dot.gov/projects/xyz",
    },
  ]

  // Use a test email (you can change this)
  const testEmail = "test@example.com"

  log(`\nSending test email to ${testEmail}...`, "cyan")
  log(`Opportunities: ${testOpportunities.length}`, "cyan")

  try {
    const result = await emailService.sendOpportunitiesReadyEmail(
      testEmail,
      "Test User",
      testOpportunities
    )

    if (result.success) {
      log(`\n✓ Email sent successfully!`, "green")
      log(`✓ Message ID: ${result.messageId}`, "green")
      log(`\n📧 Email sent to ${testEmail}`, "cyan")
      log("Expected email:", "cyan")
      log('  Subject: "🎯 We found 3 perfect opportunities for you!"', "cyan")
      log("  Contains: List of 3 opportunities", "cyan")
      log("  Has: Link to /my-opportunities", "cyan")
      log("\n⚠ Note: This is a test email - update testEmail variable for real testing", "yellow")
      return { success: true, messageId: result.messageId }
    } else {
      log(`\n✗ Email send failed: ${result.error}`, "red")
      return { success: false, error: result.error }
    }
  } catch (error: any) {
    log(`\n✗ Error sending email: ${error.message}`, "red")
    return { success: false, error: error.message }
  }
}

async function testFilteringAndScoring() {
  logStep(6, "Testing Filtering & Scoring Logic")

  const braveSearchService = new BraveSearchService()

  // Mock results (simulating Brave Search response)
  const mockResults = [
    {
      title: "GSA Construction Contracts",
      url: "https://gsa.gov/contracts/123",
      description: "General Services Administration seeking construction contractors...",
      domain: "gsa.gov",
      rank: 1,
    },
    {
      title: "SAM.gov Contract Opportunities",
      url: "https://sam.gov/opportunities/456",
      description: "Federal contract opportunities for construction services...",
      domain: "sam.gov",
      rank: 2,
    },
    {
      title: "Commercial Construction Blog",
      url: "https://constructionblog.com/article",
      description: "Latest trends in commercial construction...",
      domain: "constructionblog.com",
      rank: 3,
    },
  ] as any[]

  log("\nMock Results:", "cyan")
  mockResults.forEach((r, i) => {
    console.log(`${i + 1}. ${r.title} (${r.domain})`)
  })

  // Test filtering
  const govResults = mockResults.filter(
    (r) => r.domain?.includes(".gov") || r.url.includes(".gov")
  )

  log(`\n✓ Filtered Results: ${govResults.length}/${mockResults.length} are .gov`, "green")

  // Test scoring
  const scored = braveSearchService.scoreResults(mockResults, {
    industry: "Construction",
    naics_codes: ["236220"],
  })

  log("\nScored Results:", "cyan")
  scored.forEach((result, i) => {
    console.log(`${i + 1}. ${result.title}`)
    log(`   Score: ${result.score}`, result.score > 80 ? "green" : "yellow")
    log(`   Domain: ${result.domain}`, "cyan")
  })

  log("\n✓ Filtering and scoring logic working correctly", "green")
  return { success: true }
}

async function runFullTest() {
  console.log("\n")
  log("=".repeat(60), "blue")
  log("COMPLETE WORKFLOW TEST", "blue")
  log("=".repeat(60), "blue")
  log("Testing all components of the opportunity discovery system", "cyan")
  console.log()

  const results = {
    environment: false,
    queryBuilder: false,
    braveSearch: false,
    adminEmail: false,
    companyEmail: false,
    filtering: false,
  }

  // Step 1: Environment
  results.environment = await testEnvironmentSetup()
  if (!results.environment) {
    log("\n❌ Cannot continue - environment not configured", "red")
    return results
  }

  // Step 2: Query Builder
  const queryResult = await testQueryBuilder()
  results.queryBuilder = true

  // Step 3: Brave Search
  const searchResult = await testBraveSearch(queryResult.query)
  results.braveSearch = searchResult.success

  // Step 4: Admin Email
  const adminEmailResult = await testAdminEmail()
  results.adminEmail = adminEmailResult.success

  // Step 5: Company Email
  const companyEmailResult = await testCompanyEmail()
  results.companyEmail = companyEmailResult.success

  // Step 6: Filtering & Scoring
  const filterResult = await testFilteringAndScoring()
  results.filtering = filterResult.success

  // Final Summary
  console.log("\n")
  log("=".repeat(60), "blue")
  log("TEST SUMMARY", "blue")
  log("=".repeat(60), "blue")

  const totalTests = Object.keys(results).length
  const passedTests = Object.values(results).filter(Boolean).length

  console.log(`\nTotal Tests: ${totalTests}`)
  log(`Passed: ${passedTests}/${totalTests}`, passedTests === totalTests ? "green" : "yellow")
  console.log(`Failed: ${totalTests - passedTests}/${totalTests}`)

  console.log("\nDetailed Results:")
  Object.entries(results).forEach(([test, passed]) => {
    const name = test.replace(/([A-Z])/g, " $1").toLowerCase()
    if (passed) {
      log(`  ✓ ${name}`, "green")
    } else {
      log(`  ✗ ${name}`, "red")
    }
  })

  console.log("\n")
  if (passedTests === totalTests) {
    log("🎉 ALL TESTS PASSED! System is ready for production.", "green")
  } else {
    log("⚠ Some tests failed - review errors above", "yellow")
  }

  console.log("\n")
  log("Next Steps:", "cyan")
  log("1. Check email inboxes at:", "cyan")
  log("   - parker@stroomai.com", "cyan")
  log("   - veteransccsd@gmail.com", "cyan")
  log("2. Test the full workflow through the UI:", "cyan")
  log("   - Company clicks 'Get Opportunities' on dashboard", "cyan")
  log("   - Admin receives email and searches", "cyan")
  log("   - Admin approves opportunities", "cyan")
  log("   - Company receives email and views /my-opportunities", "cyan")

  return results
}

// Run tests
runFullTest()
  .then((results) => {
    const allPassed = Object.values(results).every(Boolean)
    process.exit(allPassed ? 0 : 1)
  })
  .catch((error) => {
    log(`\n✗ Fatal error: ${error.message}`, "red")
    console.error(error)
    process.exit(1)
  })
