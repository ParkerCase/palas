const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing required environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testTextInputs() {
  console.log("🧪 Testing Text Input Fields...\n");

  try {
    // Get a test company
    const { data: companies, error: companyError } = await supabase
      .from("companies")
      .select("id, name")
      .limit(1);

    if (companyError) {
      console.error("❌ Error fetching companies:", companyError);
      return;
    }

    if (!companies || companies.length === 0) {
      console.log("⚠️  No companies found");
      return;
    }

    const testCompany = companies[0];
    console.log(`✅ Using test company: ${testCompany.name}`);

    // Test text input fields
    const textFields = {
      business_license_number_state: "BL-123456789",
      federal_ein_value_state: "12-3456789",
      certification_numbers_state: "SB-123456, DVBE-789012",
      cal_eprocure_number: "EP-987654321",
      legal_business_name_value: "ABC Corporation dba ABC Services",
      duns_uei_value: "123456789",
    };

    console.log("\n📝 Testing text field updates...");

    for (const [field, value] of Object.entries(textFields)) {
      console.log(`   Testing ${field}: ${value}`);

      const { data: updatedChecklist, error: updateError } = await supabase
        .from("company_checklist")
        .update({ [field]: value })
        .eq("company_id", testCompany.id)
        .select()
        .single();

      if (updateError) {
        console.error(`   ❌ Error updating ${field}:`, updateError);
      } else {
        console.log(`   ✅ Updated ${field} successfully`);
      }
    }

    // Verify the text fields were saved
    console.log("\n🔍 Verifying saved text fields...");
    const { data: checklist, error: fetchError } = await supabase
      .from("company_checklist")
      .select("*")
      .eq("company_id", testCompany.id)
      .single();

    if (fetchError) {
      console.error("❌ Error fetching checklist:", fetchError);
    } else {
      console.log("✅ Checklist retrieved successfully");

      for (const [field, expectedValue] of Object.entries(textFields)) {
        const actualValue = checklist[field];
        if (actualValue === expectedValue) {
          console.log(`   ✅ ${field}: "${actualValue}"`);
        } else {
          console.log(
            `   ❌ ${field}: expected "${expectedValue}", got "${actualValue}"`
          );
        }
      }
    }

    console.log("\n🎉 Text input test completed!");
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Run the test
testTextInputs();
