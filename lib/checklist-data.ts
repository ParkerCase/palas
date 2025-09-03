import { ChecklistItem, ChecklistCategory } from '@/types/checklist'

export const CHECKLIST_ITEMS: ChecklistItem[] = [
  // State Requirements
  {
    id: 'business_license_state',
    label: 'Business License',
    category: 'State',
    description: 'State business license registration',
    field: 'business_license_state',
    inputType: 'boolean'
  },
  {
    id: 'business_license_number_state',
    label: 'Business License Number',
    category: 'State',
    description: 'Enter your state business license number',
    field: 'business_license_number_state',
    inputType: 'text',
    placeholder: 'e.g., BL-123456789',
    required: false
  },
  {
    id: 'secretary_of_state_registration_state',
    label: 'Secretary of State Registration',
    category: 'State',
    description: 'State business registration with Secretary of State',
    field: 'secretary_of_state_registration_state',
    inputType: 'boolean'
  },
  {
    id: 'secretary_of_state_number_state',
    label: 'Secretary of State Number',
    category: 'State',
    description: 'Enter your Secretary of State registration number',
    field: 'secretary_of_state_number_state',
    inputType: 'text',
    placeholder: 'e.g., 123456789',
    required: false
  },
  {
    id: 'federal_ein_state',
    label: 'Federal EIN (Tax ID)',
    category: 'State',
    description: 'Federal Employer Identification Number',
    field: 'federal_ein_state',
    inputType: 'boolean'
  },
  {
    id: 'federal_ein_value_state',
    label: 'Federal EIN Number',
    category: 'State',
    description: 'Enter your Federal EIN (Tax ID) number',
    field: 'federal_ein_value_state',
    inputType: 'text',
    placeholder: 'e.g., 12-3456789',
    required: false
  },
  {
    id: 'ca_sellers_permit_state',
    label: 'CA Seller\'s Permit (if applicable)',
    category: 'State',
    description: 'California Seller\'s Permit for sales tax collection',
    field: 'ca_sellers_permit_state',
    inputType: 'boolean'
  },
  {
    id: 'insurance_certificates_state',
    label: 'Insurance Certificates',
    category: 'State',
    description: 'General liability and other required insurance certificates',
    field: 'insurance_certificates_state',
    inputType: 'boolean'
  },
  {
    id: 'financial_statements_state',
    label: 'Financial Statements (2–3 years)',
    category: 'State',
    description: 'Audited financial statements for the past 2-3 years',
    field: 'financial_statements_state',
    inputType: 'boolean'
  },
  {
    id: 'references_past_performance_state',
    label: 'References / Past Performance',
    category: 'State',
    description: 'Client references and past performance documentation',
    field: 'references_past_performance_state',
    inputType: 'boolean'
  },
  {
    id: 'capability_statement_state',
    label: 'Capability Statement',
    category: 'State',
    description: 'Company capability statement and qualifications',
    field: 'capability_statement_state',
    inputType: 'boolean'
  },
  {
    id: 'resumes_key_staff_state',
    label: 'Resumes of Key Staff',
    category: 'State',
    description: 'Resumes and qualifications of key personnel',
    field: 'resumes_key_staff_state',
    inputType: 'boolean'
  },
  {
    id: 'certifications_sb_dvbe_dbe_state',
    label: 'Certifications (SB, DVBE, DBE, etc.)',
    category: 'State',
    description: 'Small Business, Disabled Veteran, Disadvantaged Business certifications',
    field: 'certifications_sb_dvbe_dbe_state',
    inputType: 'boolean'
  },
  {
    id: 'certification_numbers_state',
    label: 'Certification Numbers',
    category: 'State',
    description: 'Enter your certification numbers (SB, DVBE, DBE, etc.)',
    field: 'certification_numbers_state',
    inputType: 'text',
    placeholder: 'e.g., SB-123456, DVBE-789012',
    required: false
  },
  {
    id: 'cal_eprocure_registration',
    label: 'Cal eProcure Registration',
    category: 'State',
    description: 'California eProcure system registration',
    field: 'cal_eprocure_registration',
    inputType: 'boolean'
  },
  {
    id: 'cal_eprocure_number',
    label: 'Cal eProcure Number',
    category: 'State',
    description: 'Enter your Cal eProcure registration number',
    field: 'cal_eprocure_number',
    inputType: 'text',
    placeholder: 'e.g., EP-123456789',
    required: false
  },
  {
    id: 'payee_data_record_std_204',
    label: 'Payee Data Record (STD 204)',
    category: 'State',
    description: 'California Payee Data Record form',
    field: 'payee_data_record_std_204',
    inputType: 'boolean'
  },
  {
    id: 'darfur_contracting_act_certification_std_843',
    label: 'Darfur Contracting Act Certification (STD 843)',
    category: 'State',
    description: 'Certification regarding Sudan and Darfur contracting',
    field: 'darfur_contracting_act_certification_std_843',
    inputType: 'boolean'
  },
  {
    id: 'contractor_certification_clauses_ccc_04',
    label: 'Contractor Certification Clauses (CCC-04 or latest)',
    category: 'State',
    description: 'Contractor certification clauses compliance',
    field: 'contractor_certification_clauses_ccc_04',
    inputType: 'boolean'
  },
  {
    id: 'bidder_declaration_form_gspd_05_105',
    label: 'Bidder Declaration Form (GSPD-05-105)',
    category: 'State',
    description: 'General Services bidder declaration form',
    field: 'bidder_declaration_form_gspd_05_105',
    inputType: 'boolean'
  },
  {
    id: 'civil_rights_compliance_certification',
    label: 'Civil Rights Compliance Certification',
    category: 'State',
    description: 'Civil rights compliance certification',
    field: 'civil_rights_compliance_certification',
    inputType: 'boolean'
  },

  // County Requirements
  {
    id: 'business_license_county',
    label: 'Business License',
    category: 'County',
    description: 'County business license registration',
    field: 'business_license_county',
    inputType: 'boolean'
  },
  {
    id: 'secretary_of_state_registration_county',
    label: 'Secretary of State Registration',
    category: 'County',
    description: 'County business registration',
    field: 'secretary_of_state_registration_county',
    inputType: 'boolean'
  },
  {
    id: 'federal_ein_county',
    label: 'Federal EIN (Tax ID)',
    category: 'County',
    description: 'Federal Employer Identification Number',
    field: 'federal_ein_county',
    inputType: 'boolean'
  },
  {
    id: 'ca_sellers_permit_county',
    label: 'CA Seller\'s Permit (if applicable)',
    category: 'County',
    description: 'California Seller\'s Permit for sales tax collection',
    field: 'ca_sellers_permit_county',
    inputType: 'boolean'
  },
  {
    id: 'insurance_certificates_county',
    label: 'Insurance Certificates',
    category: 'County',
    description: 'General liability and other required insurance certificates',
    field: 'insurance_certificates_county',
    inputType: 'boolean'
  },
  {
    id: 'financial_statements_county',
    label: 'Financial Statements (2–3 years)',
    category: 'County',
    description: 'Audited financial statements for the past 2-3 years',
    field: 'financial_statements_county',
    inputType: 'boolean'
  },
  {
    id: 'references_past_performance_county',
    label: 'References / Past Performance',
    category: 'County',
    description: 'Client references and past performance documentation',
    field: 'references_past_performance_county',
    inputType: 'boolean'
  },
  {
    id: 'capability_statement_county',
    label: 'Capability Statement',
    category: 'County',
    description: 'Company capability statement and qualifications',
    field: 'capability_statement_county',
    inputType: 'boolean'
  },
  {
    id: 'resumes_key_staff_county',
    label: 'Resumes of Key Staff',
    category: 'County',
    description: 'Resumes and qualifications of key personnel',
    field: 'resumes_key_staff_county',
    inputType: 'boolean'
  },
  {
    id: 'certifications_sb_dvbe_dbe_county',
    label: 'Certifications (SB, DVBE, DBE, etc.)',
    category: 'County',
    description: 'Small Business, Disabled Veteran, Disadvantaged Business certifications',
    field: 'certifications_sb_dvbe_dbe_county',
    inputType: 'boolean'
  },
  {
    id: 'county_vendor_registration',
    label: 'County Vendor Registration',
    category: 'County',
    description: 'County vendor registration system enrollment',
    field: 'county_vendor_registration',
    inputType: 'boolean'
  },
  {
    id: 'w9_county_payee_form',
    label: 'W-9 or County Payee Form',
    category: 'County',
    description: 'W-9 form or county-specific payee information form',
    field: 'w9_county_payee_form',
    inputType: 'boolean'
  },
  {
    id: 'insurance_certificates_naming_county',
    label: 'Insurance Certificates (naming county)',
    category: 'County',
    description: 'Insurance certificates with county as additional insured',
    field: 'insurance_certificates_naming_county',
    inputType: 'boolean'
  },
  {
    id: 'debarment_suspension_certification_county',
    label: 'Debarment / Suspension Certification',
    category: 'County',
    description: 'Certification of no debarment or suspension',
    field: 'debarment_suspension_certification_county',
    inputType: 'boolean'
  },
  {
    id: 'conflict_of_interest_statement_county',
    label: 'Conflict of Interest Statement',
    category: 'County',
    description: 'Conflict of interest disclosure statement',
    field: 'conflict_of_interest_statement_county',
    inputType: 'boolean'
  },
  {
    id: 'non_collusion_declaration_county',
    label: 'Non-Collusion Declaration',
    category: 'County',
    description: 'Declaration of no collusion in bidding',
    field: 'non_collusion_declaration_county',
    inputType: 'boolean'
  },
  {
    id: 'technical_proposal_pricing_sheet_county',
    label: 'Technical Proposal / Pricing Sheet',
    category: 'County',
    description: 'Technical proposal and pricing documentation',
    field: 'technical_proposal_pricing_sheet_county',
    inputType: 'boolean'
  },

  // City Requirements
  {
    id: 'business_license_city',
    label: 'Business License',
    category: 'City',
    description: 'City business license registration',
    field: 'business_license_city',
    inputType: 'boolean'
  },
  {
    id: 'secretary_of_state_registration_city',
    label: 'Secretary of State Registration',
    category: 'City',
    description: 'City business registration',
    field: 'secretary_of_state_registration_city',
    inputType: 'boolean'
  },
  {
    id: 'federal_ein_city',
    label: 'Federal EIN (Tax ID)',
    category: 'City',
    description: 'Federal Employer Identification Number',
    field: 'federal_ein_city',
    inputType: 'boolean'
  },
  {
    id: 'ca_sellers_permit_city',
    label: 'CA Seller\'s Permit (if applicable)',
    category: 'City',
    description: 'California Seller\'s Permit for sales tax collection',
    field: 'ca_sellers_permit_city',
    inputType: 'boolean'
  },
  {
    id: 'insurance_certificates_city',
    label: 'Insurance Certificates',
    category: 'City',
    description: 'General liability and other required insurance certificates',
    field: 'insurance_certificates_city',
    inputType: 'boolean'
  },
  {
    id: 'financial_statements_city',
    label: 'Financial Statements (2–3 years)',
    category: 'City',
    description: 'Audited financial statements for the past 2-3 years',
    field: 'financial_statements_city',
    inputType: 'boolean'
  },
  {
    id: 'references_past_performance_city',
    label: 'References / Past Performance',
    category: 'City',
    description: 'Client references and past performance documentation',
    field: 'references_past_performance_city',
    inputType: 'boolean'
  },
  {
    id: 'capability_statement_city',
    label: 'Capability Statement',
    category: 'City',
    description: 'Company capability statement and qualifications',
    field: 'capability_statement_city',
    inputType: 'boolean'
  },
  {
    id: 'resumes_key_staff_city',
    label: 'Resumes of Key Staff',
    category: 'City',
    description: 'Resumes and qualifications of key personnel',
    field: 'resumes_key_staff_city',
    inputType: 'boolean'
  },
  {
    id: 'certifications_sb_dvbe_dbe_city',
    label: 'Certifications (SB, DVBE, DBE, etc.)',
    category: 'City',
    description: 'Small Business, Disabled Veteran, Disadvantaged Business certifications',
    field: 'certifications_sb_dvbe_dbe_city',
    inputType: 'boolean'
  },
  {
    id: 'city_vendor_registration',
    label: 'City Vendor Registration',
    category: 'City',
    description: 'City vendor registration system enrollment',
    field: 'city_vendor_registration',
    inputType: 'boolean'
  },
  {
    id: 'w9_form_city',
    label: 'W-9 Form',
    category: 'City',
    description: 'W-9 form for tax identification',
    field: 'w9_form_city',
    inputType: 'boolean'
  },
  {
    id: 'insurance_certificates_naming_city',
    label: 'Insurance Certificates (naming city)',
    category: 'City',
    description: 'Insurance certificates with city as additional insured',
    field: 'insurance_certificates_naming_city',
    inputType: 'boolean'
  },
  {
    id: 'city_business_license',
    label: 'City Business License',
    category: 'City',
    description: 'City-specific business license',
    field: 'city_business_license',
    inputType: 'boolean'
  },
  {
    id: 'non_collusion_affidavit_city',
    label: 'Non-Collusion Affidavit',
    category: 'City',
    description: 'Non-collusion affidavit for city contracts',
    field: 'non_collusion_affidavit_city',
    inputType: 'boolean'
  },
  {
    id: 'subcontractor_list_construction_city',
    label: 'Subcontractor List (if construction)',
    category: 'City',
    description: 'List of subcontractors for construction projects',
    field: 'subcontractor_list_construction_city',
    inputType: 'boolean'
  },
  {
    id: 'eeo_certification_city',
    label: 'EEO Certification',
    category: 'City',
    description: 'Equal Employment Opportunity certification',
    field: 'eeo_certification_city',
    inputType: 'boolean'
  },
  {
    id: 'signed_addenda_acknowledgments_city',
    label: 'Signed Addenda Acknowledgments',
    category: 'City',
    description: 'Signed acknowledgments of all addenda',
    field: 'signed_addenda_acknowledgments_city',
    inputType: 'boolean'
  },
  {
    id: 'pricing_sheet_cost_proposal_city',
    label: 'Pricing Sheet / Cost Proposal',
    category: 'City',
    description: 'Detailed pricing sheet and cost proposal',
    field: 'pricing_sheet_cost_proposal_city',
    inputType: 'boolean'
  },

  // Universal Requirements (All jurisdictions)
  {
    id: 'legal_business_name_dba',
    label: 'Legal Business Name + DBA(s)',
    category: 'All',
    description: 'Legal business name and any doing business as names',
    field: 'legal_business_name_dba',
    inputType: 'boolean'
  },
  {
    id: 'legal_business_name_value',
    label: 'Legal Business Name',
    category: 'All',
    description: 'Enter your legal business name and any DBA names',
    field: 'legal_business_name_value',
    inputType: 'text',
    placeholder: 'e.g., ABC Corporation dba ABC Services',
    required: false
  },
  {
    id: 'duns_uei_number',
    label: 'DUNS / UEI Number',
    category: 'All',
    description: 'DUNS number or Unique Entity Identifier (if federal funds)',
    field: 'duns_uei_number',
    inputType: 'boolean'
  },
  {
    id: 'duns_uei_value',
    label: 'DUNS / UEI Number Value',
    category: 'All',
    description: 'Enter your DUNS or UEI number',
    field: 'duns_uei_value',
    inputType: 'text',
    placeholder: 'e.g., 123456789',
    required: false
  },
  {
    id: 'naics_unspsc_codes',
    label: 'NAICS / UNSPSC Codes',
    category: 'All',
    description: 'North American Industry Classification System and UNSPSC codes',
    field: 'naics_unspsc_codes',
    inputType: 'boolean'
  },
  {
    id: 'sam_gov_registration',
    label: 'SAM.gov Registration',
    category: 'All',
    description: 'System for Award Management registration (if federal funds)',
    field: 'sam_gov_registration',
    inputType: 'boolean'
  },
  {
    id: 'bonding_capacity_construction',
    label: 'Bonding Capacity (if construction)',
    category: 'All',
    description: 'Surety bonding capacity for construction projects',
    field: 'bonding_capacity_construction',
    inputType: 'boolean'
  },
  {
    id: 'project_approach_technical_proposal',
    label: 'Project Approach / Technical Proposal',
    category: 'All',
    description: 'Project approach methodology and technical proposal',
    field: 'project_approach_technical_proposal',
    inputType: 'boolean'
  },
  {
    id: 'key_personnel_availability',
    label: 'Key Personnel Availability',
    category: 'All',
    description: 'Availability and commitment of key personnel',
    field: 'key_personnel_availability',
    inputType: 'boolean'
  },
  {
    id: 'pricing_justification_cost_breakdown',
    label: 'Pricing Justification / Cost Breakdown',
    category: 'All',
    description: 'Detailed pricing justification and cost breakdown',
    field: 'pricing_justification_cost_breakdown',
    inputType: 'boolean'
  }
]

export const CHECKLIST_CATEGORIES: ChecklistCategory[] = [
  {
    name: 'State',
    items: CHECKLIST_ITEMS.filter(item => item.category === 'State'),
    color: 'bg-blue-50 border-blue-200 text-blue-800'
  },
  {
    name: 'County',
    items: CHECKLIST_ITEMS.filter(item => item.category === 'County'),
    color: 'bg-green-50 border-green-200 text-green-800'
  },
  {
    name: 'City',
    items: CHECKLIST_ITEMS.filter(item => item.category === 'City'),
    color: 'bg-purple-50 border-purple-200 text-purple-800'
  },
  {
    name: 'All',
    items: CHECKLIST_ITEMS.filter(item => item.category === 'All'),
    color: 'bg-orange-50 border-orange-200 text-orange-800'
  }
]

export function getChecklistProgress(checklist: any): {
  total: number
  completed: number
  percentage: number
  byCategory: { [key: string]: number }
} {
  const byCategory: { [key: string]: number } = {}
  let completed = 0
  const total = CHECKLIST_ITEMS.length

  CHECKLIST_CATEGORIES.forEach(category => {
    const categoryItems = category.items
    const categoryCompleted = categoryItems.filter(item => {
      if (item.inputType === 'boolean') {
        return checklist[item.field] === true
      } else {
        // For text, date, number inputs, consider completed if there's a value
        return checklist[item.field] && checklist[item.field].toString().trim().length > 0
      }
    }).length
    byCategory[category.name] = categoryCompleted
    completed += categoryCompleted
  })

  return {
    total,
    completed,
    percentage: Math.round((completed / total) * 100),
    byCategory
  }
}
