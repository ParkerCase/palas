const { createClient } = require("@supabase/supabase-js");

// Load environment variables
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing required environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkCompany() {
  console.log("🔍 Checking company setup...");

  try {
    const userId = "5224d682-4785-415b-9b3a-b36dd675dea7";
    const companyId = "e17788e0-4b0d-4006-a65e-a8e1a1a95166";

    // Check company exists
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("*")
      .eq("id", companyId)
      .single();

    if (companyError) {
      console.error("❌ Error fetching company:", companyError);
      return;
    }

    console.log("✅ Company found:", company);

    // Check profile has correct company_id
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (profileError) {
      console.error("❌ Error fetching profile:", profileError);
      return;
    }

    console.log("✅ Profile found:", profile);

    if (profile.company_id === companyId) {
      console.log("✅ Profile and company are properly linked");
    } else {
      console.log("❌ Profile and company are not properly linked");
      console.log("Profile company_id:", profile.company_id);
      console.log("Expected company_id:", companyId);
    }
  } catch (error) {
    console.error("❌ Unexpected error:", error);
  }
}

checkCompany()
  .then(() => {
    console.log("\n✨ Company check completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
