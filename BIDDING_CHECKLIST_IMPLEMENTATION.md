# Bidding Checklist Implementation

## Overview

This document describes the comprehensive bidding checklist system implemented for the GovContractAI platform. The system provides a structured way for companies to track their compliance requirements for government contracting across different jurisdictions.

## Features

### ✅ Core Functionality

- **40 Comprehensive Checklist Items** - Covering State, County, City, and Universal requirements
- **Progress Tracking** - Real-time completion percentage and category breakdown
- **Auto-Save** - Changes are automatically saved to Supabase
- **Jurisdiction Grouping** - Items organized by State, County, City, and All jurisdictions
- **Visual Feedback** - Progress bars, completion indicators, and status badges
- **Permission Control** - Only company owners and admins can modify checklist

### ✅ Database Schema

- **company_checklist table** - Stores all 40 boolean fields plus metadata
- **Row Level Security (RLS)** - Ensures data privacy and access control
- **Indexes** - Optimized queries for performance
- **Triggers** - Automatic timestamp updates
- **Foreign Key Relationships** - Links to companies table

### ✅ UI Components

- **BiddingChecklist Component** - Main checklist interface
- **Progress Visualization** - Overall and category-specific progress
- **Checkbox Interface** - Interactive checklist items with descriptions
- **Alert System** - Incomplete profile warnings and recommendations
- **Responsive Design** - Works on desktop and mobile devices

## Database Structure

### Table: `company_checklist`

```sql
CREATE TABLE company_checklist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

    -- State/County/City Requirements (30 fields)
    business_license_state BOOLEAN DEFAULT FALSE,
    business_license_county BOOLEAN DEFAULT FALSE,
    business_license_city BOOLEAN DEFAULT FALSE,
    -- ... (27 more similar fields)

    -- State-specific requirements (6 fields)
    cal_eprocure_registration BOOLEAN DEFAULT FALSE,
    payee_data_record_std_204 BOOLEAN DEFAULT FALSE,
    -- ... (4 more state-specific fields)

    -- County-specific requirements (7 fields)
    county_vendor_registration BOOLEAN DEFAULT FALSE,
    w9_county_payee_form BOOLEAN DEFAULT FALSE,
    -- ... (5 more county-specific fields)

    -- City-specific requirements (9 fields)
    city_vendor_registration BOOLEAN DEFAULT FALSE,
    w9_form_city BOOLEAN DEFAULT FALSE,
    -- ... (7 more city-specific fields)

    -- Universal requirements (8 fields)
    legal_business_name_dba BOOLEAN DEFAULT FALSE,
    duns_uei_number BOOLEAN DEFAULT FALSE,
    -- ... (6 more universal fields)

    -- Metadata
    last_updated_by UUID REFERENCES profiles(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Key Features:

- **40 Boolean Fields** - One for each checklist item
- **Unique Constraint** - One checklist per company
- **Indexes** - Optimized for category-based queries
- **RLS Policies** - Secure access control
- **Triggers** - Automatic timestamp management

## Checklist Items

### State Requirements (16 items)

1. Business License
2. Secretary of State Registration
3. Federal EIN (Tax ID)
4. CA Seller's Permit (if applicable)
5. Insurance Certificates
6. Financial Statements (2–3 years)
7. References / Past Performance
8. Capability Statement
9. Resumes of Key Staff
10. Certifications (SB, DVBE, DBE, etc.)
11. Cal eProcure Registration
12. Payee Data Record (STD 204)
13. Darfur Contracting Act Certification (STD 843)
14. Contractor Certification Clauses (CCC-04)
15. Bidder Declaration Form (GSPD-05-105)
16. Civil Rights Compliance Certification

### County Requirements (16 items)

1. Business License
2. Secretary of State Registration
3. Federal EIN (Tax ID)
4. CA Seller's Permit (if applicable)
5. Insurance Certificates
6. Financial Statements (2–3 years)
7. References / Past Performance
8. Capability Statement
9. Resumes of Key Staff
10. Certifications (SB, DVBE, DBE, etc.)
11. County Vendor Registration
12. W-9 or County Payee Form
13. Insurance Certificates (naming county)
14. Debarment / Suspension Certification
15. Conflict of Interest Statement
16. Non-Collusion Declaration
17. Technical Proposal / Pricing Sheet

### City Requirements (18 items)

1. Business License
2. Secretary of State Registration
3. Federal EIN (Tax ID)
4. CA Seller's Permit (if applicable)
5. Insurance Certificates
6. Financial Statements (2–3 years)
7. References / Past Performance
8. Capability Statement
9. Resumes of Key Staff
10. Certifications (SB, DVBE, DBE, etc.)
11. City Vendor Registration
12. W-9 Form
13. Insurance Certificates (naming city)
14. City Business License
15. Non-Collusion Affidavit
16. Subcontractor List (if construction)
17. EEO Certification
18. Signed Addenda Acknowledgments
19. Pricing Sheet / Cost Proposal

### Universal Requirements (8 items)

1. Legal Business Name + DBA(s)
2. DUNS / UEI Number
3. NAICS / UNSPSC Codes
4. SAM.gov Registration
5. Bonding Capacity (if construction)
6. Project Approach / Technical Proposal
7. Key Personnel Availability
8. Pricing Justification / Cost Breakdown

## API Endpoints

### GET `/api/company/checklist`

Retrieves the checklist for the current user's company.

**Response:**

```json
{
  "id": "uuid",
  "company_id": "uuid",
  "business_license_state": true,
  "federal_ein_state": false,
  // ... all 40 boolean fields
  "last_updated_by": "uuid",
  "notes": "string",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

### PUT `/api/company/checklist`

Updates a single checklist item.

**Request Body:**

```json
{
  "field": "business_license_state",
  "value": true
}
```

### PATCH `/api/company/checklist`

Updates multiple checklist items at once.

**Request Body:**

```json
{
  "updates": {
    "business_license_state": true,
    "federal_ein_state": true,
    "insurance_certificates_state": false
  },
  "notes": "Updated based on new requirements"
}
```

## Component Usage

### Basic Implementation

```tsx
import BiddingChecklist from "@/components/company/BiddingChecklist";

function CompanySettingsPage() {
  return (
    <BiddingChecklist
      companyId={company.id}
      canManage={user.role === "company_owner" || user.role === "admin"}
    />
  );
}
```

### Integration with Company Settings

The checklist is integrated into the Company Settings page as a new tab:

```tsx
<Tabs defaultValue="overview" className="space-y-6">
  <TabsList>
    <TabsTrigger value="overview">Company Settings</TabsTrigger>
    <TabsTrigger value="checklist">Bidding Checklist</TabsTrigger>
    <TabsTrigger value="certifications">Certifications</TabsTrigger>
    <TabsTrigger value="subscription">Subscription</TabsTrigger>
  </TabsList>

  <TabsContent value="checklist">
    <BiddingChecklist companyId={company.id} canManage={canManage} />
  </TabsContent>
</Tabs>
```

## Validation and Recommendations

### Validation Functions

```typescript
import {
  validateChecklistForJurisdiction,
  validateChecklistForApplication,
} from "@/lib/checklist-validation";

// Check completion for a specific jurisdiction
const stateValidation = validateChecklistForJurisdiction(checklist, "State");

// Check completion for multiple jurisdictions
const applicationValidation = validateChecklistForApplication(checklist, [
  "State",
  "County",
]);
```

### Validation Results

```typescript
interface ChecklistValidationResult {
  isComplete: boolean;
  missingItems: string[];
  recommendations: string[];
  completionPercentage: number;
  canApply: boolean;
}
```

## Setup Instructions

### 1. Run Database Migration

```bash
node scripts/run-checklist-migration.js
```

### 2. Test the System

```bash
node test-checklist-system.js
```

### 3. Verify Integration

- Navigate to Company Settings page
- Click on "Bidding Checklist" tab
- Verify all 40 items are displayed
- Test checkbox functionality
- Verify auto-save works

## Security Features

### Row Level Security (RLS)

- Users can only view their own company's checklist
- Only company owners and admins can modify checklist
- Automatic user tracking for audit trail

### API Security

- Authentication required for all endpoints
- Role-based access control
- Input validation and sanitization

## Performance Optimizations

### Database Indexes

- Category-based indexes for fast filtering
- Company ID index for quick lookups
- Boolean field indexes for completion queries

### Frontend Optimizations

- Lazy loading of checklist data
- Debounced auto-save to reduce API calls
- Optimistic UI updates for better UX

## Future Enhancements

### Planned Features

- **Bulk Operations** - Select multiple items to mark as complete
- **Export Functionality** - Generate PDF reports of checklist status
- **Integration with Applications** - Auto-fill application forms
- **Reminder System** - Email notifications for incomplete items
- **Template System** - Pre-configured checklists for different industries
- **Analytics Dashboard** - Track completion trends and insights

### Integration Points

- **Opportunity Applications** - Validate checklist before allowing applications
- **AI Recommendations** - Suggest next steps based on completion status
- **Compliance Monitoring** - Track changes and maintain audit trail
- **Third-party Integrations** - Connect with government systems for verification

## Troubleshooting

### Common Issues

1. **Checklist not loading**

   - Verify RLS policies are configured correctly
   - Check user has proper role permissions
   - Ensure company_id exists in profiles table

2. **Auto-save not working**

   - Check network connectivity
   - Verify API endpoint is accessible
   - Review browser console for errors

3. **Progress calculation errors**
   - Verify all 40 boolean fields exist in database
   - Check checklist data structure matches expected format
   - Ensure category assignments are correct

### Debug Commands

```bash
# Check database table structure
node -e "const { createClient } = require('@supabase/supabase-js'); const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY); supabase.from('information_schema.columns').select('*').eq('table_name', 'company_checklist').then(console.log)"

# Test checklist creation
node test-checklist-system.js

# Verify RLS policies
node -e "const { createClient } = require('@supabase/supabase-js'); const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY); supabase.from('information_schema.policies').select('*').eq('table_name', 'company_checklist').then(console.log)"
```

## Support

For questions or issues with the bidding checklist system:

1. Check the troubleshooting section above
2. Review the test logs for specific error messages
3. Verify database migration completed successfully
4. Test with a fresh company profile to isolate issues

The system is designed to be robust and user-friendly, with comprehensive error handling and validation throughout.
