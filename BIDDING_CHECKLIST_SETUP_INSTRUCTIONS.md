# Bidding Checklist Setup Instructions

## Overview

The comprehensive bidding checklist system has been implemented with all 40 required items organized by jurisdiction (State, County, City, All). This document provides instructions for setting up the database table and testing the system.

## What's Been Implemented

### ✅ Frontend Components

- **BiddingChecklist Component** (`components/company/BiddingChecklist.tsx`)
- **TypeScript Types** (`types/checklist.ts`)
- **Checklist Data Configuration** (`lib/checklist-data.ts`)
- **Validation Functions** (`lib/checklist-validation.ts`)
- **API Routes** (`app/api/company/checklist/route.ts`)
- **Integration with Company Settings** (Updated `app/(dashboard)/company/page.tsx`)

### ✅ Database Schema

- **Migration File** (`supabase/migrations/20241201000002_create_company_checklist.sql`)
- **40 Boolean Fields** for all checklist items
- **Row Level Security (RLS)** policies
- **Indexes** for performance optimization
- **Triggers** for automatic timestamp updates

### ✅ Features Implemented

- **Progress Tracking** - Real-time completion percentage
- **Auto-Save** - Changes saved automatically to Supabase
- **Jurisdiction Grouping** - State, County, City, All categories
- **Visual Feedback** - Progress bars and completion indicators
- **Permission Control** - Only company owners/admins can modify
- **Validation System** - Check completion for applications

## Manual Database Setup

Since the automated migration scripts require special database functions, you'll need to manually create the table in Supabase:

### Step 1: Access Supabase SQL Editor

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Create a new query

### Step 2: Execute the Migration SQL

Copy and paste the entire contents of `supabase/migrations/20241201000002_create_company_checklist.sql` into the SQL Editor and execute it.

This will create:

- `company_checklist` table with 40 boolean fields
- Unique constraint on company_id
- Indexes for performance
- RLS policies for security
- Triggers for timestamp management

### Step 3: Verify Table Creation

Run this query to verify the table was created:

```sql
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'company_checklist'
ORDER BY ordinal_position;
```

You should see 47 columns total (including metadata fields).

## Testing the System

### Step 1: Test Database Connection

```bash
node test-checklist-creation.js
```

### Step 2: Test Full System

```bash
node test-checklist-system.js
```

### Step 3: Test Frontend Integration

1. Start the development server: `npm run dev`
2. Navigate to Company Settings page
3. Click on "Bidding Checklist" tab
4. Verify all 40 items are displayed
5. Test checkbox functionality
6. Verify auto-save works

## Checklist Items Summary

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

### PUT `/api/company/checklist`

Updates a single checklist item.

### PATCH `/api/company/checklist`

Updates multiple checklist items at once.

## Integration Points

### Company Settings Page

The checklist is integrated as a new tab in the Company Settings page:

- Tab: "Bidding Checklist"
- Component: `BiddingChecklist`
- Props: `companyId`, `canManage`

### Validation System

The checklist can be used to validate application readiness:

```typescript
import { validateChecklistForJurisdiction } from "@/lib/checklist-validation";

const validation = validateChecklistForJurisdiction(checklist, "State");
if (validation.canApply) {
  // Allow application
}
```

## Troubleshooting

### Common Issues

1. **Table doesn't exist**

   - Run the SQL migration manually in Supabase
   - Verify all 40 boolean fields are created

2. **RLS policies not working**

   - Check that policies are created correctly
   - Verify user has proper role permissions

3. **Auto-save not working**
   - Check network connectivity
   - Verify API endpoint is accessible
   - Review browser console for errors

### Debug Commands

```bash
# Test database connection
node test-checklist-creation.js

# Test full system
node test-checklist-system.js

# Check environment variables
node -e "console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET')"
```

## Next Steps

Once the database table is created:

1. **Test the system** using the provided test scripts
2. **Verify frontend integration** by navigating to Company Settings
3. **Test auto-save functionality** by toggling checkboxes
4. **Verify progress tracking** shows correct percentages
5. **Test permission controls** with different user roles

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Verify the database table was created correctly
3. Test with a fresh company profile
4. Review the implementation documentation in `BIDDING_CHECKLIST_IMPLEMENTATION.md`

The system is designed to be robust and user-friendly, with comprehensive error handling and validation throughout.
