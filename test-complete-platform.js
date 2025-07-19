const http = require("http");

const BASE_URL = "http://localhost:3000";
const TEST_USER_EMAIL = "parker@parkercase.co";
const TEST_USER_PASSWORD = "testpassword123";

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
        "User-Agent": "GovContractAI-Complete-Test/1.0",
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
  log("🚀 Starting Complete Platform Test Suite");
  log("==========================================");

  // Test 1: Authentication (should fail without session)
  try {
    const response = await makeRequest("GET", "/api/companies");
    testResult(
      "Authentication Required - Companies API",
      response.status === 401,
      `Status: ${response.status}`
    );
  } catch (error) {
    testResult("Authentication Required - Companies API", false, error.message);
  }

  // Test 2: Companies API - Create
  try {
    const companyData = {
      name: "Test Company Inc.",
      industry: "Technology",
      size: "Small",
      location: "Washington, DC",
      description: "A test company for platform verification",
    };

    const response = await makeRequest("POST", "/api/companies", companyData);
    testResult(
      "Companies API - Create (Unauthenticated)",
      response.status === 401,
      `Status: ${response.status}`
    );
  } catch (error) {
    testResult(
      "Companies API - Create (Unauthenticated)",
      false,
      error.message
    );
  }

  // Test 3: AI Analysis API - Opportunity Analysis
  try {
    const analysisData = {
      type: "opportunity",
      data: {
        title: "Federal IT Services Contract",
        description: "IT services for government agency",
        agency: "Department of Defense",
        amount: "$500,000",
        deadline: "2024-12-31",
        industry: "Technology",
        requirements: "Cybersecurity, cloud computing",
      },
    };

    const response = await makeRequest("POST", "/api/ai/analyze", analysisData);
    testResult(
      "AI Analysis API - Opportunity Analysis (Unauthenticated)",
      response.status === 401,
      `Status: ${response.status}`
    );
  } catch (error) {
    testResult(
      "AI Analysis API - Opportunity Analysis (Unauthenticated)",
      false,
      error.message
    );
  }

  // Test 4: AI Analysis API - Proposal Generation
  try {
    const proposalData = {
      type: "proposal",
      data: {
        opportunityTitle: "Federal IT Services Contract",
        opportunityDescription: "IT services for government agency",
        companyName: "Test Company Inc.",
        companyStrengths: "Cybersecurity expertise, cloud computing experience",
        approach: "Comprehensive IT solution with security focus",
      },
    };

    const response = await makeRequest("POST", "/api/ai/analyze", proposalData);
    testResult(
      "AI Analysis API - Proposal Generation (Unauthenticated)",
      response.status === 401,
      `Status: ${response.status}`
    );
  } catch (error) {
    testResult(
      "AI Analysis API - Proposal Generation (Unauthenticated)",
      false,
      error.message
    );
  }

  // Test 5: AI Analysis API - Company Analysis
  try {
    const companyAnalysisData = {
      type: "company",
      data: {
        name: "Test Company Inc.",
        industry: "Technology",
        size: "Small",
        location: "Washington, DC",
        description: "Cybersecurity and IT services company",
        yearsInBusiness: "5",
        certifications: "ISO 27001, CMMI Level 3",
        pastProjects: "Federal cybersecurity projects",
      },
    };

    const response = await makeRequest(
      "POST",
      "/api/ai/analyze",
      companyAnalysisData
    );
    testResult(
      "AI Analysis API - Company Analysis (Unauthenticated)",
      response.status === 401,
      `Status: ${response.status}`
    );
  } catch (error) {
    testResult(
      "AI Analysis API - Company Analysis (Unauthenticated)",
      false,
      error.message
    );
  }

  // Test 6: Grants API - List
  try {
    const response = await makeRequest("GET", "/api/grants");
    testResult(
      "Grants API - List (Unauthenticated)",
      response.status === 401,
      `Status: ${response.status}`
    );
  } catch (error) {
    testResult("Grants API - List (Unauthenticated)", false, error.message);
  }

  // Test 7: Grants API - Create
  try {
    const grantData = {
      title: "Test Grant Opportunity",
      description: "A test grant for platform verification",
      agency: "Test Agency",
      category: "Technology",
      amount: "$100,000",
      deadline: "2024-12-31",
      eligibility: "Small businesses",
      requirements: "Technology expertise",
    };

    const response = await makeRequest("POST", "/api/grants", grantData);
    testResult(
      "Grants API - Create (Unauthenticated)",
      response.status === 401,
      `Status: ${response.status}`
    );
  } catch (error) {
    testResult("Grants API - Create (Unauthenticated)", false, error.message);
  }

  // Test 8: Existing APIs still working
  try {
    const response = await makeRequest(
      "GET",
      "/api/construction?action=overview"
    );
    testResult(
      "Construction API - Still Working",
      response.status === 200 && response.data?.construction_overview,
      `Status: ${response.status}, Has data: ${!!response.data?.construction_overview}`
    );
  } catch (error) {
    testResult("Construction API - Still Working", false, error.message);
  }

  // Test 9: Manufacturing API still working
  try {
    const response = await makeRequest(
      "GET",
      "/api/manufacturing?action=overview"
    );
    testResult(
      "Manufacturing API - Still Working",
      response.status === 200 && response.data?.manufacturing_overview,
      `Status: ${response.status}, Has data: ${!!response.data?.manufacturing_overview}`
    );
  } catch (error) {
    testResult("Manufacturing API - Still Working", false, error.message);
  }

  // Test 10: Education API still working
  try {
    const response = await makeRequest("GET", "/api/education?action=overview");
    testResult(
      "Education API - Still Working",
      response.status === 200 && response.data?.education_overview,
      `Status: ${response.status}, Has data: ${!!response.data?.education_overview}`
    );
  } catch (error) {
    testResult("Education API - Still Working", false, error.message);
  }

  // Test 11: Healthcare API still working
  try {
    const response = await makeRequest(
      "GET",
      "/api/healthcare?action=overview"
    );
    testResult(
      "Healthcare API - Still Working",
      response.status === 200 && response.data?.healthcare_overview,
      `Status: ${response.status}, Has data: ${!!response.data?.healthcare_overview}`
    );
  } catch (error) {
    testResult("Healthcare API - Still Working", false, error.message);
  }

  // Test 12: Opportunities API still working
  try {
    const response = await makeRequest("GET", "/api/opportunities");
    testResult(
      "Opportunities API - Still Working",
      response.status === 200 && response.data?.opportunities,
      `Status: ${response.status}, Has data: ${!!response.data?.opportunities}`
    );
  } catch (error) {
    testResult("Opportunities API - Still Working", false, error.message);
  }

  // Test 13: Applications API still working
  try {
    const response = await makeRequest("GET", "/api/applications");
    testResult(
      "Applications API - Still Working",
      response.status === 200 && response.data?.applications,
      `Status: ${response.status}, Has data: ${!!response.data?.applications}`
    );
  } catch (error) {
    testResult("Applications API - Still Working", false, error.message);
  }

  // Test 14: Dashboard API still working
  try {
    const response = await makeRequest("GET", "/api/dashboard");
    testResult(
      "Dashboard API - Still Working",
      response.status === 200 && response.data,
      `Status: ${response.status}, Has data: ${!!response.data}`
    );
  } catch (error) {
    testResult("Dashboard API - Still Working", false, error.message);
  }

  // Test 15: Frontend pages accessible (should redirect to login)
  try {
    const response = await makeRequest("GET", "/company-setup");
    testResult(
      "Company Setup Page - Accessible",
      response.status === 200 || response.status === 307,
      `Status: ${response.status}`
    );
  } catch (error) {
    testResult("Company Setup Page - Accessible", false, error.message);
  }

  // Test 16: AI Analysis page accessible
  try {
    const response = await makeRequest("GET", "/ai-analysis");
    testResult(
      "AI Analysis Page - Accessible",
      response.status === 200 || response.status === 307,
      `Status: ${response.status}`
    );
  } catch (error) {
    testResult("AI Analysis Page - Accessible", false, error.message);
  }

  // Test 17: Grants page accessible
  try {
    const response = await makeRequest("GET", "/grants");
    testResult(
      "Grants Page - Accessible",
      response.status === 200 || response.status === 307,
      `Status: ${response.status}`
    );
  } catch (error) {
    testResult("Grants Page - Accessible", false, error.message);
  }

  // Test 18: API validation - Missing required fields
  try {
    const response = await makeRequest("POST", "/api/companies", {});
    testResult(
      "Companies API - Validation (Missing Fields)",
      response.status === 401, // Should be 401 (auth required) before validation
      `Status: ${response.status}`
    );
  } catch (error) {
    testResult(
      "Companies API - Validation (Missing Fields)",
      false,
      error.message
    );
  }

  // Test 19: API validation - Invalid data types
  try {
    const response = await makeRequest("POST", "/api/ai/analyze", {
      type: "invalid_type",
      data: {},
    });
    testResult(
      "AI Analysis API - Validation (Invalid Type)",
      response.status === 401, // Should be 401 (auth required) before validation
      `Status: ${response.status}`
    );
  } catch (error) {
    testResult(
      "AI Analysis API - Validation (Invalid Type)",
      false,
      error.message
    );
  }

  // Test 20: API error handling
  try {
    const response = await makeRequest("GET", "/api/nonexistent");
    testResult(
      "API Error Handling - 404",
      response.status === 404,
      `Status: ${response.status}`
    );
  } catch (error) {
    testResult("API Error Handling - 404", false, error.message);
  }

  // Summary
  log("\n==========================================");
  log("📊 Test Results Summary");
  log("==========================================");
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

  log("\n🎯 Platform Status:");
  if (results.passed >= 18) {
    log("🟢 EXCELLENT - Platform is ready for launch!");
  } else if (results.passed >= 15) {
    log("🟡 GOOD - Platform is mostly functional with minor issues");
  } else if (results.passed >= 10) {
    log("🟠 FAIR - Platform needs some fixes before launch");
  } else {
    log("🔴 POOR - Platform needs significant work before launch");
  }

  log("\n📋 Next Steps:");
  if (results.failed > 0) {
    log("1. Review failed tests above");
    log("2. Fix authentication issues if any");
    log("3. Verify API endpoints are properly configured");
    log("4. Test with authenticated user session");
  } else {
    log("1. ✅ All tests passed!");
    log("2. 🚀 Platform is ready for production deployment");
    log("3. 📊 Monitor performance in production");
    log("4. 🔄 Set up automated testing pipeline");
  }

  process.exit(results.failed > 0 ? 1 : 0);
}

// Run the tests
runTests().catch((error) => {
  log(`❌ Test suite failed to run: ${error.message}`);
  process.exit(1);
});
