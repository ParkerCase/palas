-- Migration: Create company checklist table
-- This table stores the comprehensive bidding checklist for companies

CREATE TABLE company_checklist (
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
    
    -- Text Input Fields
    business_license_number_state TEXT,
    business_license_number_county TEXT,
    business_license_number_city TEXT,
    
    secretary_of_state_number_state TEXT,
    secretary_of_state_number_county TEXT,
    secretary_of_state_number_city TEXT,
    
    federal_ein_value_state TEXT,
    federal_ein_value_county TEXT,
    federal_ein_value_city TEXT,
    
    ca_sellers_permit_number_state TEXT,
    ca_sellers_permit_number_county TEXT,
    ca_sellers_permit_number_city TEXT,
    
    insurance_certificate_number_state TEXT,
    insurance_certificate_number_county TEXT,
    insurance_certificate_number_city TEXT,
    
    financial_statements_years_state TEXT,
    financial_statements_years_county TEXT,
    financial_statements_years_city TEXT,
    
    references_count_state TEXT,
    references_count_county TEXT,
    references_count_city TEXT,
    
    capability_statement_date_state TEXT,
    capability_statement_date_county TEXT,
    capability_statement_date_city TEXT,
    
    key_staff_count_state TEXT,
    key_staff_count_county TEXT,
    key_staff_count_city TEXT,
    
    certification_numbers_state TEXT,
    certification_numbers_county TEXT,
    certification_numbers_city TEXT,
    
    cal_eprocure_number TEXT,
    payee_data_record_number TEXT,
    darfur_certification_number TEXT,
    contractor_certification_number TEXT,
    bidder_declaration_number TEXT,
    civil_rights_certification_number TEXT,
    
    county_vendor_number TEXT,
    w9_county_number TEXT,
    insurance_county_number TEXT,
    debarment_certification_number_county TEXT,
    conflict_of_interest_number_county TEXT,
    non_collusion_number_county TEXT,
    technical_proposal_number_county TEXT,
    
    city_vendor_number TEXT,
    w9_city_number TEXT,
    insurance_city_number TEXT,
    city_business_license_number TEXT,
    non_collusion_number_city TEXT,
    subcontractor_count_city TEXT,
    eeo_certification_number_city TEXT,
    addenda_count_city TEXT,
    pricing_sheet_number_city TEXT,
    
    legal_business_name_value TEXT,
    duns_uei_value TEXT,
    naics_codes_value TEXT,
    sam_gov_number TEXT,
    bonding_capacity_value TEXT,
    project_approach_date TEXT,
    key_personnel_count TEXT,
    pricing_justification_date TEXT,
    
    -- Metadata
    last_updated_by UUID REFERENCES profiles(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique constraint to ensure one checklist per company
CREATE UNIQUE INDEX idx_company_checklist_company_id ON company_checklist(company_id);

-- Create indexes for better query performance
CREATE INDEX idx_company_checklist_state_requirements ON company_checklist(
    business_license_state,
    secretary_of_state_registration_state,
    federal_ein_state,
    cal_eprocure_registration,
    payee_data_record_std_204,
    darfur_contracting_act_certification_std_843,
    contractor_certification_clauses_ccc_04,
    bidder_declaration_form_gspd_05_105,
    civil_rights_compliance_certification
);

CREATE INDEX idx_company_checklist_county_requirements ON company_checklist(
    business_license_county,
    secretary_of_state_registration_county,
    federal_ein_county,
    county_vendor_registration,
    w9_county_payee_form,
    insurance_certificates_naming_county,
    debarment_suspension_certification_county,
    conflict_of_interest_statement_county,
    non_collusion_declaration_county,
    technical_proposal_pricing_sheet_county
);

CREATE INDEX idx_company_checklist_city_requirements ON company_checklist(
    business_license_city,
    secretary_of_state_registration_city,
    federal_ein_city,
    city_vendor_registration,
    w9_form_city,
    insurance_certificates_naming_city,
    city_business_license,
    non_collusion_affidavit_city,
    subcontractor_list_construction_city,
    eeo_certification_city,
    signed_addenda_acknowledgments_city,
    pricing_sheet_cost_proposal_city
);

CREATE INDEX idx_company_checklist_universal_requirements ON company_checklist(
    legal_business_name_dba,
    duns_uei_number,
    naics_unspsc_codes,
    sam_gov_registration,
    bonding_capacity_construction,
    project_approach_technical_proposal,
    key_personnel_availability,
    pricing_justification_cost_breakdown
);

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_company_checklist_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_company_checklist_updated_at
    BEFORE UPDATE ON company_checklist
    FOR EACH ROW
    EXECUTE FUNCTION update_company_checklist_updated_at();

-- Enable Row Level Security
ALTER TABLE company_checklist ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their company's checklist" ON company_checklist
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Company owners and admins can update their company's checklist" ON company_checklist
    FOR UPDATE USING (
        company_id IN (
            SELECT company_id FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('company_owner', 'admin')
        )
    );

CREATE POLICY "Company owners and admins can insert checklist for their company" ON company_checklist
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT company_id FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('company_owner', 'admin')
        )
    );
