/**
 * Email Notification Test Script
 *
 * Tests that admin email notifications are sent correctly to parker@stroomai.com
 * when a company creates an opportunity request.
 *
 * Prerequisites:
 * - RESEND_API_KEY set in .env.local
 * - Valid Supabase credentials
 * - Test user authenticated
 */

const colors = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
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

function logInfo(message) {
  log(`ℹ ${message}`, "cyan");
}

function logWarning(message) {
  log(`⚠ ${message}`, "yellow");
}

/**
 * Test direct email sending via EmailService
 */
async function testDirectEmailSend() {
  logStep(1, "Testing Direct Email Send via EmailService");

  try {
    // Import the email service
    const emailServicePath = "./lib/email/index.ts";
    logInfo(`Attempting to import EmailService from ${emailServicePath}`);

    // Since we're in Node, we need to use dynamic import
    const { emailService } = await import("./lib/email/index.js");

    logInfo("EmailService imported successfully");

    // Test sending admin notification
    const testData = {
      requestId: "test-request-" + Date.now(),
      companyName: "Test Company Inc.",
      industry: "Construction",
      location: "Los Angeles, California",
      businessType: "Small Business",
      naicsCodes: ["236220", "237310"],
    };

    logInfo(
      `Sending test email to parker@stroomai.com with data: ${JSON.stringify(testData, null, 2)}`
    );

    const result = await emailService.sendAdminOpportunityRequestNotification(
      testData.requestId,
      testData.companyName,
      testData.industry,
      testData.location,
      testData.businessType,
      testData.naicsCodes
    );

    if (result.success) {
      logSuccess("Email sent successfully!");
      logSuccess(`Message ID: ${result.messageId}`);
      logInfo("\nPlease check inbox at parker@stroomai.com");
      logInfo("Expected email:");
      logInfo('  - Subject: "New Opportunity Request from Test Company Inc."');
      logInfo("  - Contains company details and request ID");
      logInfo("  - Has link to admin panel");
      return { success: true, messageId: result.messageId };
    } else {
      logError(`Email send failed: ${result.error}`);
      return { success: false, error: result.error };
    }
  } catch (error) {
    logError(`Error in direct email test: ${error.message}`);
    console.error(error);
    return { success: false, error: error.message };
  }
}

/**
 * Test email sending via API endpoint
 */
async function testAPIEmailSend() {
  logStep(2, "Testing Email Send via API Endpoint");

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  try {
    logInfo(
      `Sending POST request to ${baseUrl}/api/opportunity-requests/create`
    );
    logWarning(
      "Note: This requires authentication. You may need to add auth headers."
    );

    const response = await fetch(`${baseUrl}/api/opportunity-requests/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Add auth headers if needed
        // 'Authorization': 'Bearer YOUR_TOKEN_HERE'
      },
    });

    const data = await response.json();

    if (response.ok && data.success) {
      logSuccess("Opportunity request created successfully");
      logSuccess(`Request ID: ${data.request?.id}`);
      logInfo("\nEmail should have been sent to parker@stroomai.com");
      logInfo("Check the following:");
      logInfo("  1. Email received at parker@stroomai.com");
      logInfo("  2. Subject line is correct");
      logInfo("  3. Company details are included");
      logInfo("  4. Link to admin panel works");
      return { success: true, requestId: data.request?.id };
    } else {
      if (response.status === 401) {
        logWarning("Unauthorized - Authentication required");
        logInfo(
          "To test with auth, you'll need to login first and pass the session"
        );
      } else {
        logError(`API request failed: ${data.error}`);
      }
      return { success: false, error: data.error, status: response.status };
    }
  } catch (error) {
    logError(`Error in API test: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Verify environment variables
 */
async function verifyEnvironment() {
  logStep(0, "Verifying Environment Setup");

  const requiredEnvVars = {
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  };

  let allPresent = true;

  for (const [key, value] of Object.entries(requiredEnvVars)) {
    if (value) {
      logSuccess(`${key} is set`);
      if (key === "RESEND_API_KEY") {
        logInfo(`  Value: ${value.substring(0, 10)}...`);
      } else {
        logInfo(`  Value: ${value}`);
      }
    } else {
      logError(`${key} is NOT set`);
      allPresent = false;
    }
  }

  if (!allPresent) {
    logWarning(
      "\nMissing environment variables. Please add them to .env.local:"
    );
    log("  RESEND_API_KEY=your_resend_api_key");
    log("  NEXT_PUBLIC_APP_URL=http://localhost:3000");
    return { success: false, error: "Missing environment variables" };
  }

  logSuccess("All required environment variables are set");
  return { success: true };
}

/**
 * Main test runner
 */
async function runEmailTests() {
  log("\n" + "=".repeat(60), "blue");
  log("EMAIL NOTIFICATION TEST", "blue");
  log("=".repeat(60) + "\n", "blue");

  log("This script will test email notifications sent to:", "cyan");
  log("  → parker@stroomai.com (hardcoded in email service)\n", "cyan");

  // Step 0: Verify environment
  const envCheck = await verifyEnvironment();
  if (!envCheck.success) {
    logError("\n❌ Environment check failed. Cannot proceed with tests.");
    return;
  }

  // Step 1: Test direct email send
  logInfo("\nAttempting to send test email directly...");
  const directTest = await testDirectEmailSend();

  if (directTest.success) {
    log("\n" + "=".repeat(60), "green");
    log("✓ EMAIL TEST SUCCESSFUL", "green");
    log("=".repeat(60), "green");
    log("\n📧 Check your inbox at parker@stroomai.com\n", "cyan");
    log("What to verify:", "yellow");
    log("  1. Email was received");
    log("  2. Subject: 'New Opportunity Request from Test Company Inc.'");
    log("  3. Email contains:");
    log("     - Company name: Test Company Inc.");
    log("     - Industry: Construction");
    log("     - Location: Los Angeles, California");
    log("     - Business Type: Small Business");
    log("     - NAICS Codes: 236220, 237310");
    log("     - Request ID");
    log("     - Link to admin panel");
    log("  4. Email is properly formatted (HTML)");
    log("\n");
  } else {
    log("\n" + "=".repeat(60), "red");
    log("❌ EMAIL TEST FAILED", "red");
    log("=".repeat(60), "red");
    log("\nCommon issues:", "yellow");
    log("  1. RESEND_API_KEY not set or invalid");
    log("  2. Sending domain not verified in Resend");
    log("  3. Network connectivity issues");
    log("  4. Rate limiting (too many test emails)");
    log("\nError details:", "yellow");
    log(`  ${directTest.error}\n`);
  }

  // Step 2: Optionally test via API (requires auth)
  logInfo("\n" + "-".repeat(60));
  logInfo("Optional: Test via API endpoint (requires authentication)");
  logWarning("Skipping API test - requires user authentication");
  logInfo("To test via API, use the dashboard UI or provide auth headers\n");

  return directTest;
}

// Run tests if executed directly
if (require.main === module) {
  // Load environment variables
  require("dotenv").config({ path: ".env.local" });

  runEmailTests()
    .then((result) => {
      if (result && result.success) {
        log("✓ All email tests completed successfully\n", "green");
        process.exit(0);
      } else {
        log("✗ Email tests failed\n", "red");
        process.exit(1);
      }
    })
    .catch((error) => {
      logError(`Fatal error: ${error.message}`);
      console.error(error);
      process.exit(1);
    });
}

module.exports = {
  runEmailTests,
  testDirectEmailSend,
  testAPIEmailSend,
  verifyEnvironment,
};
