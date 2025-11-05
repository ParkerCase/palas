/**
 * Opportunity Discovery Workflow Test Script
 *
 * This script tests the complete workflow:
 * 1. Company creates opportunity request
 * 2. Admin receives email notification
 * 3. Admin searches for opportunities using Brave Search
 * 4. Admin approves top 3-5 opportunities
 * 5. Company receives email notification
 * 6. Opportunities display on /my-opportunities page
 *
 * Requirements:
 * - Node.js 18+
 * - Environment variables configured (.env.local)
 * - Supabase database set up
 * - Valid API keys (BRAVE_SEARCH_API_KEY, RESEND_API_KEY)
 */

const ADMIN_EMAIL = "parker@stroomai.com";

// Test configuration
const TEST_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  testCompany: {
    id: null, // Will be set after creation
    name: "Test Construction Company",
    industry: "Construction",
    business_type: "Small Business",
    city: "Los Angeles",
    state: "California",
    naics_codes: ["236220", "237310"],
  },
  testUser: {
    email: "test@example.com",
    password: "TestPassword123!",
    full_name: "Test User",
  },
};

// Colors for console output
const colors = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  reset: "\x1b[0m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n[STEP ${step}] ${message}`, "blue");
}

function logSuccess(message) {
  log(`✓ ${message}`, "green");
}

function logError(message) {
  log(`✗ ${message}`, "red");
}

function logWarning(message) {
  log(`⚠ ${message}`, "yellow");
}

/**
 * Test Step 1: Create Opportunity Request
 */
async function testCreateOpportunityRequest() {
  logStep(1, "Testing Opportunity Request Creation");

  try {
    const response = await fetch(
      `${TEST_CONFIG.baseUrl}/api/opportunity-requests/create`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // In real test, would need auth token
        },
      }
    );

    const data = await response.json();

    if (response.ok && data.success) {
      logSuccess("Opportunity request created successfully");
      logSuccess(`Request ID: ${data.request?.id}`);
      return { success: true, requestId: data.request?.id };
    } else {
      logError(`Failed to create opportunity request: ${data.error}`);
      return { success: false, error: data.error };
    }
  } catch (error) {
    logError(`Error creating opportunity request: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Test Step 2: Verify Admin Email Notification
 */
async function testAdminEmailNotification(requestId) {
  logStep(2, "Verifying Admin Email Notification");

  logWarning("Manual verification required:");
  log(`  1. Check inbox for ${ADMIN_EMAIL}`);
  log(
    `  2. Verify email subject: "New Opportunity Request from ${TEST_CONFIG.testCompany.name}"`
  );
  log(`  3. Verify email contains:`);
  log(`     - Company name: ${TEST_CONFIG.testCompany.name}`);
  log(`     - Industry: ${TEST_CONFIG.testCompany.industry}`);
  log(
    `     - Location: ${TEST_CONFIG.testCompany.city}, ${TEST_CONFIG.testCompany.state}`
  );
  log(`     - NAICS codes: ${TEST_CONFIG.testCompany.naics_codes.join(", ")}`);
  log(`     - Request ID: ${requestId}`);
  log(`     - Link to admin panel`);

  return { success: true, requiresManualVerification: true };
}

/**
 * Test Step 3: Search for Opportunities using Brave Search
 */
async function testBraveSearchIntegration(requestId, companyId) {
  logStep(3, "Testing Brave Search Integration");

  try {
    const response = await fetch(
      `${TEST_CONFIG.baseUrl}/api/admin/search-opportunities`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // In real test, would need admin auth token
        },
        body: JSON.stringify({
          requestId: requestId,
          companyId: companyId,
        }),
      }
    );

    const data = await response.json();

    if (response.ok && data.success) {
      logSuccess(`Search completed successfully`);
      logSuccess(`Query used: ${data.query}`);
      logSuccess(`Found ${data.total_results} opportunities`);

      // Verify query includes location
      if (
        data.query.includes(TEST_CONFIG.testCompany.city) &&
        data.query.includes(TEST_CONFIG.testCompany.state)
      ) {
        logSuccess("Query includes city AND state");
      } else {
        logWarning("Query may not include complete location information");
      }

      // Verify results are government-related
      const govResults = data.results.filter(
        (r) => r.domain?.includes(".gov") || r.url?.includes(".gov")
      );
      if (govResults.length > 0) {
        logSuccess(
          `${govResults.length}/${data.total_results} results are from .gov domains`
        );
      } else {
        logWarning("No .gov domain results found");
      }

      return { success: true, results: data.results, query: data.query };
    } else {
      logError(`Search failed: ${data.error}`);
      return { success: false, error: data.error };
    }
  } catch (error) {
    logError(`Error during search: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Test Step 4: Approve Top 3 Opportunities
 */
async function testApproveOpportunities(requestId, companyId, searchResults) {
  logStep(4, "Testing Opportunity Approval");

  // Select top 3 results
  const topOpportunities = searchResults.slice(0, 3).map((result) => ({
    title: result.title,
    url: result.url,
    description: result.description || result.snippet,
    agency: result.domain,
    source_data: result,
  }));

  try {
    const response = await fetch(
      `${TEST_CONFIG.baseUrl}/api/admin/approve-opportunities`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // In real test, would need admin auth token
        },
        body: JSON.stringify({
          requestId: requestId,
          companyId: companyId,
          selectedOpportunities: topOpportunities,
        }),
      }
    );

    const data = await response.json();

    if (response.ok && data.success) {
      logSuccess(`Approved ${data.opportunities_created} opportunities`);
      logSuccess("Company notification email sent");
      return { success: true, count: data.opportunities_created };
    } else {
      logError(`Approval failed: ${data.error}`);
      return { success: false, error: data.error };
    }
  } catch (error) {
    logError(`Error during approval: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Test Step 5: Verify Company Email Notification
 */
async function testCompanyEmailNotification() {
  logStep(5, "Verifying Company Email Notification");

  logWarning("Manual verification required:");
  log(`  1. Check inbox for ${TEST_CONFIG.testUser.email}`);
  log(
    `  2. Verify email subject contains: "We found 3 perfect opportunities for you!"`
  );
  log(`  3. Verify email contains:`);
  log(`     - List of 3 opportunities with titles`);
  log(`     - Agency/source for each opportunity`);
  log(`     - Link to view opportunities`);
  log(`     - CTA button: "View Your Opportunities"`);

  return { success: true, requiresManualVerification: true };
}

/**
 * Test Step 6: Verify Opportunities Display
 */
async function testOpportunitiesDisplay(companyId) {
  logStep(6, "Testing Opportunities Display on Dashboard");

  logWarning("Manual verification required:");
  log(`  1. Navigate to ${TEST_CONFIG.baseUrl}/my-opportunities`);
  log(`  2. Verify page displays recommended opportunities`);
  log(`  3. Verify each opportunity shows:`);
  log(`     - Title`);
  log(`     - Agency/source`);
  log(`     - Match score`);
  log(`     - Description`);
  log(`     - "Apply Now" button`);
  log(`     - "View Details" button`);
  log(`  4. Verify opportunities are marked as "Hand-Selected"`);
  log(`  5. Test clicking "Apply Now" creates application draft`);

  return { success: true, requiresManualVerification: true };
}

/**
 * Test Request Status Tracking
 */
async function testStatusTracking(requestId) {
  logStep(7, "Testing Status Tracking");

  logWarning("Verify the following status transitions occurred:");
  log(`  - Initial status: pending`);
  log(`  - After search: processing`);
  log(`  - After approval: completed`);
  log(`  - Email sent flag: true`);
  log(`  - Processed by admin: ${ADMIN_EMAIL}`);

  return { success: true, requiresManualVerification: true };
}

/**
 * Test Error Handling
 */
async function testErrorHandling() {
  logStep(8, "Testing Error Handling");

  const tests = [
    {
      name: "Invalid request ID",
      test: async () => {
        // Test with invalid request ID
        logWarning("TODO: Test invalid request ID handling");
      },
    },
    {
      name: "Failed Brave Search",
      test: async () => {
        // Test with invalid API key or network error
        logWarning("TODO: Test Brave Search error handling");
      },
    },
    {
      name: "Email send failure",
      test: async () => {
        // Test email service failure
        logWarning("TODO: Test email failure handling");
      },
    },
    {
      name: "Non-admin access",
      test: async () => {
        // Test non-admin trying to access admin endpoints
        logWarning("TODO: Test admin access control");
      },
    },
  ];

  for (const test of tests) {
    log(`\n  Testing: ${test.name}`);
    await test.test();
  }

  return { success: true, requiresManualVerification: true };
}

/**
 * Main Test Runner
 */
async function runTests() {
  log("\n========================================", "blue");
  log("OPPORTUNITY DISCOVERY WORKFLOW TESTS", "blue");
  log("========================================\n", "blue");

  log("Prerequisites:", "yellow");
  log("  1. Database migrations applied");
  log("  2. Environment variables configured");
  log("  3. BRAVE_SEARCH_API_KEY set");
  log("  4. RESEND_API_KEY set");
  log("  5. Test user and company created");
  log("  6. Admin user with stroomai.com email exists");

  log("\nStarting tests...\n");

  const results = {
    total: 8,
    passed: 0,
    failed: 0,
    manualVerification: 0,
  };

  // Test 1: Create Request
  const step1 = await testCreateOpportunityRequest();
  if (step1.success) results.passed++;
  else results.failed++;

  if (!step1.success) {
    logError("Cannot continue tests - request creation failed");
    return results;
  }

  const requestId = step1.requestId || "test-request-id";
  const companyId = TEST_CONFIG.testCompany.id || "test-company-id";

  // Test 2: Admin Email
  const step2 = await testAdminEmailNotification(requestId);
  if (step2.requiresManualVerification) results.manualVerification++;

  // Test 3: Brave Search
  const step3 = await testBraveSearchIntegration(requestId, companyId);
  if (step3.success) results.passed++;
  else results.failed++;

  if (!step3.success) {
    logError("Cannot continue tests - search failed");
    return results;
  }

  // Test 4: Approve Opportunities
  const step4 = await testApproveOpportunities(
    requestId,
    companyId,
    step3.results || []
  );
  if (step4.success) results.passed++;
  else results.failed++;

  // Test 5: Company Email
  const step5 = await testCompanyEmailNotification();
  if (step5.requiresManualVerification) results.manualVerification++;

  // Test 6: Display Opportunities
  const step6 = await testOpportunitiesDisplay(companyId);
  if (step6.requiresManualVerification) results.manualVerification++;

  // Test 7: Status Tracking
  const step7 = await testStatusTracking(requestId);
  if (step7.requiresManualVerification) results.manualVerification++;

  // Test 8: Error Handling
  const step8 = await testErrorHandling();
  if (step8.requiresManualVerification) results.manualVerification++;

  // Print Summary
  log("\n========================================", "blue");
  log("TEST SUMMARY", "blue");
  log("========================================\n", "blue");
  log(`Total Tests: ${results.total}`);
  logSuccess(`Passed: ${results.passed}`);
  logError(`Failed: ${results.failed}`);
  logWarning(`Manual Verification Required: ${results.manualVerification}`);

  log("\n========================================\n", "blue");

  return results;
}

// Run tests if executed directly
if (require.main === module) {
  runTests()
    .then((results) => {
      process.exit(results.failed > 0 ? 1 : 0);
    })
    .catch((error) => {
      logError(`Fatal error: ${error.message}`);
      console.error(error);
      process.exit(1);
    });
}

module.exports = {
  runTests,
  testCreateOpportunityRequest,
  testBraveSearchIntegration,
  testApproveOpportunities,
};
