# Complete Opportunity Discovery Workflow

## 🔄 Full End-to-End Process

```
┌─────────────────────────────────────────────────────────────────┐
│                         COMPANY SIDE                             │
└─────────────────────────────────────────────────────────────────┘

1. Company User visits /dashboard
   └─> Clicks "Get Opportunities" button
       └─> Loading spinner appears...

2. API creates opportunity_request
   └─> Status: "pending"
   └─> Saves company profile data (industry, location, NAICS)

📧 EMAIL #1: ADMIN NOTIFICATION
   ├─> TO: parker@stroomai.com (hardcoded)
   ├─> SUBJECT: "New Opportunity Request from [Company Name]"
   └─> CONTAINS:
       ├─ Company name
       ├─ Industry
       ├─ Location (city + state)
       ├─ NAICS codes
       ├─ Business type
       └─ Link to /admin/opportunity-requests

3. Company sees success toast
   └─> "Request submitted! We'll find opportunities for you within 24 hours."

⏸️  COMPANY WAITS...


┌─────────────────────────────────────────────────────────────────┐
│                         ADMIN SIDE                               │
└─────────────────────────────────────────────────────────────────┘

4. Admin (parker@stroomai.com or veteransccsd@gmail.com)
   └─> Receives email notification
   └─> Clicks link to /admin/opportunity-requests

5. Admin sees request in dashboard
   └─> Status: "pending"
   └─> Company details visible in sidebar

6. Admin clicks "Search Opportunities" button
   └─> System builds dynamic query:
       "government contracts [industry] [city] [state] NAICS [codes]"
   └─> Brave Search API called
   └─> Status updates to: "processing"

7. FILTER & SCORE RESULTS
   ├─> Brave returns ~10 results
   ├─> System filters for:
   │   ├─ .gov domains (priority)
   │   ├─ .mil domains
   │   └─ Contract keywords (RFP, solicitation, bid)
   └─> System scores based on:
       ├─ Government domain (+20 points)
       ├─ Industry match (+15 points)
       ├─ NAICS match (+10 points)
       └─ Search ranking (higher = better)

8. Admin reviews scored results
   └─> Results displayed in interactive panel
   └─> Each shows:
       ├─ Title
       ├─ URL (clickable to verify)
       ├─ Description/snippet
       ├─ Domain (e.g., sam.gov)
       └─ Match score

9. ADMIN APPROVES
   ├─> Clicks checkboxes to select top 3-5 opportunities
   ├─> Reviews selections
   └─> Clicks "Approve & Send (3)" button

10. System processes approval
    ├─> Creates opportunity records in database
    ├─> Links to company via company_id
    ├─> Creates application records with status "recommended"
    └─> Updates request status to: "completed"

📧 EMAIL #2: COMPANY NOTIFICATION
   ├─> TO: Company user email
   ├─> SUBJECT: "🎯 We found 3 perfect opportunities for you!"
   └─> CONTAINS:
       ├─ List of 3 opportunity titles
       ├─ Agency/source for each
       ├─ Link to /my-opportunities
       └─ "View Your Opportunities" CTA button


┌─────────────────────────────────────────────────────────────────┐
│                    COMPANY SIDE (AGAIN)                          │
└─────────────────────────────────────────────────────────────────┘

11. Company user receives email
    └─> "Your opportunities are ready!"

12. User clicks link to /my-opportunities

13. FRONTEND DISPLAY
    ├─> Page shows 3 hand-selected opportunities
    ├─> Each opportunity card shows:
    │   ├─ Title
    │   ├─ Agency/source
    │   ├─ Match score badge (e.g., "85% match")
    │   ├─ Description
    │   ├─ Source URL (link to .gov site)
    │   ├─ Admin notes (if any)
    │   ├─ "Apply Now" button
    │   └─ "View Details" button
    └─> "Hand-Selected by Our Team" badge

14. Company clicks "Apply Now"
    └─> System creates/updates application
    └─> Status changes from "recommended" to "draft"
    └─> User can complete application form
```

---

## 📊 Data Flow Diagram

```
Company Profile              Brave Search API           Admin Panel
     |                              |                        |
     |  1. Submit Request           |                        |
     |----------------------------->|                        |
     |                              |                        |
     |  📧 Email to Admin          |                        |
     |-------------------------------------------------->    |
     |                              |                        |
     |                              |  2. Search Query       |
     |                              |<-----------------------|
     |                              |                        |
     |                              |  3. Return Results     |
     |                              |----------------------->|
     |                              |                        |
     |                              |  4. Filter & Score     |
     |                              |         (locally)      |
     |                              |                        |
     |                              |  5. Admin Selects 3-5  |
     |                              |         (UI)           |
     |                              |                        |
     |  📧 Opportunities Ready     |                        |
     |<--------------------------------------------------|
     |                              |                        |
     |  6. View on /my-opportunities|                       |
     |  (Frontend displays data)    |                        |
```

---

## 🔐 Two Email System

### Email #1: Admin Notification (Request Created)

**Trigger**: When company clicks "Get Opportunities"

**Recipient**: `parker@stroomai.com` (hardcoded)

**Purpose**: Alert admin that a company needs opportunities

**Contents**:

```
Subject: New Opportunity Request from Acme Construction

Hi,

A new company is requesting opportunities!

Company Name: Acme Construction
Industry: Construction
Location: Los Angeles, California
Business Type: Small Business
NAICS Codes: 236220, 237310

[View Request in Admin Panel]

Request ID: abc-123-def
```

**Code Location**: `app/api/opportunity-requests/create/route.ts` (lines 79-86)

---

### Email #2: Company Notification (Opportunities Ready)

**Trigger**: When admin clicks "Approve & Send"

**Recipient**: Company user's email

**Purpose**: Notify company their opportunities are ready

**Contents**:

```
Subject: 🎯 We found 3 perfect opportunities for you!

Hi [FirstName],

Great news! Our team has found 3 contract opportunities that are perfect
matches for your company profile.

1. GSA Schedule 36 - Building Construction Services
   Agency: General Services Administration
   https://sam.gov/...

2. Los Angeles County Construction Projects
   Agency: LA County Public Works
   https://lacounty.gov/...

3. Federal Highway Administration - Bridge Construction
   Agency: Department of Transportation
   https://fhwa.dot.gov/...

[View Your Opportunities]

These opportunities have been hand-selected by our team based on your
company profile. You can start applying right away!
```

**Code Location**: `app/api/admin/approve-opportunities/route.ts` (lines 121-127)

---

## ⏱️ Timeline Example

| Time                | Event                                       | Who          |
| ------------------- | ------------------------------------------- | ------------ |
| **Day 1, 9:00 AM**  | Company clicks "Get Opportunities"          | Company User |
| **Day 1, 9:00 AM**  | 📧 Email sent to parker@stroomai.com        | System       |
| **Day 1, 9:05 AM**  | Admin receives email                        | Admin        |
| **Day 1, 10:30 AM** | Admin logs into /admin/opportunity-requests | Admin        |
| **Day 1, 10:32 AM** | Admin clicks "Search Opportunities"         | Admin        |
| **Day 1, 10:33 AM** | Brave Search returns 10 results             | System       |
| **Day 1, 10:35 AM** | Admin reviews, selects top 3                | Admin        |
| **Day 1, 10:36 AM** | Admin clicks "Approve & Send"               | Admin        |
| **Day 1, 10:36 AM** | 📧 Email sent to company user               | System       |
| **Day 1, 10:40 AM** | Company user checks email                   | Company User |
| **Day 1, 10:41 AM** | Company views /my-opportunities             | Company User |
| **Day 1, 10:45 AM** | Company clicks "Apply Now"                  | Company User |

**Total Time**: ~1-2 hours (or 24 hours if admin is busy)

---

## 🎯 Key Points About the Workflow

### Between Filter & Score → Admin Approves

**What Happens**:

1. ✅ Brave Search returns raw results
2. ✅ System automatically filters and scores
3. ✅ Admin sees scored list in UI
4. ⏸️ **Admin manually reviews each result**
5. ⏸️ **Admin clicks checkboxes to select best 3-5**
6. ⏸️ **Admin verifies selections**
7. ✅ Admin clicks "Approve & Send"

**Why Manual Review?**

- Quality control - human verification beats algorithm
- Admin can click links to verify .gov sites are real
- Admin can add notes (e.g., "Perfect fit - similar past projects")
- Prevents sending irrelevant opportunities

### After Admin Approves

**What Happens**:

1. ✅ Opportunities saved to database with `company_id`
2. ✅ Application records created with status "recommended"
3. ✅ Email sent to company user
4. ✅ Company sees opportunities on `/my-opportunities`
5. ⏸️ **Company reviews opportunities**
6. ⏸️ **Company clicks "Apply Now" on chosen opportunity**
7. ✅ Status changes to "draft"
8. ✅ Company completes application

---

## 📧 Email Notification Details

### Email #1 Technical Details

```typescript
// Sent from: app/api/opportunity-requests/create/route.ts

const emailResult = await emailService.sendAdminOpportunityRequestNotification(
  opportunityRequest.id, // Request ID
  company.name, // "Acme Construction"
  company.industry, // "Construction"
  location, // "Los Angeles, California"
  company.business_type, // "Small Business"
  naicsCodes // ["236220", "237310"]
);

// Hardcoded recipient in lib/email/index.ts line 171:
to: "parker@stroomai.com";
```

### Email #2 Technical Details

```typescript
// Sent from: app/api/admin/approve-opportunities/route.ts

await emailService.sendOpportunitiesReadyEmail(
  userProfile.email, // Company user email
  userProfile.full_name, // "John Doe"
  createdOpportunities // Array of 3-5 opportunities
);

// Dynamic recipient - company user's email
to: userProfile.email;
```

---

## 🔄 Status Progression

```
Request Status Flow:
pending → processing → completed

Application Status Flow:
recommended → draft → submitted → under_review → awarded
```

---

## 🎨 Frontend Display on /my-opportunities

```
┌─────────────────────────────────────────────────────────────┐
│  🌟 Perfect Matches for Your Company                        │
│                                                              │
│  These opportunities have been hand-selected by our team    │
│  based on your company profile, industry, location, and     │
│  expertise. Start applying now!                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  GSA Schedule 36 - Building Construction Services           │
│  📍 General Services Administration    ⭐ 92% Match          │
│                                                              │
│  Seeking qualified contractors for federal building          │
│  construction services across California...                  │
│                                                              │
│  [Apply Now]  [View Details]  [🔗 Source]                  │
│                                                              │
│  Added 2 hours ago                                          │
└─────────────────────────────────────────────────────────────┘

[Similar cards for other 2-4 opportunities...]
```

---

## ✨ Summary

**The Email Flow**:

1. Company requests → 📧 **Admin receives notification**
2. Admin searches & scores (Brave API)
3. Admin manually selects best 3-5
4. Admin approves → 📧 **Company receives notification**
5. Company views opportunities on frontend
6. Company applies

**Key Insight**: The system is **semi-automated**:

- ✅ Automated: Request creation, Brave Search, filtering, scoring
- 👤 Manual: Admin reviews and selects best opportunities
- ✅ Automated: Delivery to company frontend

This ensures **high quality** while saving time!
