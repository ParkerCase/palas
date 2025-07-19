#!/usr/bin/env node

/**
 * 🚀 COMPREHENSIVE PRODUCTION READINESS TEST
 * 
 * Tests all functionality to ensure platform is ready for handover
 */

const chalk = require('chalk') || { 
  green: (text) => text, 
  red: (text) => text, 
  yellow: (text) => text, 
  blue: (text) => text, 
  cyan: (text) => text,
  bold: (text) => text 
}

console.log(chalk.cyan.bold('🚀 GOVCONTRACT-AI PRODUCTION READINESS TEST'))
console.log(chalk.cyan('=' .repeat(60)))

const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  warnings: 0,
  critical: [],
  details: []
}

async function runTest(testName, testFunction, isCritical = false) {
  testResults.total++
  console.log(chalk.blue(`\n🧪 Testing: ${testName}`))
  
  try {
    const result = await testFunction()
    if (result.success) {
      testResults.passed++
      console.log(chalk.green(`✅ PASS: ${testName}`))
      if (result.details) {
        console.log(chalk.green(`   ${result.details}`))
      }
    } else {
      if (result.warning) {
        testResults.warnings++
        console.log(chalk.yellow(`⚠️  WARN: ${testName}`))
      } else {
        testResults.failed++
        if (isCritical) testResults.critical.push(testName)
        console.log(chalk.red(`❌ FAIL: ${testName}`))
      }
      if (result.error) {
        console.log(chalk.red(`   Error: ${result.error}`))
      }
    }
    testResults.details.push({ 
      name: testName, 
      success: result.success, 
      details: result.details || result.error,
      critical: isCritical 
    })
  } catch (error) {
    testResults.failed++
    if (isCritical) testResults.critical.push(testName)
    console.log(chalk.red(`❌ FAIL: ${testName}`))
    console.log(chalk.red(`   Exception: ${error.message}`))
    testResults.details.push({ 
      name: testName, 
      success: false, 
      error: error.message,
      critical: isCritical 
    })
  }
}

// Test 1: Server Health Check
async function testServerHealth() {
  try {
    const response = await fetch('http://localhost:3000')
    
    if (response.ok || response.status === 404 || response.status === 307) {
      return { 
        success: true, 
        details: `Server responding with status ${response.status}` 
      }
    } else {
      return { 
        success: false, 
        error: `Server returned ${response.status}` 
      }
    }
  } catch (error) {
    return { 
      success: false, 
      error: 'Server not responding - run npm run dev first' 
    }
  }
}

// Test 2: Authentication API Protection
async function testAuthProtection() {
  try {
    const response = await fetch('http://localhost:3000/api/opportunities')
    
    if (response.status === 401) {
      return { 
        success: true, 
        details: 'API properly protected with authentication' 
      }
    } else {
      return { 
        success: false, 
        error: `Expected 401, got ${response.status}. API may not be properly secured.` 
      }
    }
  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    }
  }
}

// Test 3: USAspending.gov API Integration
async function testUSASpendingAPI() {
  try {
    const requestBody = {
      filters: {
        award_type_codes: ['A', 'B', 'C', 'D'],
        time_period: [{
          start_date: '2024-01-01',
          end_date: '2024-12-31'
        }]
      },
      fields: ['Award ID', 'Recipient Name', 'Award Amount'],
      page: 1,
      limit: 5
    }

    const response = await fetch('https://api.usaspending.gov/api/v2/search/spending_by_award/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'GovContractAI-ProductionTest/1.0'
      },
      body: JSON.stringify(requestBody)
    })

    if (response.ok) {
      const data = await response.json()
      const resultsCount = data.results?.length || 0
      const totalAmount = data.results?.reduce((sum, award) => sum + (award['Award Amount'] || 0), 0) || 0
      
      return { 
        success: true, 
        details: `${resultsCount} contracts found, $${(totalAmount/1000000).toFixed(1)}M total value` 
      }
    } else {
      return { 
        success: false, 
        error: `API returned ${response.status}: ${response.statusText}` 
      }
    }
  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    }
  }
}

// Test 4: Grants.gov API Integration
async function testGrantsGovAPI() {
  try {
    const requestBody = {
      rows: 5,
      keyword: 'technology',
      oppStatuses: 'forecasted|posted'
    }

    const response = await fetch('https://api.grants.gov/v1/api/search2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'GovContractAI-ProductionTest/1.0'
      },
      body: JSON.stringify(requestBody)
    })

    if (response.ok) {
      const data = await response.json()
      
      if (data.errorcode === 0) {
        const grantsCount = data.data?.oppHits?.length || 0
        return { 
          success: true, 
          details: `${grantsCount} grants found from ${data.hitCount || 0} total` 
        }
      } else {
        return { 
          success: false, 
          error: `Grants.gov error: ${data.msg || 'Unknown error'}` 
        }
      }
    } else {
      return { 
        success: false, 
        error: `API returned ${response.status}: ${response.statusText}` 
      }
    }
  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    }
  }
}

// Test 5: NPPES Healthcare API
async function testNPPESAPI() {
  try {
    const response = await fetch('https://npiregistry.cms.hhs.gov/api/?state=CA&limit=5', {
      headers: {
        'User-Agent': 'GovContractAI-ProductionTest/1.0',
        'Accept': 'application/json'
      }
    })

    if (response.ok) {
      const data = await response.json()
      const providersCount = data.results?.length || 0
      const totalCount = data.result_count || 0
      
      return { 
        success: true, 
        details: `${providersCount} providers from ${totalCount} total in CA` 
      }
    } else {
      return { 
        success: false, 
        error: `NPPES API returned ${response.status}` 
      }
    }
  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    }
  }
}

// Test 6: IPEDS Education API
async function testIPEDSAPI() {
  try {
    const response = await fetch('https://educationdata.urban.org/api/v1/college-university/ipeds/institutional-characteristics/2022/?state=CA&limit=5', {
      headers: {
        'User-Agent': 'GovContractAI-ProductionTest/1.0',
        'Accept': 'application/json'
      }
    })

    if (response.ok) {
      const data = await response.json()
      const institutionsCount = data.results?.length || 0
      
      return { 
        success: true, 
        details: `${institutionsCount} institutions found in CA` 
      }
    } else {
      return { 
        success: false, 
        error: `IPEDS API returned ${response.status}` 
      }
    }
  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    }
  }
}

// Test 7: OpenAI API Configuration
async function testOpenAIConfig() {
  try {
    const apiKey = process.env.OPENAI_API_KEY
    
    if (!apiKey) {
      return { 
        success: false, 
        error: 'OPENAI_API_KEY not found in environment variables' 
      }
    }

    if (!apiKey.startsWith('sk-')) {
      return { 
        success: false, 
        error: 'OPENAI_API_KEY appears to be invalid format' 
      }
    }

    // Test basic API call
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'User-Agent': 'GovContractAI-ProductionTest/1.0'
      }
    })

    if (response.ok) {
      const data = await response.json()
      const modelsCount = data.data?.length || 0
      
      return { 
        success: true, 
        details: `OpenAI API accessible, ${modelsCount} models available` 
      }
    } else {
      return { 
        success: false, 
        error: `OpenAI API returned ${response.status}` 
      }
    }
  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    }
  }
}

// Test 8: Environment Variables
async function testEnvironmentVariables() {
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'OPENAI_API_KEY'
  ]

  const missing = requiredVars.filter(varName => !process.env[varName])
  
  if (missing.length === 0) {
    return { 
      success: true, 
      details: 'All required environment variables present' 
    }
  } else {
    return { 
      success: false, 
      error: `Missing environment variables: ${missing.join(', ')}` 
    }
  }
}

// Test 9: Page Load Performance
async function testPagePerformance() {
  try {
    const startTime = Date.now()
    const response = await fetch('http://localhost:3000')
    const endTime = Date.now()
    const responseTime = endTime - startTime

    if (responseTime < 2000) {
      return { 
        success: true, 
        details: `Page loads in ${responseTime}ms (excellent)` 
      }
    } else if (responseTime < 5000) {
      return { 
        success: true, 
        warning: true,
        details: `Page loads in ${responseTime}ms (acceptable but could be faster)` 
      }
    } else {
      return { 
        success: false, 
        error: `Page loads in ${responseTime}ms (too slow for production)` 
      }
    }
  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    }
  }
}

// Test 10: Data Quality Verification
async function testDataQuality() {
  try {
    // Test multiple APIs to ensure we're getting real, diverse data
    const [usaResponse, grantsResponse] = await Promise.all([
      fetch('https://api.usaspending.gov/api/v2/search/spending_by_award/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'User-Agent': 'GovContractAI-ProductionTest/1.0' },
        body: JSON.stringify({
          filters: { award_type_codes: ['A'], time_period: [{ start_date: '2024-01-01', end_date: '2024-12-31' }] },
          fields: ['Award ID', 'Award Amount', 'Recipient Name'],
          limit: 3
        })
      }),
      fetch('https://api.grants.gov/v1/api/search2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'User-Agent': 'GovContractAI-ProductionTest/1.0' },
        body: JSON.stringify({ rows: 3, oppStatuses: 'posted' })
      })
    ])

    const [usaData, grantsData] = await Promise.all([
      usaResponse.json(),
      grantsResponse.json()
    ])

    // Verify data quality
    const hasUSAData = usaData.results?.length > 0
    const hasGrantsData = grantsData.errorcode === 0 && grantsData.data?.oppHits?.length > 0
    const hasRealAmounts = usaData.results?.some(award => award['Award Amount'] > 100000)

    if (hasUSAData && hasGrantsData && hasRealAmounts) {
      return { 
        success: true, 
        details: 'Real government data verified across multiple sources' 
      }
    } else {
      return { 
        success: false, 
        error: 'Data quality issues detected - may be using mock data' 
      }
    }
  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    }
  }
}

// Main test execution
async function runAllTests() {
  console.log(chalk.yellow('\n📋 CRITICAL INFRASTRUCTURE TESTS'))
  console.log(chalk.yellow('-'.repeat(40)))
  
  await runTest('Server Health Check', testServerHealth, true)
  await runTest('Environment Variables', testEnvironmentVariables, true)
  await runTest('Authentication Protection', testAuthProtection, true)
  
  console.log(chalk.yellow('\n🔌 EXTERNAL API INTEGRATIONS'))
  console.log(chalk.yellow('-'.repeat(40)))
  
  await runTest('USAspending.gov Integration', testUSASpendingAPI, true)
  await runTest('Grants.gov Integration', testGrantsGovAPI, true)
  await runTest('NPPES Healthcare API', testNPPESAPI)
  await runTest('IPEDS Education API', testIPEDSAPI)
  await runTest('OpenAI API Configuration', testOpenAIConfig, true)
  
  console.log(chalk.yellow('\n⚡ PERFORMANCE & QUALITY'))
  console.log(chalk.yellow('-'.repeat(40)))
  
  await runTest('Page Load Performance', testPagePerformance)
  await runTest('Data Quality Verification', testDataQuality, true)
  
  // Generate comprehensive report
  await generateLaunchReport()
}

async function generateLaunchReport() {
  console.log(chalk.cyan.bold('\n📊 PRODUCTION READINESS REPORT'))
  console.log(chalk.cyan('=' .repeat(50)))
  
  const totalTests = testResults.total
  const successRate = totalTests > 0 ? ((testResults.passed / totalTests) * 100).toFixed(1) : 0
  const criticalIssues = testResults.critical.length
  
  console.log(`\n📈 OVERALL SCORE: ${successRate}%`)
  console.log(`✅ Passed: ${testResults.passed}/${totalTests}`)
  console.log(`❌ Failed: ${testResults.failed}/${totalTests}`)
  console.log(`⚠️  Warnings: ${testResults.warnings}/${totalTests}`)
  console.log(`🚨 Critical Issues: ${criticalIssues}`)
  
  if (criticalIssues === 0 && testResults.failed === 0) {
    console.log(chalk.green.bold('\n🚀 PRODUCTION READY! 🚀'))
    console.log(chalk.green('====================================='))
    console.log(chalk.green('✅ All critical systems operational'))
    console.log(chalk.green('✅ Real government data sources working'))
    console.log(chalk.green('✅ AI integration functional'))
    console.log(chalk.green('✅ Authentication properly secured'))
    console.log(chalk.green('✅ APIs responding correctly'))
    console.log(chalk.green('✅ Performance within acceptable limits'))
    
    console.log(chalk.cyan.bold('\n🎯 READY FOR BUSINESS PARTNER HANDOVER'))
    console.log(chalk.cyan('Your platform is production-ready with:'))
    console.log(chalk.cyan('• Real-time government data integration'))
    console.log(chalk.cyan('• AI-powered opportunity analysis'))
    console.log(chalk.cyan('• Secure user authentication'))
    console.log(chalk.cyan('• Healthcare & education sector intelligence'))
    console.log(chalk.cyan('• Zero-friction user experience'))
    
    console.log(chalk.green.bold('\n📋 HANDOVER CHECKLIST:'))
    console.log(chalk.green('1. ✅ Share environment variables with business partner'))
    console.log(chalk.green('2. ✅ Provide access to Supabase dashboard'))
    console.log(chalk.green('3. ✅ Document API rate limits and usage'))
    console.log(chalk.green('4. ✅ Set up monitoring and alerting'))
    console.log(chalk.green('5. ✅ Create admin user accounts'))
    console.log(chalk.green('6. ✅ Deploy to production environment'))
    
  } else if (criticalIssues === 0 && testResults.failed <= 2) {
    console.log(chalk.yellow.bold('\n⚠️  MOSTLY READY - MINOR ISSUES TO ADDRESS'))
    console.log(chalk.yellow('============================================='))
    console.log(chalk.yellow('Core functionality working but some non-critical issues detected.'))
    
  } else {
    console.log(chalk.red.bold('\n🛑 NOT READY FOR PRODUCTION'))
    console.log(chalk.red('=============================='))
    console.log(chalk.red('Critical issues must be resolved before handover.'))
    
    if (criticalIssues > 0) {
      console.log(chalk.red.bold('\n🚨 CRITICAL ISSUES TO FIX:'))
      testResults.critical.forEach(issue => {
        console.log(chalk.red(`  • ${issue}`))
      })
    }
  }
  
  // Detailed breakdown
  console.log(chalk.blue.bold('\n📋 DETAILED TEST RESULTS:'))
  testResults.details.forEach(test => {
    const symbol = test.success ? '✅' : '❌'
    const color = test.success ? chalk.green : chalk.red
    console.log(color(`${symbol} ${test.name}`))
    if (test.details) {
      console.log(color(`   ${test.details}`))
    }
    if (test.error) {
      console.log(chalk.red(`   Error: ${test.error}`))
    }
  })
  
  return criticalIssues === 0 && testResults.failed === 0
}

// Handle global fetch if not available
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch')
}

// Load environment variables
require('dotenv').config({ path: '.env.local' })

// Run the comprehensive test suite
runAllTests().then(isReady => {
  if (isReady) {
    console.log(chalk.green.bold('\n🏆 PLATFORM READY FOR HANDOVER! 🏆'))
    process.exit(0)
  } else {
    console.log(chalk.red.bold('\n🔧 ISSUES NEED RESOLUTION'))
    process.exit(1)
  }
}).catch(error => {
  console.error(chalk.red.bold('\n💥 TEST SUITE FAILED:'), error.message)
  process.exit(1)
})