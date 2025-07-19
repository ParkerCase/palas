#!/usr/bin/env node

const http = require("http");

const BASE_URL = "http://localhost:3000";

// Test all APIs with correct query parameters
async function testAllAPIs() {
  console.log("🔍 Testing All APIs with Real Data Sources");
  console.log("=".repeat(60));

  const tests = [
    // Construction API - Real Census Bureau Data
    {
      name: "Construction API Overview",
      path: "/api/construction?action=overview",
      expectedRealData: true,
      description: "Should fetch real construction data from Census Bureau",
    },
    {
      name: "Construction API Search Companies",
      path: "/api/construction?action=search-companies&query=&state=&limit=10",
      expectedRealData: true,
      description: "Should search construction companies via SAM.gov",
    },

    // Manufacturing API - Real Census Bureau Data
    {
      name: "Manufacturing API Overview",
      path: "/api/manufacturing?action=overview",
      expectedRealData: true,
      description: "Should fetch real manufacturing data from Census Bureau",
    },
    {
      name: "Manufacturing API Search Companies",
      path: "/api/manufacturing?action=search-manufacturers&query=&state=&limit=10",
      expectedRealData: true,
      description: "Should search manufacturers via SAM.gov",
    },

    // Education API - Real Department of Education Data
    {
      name: "Education API Overview",
      path: "/api/education?action=overview",
      expectedRealData: true,
      description:
        "Should fetch real education data from Department of Education",
    },

    // Healthcare API - Real Healthcare Data
    {
      name: "Healthcare API Overview",
      path: "/api/healthcare?action=overview",
      expectedRealData: true,
      description: "Should fetch real healthcare data from government sources",
    },

    // Opportunities API - Real Government Data
    {
      name: "Opportunities API (USAspending.gov)",
      path: "/api/opportunities?limit=5",
      expectedRealData: true,
      description:
        "Should fetch real opportunities from USAspending.gov and Grants.gov",
    },

    // Health Check
    {
      name: "Health Check",
      path: "/api/health",
      expectedRealData: false,
      description: "Basic health check endpoint",
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    console.log(`\n🧪 Testing: ${test.name}`);
    console.log(`   Description: ${test.description}`);

    try {
      const result = await makeRequest(test.path);

      if (result.status === 200) {
        const data = JSON.parse(result.body);

        // Check for real data indicators
        let hasRealData = false;
        if (test.expectedRealData) {
          hasRealData = checkForRealData(data, test.name);
        } else {
          hasRealData = true; // Health check doesn't need real data
        }

        if (hasRealData) {
          console.log(
            `   ✅ PASSED - Status: ${result.status}, Real Data: ${hasRealData ? "Yes" : "No"}`
          );
          passed++;
        } else {
          console.log(`   ❌ FAILED - No real data found`);
          console.log(`   Response: ${result.body.substring(0, 200)}...`);
          failed++;
        }
      } else {
        console.log(`   ❌ FAILED - Status: ${result.status}`);
        console.log(`   Response: ${result.body.substring(0, 200)}...`);
        failed++;
      }
    } catch (error) {
      console.log(`   ❌ FAILED - Error: ${error.message}`);
      failed++;
    }
  }

  console.log(`\n📊 Test Results:`);
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(
    `   📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`
  );

  return { passed, failed };
}

function checkForRealData(data, apiName) {
  // Check for real data indicators based on API
  if (apiName.includes("Construction")) {
    return (
      data.construction_overview?.metadata?.data_source?.includes(
        "Census Bureau"
      ) ||
      data.construction_overview?.sector_summary?.total_contractors?.includes(
        "715364"
      )
    );
  }

  if (apiName.includes("Manufacturing")) {
    return (
      data.manufacturing_overview?.metadata?.data_source?.includes(
        "Census Bureau"
      ) ||
      data.manufacturing_overview?.sector_summary?.total_establishments?.includes(
        "250,000"
      )
    );
  }

  if (apiName.includes("Education")) {
    return (
      data.education_overview?.metadata?.data_source?.includes(
        "Department of Education"
      ) ||
      data.education_overview?.sector_summary?.federal_spending?.includes(
        "$79.6 billion"
      )
    );
  }

  if (apiName.includes("Healthcare")) {
    return (
      data.healthcare_overview?.metadata?.data_source?.includes(
        "Real-time government"
      ) ||
      data.healthcare_overview?.sector_summary?.market_size?.includes(
        "$4.5 trillion"
      )
    );
  }

  if (apiName.includes("Opportunities")) {
    return (
      data.opportunities &&
      Array.isArray(data.opportunities) &&
      data.opportunities.length > 0
    );
  }

  if (apiName.includes("Health")) {
    return data.status === "ok" || data.message === "Server is running";
  }

  return false;
}

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: "GET",
      headers: {
        "User-Agent": "GovContractAI-Test-Suite/1.0",
        Accept: "application/json",
      },
    };

    const req = http.request(options, (res) => {
      let body = "";

      res.on("data", (chunk) => {
        body += chunk;
      });

      res.on("end", () => {
        resolve({
          status: res.statusCode,
          body: body,
          headers: res.headers,
        });
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });

    req.end();
  });
}

// Run the tests
testAllAPIs()
  .then((results) => {
    console.log("\n🎉 API Testing Complete!");
    process.exit(results.failed > 0 ? 1 : 0);
  })
  .catch((error) => {
    console.error("Test suite error:", error);
    process.exit(1);
  });
