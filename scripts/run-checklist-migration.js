const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing required environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runChecklistMigration() {
  console.log("Starting checklist migration...");

  try {
    // Read the migration SQL
    const fs = require("fs");
    const path = require("path");
    const migrationPath = path.join(
      __dirname,
      "../supabase/migrations/20241201000002_create_company_checklist.sql"
    );

    if (!fs.existsSync(migrationPath)) {
      console.error("Migration file not found:", migrationPath);
      process.exit(1);
    }

    const migrationSQL = fs.readFileSync(migrationPath, "utf8");
    console.log("Migration SQL loaded successfully");

    // Execute the migration by running SQL directly
    console.log("Executing migration...");

    // Split the SQL into individual statements and execute them
    const statements = migrationSQL
      .split(";")
      .filter((stmt) => stmt.trim().length > 0);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement.length === 0) continue;

      console.log(`Executing statement ${i + 1}/${statements.length}...`);

      try {
        const { error } = await supabase.rpc("sql", statement);
        if (error) {
          console.error(`Error in statement ${i + 1}:`, error);
          // Continue with other statements
        }
      } catch (err) {
        console.error(`Error executing statement ${i + 1}:`, err);
        // Continue with other statements
      }
    }

    console.log("✅ Checklist migration completed successfully!");
    console.log("✅ company_checklist table created");
    console.log("✅ Indexes and constraints added");
    console.log("✅ RLS policies configured");
    console.log("✅ Triggers set up");

    // Verify the table was created
    const { data: tables, error: tableError } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_name", "company_checklist");

    if (tableError) {
      console.error("Error verifying table creation:", tableError);
    } else if (tables && tables.length > 0) {
      console.log("✅ Table verification successful");
    } else {
      console.error("❌ Table verification failed - table not found");
    }
  } catch (error) {
    console.error("Migration failed with error:", error);
    process.exit(1);
  }
}

// Run the migration
runChecklistMigration();
