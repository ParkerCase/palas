export interface CompanyChecklist {
  id: string
  company_id: string
  last_updated_by?: string
  notes?: string
  created_at: string
  updated_at: string
  
  // State/County/City Requirements (Boolean)
  business_license_state: boolean
  business_license_county: boolean
  business_license_city: boolean
  
  secretary_of_state_registration_state: boolean
  secretary_of_state_registration_county: boolean
  secretary_of_state_registration_city: boolean
  
  federal_ein_state: boolean
  federal_ein_county: boolean
  federal_ein_city: boolean
  
  ca_sellers_permit_state: boolean
  ca_sellers_permit_county: boolean
  ca_sellers_permit_city: boolean
  
  insurance_certificates_state: boolean
  insurance_certificates_county: boolean
  insurance_certificates_city: boolean
  
  financial_statements_state: boolean
  financial_statements_county: boolean
  financial_statements_city: boolean
  
  references_past_performance_state: boolean
  references_past_performance_county: boolean
  references_past_performance_city: boolean
  
  capability_statement_state: boolean
  capability_statement_county: boolean
  capability_statement_city: boolean
  
  resumes_key_staff_state: boolean
  resumes_key_staff_county: boolean
  resumes_key_staff_city: boolean
  
  certifications_sb_dvbe_dbe_state: boolean
  certifications_sb_dvbe_dbe_county: boolean
  certifications_sb_dvbe_dbe_city: boolean
  
  // State-specific requirements (Boolean)
  cal_eprocure_registration: boolean
  payee_data_record_std_204: boolean
  darfur_contracting_act_certification_std_843: boolean
  contractor_certification_clauses_ccc_04: boolean
  bidder_declaration_form_gspd_05_105: boolean
  civil_rights_compliance_certification: boolean
  
  // County-specific requirements (Boolean)
  county_vendor_registration: boolean
  w9_county_payee_form: boolean
  insurance_certificates_naming_county: boolean
  debarment_suspension_certification_county: boolean
  conflict_of_interest_statement_county: boolean
  non_collusion_declaration_county: boolean
  technical_proposal_pricing_sheet_county: boolean
  
  // City-specific requirements (Boolean)
  city_vendor_registration: boolean
  w9_form_city: boolean
  insurance_certificates_naming_city: boolean
  city_business_license: boolean
  non_collusion_affidavit_city: boolean
  subcontractor_list_construction_city: boolean
  eeo_certification_city: boolean
  signed_addenda_acknowledgments_city: boolean
  pricing_sheet_cost_proposal_city: boolean
  
  // Universal requirements (Boolean)
  legal_business_name_dba: boolean
  duns_uei_number: boolean
  naics_unspsc_codes: boolean
  sam_gov_registration: boolean
  bonding_capacity_construction: boolean
  project_approach_technical_proposal: boolean
  key_personnel_availability: boolean
  pricing_justification_cost_breakdown: boolean

  // Text Input Fields
  business_license_number_state?: string
  business_license_number_county?: string
  business_license_number_city?: string
  
  secretary_of_state_number_state?: string
  secretary_of_state_number_county?: string
  secretary_of_state_number_city?: string
  
  federal_ein_value_state?: string
  federal_ein_value_county?: string
  federal_ein_value_city?: string
  
  ca_sellers_permit_number_state?: string
  ca_sellers_permit_number_county?: string
  ca_sellers_permit_number_city?: string
  
  insurance_certificate_number_state?: string
  insurance_certificate_number_county?: string
  insurance_certificate_number_city?: string
  
  financial_statements_years_state?: string
  financial_statements_years_county?: string
  financial_statements_years_city?: string
  
  references_count_state?: string
  references_count_county?: string
  references_count_city?: string
  
  capability_statement_date_state?: string
  capability_statement_date_county?: string
  capability_statement_date_city?: string
  
  key_staff_count_state?: string
  key_staff_count_county?: string
  key_staff_count_city?: string
  
  certification_numbers_state?: string
  certification_numbers_county?: string
  certification_numbers_city?: string
  
  cal_eprocure_number?: string
  payee_data_record_number?: string
  darfur_certification_number?: string
  contractor_certification_number?: string
  bidder_declaration_number?: string
  civil_rights_certification_number?: string
  
  county_vendor_number?: string
  w9_county_number?: string
  insurance_county_number?: string
  debarment_certification_number_county?: string
  conflict_of_interest_number_county?: string
  non_collusion_number_county?: string
  technical_proposal_number_county?: string
  
  city_vendor_number?: string
  w9_city_number?: string
  insurance_city_number?: string
  city_business_license_number?: string
  non_collusion_number_city?: string
  subcontractor_count_city?: string
  eeo_certification_number_city?: string
  addenda_count_city?: string
  pricing_sheet_number_city?: string
  
  legal_business_name_value?: string
  duns_uei_value?: string
  naics_codes_value?: string
  sam_gov_number?: string
  bonding_capacity_value?: string
  project_approach_date?: string
  key_personnel_count?: string
  pricing_justification_date?: string
}

export interface ChecklistItem {
  id: string
  label: string
  category: 'State' | 'County' | 'City' | 'All'
  description?: string
  field: keyof Omit<CompanyChecklist, 'id' | 'company_id' | 'last_updated_by' | 'notes' | 'created_at' | 'updated_at'>
  inputType: 'boolean' | 'text' | 'date' | 'number'
  placeholder?: string
  required?: boolean
}

export interface ChecklistCategory {
  name: string
  items: ChecklistItem[]
  color: string
}

export interface ChecklistProgress {
  total: number
  completed: number
  percentage: number
  byCategory: {
    State: number
    County: number
    City: number
    All: number
  }
}
