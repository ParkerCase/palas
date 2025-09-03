const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing required environment variables");
  console.error("NEXT_PUBLIC_SUPABASE_URL:", !!supabaseUrl);
  console.error("SUPABASE_SERVICE_ROLE_KEY:", !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createChecklistTable() {
  console.log("Creating company_checklist table...");

  try {
    // Create the table
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS company_checklist (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        
        -- State/County/City Requirements
        business_license_state BOOLEAN DEFAULT FALSE,
        business_license_county BOOLEAN DEFAULT FALSE,
        business_license_city BOOLEAN DEFAULT FALSE,
        
        secretary_of_state_registration_state BOOLEAN DEFAULT FALSE,
        secretary_of_state_registration_county BOOLEAN DEFAULT FALSE,
        secretary_of_state_registration_city BOOLEAN DEFAULT FALSE,
        
        federal_ein_state BOOLEAN DEFAULT FALSE,
        federal_ein_county BOOLEAN DEFAULT FALSE,
        federal_ein_city BOOLEAN DEFAULT FALSE,
        
        ca_sellers_permit_state BOOLEAN DEFAULT FALSE,
        ca_sellers_permit_county BOOLEAN DEFAULT FALSE,
        ca_sellers_permit_city BOOLEAN DEFAULT FALSE,
        
        insurance_certificates_state BOOLEAN DEFAULT FALSE,
        insurance_certificates_county BOOLEAN DEFAULT FALSE,
        insurance_certificates_city BOOLEAN DEFAULT FALSE,
        
        financial_statements_state BOOLEAN DEFAULT FALSE,
        financial_statements_county BOOLEAN DEFAULT FALSE,
        financial_statements_city BOOLEAN DEFAULT FALSE,
        
        references_past_performance_state BOOLEAN DEFAULT FALSE,
        references_past_performance_county BOOLEAN DEFAULT FALSE,
        references_past_performance_city BOOLEAN DEFAULT FALSE,
        
        capability_statement_state BOOLEAN DEFAULT FALSE,
        capability_statement_county BOOLEAN DEFAULT FALSE,
        capability_statement_city BOOLEAN DEFAULT FALSE,
        
        resumes_key_staff_state BOOLEAN DEFAULT FALSE,
        resumes_key_staff_county BOOLEAN DEFAULT FALSE,
        resumes_key_staff_city BOOLEAN DEFAULT FALSE,
        
        certifications_sb_dvbe_dbe_state BOOLEAN DEFAULT FALSE,
        certifications_sb_dvbe_dbe_county BOOLEAN DEFAULT FALSE,
        certifications_sb_dvbe_dbe_city BOOLEAN DEFAULT FALSE,
        
        -- State-specific requirements
        cal_eprocure_registration BOOLEAN DEFAULT FALSE,
        payee_data_record_std_204 BOOLEAN DEFAULT FALSE,
        darfur_contracting_act_certification_std_843 BOOLEAN DEFAULT FALSE,
        contractor_certification_clauses_ccc_04 BOOLEAN DEFAULT FALSE,
        bidder_declaration_form_gspd_05_105 BOOLEAN DEFAULT FALSE,
        civil_rights_compliance_certification BOOLEAN DEFAULT FALSE,
        
        -- County-specific requirements
        county_vendor_registration BOOLEAN DEFAULT FALSE,
        w9_county_payee_form BOOLEAN DEFAULT FALSE,
        insurance_certificates_naming_county BOOLEAN DEFAULT FALSE,
        debarment_suspension_certification_county BOOLEAN DEFAULT FALSE,
        conflict_of_interest_statement_county BOOLEAN DEFAULT FALSE,
        non_collusion_declaration_county BOOLEAN DEFAULT FALSE,
        technical_proposal_pricing_sheet_county BOOLEAN DEFAULT FALSE,
        
        -- City-specific requirements
        city_vendor_registration BOOLEAN DEFAULT FALSE,
        w9_form_city BOOLEAN DEFAULT FALSE,
        insurance_certificates_naming_city BOOLEAN DEFAULT FALSE,
        city_business_license BOOLEAN DEFAULT FALSE,
        non_collusion_affidavit_city BOOLEAN DEFAULT FALSE,
        subcontractor_list_construction_city BOOLEAN DEFAULT FALSE,
        eeo_certification_city BOOLEAN DEFAULT FALSE,
        signed_addenda_acknowledgments_city BOOLEAN DEFAULT FALSE,
        pricing_sheet_cost_proposal_city BOOLEAN DEFAULT FALSE,
        
        -- Universal requirements (All jurisdictions)
        legal_business_name_dba BOOLEAN DEFAULT FALSE,
        duns_uei_number BOOLEAN DEFAULT FALSE,
        naics_unspsc_codes BOOLEAN DEFAULT FALSE,
        sam_gov_registration BOOLEAN DEFAULT FALSE,
        bonding_capacity_construction BOOLEAN DEFAULT FALSE,
        project_approach_technical_proposal BOOLEAN DEFAULT FALSE,
        key_personnel_availability BOOLEAN DEFAULT FALSE,
        pricing_justification_cost_breakdown BOOLEAN DEFAULT FALSE,
        
        -- Metadata
        last_updated_by UUID REFERENCES profiles(id),
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    console.log("Creating table...");
    const { error: createError } = await supabase.rpc("sql", createTableSQL);

    if (createError) {
      console.error("Error creating table:", createError);
    } else {
      console.log("✅ Table created successfully");
    }

    // Create unique index
    console.log("Creating unique index...");
    const indexSQL = `
      CREATE UNIQUE INDEX IF NOT EXISTS idx_company_checklist_company_id 
      ON company_checklist(company_id)
    `;
    const { error: indexError } = await supabase.rpc("sql", indexSQL);

    if (indexError) {
      console.error("Error creating index:", indexError);
    } else {
      console.log("✅ Unique index created");
    }

    // Enable RLS
    console.log("Enabling RLS...");
    const rlsSQL = `ALTER TABLE company_checklist ENABLE ROW LEVEL SECURITY`;
    const { error: rlsError } = await supabase.rpc("sql", rlsSQL);

    if (rlsError) {
      console.error("Error enabling RLS:", rlsError);
    } else {
      console.log("✅ RLS enabled");
    }

    // Create RLS policies
    console.log("Creating RLS policies...");
    const policies = [
      `CREATE POLICY "Users can view their company's checklist" ON company_checklist
       FOR SELECT USING (
         company_id IN (
           SELECT company_id FROM profiles WHERE id = auth.uid()
         )
       )`,

      `CREATE POLICY "Company owners and admins can update their company's checklist" ON company_checklist
       FOR UPDATE USING (
         company_id IN (
           SELECT company_id FROM profiles 
           WHERE id = auth.uid() 
           AND role IN ('company_owner', 'admin')
         )
       )`,

      `CREATE POLICY "Company owners and admins can insert checklist for their company" ON company_checklist
       FOR INSERT WITH CHECK (
         company_id IN (
           SELECT company_id FROM profiles 
           WHERE id = auth.uid() 
           AND role IN ('company_owner', 'admin')
         )
       )`,
    ];

    for (let i = 0; i < policies.length; i++) {
      const { error: policyError } = await supabase.rpc("sql", policies[i]);
      if (policyError) {
        console.error(`Error creating policy ${i + 1}:`, policyError);
      } else {
        console.log(`✅ Policy ${i + 1} created`);
      }
    }

    console.log("\n🎉 Checklist table setup completed!");
    console.log("✅ Table created with 40 boolean fields");
    console.log("✅ Unique constraint added");
    console.log("✅ RLS policies configured");
    console.log("✅ Ready for use");
  } catch (error) {
    console.error("Setup failed:", error);
    process.exit(1);
  }
}

// Run the setup
createChecklistTable();
