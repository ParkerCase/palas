const { createClient } = require("@supabase/supabase-js");

// Load environment variables
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing required environment variables");
  console.error("NEXT_PUBLIC_SUPABASE_URL:", !!supabaseUrl);
  console.error("SUPABASE_SERVICE_ROLE_KEY:", !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixUserProfile() {
  console.log("🔧 Fixing missing user profile...");

  try {
    // Get the user from auth (using the user ID from the logs)
    const userId = "5224d682-4785-415b-9b3a-b36dd675dea7";
    const userEmail = "parker@parkercase.co";

    console.log(`📋 User ID: ${userId}`);
    console.log(`📧 User Email: ${userEmail}`);

    // Check if profile already exists
    const { data: existingProfile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (profileError && profileError.code !== "PGRST116") {
      console.error("❌ Error checking profile:", profileError);
      return;
    }

    if (existingProfile) {
      console.log("✅ Profile already exists:", existingProfile);
      return;
    }

    // Create profile
    const { data: profile, error: createError } = await supabase
      .from("profiles")
      .insert({
        id: userId,
        email: userEmail,
        full_name: "Parker Case",
        company_name: "ParkerCase",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (createError) {
      console.error("❌ Error creating profile:", createError);
      return;
    }

    console.log("✅ Profile created successfully:", profile);

    // Check if company exists
    const { data: existingCompany, error: companyError } = await supabase
      .from("companies")
      .select("*")
      .eq("owner_id", userId)
      .single();

    if (companyError && companyError.code !== "PGRST116") {
      console.error("❌ Error checking company:", companyError);
      return;
    }

    if (existingCompany) {
      console.log("✅ Company already exists:", existingCompany);
      return;
    }

    // Create company
    const { data: company, error: createCompanyError } = await supabase
      .from("companies")
      .insert({
        name: "ParkerCase",
        slug: "parkercase",
        owner_id: userId,
        industry: "Technology",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (createCompanyError) {
      console.error("❌ Error creating company:", createCompanyError);
      return;
    }

    console.log("✅ Company created successfully:", company);

    // Update profile with company_id
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ company_id: company.id })
      .eq("id", userId);

    if (updateError) {
      console.error("❌ Error updating profile with company_id:", updateError);
      return;
    }

    console.log("✅ Profile updated with company_id");

    console.log("\n🎉 User profile and company setup complete!");
    console.log(
      "The user should now be able to access all pages without 404 errors."
    );
  } catch (error) {
    console.error("❌ Unexpected error:", error);
  }
}

// Run the fix
fixUserProfile()
  .then(() => {
    console.log("\n✨ Profile fix completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
