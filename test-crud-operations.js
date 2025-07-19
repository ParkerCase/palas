#!/usr/bin/env node

const http = require("http");

const BASE_URL = "http://localhost:3000";

// Test CRUD operations
async function testCRUDOperations() {
  console.log("🔧 Testing CRUD Operations");
  console.log("=".repeat(50));

  // Test 1: Create an opportunity
  console.log("\n1️⃣ Testing CREATE - New Opportunity");
  const newOpportunity = {
    title: "Test Government Contract",
    description: "This is a test opportunity for CRUD testing",
    agency: "Department of Defense",
    amount: 500000,
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    type: "contract",
  };

  try {
    const createResponse = await makeRequest(
      "/api/opportunities",
      "POST",
      newOpportunity
    );
    console.log(`   Status: ${createResponse.status}`);
    if (createResponse.status === 201 || createResponse.status === 200) {
      console.log("   ✅ CREATE: Success");
      const createdData = createResponse.json;
      console.log(`   📝 Created ID: ${createdData?.id || "Unknown"}`);
    } else {
      console.log(
        `   ❌ CREATE: Failed - ${createResponse.body.substring(0, 100)}`
      );
    }
  } catch (error) {
    console.log(`   ❌ CREATE: Error - ${error.message}`);
  }

  // Test 2: Read opportunities
  console.log("\n2️⃣ Testing READ - Get Opportunities");
  try {
    const readResponse = await makeRequest("/api/opportunities?limit=5", "GET");
    console.log(`   Status: ${readResponse.status}`);
    if (readResponse.status === 200) {
      console.log("   ✅ READ: Success");
      const opportunities =
        readResponse.json?.opportunities || readResponse.json?.data || [];
      console.log(`   📊 Found ${opportunities.length} opportunities`);
      if (opportunities.length > 0) {
        console.log(
          `   📋 Sample: ${opportunities[0].title || opportunities[0].id}`
        );
      }
    } else {
      console.log(
        `   ❌ READ: Failed - ${readResponse.body.substring(0, 100)}`
      );
    }
  } catch (error) {
    console.log(`   ❌ READ: Error - ${error.message}`);
  }

  // Test 3: Read specific opportunity
  console.log("\n3️⃣ Testing READ - Get Specific Opportunity");
  try {
    const specificResponse = await makeRequest(
      "/api/opportunities/test-opportunity-123",
      "GET"
    );
    console.log(`   Status: ${specificResponse.status}`);
    if (specificResponse.status === 200) {
      console.log("   ✅ READ Specific: Success");
      const opportunity = specificResponse.json;
      console.log(`   📋 Title: ${opportunity?.title || "Unknown"}`);
    } else if (specificResponse.status === 404) {
      console.log("   ⚠️  READ Specific: Not found (expected for test ID)");
    } else {
      console.log(
        `   ❌ READ Specific: Failed - ${specificResponse.body.substring(0, 100)}`
      );
    }
  } catch (error) {
    console.log(`   ❌ READ Specific: Error - ${error.message}`);
  }

  // Test 4: Update opportunity
  console.log("\n4️⃣ Testing UPDATE - Update Opportunity");
  const updateData = {
    title: "Updated Test Government Contract",
    description: "This opportunity has been updated for testing",
    amount: 750000,
  };

  try {
    const updateResponse = await makeRequest(
      "/api/opportunities/test-opportunity-123",
      "PUT",
      updateData
    );
    console.log(`   Status: ${updateResponse.status}`);
    if (updateResponse.status === 200) {
      console.log("   ✅ UPDATE: Success");
    } else if (updateResponse.status === 404) {
      console.log("   ⚠️  UPDATE: Not found (expected for test ID)");
    } else {
      console.log(
        `   ❌ UPDATE: Failed - ${updateResponse.body.substring(0, 100)}`
      );
    }
  } catch (error) {
    console.log(`   ❌ UPDATE: Error - ${error.message}`);
  }

  // Test 5: Delete opportunity
  console.log("\n5️⃣ Testing DELETE - Delete Opportunity");
  try {
    const deleteResponse = await makeRequest(
      "/api/opportunities/test-opportunity-123",
      "DELETE"
    );
    console.log(`   Status: ${deleteResponse.status}`);
    if (deleteResponse.status === 200 || deleteResponse.status === 204) {
      console.log("   ✅ DELETE: Success");
    } else if (deleteResponse.status === 404) {
      console.log("   ⚠️  DELETE: Not found (expected for test ID)");
    } else {
      console.log(
        `   ❌ DELETE: Failed - ${deleteResponse.body.substring(0, 100)}`
      );
    }
  } catch (error) {
    console.log(`   ❌ DELETE: Error - ${error.message}`);
  }

  // Test 6: Applications CRUD
  console.log("\n6️⃣ Testing Applications CRUD");

  // Create application
  const newApplication = {
    opportunity_id: "test-opp-123",
    company_id: "test-company-123",
    status: "draft",
    proposal_summary: "Test proposal for CRUD testing",
    estimated_cost: 450000,
  };

  try {
    const createAppResponse = await makeRequest(
      "/api/applications",
      "POST",
      newApplication
    );
    console.log(`   CREATE Status: ${createAppResponse.status}`);
    if (createAppResponse.status === 201 || createAppResponse.status === 200) {
      console.log("   ✅ Application CREATE: Success");
    } else {
      console.log(
        `   ❌ Application CREATE: Failed - ${createAppResponse.body.substring(0, 100)}`
      );
    }
  } catch (error) {
    console.log(`   ❌ Application CREATE: Error - ${error.message}`);
  }

  // Read applications
  try {
    const readAppResponse = await makeRequest("/api/applications", "GET");
    console.log(`   READ Status: ${readAppResponse.status}`);
    if (readAppResponse.status === 200) {
      console.log("   ✅ Application READ: Success");
      const applications =
        readAppResponse.json?.applications || readAppResponse.json?.data || [];
      console.log(`   📊 Found ${applications.length} applications`);
    } else {
      console.log(
        `   ❌ Application READ: Failed - ${readAppResponse.body.substring(0, 100)}`
      );
    }
  } catch (error) {
    console.log(`   ❌ Application READ: Error - ${error.message}`);
  }

  console.log("\n✅ CRUD Testing Complete");
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
        "User-Agent": "GovContractAI-CRUD-Test/1.0",
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

// Run the CRUD tests
testCRUDOperations().catch(console.error);
