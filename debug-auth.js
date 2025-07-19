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

async function debugAuth() {
  console.log("🔍 Debugging authentication...");

  try {
    const userId = "5224d682-4785-415b-9b3a-b36dd675dea7";

    // Check if user exists in auth
    const { data: authUser, error: authError } =
      await supabase.auth.admin.getUserById(userId);

    if (authError) {
      console.error("❌ Error getting auth user:", authError);
      return;
    }

    console.log("✅ Auth user found:", {
      id: authUser.user.id,
      email: authUser.user.email,
      email_confirmed_at: authUser.user.email_confirmed_at,
    });

    // Check profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (profileError) {
      console.error("❌ Error getting profile:", profileError);
      return;
    }

    console.log("✅ Profile found:", {
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name,
      company_id: profile.company_id,
      role: profile.role,
    });

    // Check company
    if (profile.company_id) {
      const { data: company, error: companyError } = await supabase
        .from("companies")
        .select("*")
        .eq("id", profile.company_id)
        .single();

      if (companyError) {
        console.error("❌ Error getting company:", companyError);
        return;
      }

      console.log("✅ Company found:", {
        id: company.id,
        name: company.name,
        slug: company.slug,
        owner_id: company.owner_id,
      });
    } else {
      console.log("❌ No company_id in profile");
    }

    // Test the exact query that getCurrentUser uses
    console.log("\n🔍 Testing getCurrentUser query...");
    const { data: testProfile, error: testError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (testError) {
      console.error("❌ Test query error:", testError);
    } else if (!testProfile) {
      console.log("❌ Test query returned no profile");
    } else {
      console.log("✅ Test query successful:", {
        id: testProfile.id,
        company_id: testProfile.company_id,
      });
    }
  } catch (error) {
    console.error("❌ Unexpected error:", error);
  }
}

debugAuth()
  .then(() => {
    console.log("\n✨ Debug completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
