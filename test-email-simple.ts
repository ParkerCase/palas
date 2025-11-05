/**
 * Simple Email Test Script (TypeScript)
 * 
 * Run this to test email sending directly:
 * npx tsx test-email-simple.ts
 */

import { emailService } from './lib/email'

async function testEmail() {
  console.log('🧪 Testing email notification to parker@stroomai.com...\n')

  const testData = {
    requestId: `test-${Date.now()}`,
    companyName: 'Acme Construction Co.',
    industry: 'Construction',
    location: 'Los Angeles, California',
    businessType: 'Small Business',
    naicsCodes: ['236220', '237310']
  }

  console.log('Sending email with data:')
  console.log(JSON.stringify(testData, null, 2))
  console.log('\n')

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
      console.log('✅ SUCCESS! Email sent to parker@stroomai.com')
      console.log('Please check the inbox at parker@stroomai.com\n')
      console.log('Expected email:')
      console.log('  Subject: "New Opportunity Request from Acme Construction Co."')
      console.log('  Contains: Company details, location, NAICS codes')
      console.log('  Has: Link to admin panel')
    } else {
      console.log('❌ FAILED to send email')
      console.log(`Error: ${result.error}\n`)
      console.log('Common issues:')
      console.log('  1. RESEND_API_KEY not set in .env.local')
      console.log('  2. Domain not verified in Resend')
      console.log('  3. Invalid API key')
    }

    return result
  } catch (error) {
    console.error('❌ ERROR:', error)
    throw error
  }
}

// Run the test
testEmail()
  .then(() => {
    console.log('\n✓ Test completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n✗ Test failed:', error)
    process.exit(1)
  })

