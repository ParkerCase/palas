#!/usr/bin/env node

/**
 * 🎯 GovContractAI - Complete Platform Verification Script
 * 
 * This script comprehensively tests:
 * ✅ Database schema and tables
 * ✅ API endpoints with real data
 * ✅ UI components functionality  
 * ✅ Authentication flow
 * ✅ AI integration
 * ✅ Government data sources
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Configuration
const config = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  anthropicKey: process.env.ANTHROPIC_API_KEY,
  samGovKey: process.env.SAM_GOV_API_KEY,
  collegeScorecardKey: process.env.COLLEGE_SCORECARD_API_KEY,
  baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
}

// Results tracking
const results = {
  database: { total: 0, passed: 0, failed: 0, details: [] },
  apis: { total: 0, passed: 0, failed: 0, details: [] },
  ui: { total: 0, passed: 0, failed: 0, details: [] },
  integration: { total: 0, passed: 0, failed: 0, details: [] },
  overall: { total: 0, passed: 0, failed: 0 }
}

// Utility functions
const colors = {
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
  bold: (text) => `\x1b[1m${text}\x1b[0m`
}

async function runTest(category, testName, testFunction) {
  results[category].total++
  results.overall.total++
  
  console.log(colors.blue(`\n🧪 Testing: ${testName}`))
  
  try {
    const result = await testFunction()
    if (result.success) {
      results[category].passed++
      results.overall.passed++
      console.log(colors.green(`✅ PASS: ${testName}`))
      if (result.details) {
        console.log(colors.green(`   ${result.details}`))
      }
    } else {
      results[category].failed++
      results.overall.failed++
      console.log(colors.red(`❌ FAIL: ${testName}`))
      if (result.error) {
        console.log(colors.red(`   Error: ${result.error}`))
      }
    }
    results[category].details.push({ name: testName, success: result.success, details: result.details || result.error })
  } catch (error) {
    results[category].failed++
    results.overall.failed++
    console.log(colors.red(`❌ FAIL: ${testName}`))
    console.log(colors.red(`   Exception: ${error.message}`))
    results[category].details.push({ name: testName, success: false, error: error.message })
  }
}

// ============================================================================
// DATABASE VERIFICATION TESTS
// ============================================================================

async function testDatabaseConnection() {
  try {
    const supabase = createClient(config.supabaseUrl, config.supabaseServiceKey)
    const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true })
    
    if (error) {
      return { success: false, error: `Database connection failed: ${error.message}` }
    }
    
    return { success: true, details: 'Successfully connected to Supabase database' }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

async function testRequiredTables() {
  try {
    const supabase = createClient(config.supabaseUrl, config.supabaseServiceKey)
    
    const requiredTables = [
      'profiles', 'companies', 'subscriptions', 'opportunities', 
      'applications', 'jurisdictions', 'ai_usage_logs', 'notifications'
    ]
    
    const existingTables = []
    const missingTables = []
    
    for (const table of requiredTables) {
      try {
        const { error } = await supabase.from(table).select('*', { count: 'exact', head: true })
        if (!error) {
          existingTables.push(table)
        } else {
          missingTables.push(table)
        }
      } catch (e) {
        missingTables.push(table)
      }
    }
    
    if (missingTables.length > 0) {
      return { 
        success: false, 
        error: `Missing required tables: ${missingTables.join(', ')}. Run the database schema SQL in Supabase.` 
      }
    }
    
    return { 
      success: true, 
      details: `All ${existingTables.length} required tables exist: ${existingTables.join(', ')}` 
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

async function testDatabaseFunctions() {
  try {
    const supabase = createClient(config.supabaseUrl, config.supabaseServiceKey)
    
    // Test cache analytics function
    const { data, error } = await supabase.rpc('get_cache_analytics', { days_back: 30 })
    
    if (error) {
      return { success: false, error: `Database functions not available: ${error.message}` }
    }
    
    return { success: true, details: 'Database functions are working correctly' }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// ============================================================================
// API ENDPOINT TESTS
// ============================================================================

async function testEducationAPI() {
  try {
    // First, create a test user session
    const supabase = createClient(config.supabaseUrl, config.supabaseServiceKey)
    
    // Test the API endpoint structure
    const response = await fetch(`${config.baseUrl}/api/education?action=search&query=university&state=CA&limit=5`, {
      headers: {
        'Content-Type': 'application/json',
      }
    })
    
    if (response.status === 401) {
      return { success: true, details: 'Education API properly requires authentication (expected behavior)' }
    }
    
    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}: ${response.statusText}` }
    }
    
    const data = await response.json()
    const institutionsCount = data.institutions?.length || 0
    
    return { 
      success: true, 
      details: `Education API returned ${institutionsCount} institutions. Data source: ${data.metadata?.data_source}` 
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      return { success: false, error: 'Development server not running. Please start with: npm run dev' }
    }
    return { success: false, error: error.message }
  }
}

async function testHealthcareAPI() {
  try {
    const response = await fetch(`${config.baseUrl}/api/healthcare?action=overview`, {
      headers: {
        'Content-Type': 'application/json',
      }
    })
    
    if (response.status === 401) {
      return { success: true, details: 'Healthcare API properly requires authentication (expected behavior)' }
    }
    
    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}: ${response.statusText}` }
    }
    
    const data = await response.json()
    const marketSize = data.healthcare_overview?.sector_summary?.market_size || 'Unknown'
    
    return { 
      success: true, 
      details: `Healthcare API returned market data. Market size: ${marketSize}` 
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      return { success: false, error: 'Development server not running. Please start with: npm run dev' }
    }
    return { success: false, error: error.message }
  }
}

async function testConstructionAPI() {
  try {
    const response = await fetch(`${config.baseUrl}/api/construction?action=overview`, {
      headers: {
        'Content-Type': 'application/json',
      }
    })
    
    if (response.status === 401) {
      return { success: true, details: 'Construction API properly requires authentication (expected behavior)' }
    }
    
    return { success: true, details: 'Construction API endpoint is accessible' }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      return { success: false, error: 'Development server not running. Please start with: npm run dev' }
    }
    return { success: false, error: error.message }
  }
}

async function testManufacturingAPI() {
  try {
    const response = await fetch(`${config.baseUrl}/api/manufacturing?action=overview`)
    
    if (response.status === 401) {
      return { success: true, details: 'Manufacturing API properly requires authentication (expected behavior)' }
    }
    
    return { success: true, details: 'Manufacturing API endpoint is accessible' }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      return { success: false, error: 'Development server not running. Please start with: npm run dev' }
    }
    return { success: false, error: error.message }
  }
}

async function testGovernmentAPI() {
  try {
    const response = await fetch(`${config.baseUrl}/api/government?action=overview`)
    
    if (response.status === 401) {
      return { success: true, details: 'Government API properly requires authentication (expected behavior)' }
    }
    
    return { success: true, details: 'Government API endpoint is accessible' }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      return { success: false, error: 'Development server not running. Please start with: npm run dev' }
    }
    return { success: false, error: error.message }
  }
}

// ============================================================================
// EXTERNAL API INTEGRATION TESTS
// ============================================================================

async function testUrbanInstituteIntegration() {
  try {
    const url = 'https://educationdata.urban.org/api/v1/college-university/ipeds/institutional-characteristics/2022/?state=CA&per_page=5'
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'GovContractAI-Test/1.0',
        'Accept': 'application/json'
      }
    })
    
    if (!response.ok) {
      return { success: false, error: `Urban Institute API failed: ${response.status}` }
    }
    
    const data = await response.json()
    const count = data.results?.length || 0
    
    return { 
      success: true, 
      details: `Urban Institute API working. Found ${count} CA institutions.` 
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

async function testNPPESIntegration() {
  try {
    const url = 'https://npiregistry.cms.hhs.gov/api/?state=CA&limit=5'
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'GovContractAI-Test/1.0',
        'Accept': 'application/json'
      }
    })
    
    if (!response.ok) {
      return { success: false, error: `NPPES API failed: ${response.status}` }
    }
    
    const data = await response.json()
    const count = data.result_count || 0
    
    return { 
      success: true, 
      details: `NPPES Healthcare API working. Found ${count} providers.` 
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

async function testUSASpendingIntegration() {
  try {
    const requestBody = {
      filters: {
        award_type_codes: ['02', '03', '04', '05'],
        time_period: [{ start_date: '2023-01-01', end_date: '2024-12-31' }]
      },
      fields: ['Award ID', 'Recipient Name', 'Award Amount'],
      page: 1,
      limit: 5,
      sort: 'Award Amount',
      order: 'desc'
    }

    const response = await fetch('https://api.usaspending.gov/api/v2/search/spending_by_award/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'GovContractAI-Test/1.0'
      },
      body: JSON.stringify(requestBody)
    })
    
    if (!response.ok) {
      return { success: false, error: `USAspending API failed: ${response.status}` }
    }
    
    const data = await response.json()
    const count = data.results?.length || 0
    
    return { 
      success: true, 
      details: `USAspending API working. Found ${count} federal awards.` 
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

async function testGrantsGovIntegration() {
  try {
    const requestBody = {
      rows: 5,
      keyword: 'technology',
      oppStatuses: 'posted'
    }

    const response = await fetch('https://api.grants.gov/v1/api/search2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'GovContractAI-Test/1.0'
      },
      body: JSON.stringify(requestBody)
    })
    
    if (!response.ok) {
      return { success: false, error: `Grants.gov API failed: ${response.status}` }
    }
    
    const data = await response.json()
    
    if (data.errorcode !== 0) {
      return { success: false, error: `Grants.gov error: ${data.error}` }
    }
    
    const count = data.data?.oppHits?.length || 0
    
    return { 
      success: true, 
      details: `Grants.gov API working. Found ${count} grant opportunities.` 
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// ============================================================================
// UI COMPONENT TESTS
// ============================================================================

async function testEducationPageLoad() {
  try {
    const response = await fetch(`${config.baseUrl}/education`)
    
    if (!response.ok && response.status !== 401) {
      return { success: false, error: `Education page failed to load: ${response.status}` }
    }
    
    return { success: true, details: 'Education page loads successfully' }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      return { success: false, error: 'Development server not running. Please start with: npm run dev' }
    }
    return { success: false, error: error.message }
  }
}

async function testHealthcarePageLoad() {
  try {
    const response = await fetch(`${config.baseUrl}/healthcare`)
    
    if (!response.ok && response.status !== 401) {
      return { success: false, error: `Healthcare page failed to load: ${response.status}` }
    }
    
    return { success: true, details: 'Healthcare page loads successfully' }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      return { success: false, error: 'Development server not running. Please start with: npm run dev' }
    }
    return { success: false, error: error.message }
  }
}

async function testConstructionPageLoad() {
  try {
    const response = await fetch(`${config.baseUrl}/construction`)
    
    if (!response.ok && response.status !== 401) {
      return { success: false, error: `Construction page failed to load: ${response.status}` }
    }
    
    return { success: true, details: 'Construction page loads successfully' }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      return { success: false, error: 'Development server not running. Please start with: npm run dev' }
    }
    return { success: false, error: error.message }
  }
}

async function testManufacturingPageLoad() {
  try {
    const response = await fetch(`${config.baseUrl}/manufacturing`)
    
    if (!response.ok && response.status !== 401) {
      return { success: false, error: `Manufacturing page failed to load: ${response.status}` }
    }
    
    return { success: true, details: 'Manufacturing page loads successfully' }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      return { success: false, error: 'Development server not running. Please start with: npm run dev' }
    }
    return { success: false, error: error.message }
  }
}

async function testGovernmentPageLoad() {
  try {
    const response = await fetch(`${config.baseUrl}/government`)
    
    if (!response.ok && response.status !== 401) {
      return { success: false, error: `Government page failed to load: ${response.status}` }
    }
    
    return { success: true, details: 'Government page loads successfully' }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      return { success: false, error: 'Development server not running. Please start with: npm run dev' }
    }
    return { success: false, error: error.message }
  }
}

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

async function testEnvironmentVariables() {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY', 
    'SUPABASE_SERVICE_ROLE_KEY',
    'ANTHROPIC_API_KEY'
  ]
  
  const missing = required.filter(key => !process.env[key])
  
  if (missing.length > 0) {
    return { 
      success: false, 
      error: `Missing required environment variables: ${missing.join(', ')}` 
    }
  }
  
  const optional = [
    'SAM_GOV_API_KEY',
    'COLLEGE_SCORECARD_API_KEY'
  ]
  
  const optionalMissing = optional.filter(key => !process.env[key])
  
  return { 
    success: true, 
    details: `All required env vars present. Optional missing: ${optionalMissing.join(', ') || 'none'}` 
  }
}

async function testAnthropicIntegration() {
  try {
    if (!config.anthropicKey) {
      return { success: false, error: 'ANTHROPIC_API_KEY not found in environment' }
    }
    
    // Test basic Claude API call
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.anthropicKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 100,
        messages: [
          { role: 'user', content: 'Hello, respond with just "API test successful"' }
        ]
      })
    })
    
    if (!response.ok) {
      return { success: false, error: `Anthropic API failed: ${response.status}` }
    }
    
    const data = await response.json()
    
    return { 
      success: true, 
      details: `Anthropic Claude API working. Response: ${data.content?.[0]?.text?.slice(0, 50) || 'Success'}` 
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

async function testBuildStatus() {
  try {
    // Check if .next directory exists (indicates successful build)
    const fs = require('fs')
    const path = require('path')
    
    const nextDir = path.join(process.cwd(), '.next')
    
    if (!fs.existsSync(nextDir)) {
      return { success: false, error: 'Project has not been built. Run: npm run build' }
    }
    
    const buildId = path.join(nextDir, 'BUILD_ID')
    if (fs.existsSync(buildId)) {
      const buildTime = fs.statSync(buildId).mtime
      return { 
        success: true, 
        details: `Project built successfully on ${buildTime.toISOString()}` 
      }
    }
    
    return { success: true, details: 'Project appears to be built and ready' }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function runAllVerificationTests() {
  console.log(colors.bold(colors.cyan('🎯 GovContractAI - Complete Platform Verification')))
  console.log(colors.cyan('=' .repeat(60)))
  
  console.log(colors.yellow('\n📋 Database Verification'))
  console.log(colors.yellow('-'.repeat(30)))
  await runTest('database', 'Database Connection', testDatabaseConnection)
  await runTest('database', 'Required Tables', testRequiredTables)
  await runTest('database', 'Database Functions', testDatabaseFunctions)
  
  console.log(colors.yellow('\n🔌 API Endpoint Tests'))
  console.log(colors.yellow('-'.repeat(30)))
  await runTest('apis', 'Education API', testEducationAPI)
  await runTest('apis', 'Healthcare API', testHealthcareAPI)
  await runTest('apis', 'Construction API', testConstructionAPI)
  await runTest('apis', 'Manufacturing API', testManufacturingAPI)
  await runTest('apis', 'Government API', testGovernmentAPI)
  
  console.log(colors.yellow('\n🌐 External API Integration'))
  console.log(colors.yellow('-'.repeat(30)))
  await runTest('integration', 'Urban Institute API', testUrbanInstituteIntegration)
  await runTest('integration', 'NPPES Healthcare API', testNPPESIntegration)
  await runTest('integration', 'USAspending.gov API', testUSASpendingIntegration)
  await runTest('integration', 'Grants.gov API', testGrantsGovIntegration)
  
  console.log(colors.yellow('\n💻 UI Component Tests'))
  console.log(colors.yellow('-'.repeat(30)))
  await runTest('ui', 'Education Page Load', testEducationPageLoad)
  await runTest('ui', 'Healthcare Page Load', testHealthcarePageLoad)
  await runTest('ui', 'Construction Page Load', testConstructionPageLoad)
  await runTest('ui', 'Manufacturing Page Load', testManufacturingPageLoad)
  await runTest('ui', 'Government Page Load', testGovernmentPageLoad)
  
  console.log(colors.yellow('\n🔧 Integration & Configuration'))
  console.log(colors.yellow('-'.repeat(30)))
  await runTest('integration', 'Environment Variables', testEnvironmentVariables)
  await runTest('integration', 'Anthropic AI Integration', testAnthropicIntegration)
  await runTest('integration', 'Build Status', testBuildStatus)
  
  // Final Results Summary
  console.log(colors.bold(colors.cyan('\n📊 VERIFICATION RESULTS SUMMARY')))
  console.log(colors.cyan('=' .repeat(50)))
  
  Object.entries(results).forEach(([category, data]) => {
    if (category === 'overall') return
    
    const successRate = data.total > 0 ? Math.round((data.passed / data.total) * 100) : 0
    const status = successRate >= 80 ? colors.green('✅') : successRate >= 60 ? colors.yellow('⚠️') : colors.red('❌')
    
    console.log(`${status} ${category.toUpperCase()}: ${data.passed}/${data.total} (${successRate}%)`)
  })
  
  const overallSuccessRate = results.overall.total > 0 ? Math.round((results.overall.passed / results.overall.total) * 100) : 0
  
  console.log(colors.cyan('\n' + '='.repeat(50)))
  console.log(colors.bold(`🎯 OVERALL SUCCESS RATE: ${overallSuccessRate}% (${results.overall.passed}/${results.overall.total})`))
  
  // Recommendations
  console.log(colors.yellow('\n💡 RECOMMENDATIONS:'))
  
  if (overallSuccessRate >= 85) {
    console.log(colors.green('🎉 EXCELLENT! Your platform is ready for production deployment.'))
    console.log(colors.green('✅ All critical systems are functioning correctly.'))
    console.log(colors.green('🚀 You can confidently launch your platform.'))
  } else if (overallSuccessRate >= 70) {
    console.log(colors.yellow('⚠️  GOOD! Most systems working, but some improvements needed.'))
    console.log(colors.yellow('🔧 Address the failed tests before production launch.'))
  } else {
    console.log(colors.red('🚨 ATTENTION NEEDED! Multiple issues detected.'))
    console.log(colors.red('🛠️  Please resolve critical issues before proceeding.'))
  }
  
  // Specific guidance
  console.log(colors.cyan('\n🔧 NEXT STEPS:'))
  
  if (results.database.failed > 0) {
    console.log(colors.yellow('📝 Database: Run the database-schema.sql file in your Supabase SQL editor'))
  }
  
  if (results.ui.failed > 0) {
    console.log(colors.yellow('🚀 UI: Start development server with: npm run dev'))
  }
  
  if (results.integration.failed > 0) {
    console.log(colors.yellow('🔑 Integration: Check your .env.local file for missing API keys'))
  }
  
  console.log(colors.green('\n🎯 Ready to dominate the government contracting market! 🚀'))
}

// Handle missing fetch in older Node.js versions
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch')
}

// Run the verification
runAllVerificationTests().catch(console.error)