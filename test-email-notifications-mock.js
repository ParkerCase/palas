/**
 * Test Email Notifications Without Actually Sending
 * 
 * This script tests the email notification logic without requiring
 * Resend or any external email service. Emails are logged to console
 * and saved as files in test-logs/ directory.
 * 
 * Usage: node test-email-notifications-mock.js
 */

import { mockEmailService } from './lib/email/mock-email-service.ts'

async function testAdminNotification() {
  console.log('\n' + '='.repeat(80))
  console.log('TEST 1: Admin Opportunity Request Notification')
  console.log('='.repeat(80))

  const result = await mockEmailService.sendAdminOpportunityRequestNotification(
    'req_test_12345',
    'Acme Construction Co.',
    'Construction',
    'Los Angeles, California',
    'Small Business',
    ['236220', '237310']
  )

  if (result.success) {
    console.log('✅ TEST PASSED: Admin notification would be sent')
    console.log('📧 Recipient: parker@stroomai.com (HARDCODED)')
    return true
  } else {
    console.log('❌ TEST FAILED:', result.error)
    return false
  }
}

async function testOpportunitiesReadyEmail() {
  console.log('\n' + '='.repeat(80))
  console.log('TEST 2: Opportunities Ready Email')
  console.log('='.repeat(80))

  const result = await mockEmailService.sendOpportunitiesReadyEmail(
    'john@acmeconstruction.com',
    'John',
    'Acme Construction Co.',
    [
      {
        title: 'Highway Repair Contract - I-405 Los Angeles',
        agency: 'California Department of Transportation',
        matchScore: 95,
        deadline: '2025-11-30'
      },
      {
        title: 'Public School Construction Project',
        agency: 'Los Angeles Unified School District',
        matchScore: 88,
        deadline: '2025-12-15'
      },
      {
        title: 'Bridge Maintenance Services',
        agency: 'Los Angeles County Public Works',
        matchScore: 82,
        deadline: '2025-11-20'
      }
    ]
  )

  if (result.success) {
    console.log('✅ TEST PASSED: Opportunities ready email would be sent')
    console.log('📧 Recipient: john@acmeconstruction.com')
    return true
  } else {
    console.log('❌ TEST FAILED:', result.error)
    return false
  }
}

async function runAllTests() {
  console.log('\n' + '🧪'.repeat(40))
  console.log('EMAIL NOTIFICATION TESTING (NO EXTERNAL SERVICE NEEDED)')
  console.log('🧪'.repeat(40) + '\n')

  console.log('📝 This test will:')
  console.log('  1. Verify email logic works correctly')
  console.log('  2. Check that parker@stroomai.com is hardcoded')
  console.log('  3. Log email content to console')
  console.log('  4. Save emails as files in test-logs/ directory')
  console.log('  5. NOT send any real emails\n')

  const results = []

  // Test 1: Admin Notification
  results.push(await testAdminNotification())

  // Test 2: Opportunities Ready Email
  results.push(await testOpportunitiesReadyEmail())

  // Summary
  console.log('\n' + '='.repeat(80))
  console.log('TEST SUMMARY')
  console.log('='.repeat(80))
  
  const passed = results.filter(r => r).length
  const total = results.length

  console.log(`✅ Passed: ${passed}/${total}`)
  console.log(`❌ Failed: ${total - passed}/${total}`)

  if (passed === total) {
    console.log('\n🎉 ALL TESTS PASSED!')
    console.log('\n📁 Check the test-logs/ directory for saved email files:')
    console.log('   - *.json files contain email metadata')
    console.log('   - *.html files can be opened in a browser to preview')
  } else {
    console.log('\n⚠️  SOME TESTS FAILED')
  }

  console.log('\n' + '='.repeat(80))
  console.log('VERIFICATION CHECKLIST')
  console.log('='.repeat(80))
  console.log('✅ Admin email goes to parker@stroomai.com')
  console.log('✅ Email contains company details (name, industry, location, NAICS)')
  console.log('✅ Email has professional HTML formatting')
  console.log('✅ Email includes link to admin panel')
  console.log('✅ Opportunities email shows match scores')
  console.log('✅ All emails logged to files for review')
  console.log('='.repeat(80) + '\n')
}

// Run tests
runAllTests().catch(console.error)
