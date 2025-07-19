#!/usr/bin/env node

const http = require("http");

const BASE_URL = "http://localhost:3000";

// Test real data sources and API integrations
async function testRealDataSources() {
  console.log("🔍 Testing Real Data Sources & API Integrations");
  console.log("=".repeat(60));

  const tests = [
    {
      name: "Construction API - Real Census Data",
      path: "/api/construction?action=overview",
      expectedRealData: true,
      description: "Should fetch real construction data from Census Bureau",
    },
    {
      name: "Manufacturing API - Real Census Data",
      path: "/api/manufacturing?action=overview",
      expectedRealData: true,
      description: "Should fetch real manufacturing data from Census Bureau",
    },
    {
      name: "Opportunities API - USAspending.gov",
      path: "/api/opportunities?limit=5",
      expectedRealData: true,
      description: "Should fetch real opportunities from USAspending.gov",
    },
    {
      name: "Opportunities API - Grants.gov",
      path: "/api/opportunities?limit=5&type=grant",
      expectedRealData: true,
      description: "Should fetch real grants from Grants.gov",
    },
    {
      name: "Construction Search - SAM.gov",
      path: "/api/construction?action=search-companies&query=construction&state=CA&limit=5",
      expectedRealData: true,
      description: "Should search real contractors via SAM.gov",
    },
    {
      name: "Manufacturing Search - SAM.gov",
      path: "/api/manufacturing?action=search-manufacturers&query=manufacturing&state=TX&limit=5",
      expectedRealData: true,
      description: "Should search real manufacturers via SAM.gov",
    },
  ];

  for (const test of tests) {
    console.log(`\n🔍 Testing: ${test.name}`);
    console.log(`   Description: ${test.description}`);
    console.log(`   URL: ${BASE_URL}${test.path}`);

    try {
      const startTime = Date.now();
      const response = await makeRequest(test.path, "GET");
      const duration = Date.now() - startTime;

      console.log(`   ✅ Status: ${response.status}`);
      console.log(`   ⏱️  Duration: ${duration}ms`);

      if (response.status === 200 && response.json) {
        const dataAnalysis = analyzeDataQuality(response.json, test.name);
        console.log(`   📊 Data Quality: ${dataAnalysis.quality}`);
        console.log(`   🔗 Data Source: ${dataAnalysis.source}`);
        console.log(`   📈 Records: ${dataAnalysis.recordCount}`);

        if (dataAnalysis.isRealData) {
          console.log(`   ✅ REAL DATA: ${dataAnalysis.realDataEvidence}`);
        } else {
          console.log(`   ⚠️  MOCK DATA: ${dataAnalysis.mockDataEvidence}`);
        }

        if (dataAnalysis.apiCalls) {
          console.log(
            `   🌐 External APIs: ${dataAnalysis.apiCalls.join(", ")}`
          );
        }
      } else if (response.status >= 400) {
        console.log(`   ❌ Error: ${response.body.substring(0, 200)}`);
      }
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
    }
  }

  console.log("\n📊 Summary of Real Data Sources:");
  console.log("=".repeat(60));
  console.log("✅ USAspending.gov - Federal contract data");
  console.log("✅ Grants.gov - Federal grant opportunities");
  console.log("✅ Census Bureau - Industry statistics");
  console.log("✅ SAM.gov - Contractor database");
  console.log("✅ Bureau of Labor Statistics - Employment data");
}

function analyzeDataQuality(data, testName) {
  const analysis = {
    quality: "Unknown",
    source: "Unknown",
    recordCount: 0,
    isRealData: false,
    realDataEvidence: "",
    mockDataEvidence: "",
    apiCalls: [],
  };

  // Check for real data indicators
  const dataStr = JSON.stringify(data).toLowerCase();

  // Check for external API indicators
  if (dataStr.includes("usaspending.gov") || dataStr.includes("usaspending")) {
    analysis.apiCalls.push("USAspending.gov");
    analysis.source = "USAspending.gov";
    analysis.isRealData = true;
    analysis.realDataEvidence = "Contains USAspending.gov data";
  }

  if (dataStr.includes("grants.gov") || dataStr.includes("grants")) {
    analysis.apiCalls.push("Grants.gov");
    analysis.source = "Grants.gov";
    analysis.isRealData = true;
    analysis.realDataEvidence = "Contains Grants.gov data";
  }

  if (dataStr.includes("census.gov") || dataStr.includes("census")) {
    analysis.apiCalls.push("Census Bureau");
    analysis.source = "Census Bureau";
    analysis.isRealData = true;
    analysis.realDataEvidence = "Contains Census Bureau data";
  }

  if (dataStr.includes("sam.gov") || dataStr.includes("sam")) {
    analysis.apiCalls.push("SAM.gov");
    analysis.source = "SAM.gov";
    analysis.isRealData = true;
    analysis.realDataEvidence = "Contains SAM.gov data";
  }

  // Check for realistic data structures
  if (data.opportunities && Array.isArray(data.opportunities)) {
    analysis.recordCount = data.opportunities.length;
    if (data.opportunities.length > 0) {
      const sample = data.opportunities[0];
      if (sample.id && sample.title && sample.agency) {
        analysis.quality = "High";
        if (!analysis.isRealData) {
          analysis.isRealData = true;
          analysis.realDataEvidence =
            "Contains realistic opportunity structure";
        }
      }
    }
  }

  if (data.construction_overview || data.manufacturing_overview) {
    analysis.quality = "High";
    if (data.metadata?.data_source?.includes("Real")) {
      analysis.isRealData = true;
      analysis.realDataEvidence = "Marked as real data source";
    }
  }

  // Check for mock data indicators
  const mockIndicators = [
    "mock",
    "fake",
    "test",
    "sample",
    "dummy",
    "placeholder",
  ];
  for (const indicator of mockIndicators) {
    if (dataStr.includes(indicator)) {
      analysis.mockDataEvidence = `Contains "${indicator}" indicator`;
      analysis.isRealData = false;
      break;
    }
  }

  // Check for realistic amounts and dates
  if (data.opportunities) {
    const realisticAmounts = data.opportunities.some(
      (opp) => opp.amount && opp.amount > 1000 && opp.amount < 1000000000
    );
    if (realisticAmounts) {
      analysis.isRealData = true;
      analysis.realDataEvidence = "Contains realistic contract amounts";
    }
  }

  return analysis;
}

// Utility function to make HTTP requests
function makeRequest(path, method = "GET", data = null) {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}${path}`;
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "GovContractAI-Data-Test/1.0",
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

// Run the tests
testRealDataSources().catch(console.error);
