#!/usr/bin/env node

const https = require("https");
const http = require("http");

const BASE_URL = "http://localhost:3000";

// Test configuration
const TESTS = {
  // API Endpoints
  apis: [
    { name: "Health Check", path: "/api/health", method: "GET" },
    {
      name: "Construction API Overview",
      path: "/api/construction?action=overview",
      method: "GET",
    },
    {
      name: "Construction API Search Companies",
      path: "/api/construction?action=search-companies&query=&state=&limit=10",
      method: "GET",
    },
    {
      name: "Manufacturing API Overview",
      path: "/api/manufacturing?action=overview",
      method: "GET",
    },
    {
      name: "Education API Overview",
      path: "/api/education?action=overview",
      method: "GET",
    },
    {
      name: "Healthcare API Overview",
      path: "/api/healthcare?action=overview",
      method: "GET",
    },
    {
      name: "Government API Overview",
      path: "/api/government?action=overview",
      method: "GET",
    },
    { name: "Opportunities API", path: "/api/opportunities", method: "GET" },
    { name: "Applications API", path: "/api/applications", method: "GET" },
    { name: "Companies API", path: "/api/companies", method: "GET" },
    { name: "Contracts API", path: "/api/contracts", method: "GET" },
    { name: "Grants API", path: "/api/grants", method: "GET" },
    { name: "AI Analysis API", path: "/api/ai/analyze", method: "POST" },
  ],

  // Pages
  pages: [
    { name: "Home Page", path: "/" },
    { name: "Dashboard", path: "/dashboard" },
    { name: "Construction Intelligence", path: "/construction" },
    { name: "Manufacturing Intelligence", path: "/manufacturing" },
    { name: "Education Intelligence", path: "/education" },
    { name: "Healthcare Intelligence", path: "/healthcare" },
    { name: "Government Intelligence", path: "/government" },
    { name: "Opportunities", path: "/opportunities" },
    { name: "Applications", path: "/applications" },
    { name: "Company Profile", path: "/company" },
  ],
};

// Utility function to make HTTP requests
function makeRequest(url, method = "GET", data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "GovContractAI-Test-Suite/1.0",
      },
    };

    if (data) {
      const postData = JSON.stringify(data);
      options.headers["Content-Length"] = Buffer.byteLength(postData);
    }

    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          const response = {
            status: res.statusCode,
            headers: res.headers,
            body: body,
            json: null,
          };

          // Try to parse JSON
          if (
            body &&
            res.headers["content-type"]?.includes("application/json")
          ) {
            try {
              response.json = JSON.parse(body);
            } catch (e) {
              // Not JSON, that's okay
            }
          }

          resolve(response);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on("error", reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Test function
async function runTest(test) {
  console.log(`\n🔍 Testing: ${test.name}`);
  console.log(`   URL: ${BASE_URL}${test.path}`);
  console.log(`   Method: ${test.method || "GET"}`);

  try {
    const startTime = Date.now();
    const response = await makeRequest(
      `${BASE_URL}${test.path}`,
      test.method || "GET",
      test.data
    );
    const duration = Date.now() - startTime;

    console.log(`   ✅ Status: ${response.status}`);
    console.log(`   ⏱️  Duration: ${duration}ms`);

    // Check for real data indicators
    if (response.json) {
      const dataCheck = checkForRealData(response.json, test.name);
      if (dataCheck.isReal) {
        console.log(`   📊 Real Data: ${dataCheck.message}`);
      } else {
        console.log(`   ⚠️  Mock Data: ${dataCheck.message}`);
      }
    }

    // Check for specific error patterns
    if (response.status >= 400) {
      console.log(`   ❌ Error: ${response.body.substring(0, 200)}...`);
    }

    return {
      name: test.name,
      success: response.status < 400,
      status: response.status,
      duration,
      hasRealData: response.json
        ? checkForRealData(response.json, test.name).isReal
        : false,
      error: response.status >= 400 ? response.body.substring(0, 200) : null,
    };
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}`);
    return {
      name: test.name,
      success: false,
      error: error.message,
    };
  }
}

// Function to check if data appears to be real vs mock
function checkForRealData(data, testName) {
  // Check for obvious mock indicators
  const mockIndicators = [
    "mock",
    "fake",
    "test",
    "sample",
    "dummy",
    "placeholder",
    "lorem ipsum",
    "example.com",
    "test@test.com",
  ];

  const dataStr = JSON.stringify(data).toLowerCase();

  // Check for mock indicators
  for (const indicator of mockIndicators) {
    if (dataStr.includes(indicator)) {
      return {
        isReal: false,
        message: `Contains mock indicator: "${indicator}"`,
      };
    }
  }

  // Check for real data indicators based on test type
  if (testName.includes("Construction")) {
    if (data.industry_data && data.industry_data.length > 0) {
      return {
        isReal: true,
        message: `Contains ${data.industry_data.length} construction industry records`,
      };
    }
  }

  if (testName.includes("Manufacturing")) {
    if (data.manufacturing_data && data.manufacturing_data.length > 0) {
      return {
        isReal: true,
        message: `Contains ${data.manufacturing_data.length} manufacturing records`,
      };
    }
  }

  if (testName.includes("Education")) {
    if (data.education_data && data.education_data.length > 0) {
      return {
        isReal: true,
        message: `Contains ${data.education_data.length} education records`,
      };
    }
  }

  if (testName.includes("Healthcare")) {
    if (data.healthcare_data && data.healthcare_data.length > 0) {
      return {
        isReal: true,
        message: `Contains ${data.healthcare_data.length} healthcare records`,
      };
    }
  }

  if (testName.includes("Government")) {
    if (data.government_data && data.government_data.length > 0) {
      return {
        isReal: true,
        message: `Contains ${data.government_data.length} government records`,
      };
    }
  }

  if (testName.includes("Opportunities")) {
    if (data.opportunities && data.opportunities.length > 0) {
      return {
        isReal: true,
        message: `Contains ${data.opportunities.length} opportunities`,
      };
    }
  }

  if (testName.includes("Applications")) {
    if (data.applications && data.applications.length > 0) {
      return {
        isReal: true,
        message: `Contains ${data.applications.length} applications`,
      };
    }
  }

  // Check for API response structure
  if (data.data && Array.isArray(data.data) && data.data.length > 0) {
    return {
      isReal: true,
      message: `Contains ${data.data.length} data records`,
    };
  }

  if (data.results && Array.isArray(data.results) && data.results.length > 0) {
    return { isReal: true, message: `Contains ${data.results.length} results` };
  }

  // Check for timestamp or date fields
  if (data.timestamp || data.created_at || data.updated_at) {
    return { isReal: true, message: "Contains timestamp data" };
  }

  // Check for realistic IDs
  if (data.id && typeof data.id === "string" && data.id.length > 10) {
    return { isReal: true, message: "Contains realistic ID" };
  }

  return {
    isReal: false,
    message: "Unable to determine if data is real or mock",
  };
}

// Main test runner
async function runAllTests() {
  console.log("🚀 Starting Comprehensive GovContractAI Test Suite");
  console.log("=".repeat(60));

  const results = {
    apis: [],
    pages: [],
    summary: {
      total: 0,
      passed: 0,
      failed: 0,
      realDataCount: 0,
      mockDataCount: 0,
    },
  };

  // Test API endpoints
  console.log("\n📡 Testing API Endpoints");
  console.log("-".repeat(40));

  for (const test of TESTS.apis) {
    const result = await runTest(test);
    results.apis.push(result);
    results.summary.total++;

    if (result.success) {
      results.summary.passed++;
    } else {
      results.summary.failed++;
    }

    if (result.hasRealData) {
      results.summary.realDataCount++;
    } else if (result.success && !result.hasRealData) {
      results.summary.mockDataCount++;
    }
  }

  // Test pages
  console.log("\n🌐 Testing Pages");
  console.log("-".repeat(40));

  for (const test of TESTS.pages) {
    const result = await runTest(test);
    results.pages.push(result);
    results.summary.total++;

    if (result.success) {
      results.summary.passed++;
    } else {
      results.summary.failed++;
    }
  }

  // Print summary
  console.log("\n📊 Test Summary");
  console.log("=".repeat(60));
  console.log(`Total Tests: ${results.summary.total}`);
  console.log(`✅ Passed: ${results.summary.passed}`);
  console.log(`❌ Failed: ${results.summary.failed}`);
  console.log(`📊 Real Data APIs: ${results.summary.realDataCount}`);
  console.log(`🎭 Mock Data APIs: ${results.summary.mockDataCount}`);
  console.log(
    `📈 Success Rate: ${((results.summary.passed / results.summary.total) * 100).toFixed(1)}%`
  );

  // Print failed tests
  const failedTests = [...results.apis, ...results.pages].filter(
    (r) => !r.success
  );
  if (failedTests.length > 0) {
    console.log("\n❌ Failed Tests:");
    failedTests.forEach((test) => {
      console.log(
        `   - ${test.name}: ${test.error || `Status ${test.status}`}`
      );
    });
  }

  // Print mock data warnings
  const mockDataTests = results.apis.filter((r) => r.success && !r.hasRealData);
  if (mockDataTests.length > 0) {
    console.log("\n⚠️  APIs with Mock Data:");
    mockDataTests.forEach((test) => {
      console.log(`   - ${test.name}`);
    });
  }

  console.log("\n🎯 Recommendations:");
  if (results.summary.failed > 0) {
    console.log("   - Fix failed API endpoints and pages");
  }
  if (results.summary.mockDataCount > 0) {
    console.log("   - Replace mock data with real API integrations");
  }
  if (results.summary.realDataCount === 0) {
    console.log("   - No real data detected - check API integrations");
  }

  console.log("\n✅ Test suite completed!");
}

// Run the tests
runAllTests().catch(console.error);
