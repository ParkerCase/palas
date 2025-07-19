#!/usr/bin/env node

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// Load environment variables
require("dotenv").config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing required environment variables:");
  console.error("   - NEXT_PUBLIC_SUPABASE_URL");
  console.error("   - SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log("🚀 Starting application_logs table migration...");

  try {
    // Read the migration SQL file
    const migrationPath = path.join(
      __dirname,
      "..",
      "supabase",
      "migrations",
      "20241201000000_create_application_logs.sql"
    );

    if (!fs.existsSync(migrationPath)) {
      console.error("❌ Migration file not found:", migrationPath);
      process.exit(1);
    }

    const migrationSQL = fs.readFileSync(migrationPath, "utf8");
    console.log("📄 Migration SQL loaded successfully");

    // Execute the migration
    console.log("⚡ Executing migration...");
    const { error } = await supabase.rpc("exec_sql", { sql: migrationSQL });

    if (error) {
      console.error("❌ Migration failed:", error);
      process.exit(1);
    }

    console.log("✅ Migration completed successfully!");
    console.log(
      "📊 Application logs table created with comprehensive logging capabilities"
    );

    // Verify the table was created
    console.log("🔍 Verifying table creation...");
    const { data: tables, error: tableError } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .eq("table_name", "application_logs");

    if (tableError) {
      console.error("❌ Error verifying table:", tableError);
      process.exit(1);
    }

    if (tables && tables.length > 0) {
      console.log("✅ application_logs table verified successfully!");
    } else {
      console.error("❌ application_logs table not found after migration");
      process.exit(1);
    }

    // Test inserting a log entry
    console.log("🧪 Testing log insertion...");
    const testLog = {
      timestamp: new Date().toISOString(),
      level: "INFO",
      category: "GENERAL",
      component: "MigrationTest",
      action: "test_insert",
      message: "Test log entry from migration script",
      metadata: {
        test: true,
        migration: "20241201000000_create_application_logs",
      },
    };

    const { error: insertError } = await supabase
      .from("application_logs")
      .insert(testLog);

    if (insertError) {
      console.error("❌ Test log insertion failed:", insertError);
      process.exit(1);
    }

    console.log("✅ Test log insertion successful!");
    console.log("🎉 Migration and verification completed successfully!");
    console.log("");
    console.log("📝 Next steps:");
    console.log(
      "   1. Your application will now log all activities to the application_logs table"
    );
    console.log("   2. Logs are also written to files in the logs/ directory");
    console.log("   3. You can query the logs using Supabase dashboard or API");
    console.log(
      "   4. Use the logger utility in your code for comprehensive logging"
    );
  } catch (error) {
    console.error("❌ Migration failed with error:", error);
    process.exit(1);
  }
}

// Run the migration
runMigration();
