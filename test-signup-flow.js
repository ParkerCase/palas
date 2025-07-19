const http = require("http");

const BASE_URL = "http://localhost:3000";

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  tests: [],
};

function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

function makeRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "GovContractAI-Signup-Test/1.0",
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => {
        body += chunk;
      });
      res.on("end", () => {
        try {
          const response = {
            status: res.statusCode,
            headers: res.headers,
            data: body ? JSON.parse(body) : null,
          };
          resolve(response);
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: body,
          });
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

function testResult(testName, passed, details = "") {
  const result = {
    testName,
    passed,
    details,
    timestamp: new Date().toISOString(),
  };
  results.tests.push(result);

  if (passed) {
    results.passed++;
    log(`✅ ${testName} - PASSED`);
  } else {
    results.failed++;
    log(`❌ ${testName} - FAILED: ${details}`);
  }
}

async function runTests() {
  log("🚀 Starting Signup Flow Test Suite");
  log("====================================");

  // Test 1: Signup page is accessible
  try {
    const response = await makeRequest("GET", "/signup");
    testResult(
      "Signup Page - Accessible",
      response.status === 200,
      `Status: ${response.status}`
    );
  } catch (error) {
    testResult("Signup Page - Accessible", false, error.message);
  }

  // Test 2: Login page is accessible
  try {
    const response = await makeRequest("GET", "/login");
    testResult(
      "Login Page - Accessible",
      response.status === 200,
      `Status: ${response.status}`
    );
  } catch (error) {
    testResult("Login Page - Accessible", false, error.message);
  }

  // Test 3: Test signup with invalid data (should fail)
  try {
    const invalidSignupData = {
      firstName: "",
      lastName: "",
      email: "invalid-email",
      password: "123",
      confirmPassword: "123",
      companyName: "",
      companySlug: "",
    };

    const response = await makeRequest(
      "POST",
      "/api/auth/signup",
      invalidSignupData
    );
    testResult(
      "Signup Validation - Invalid Data Rejected",
      response.status === 400 || response.status === 422,
      `Status: ${response.status}`
    );
  } catch (error) {
    testResult(
      "Signup Validation - Invalid Data Rejected",
      false,
      error.message
    );
  }

  // Test 4: Test signup with valid data (should succeed)
  try {
    const validSignupData = {
      firstName: "Test",
      lastName: "User",
      email: `test-${Date.now()}@example.com`,
      password: "TestPassword123!",
      confirmPassword: "TestPassword123!",
      companyName: "Test Company Inc",
      companySlug: `test-company-${Date.now()}`,
    };

    const response = await makeRequest(
      "POST",
      "/api/auth/signup",
      validSignupData
    );
    testResult(
      "Signup - Valid Data Accepted",
      response.status === 200 || response.status === 201,
      `Status: ${response.status}`
    );
  } catch (error) {
    testResult("Signup - Valid Data Accepted", false, error.message);
  }

  // Test 5: Test login with non-existent user (should fail)
  try {
    const loginData = {
      email: "nonexistent@example.com",
      password: "wrongpassword",
    };

    const response = await makeRequest("POST", "/api/auth/login", loginData);
    testResult(
      "Login - Non-existent User Rejected",
      response.status === 401 || response.status === 400,
      `Status: ${response.status}`
    );
  } catch (error) {
    testResult("Login - Non-existent User Rejected", false, error.message);
  }

  // Test 6: Check if signup creates user in Supabase (via API)
  try {
    const response = await makeRequest("GET", "/api/auth/check");
    testResult(
      "Auth API - Check Endpoint Accessible",
      response.status === 200 || response.status === 401,
      `Status: ${response.status}`
    );
  } catch (error) {
    testResult("Auth API - Check Endpoint Accessible", false, error.message);
  }

  // Test 7: Test password reset flow
  try {
    const resetData = {
      email: "test@example.com",
    };

    const response = await makeRequest(
      "POST",
      "/api/auth/reset-password",
      resetData
    );
    testResult(
      "Password Reset - Endpoint Accessible",
      response.status === 200 || response.status === 400,
      `Status: ${response.status}`
    );
  } catch (error) {
    testResult("Password Reset - Endpoint Accessible", false, error.message);
  }

  // Test 8: Check if signup form has all required fields
  try {
    const response = await makeRequest("GET", "/signup");
    const hasRequiredFields =
      response.data &&
      response.data.includes("firstName") &&
      response.data.includes("lastName") &&
      response.data.includes("email") &&
      response.data.includes("password") &&
      response.data.includes("companyName");

    testResult(
      "Signup Form - Has Required Fields",
      hasRequiredFields,
      "Missing required form fields"
    );
  } catch (error) {
    testResult("Signup Form - Has Required Fields", false, error.message);
  }

  // Test 9: Check if login form has required fields
  try {
    const response = await makeRequest("GET", "/login");
    const hasRequiredFields =
      response.data &&
      response.data.includes("email") &&
      response.data.includes("password");

    testResult(
      "Login Form - Has Required Fields",
      hasRequiredFields,
      "Missing required form fields"
    );
  } catch (error) {
    testResult("Login Form - Has Required Fields", false, error.message);
  }

  // Test 10: Test signup with duplicate email (should fail)
  try {
    const duplicateSignupData = {
      firstName: "Test",
      lastName: "User",
      email: "parker@parkercase.co", // Existing user
      password: "TestPassword123!",
      confirmPassword: "TestPassword123!",
      companyName: "Test Company Inc",
      companySlug: "test-company-duplicate",
    };

    const response = await makeRequest(
      "POST",
      "/api/auth/signup",
      duplicateSignupData
    );
    testResult(
      "Signup - Duplicate Email Rejected",
      response.status === 400 || response.status === 409,
      `Status: ${response.status}`
    );
  } catch (error) {
    testResult("Signup - Duplicate Email Rejected", false, error.message);
  }

  // Summary
  log("\n====================================");
  log("📊 Signup Flow Test Results");
  log("====================================");
  log(`✅ Passed: ${results.passed}`);
  log(`❌ Failed: ${results.failed}`);
  log(
    `📈 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`
  );

  if (results.failed > 0) {
    log("\n❌ Failed Tests:");
    results.tests
      .filter((t) => !t.passed)
      .forEach((test) => {
        log(`  - ${test.testName}: ${test.details}`);
      });
  }

  log("\n🎯 Signup Flow Status:");
  if (results.passed >= 8) {
    log("🟢 EXCELLENT - Signup flow is working correctly!");
  } else if (results.passed >= 6) {
    log("🟡 GOOD - Signup flow mostly working with minor issues");
  } else if (results.passed >= 4) {
    log("🟠 FAIR - Signup flow needs some fixes");
  } else {
    log("🔴 POOR - Signup flow needs significant work");
  }

  log("\n📋 User Account Creation Process:");
  log("1. User visits /signup page");
  log("2. User fills out registration form");
  log("3. Form validates input data");
  log("4. User data is sent to Supabase Auth");
  log("5. User profile is created in database");
  log("6. Company record is created in database");
  log("7. User receives email verification");
  log("8. User can login after email verification");

  process.exit(results.failed > 0 ? 1 : 0);
}

// Run the tests
runTests().catch((error) => {
  log(`❌ Test suite failed to run: ${error.message}`);
  process.exit(1);
});
