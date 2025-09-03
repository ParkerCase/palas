const {
  CALIFORNIA_COUNTIES,
  getCaliforniaCounties,
  getCitiesByCounty,
} = require("./lib/data/california-locations.ts");

console.log("🧪 Testing California Locations System...\n");

// Test 1: Check counties
console.log("1. California Counties:");
const counties = getCaliforniaCounties();
console.log(`   Found ${counties.length} counties`);
counties.forEach((county) => {
  console.log(
    `   - ${county.name} (${county.population?.toLocaleString()} people)`
  );
});

// Test 2: Check cities
console.log("\n2. Cities by County:");
CALIFORNIA_COUNTIES.forEach((county) => {
  console.log(`   ${county.name}: ${county.cities.length} cities`);
  county.cities.slice(0, 3).forEach((city) => {
    console.log(
      `     - ${city.name} (${city.population?.toLocaleString()} people)`
    );
  });
  if (county.cities.length > 3) {
    console.log(`     ... and ${county.cities.length - 3} more cities`);
  }
});

// Test 3: Test helper functions
console.log("\n3. Testing Helper Functions:");
const laCities = getCitiesByCounty("los-angeles");
console.log(`   Los Angeles County cities: ${laCities.length}`);

const orangeCities = getCitiesByCounty("orange");
console.log(`   Orange County cities: ${orangeCities.length}`);

console.log("\n✅ California locations system is working!");
