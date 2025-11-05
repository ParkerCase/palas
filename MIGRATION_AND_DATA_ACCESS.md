# Running the Migration in Supabase SQL Editor

## ✅ Yes, you can run it directly!

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the entire contents of `supabase/migrations/20241201000005_opportunity_discovery_workflow.sql`
4. Click **Run**

The migration uses `IF NOT EXISTS` checks, so it's safe to run multiple times - it will only add columns that don't already exist.

---

# Company Profile Data Access

## ✅ Full Company Profile Now Available

I've updated `/admin/build-contracts` to fetch and display **ALL** company profile data when you view accepted opportunities. Here's what you'll see:

### 📋 Company Information Displayed:

1. **Basic Company Info**

   - Company name
   - Industry
   - Business type (Small Business, WOSB, etc.)
   - Company size

2. **Contact & Location**

   - Website
   - Headquarters address (city, state)
   - Annual revenue

3. **Government IDs** (Critical for contract building!)

   - DUNS Number
   - CAGE Code
   - Tax ID (EIN)

4. **Business Classifications**

   - NAICS Codes (all of them)
   - Certifications (8(a), WOSB, HUBZone, etc.)
   - Capabilities

5. **Primary Contact**
   - Name
   - Email
   - Phone
   - Title/Position

### 🎯 Where This Data Comes From:

The data is pulled from:

- `companies` table - All company profile fields
- `profiles` table - User contact information

All this data is automatically fetched when you view accepted opportunities on `/admin/build-contracts`.

---

## 📊 What You'll See on Build Contracts Page:

Each accepted opportunity card now shows:

```
┌─────────────────────────────────────────────────┐
│ Opportunity Title                                │
│ Agency: [Agency Name]                            │
│ Company: [Company Name]                          │
│ Contact: [User Name] - [Email]                  │
│                                                  │
│ [Opportunity Description]                        │
│                                                  │
│ ─────────────────────────────────────────────── │
│ Company Profile Data (For Contract Building)    │
│                                                  │
│ Industry: [Industry]                            │
│ Business Type: [Type]                            │
│ Company Size: [Size]                             │
│ Website: [URL]                                   │
│ Location: [City, State]                          │
│                                                  │
│ Government IDs:                                  │
│ • DUNS: [Number]                                │
│ • CAGE: [Code]                                  │
│ • Tax ID: [ID]                                  │
│                                                  │
│ NAICS Codes: [236220, 237310, ...]              │
│ Certifications: [8(a), WOSB, ...]              │
│ Capabilities: [Capability 1, Capability 2, ...] │
│                                                  │
│ Primary Contact:                                │
│ • Email: [email]                                │
│ • Phone: [phone]                                │
│ • Title: [title]                                │
│                                                  │
│ [Build Contract] [View Application] [Source]     │
└─────────────────────────────────────────────────┘
```

---

## ✅ Data Access Confirmed

All company profile data fields are now:

- ✅ Fetched from the database
- ✅ Displayed on the build-contracts page
- ✅ Available for you to use when building contracts
- ✅ Includes all necessary government IDs (DUNS, CAGE, Tax ID)
- ✅ Includes certifications and capabilities needed for proposals

You'll have everything you need to build and submit contracts on behalf of companies!
