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
        "User-Agent": "GovContractAI-Test-Suite/1.0",
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
          const responseData = body ? JSON.parse(body) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: responseData,
          });
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
    log(`✅ PASS: ${testName}`);
  } else {
    results.failed++;
    log(`❌ FAIL: ${testName} - ${details}`);
  }

  return result;
}

async function runTests() {
  log("🚀 Starting comprehensive API tests...");
  log("");

  // Test 1: Health Check
  try {
    const response = await makeRequest("GET", "/api/health");
    testResult(
      "Health Check",
      response.status === 200,
      `Status: ${response.status}`
    );
  } catch (error) {
    testResult("Health Check", false, error.message);
  }

  // Test 2: Companies API - GET (should require auth)
  try {
    const response = await makeRequest("GET", "/api/companies");
    testResult(
      "Companies API - GET (Unauthenticated)",
      response.status === 401,
      `Status: ${response.status}, Expected: 401`
    );
  } catch (error) {
    testResult("Companies API - GET (Unauthenticated)", false, error.message);
  }

  // Test 3: Companies API - POST (should require auth)
  try {
    const response = await makeRequest("POST", "/api/companies", {
      name: "Test Company",
      industry: "Technology",
      size: "Small",
      location: "United States",
    });
    testResult(
      "Companies API - POST (Unauthenticated)",
      response.status === 401,
      `Status: ${response.status}, Expected: 401`
    );
  } catch (error) {
    testResult("Companies API - POST (Unauthenticated)", false, error.message);
  }

  // Test 4: AI Analysis API - POST (should require auth)
  try {
    const response = await makeRequest("POST", "/api/ai/analyze", {
      type: "opportunity",
      data: {
        title: "Test Opportunity",
        agency: "Test Agency",
        amount: "$100,000",
        deadline: "2024-12-31",
        industry: "Technology",
        location: "United States",
      },
    });
    testResult(
      "AI Analysis API - POST (Unauthenticated)",
      response.status === 401,
      `Status: ${response.status}, Expected: 401`
    );
  } catch (error) {
    testResult(
      "AI Analysis API - POST (Unauthenticated)",
      false,
      error.message
    );
  }

  // Test 5: Grants API - GET (should require auth)
  try {
    const response = await makeRequest("GET", "/api/grants");
    testResult(
      "Grants API - GET (Unauthenticated)",
      response.status === 401,
      `Status: ${response.status}, Expected: 401`
    );
  } catch (error) {
    testResult("Grants API - GET (Unauthenticated)", false, error.message);
  }

  // Test 6: Grants API - POST (should require auth)
  try {
    const response = await makeRequest("POST", "/api/grants", {
      title: "Test Grant",
      description: "Test grant description",
      agency: "Test Agency",
      amount: "$50,000",
      deadline: "2024-12-31",
    });
    testResult(
      "Grants API - POST (Unauthenticated)",
      response.status === 401,
      `Status: ${response.status}, Expected: 401`
    );
  } catch (error) {
    testResult("Grants API - POST (Unauthenticated)", false, error.message);
  }

  // Test 7: AI Analysis API - Invalid type
  try {
    const response = await makeRequest("POST", "/api/ai/analyze", {
      type: "invalid_type",
      data: {},
    });
    testResult(
      "AI Analysis API - Invalid Type",
      response.status === 400,
      `Status: ${response.status}, Expected: 400`
    );
  } catch (error) {
    testResult("AI Analysis API - Invalid Type", false, error.message);
  }

  // Test 8: AI Analysis API - Missing data
  try {
    const response = await makeRequest("POST", "/api/ai/analyze", {
      type: "opportunity",
    });
    testResult(
      "AI Analysis API - Missing Data",
      response.status === 400,
      `Status: ${response.status}, Expected: 400`
    );
  } catch (error) {
    testResult("AI Analysis API - Missing Data", false, error.message);
  }

  // Test 9: Companies API - Missing required fields
  try {
    const response = await makeRequest("POST", "/api/companies", {
      industry: "Technology",
      size: "Small",
    });
    testResult(
      "Companies API - Missing Required Fields",
      response.status === 400,
      `Status: ${response.status}, Expected: 400`
    );
  } catch (error) {
    testResult("Companies API - Missing Required Fields", false, error.message);
  }

  // Test 10: Grants API - Missing required fields
  try {
    const response = await makeRequest("POST", "/api/grants", {
      title: "Test Grant",
      agency: "Test Agency",
    });
    testResult(
      "Grants API - Missing Required Fields",
      response.status === 400,
      `Status: ${response.status}, Expected: 400`
    );
  } catch (error) {
    testResult("Grants API - Missing Required Fields", false, error.message);
  }

  // Test 11: Existing APIs still working
  try {
    const response = await makeRequest("GET", "/api/opportunities?limit=5");
    testResult(
      "Opportunities API - Still Working",
      response.status === 200 && response.data.opportunities,
      `Status: ${response.status}, Has data: ${!!response.data.opportunities}`
    );
  } catch (error) {
    testResult("Opportunities API - Still Working", false, error.message);
  }

  // Test 12: Construction API still working
  try {
    const response = await makeRequest(
      "GET",
      "/api/construction?action=overview"
    );
    testResult(
      "Construction API - Still Working",
      response.status === 200 && response.data.construction_overview,
      `Status: ${response.status}, Has data: ${!!response.data.construction_overview}`
    );
  } catch (error) {
    testResult("Construction API - Still Working", false, error.message);
  }

  // Test 13: Manufacturing API still working
  try {
    const response = await makeRequest(
      "GET",
      "/api/manufacturing?action=overview"
    );
    testResult(
      "Manufacturing API - Still Working",
      response.status === 200 && response.data.manufacturing_overview,
      `Status: ${response.status}, Has data: ${!!response.data.manufacturing_overview}`
    );
  } catch (error) {
    testResult("Manufacturing API - Still Working", false, error.message);
  }

  // Test 14: Education API still working
  try {
    const response = await makeRequest("GET", "/api/education?action=overview");
    testResult(
      "Education API - Still Working",
      response.status === 200 && response.data.education_overview,
      `Status: ${response.status}, Has data: ${!!response.data.education_overview}`
    );
  } catch (error) {
    testResult("Education API - Still Working", false, error.message);
  }

  // Test 15: Healthcare API still working
  try {
    const response = await makeRequest(
      "GET",
      "/api/healthcare?action=overview"
    );
    testResult(
      "Healthcare API - Still Working",
      response.status === 200 && response.data.healthcare_overview,
      `Status: ${response.status}, Has data: ${!!response.data.healthcare_overview}`
    );
  } catch (error) {
    testResult("Healthcare API - Still Working", false, error.message);
  }

  // Print summary
  log("");
  log("📊 Test Results Summary:");
  log(`✅ Passed: ${results.passed}`);
  log(`❌ Failed: ${results.failed}`);
  log(
    `📈 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`
  );

  log("");
  log("🔍 Detailed Results:");
  results.tests.forEach((test, index) => {
    const status = test.passed ? "✅" : "❌";
    log(`${index + 1}. ${status} ${test.testName} - ${test.details}`);
  });

  log("");
  if (results.failed === 0) {
    log("🎉 All tests passed! The new APIs are working correctly.");
  } else {
    log("⚠️  Some tests failed. Please review the errors above.");
  }

  return results;
}

// Run the tests
runTests().catch(console.error);
