const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing required environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testChecklistCreation() {
  console.log("🧪 Testing Bidding Checklist Creation...\n");

  try {
    // First, let's check if we can connect to Supabase
    console.log("1. Testing Supabase connection...");
    const { data: testData, error: testError } = await supabase
      .from("companies")
      .select("id, name")
      .limit(1);

    if (testError) {
      console.error("❌ Connection failed:", testError);
      return;
    }

    console.log("✅ Supabase connection successful");

    if (testData && testData.length > 0) {
      const testCompany = testData[0];
      console.log(
        `   Found test company: ${testCompany.name} (${testCompany.id})`
      );

      // Try to insert a checklist record
      console.log("\n2. Attempting to create checklist...");
      const { data: checklist, error: insertError } = await supabase
        .from("company_checklist")
        .insert({
          company_id: testCompany.id,
          business_license_state: true,
          federal_ein_state: true,
          insurance_certificates_state: true,
          legal_business_name_dba: true,
          duns_uei_number: true,
          naics_unspsc_codes: true,
          cal_eprocure_registration: true,
          county_vendor_registration: true,
          city_vendor_registration: true,
        })
        .select()
        .single();

      if (insertError) {
        if (insertError.code === "42P01") {
          console.log("❌ Table does not exist - need to create it manually");
          console.log(
            "   Please run the SQL migration in Supabase SQL Editor:"
          );
          console.log(
            "   File: supabase/migrations/20241201000002_create_company_checklist.sql"
          );
        } else {
          console.error("❌ Insert error:", insertError);
        }
        return;
      }

      console.log("✅ Checklist created successfully!");
      console.log(`   Checklist ID: ${checklist.id}`);
      console.log(`   Company ID: ${checklist.company_id}`);

      // Test updating the checklist
      console.log("\n3. Testing checklist updates...");
      const { data: updatedChecklist, error: updateError } = await supabase
        .from("company_checklist")
        .update({
          business_license_county: true,
          business_license_city: true,
          payee_data_record_std_204: true,
        })
        .eq("company_id", testCompany.id)
        .select()
        .single();

      if (updateError) {
        console.error("❌ Update error:", updateError);
      } else {
        console.log("✅ Checklist updated successfully");

        // Count completed items
        const completedItems = Object.entries(updatedChecklist)
          .filter(
            ([key, value]) =>
              key.startsWith("business_") ||
              key.startsWith("federal_") ||
              key.startsWith("insurance_") ||
              key.startsWith("legal_") ||
              key.startsWith("duns_") ||
              key.startsWith("naics_") ||
              key.startsWith("cal_") ||
              key.startsWith("county_") ||
              key.startsWith("city_") ||
              key.startsWith("payee_")
          )
          .filter(([key, value]) => value === true).length;

        console.log(`   Completed items: ${completedItems}`);
      }

      // Test fetching the checklist
      console.log("\n4. Testing checklist retrieval...");
      const { data: fetchedChecklist, error: fetchError } = await supabase
        .from("company_checklist")
        .select("*")
        .eq("company_id", testCompany.id)
        .single();

      if (fetchError) {
        console.error("❌ Fetch error:", fetchError);
      } else {
        console.log("✅ Checklist retrieved successfully");
        console.log(`   Total fields: ${Object.keys(fetchedChecklist).length}`);

        // Count boolean fields
        const booleanFields = Object.entries(fetchedChecklist).filter(
          ([key, value]) => typeof value === "boolean"
        ).length;

        console.log(`   Boolean fields: ${booleanFields}`);
      }
    } else {
      console.log("⚠️  No companies found - cannot test checklist creation");
    }

    console.log("\n🎉 Checklist system test completed!");
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Run the test
testChecklistCreation();
