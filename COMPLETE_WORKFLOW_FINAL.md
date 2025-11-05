# Complete Workflow - Updated

## 🎯 Final Workflow (Clarified)

```
┌─────────────────────────────────────────────────────────────────┐
│                         COMPANY SIDE                             │
└─────────────────────────────────────────────────────────────────┘

1. Company User visits /dashboard
   └─> Clicks "Get Opportunities" button
       └─> Creates opportunity request
           └─> Status: "pending"

📧 EMAIL #1: ADMIN NOTIFICATION
   ├─> TO: parker@stroomai.com AND veteransccsd@gmail.com
   ├─> SUBJECT: "New Opportunity Request from [Company Name]"
   └─> PURPOSE: Notify admins there's a new request to review

2. Company sees success message:
   "Request submitted! Our team will find opportunities for you within 24 hours."

⏸️  COMPANY WAITS...


┌─────────────────────────────────────────────────────────────────┐
│                         ADMIN SIDE                               │
└─────────────────────────────────────────────────────────────────┘

3. Admin (parker@stroomai.com or veteransccsd@gmail.com)
   └─> Receives email notification
   └─> Goes to /admin/review-opportunities

4. Admin sees pending request
   └─> Clicks on request
   └─> Sees company details (industry, location, NAICS codes)

5. Admin clicks "Search Opportunities"
   └─> Brave Search API runs automatically
   └─> Query built from company profile
   └─> Returns ~10 scored results

6. Admin reviews results
   ├─> Each result shows:
   │   ├─ Title
   │   ├─ Score (0-100+)
   │   ├─ Domain (.gov badge if applicable)
   │   ├─ Description
   │   └─ Link to view source
   └─> Admin can click links to verify quality

7. Admin selects best 3-5 opportunities
   └─> Checks boxes next to opportunities
   └─> Reviews selections

8. Admin clicks "Send to Company"
   └─> Opportunities saved to database
   └─> Linked to company via company_id
   └─> Application records created with status "recommended"
   └─> Request status updated to "completed"

📧 EMAIL #2: COMPANY NOTIFICATION
   ├─> TO: Company user email
   ├─> SUBJECT: "🎯 We found 3 perfect opportunities for you!"
   └─> CONTAINS: List of opportunities with links


┌─────────────────────────────────────────────────────────────────┐
│                    COMPANY SIDE (AGAIN)                          │
└─────────────────────────────────────────────────────────────────┘

9. Company user receives email
   └─> "Your opportunities are ready!"

10. Company views /my-opportunities
    └─> Sees 3-5 hand-selected opportunities
    └─> Each shows:
        ├─ Title
        ├─ Agency/source
        ├─ Match score badge
        ├─ Description
        ├─ Admin notes (if any)
        └─ Two buttons:
            ├─ "Accept & Pay" (green)
            └─ "Not Interested" (red)

11. Company reviews each opportunity
    └─> Can click "View Details" or "Source" to verify
    └─> Decides which ones to pursue

12. Company clicks "Accept & Pay" for chosen opportunities
    ├─> Status changes to "accepted"
    ├─> Badge shows: "Accepted - Contract Building"
    └─> Toast: "Our team will build out your contract for this opportunity."

13. Company clicks "Not Interested" for others
    ├─> Status changes to "rejected"
    ├─> Badge shows: "Rejected"
    └─> Opportunity removed from active list


┌─────────────────────────────────────────────────────────────────┐
│                    ADMIN SIDE (CONTRACT BUILDING)                │
└─────────────────────────────────────────────────────────────────┘

14. Admin team goes to /admin/build-contracts
    └─> Sees all accepted opportunities
    └─> Each shows:
        ├─ Opportunity title
        ├─ Company name
        ├─ Contact info
        ├─ Date accepted
        └─ "Build Contract" button

15. Admin team clicks "Build Contract"
    └─> Opens application editor
    └─> Team builds out contract application
    └─> Prepares all required documents
    └─> Completes application form

16. Application submitted
    └─> Status: "submitted"
    └─> Company notified of submission
    └─> Tracking number assigned
```

---

## 📊 Status Flow

```
Opportunity Request:
pending → processing → completed

Application Status:
recommended → draft → accepted → submitted → under_review → awarded
                 ↓
            rejected (if company declines)
```

---

## 🎯 Key Features

### For Companies (`/my-opportunities`):

- ✅ View all recommended opportunities
- ✅ Accept opportunities (willing to pay for contract building)
- ✅ Reject opportunities (not interested)
- ✅ See acceptance status badges
- ✅ View source links to verify opportunities

### For Admins (`/admin/review-opportunities`):

- ✅ View pending requests
- ✅ Search for opportunities using Brave Search
- ✅ Review scored results
- ✅ Select top 3-5 opportunities
- ✅ Send to company

### For Admin Team (`/admin/build-contracts`):

- ✅ View all accepted opportunities
- ✅ See company and contact info
- ✅ Access "Build Contract" button
- ✅ Build out contract applications

---

## 💰 Payment Flow

**When Company Clicks "Accept & Pay":**

- Opportunity marked as accepted
- Admin team notified (via /admin/build-contracts page)
- Team builds contract
- Payment processed (via your payment system)

**When Company Clicks "Not Interested":**

- Opportunity marked as rejected
- Removed from active opportunities
- No payment required

---

## 📧 Email Flow

1. **Request Created** → Email to admins (notification only)
2. **Admin Approves** → Email to company (opportunities ready)
3. **Company Accepts** → Admin sees on build-contracts page
4. **Contract Built** → Email to company (application ready)

---

## 🔄 Complete Timeline

| Step | Action                             | Who        | Status       |
| ---- | ---------------------------------- | ---------- | ------------ |
| 1    | Company clicks "Get Opportunities" | Company    | ✅ Automated |
| 2    | 📧 Email sent to admins            | System     | ✅ Automated |
| 3    | Admin searches Brave               | Admin      | 👤 Manual    |
| 4    | Admin selects best 3-5             | Admin      | 👤 Manual    |
| 5    | Admin sends to company             | Admin      | 👤 Manual    |
| 6    | 📧 Email sent to company           | System     | ✅ Automated |
| 7    | Company views opportunities        | Company    | ✅ Automated |
| 8    | Company accepts/rejects            | Company    | 👤 Manual    |
| 9    | Admin builds contract              | Admin Team | 👤 Manual    |
| 10   | Contract submitted                 | System     | ✅ Automated |

---

## 🎨 UI Features

### Company Page (`/my-opportunities`):

- **"Accept & Pay"** button (green) - Company wants to proceed
- **"Not Interested"** button (red) - Company declines
- Status badges showing acceptance state
- Clear messaging about contract building

### Admin Review Page (`/admin/review-opportunities`):

- Search results with scores
- Checkbox selection
- "Send to Company" button
- Company details sidebar

### Admin Build Contracts Page (`/admin/build-contracts`):

- List of accepted opportunities only
- Company contact information
- "Build Contract" button
- Direct link to application editor

---

## ✅ Summary

**Complete Workflow:**

1. Company requests → 📧 Admin notified
2. Admin searches & selects → Sends to company
3. Company accepts/rejects → Only accepted ones proceed
4. Admin team builds contracts → For accepted opportunities only

**Key Insight:** Companies only pay for opportunities they explicitly accept. Rejected opportunities don't proceed to contract building.
