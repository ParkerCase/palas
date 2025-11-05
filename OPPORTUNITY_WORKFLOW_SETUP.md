# Opportunity Discovery Workflow - Setup Guide

This document explains how to set up and use the dynamic government contract opportunity discovery system.

## Overview

The system provides an end-to-end workflow for discovering and recommending government contract opportunities:

1. **Company Request**: Companies click "Get Opportunities" on their dashboard
2. **Admin Notification**: Admin receives email at parker@stroomai.com
3. **Brave Search**: Admin searches for opportunities using Brave Search API
4. **Review & Approve**: Admin selects top 3-5 opportunities
5. **Company Notification**: Company receives email with recommended opportunities
6. **Apply**: Company views opportunities and applies

## Prerequisites

### 1. Environment Variables

Add these to your `.env.local` file:

```bash
# Brave Search API Key (required)
BRAVE_SEARCH_API_KEY=your_brave_search_api_key_here

# Resend API Key (required for emails)
RESEND_API_KEY=your_resend_api_key_here

# App URL (required for email links)
NEXT_PUBLIC_APP_URL=http://localhost:3000  # or your production URL
```

### 2. Database Migration

Run the new migration to add required fields:

```bash
# If using Supabase CLI
supabase migration up

# Or apply the migration file directly
# File: supabase/migrations/20241201000005_opportunity_discovery_workflow.sql
```

### 3. API Keys Setup

#### Brave Search API

1. Go to https://brave.com/search/api/
2. Sign up for an API account
3. Subscribe to a plan (Basic or higher)
4. Copy your API key
5. Add to `.env.local` as `BRAVE_SEARCH_API_KEY`

#### Resend Email API

1. Go to https://resend.com
2. Sign up and verify your account
3. Add and verify your sending domain
4. Generate an API key
5. Add to `.env.local` as `RESEND_API_KEY`

## File Structure

```
/app
  /(dashboard)
    /dashboard
      page.tsx                    # Company dashboard with "Get Opportunities" button
    /my-opportunities
      page.tsx                    # Company view for recommended opportunities
    /admin
      /opportunity-requests
        page.tsx                  # Admin interface for managing requests
  /api
    /opportunity-requests
      /create
        route.ts                  # Create new opportunity request
    /admin
      /search-opportunities
        route.ts                  # Brave Search integration
      /approve-opportunities
        route.ts                  # Approve and send opportunities

/lib
  /email
    index.ts                      # Email service with new methods
  /search
    brave.ts                      # Brave Search service

/supabase
  /migrations
    20241201000005_opportunity_discovery_workflow.sql

test-opportunity-workflow.js      # Comprehensive test suite
```

## Usage

### For Companies

1. Navigate to dashboard (`/dashboard`)
2. Click the "Get Opportunities" button in the welcome banner
3. Success toast appears: "Request submitted! Our team will find opportunities for you within 24 hours."
4. Wait for email notification when opportunities are ready
5. Navigate to "My Opportunities" (`/my-opportunities`)
6. Review hand-selected opportunities
7. Click "Apply Now" to start application

### For Admins

1. Receive email notification at parker@stroomai.com
2. Navigate to Admin Panel → Opportunity Requests (`/admin/opportunity-requests`)
3. Click on a pending request to view details
4. Review company profile (industry, location, NAICS codes)
5. Click "Search Opportunities" button
6. Review Brave Search results (filtered for .gov domains)
7. Select top 3-5 opportunities using checkboxes
8. Click "Approve & Send" button
9. System creates opportunities, sends email to company

## Key Features

### Dynamic Search Query Construction

The system automatically builds search queries from company profiles:

```javascript
const query = `government contracts ${industry} ${city} ${state} NAICS ${naics_codes}`;
```

Example: `"government contracts construction Los Angeles California NAICS 236220 237310"`

### Government Domain Filtering

Results are filtered to prioritize:

- `.gov` domains
- `.mil` domains
- Contract-related keywords (RFP, solicitation, bid, procurement)

### Match Scoring

Opportunities are scored based on:

- Government domain (+20 points)
- Industry match (+15 points)
- NAICS code match (+10 points)
- Search result rank (penalty for lower positions)

### Email Notifications

Two email templates:

1. **Admin Notification** (`sendAdminOpportunityRequestNotification`)

   - To: parker@stroomai.com (hardcoded)
   - Subject: "New Opportunity Request from {Company Name}"
   - Contains: Company profile, location, industry, NAICS codes

2. **Company Notification** (`sendOpportunitiesReadyEmail`)
   - To: Company user email
   - Subject: "🎯 We found 3 perfect opportunities for you!"
   - Contains: List of opportunities with links

### Status Tracking

Requests progress through statuses:

- `pending` - Initial state after creation
- `processing` - After Brave Search is performed
- `completed` - After opportunities are approved and sent
- `cancelled` - If request is cancelled

## Testing

Run the comprehensive test suite:

```bash
node test-opportunity-workflow.js
```

The test script validates:

1. ✓ Opportunity request creation
2. ⚠ Admin email notification (manual verification)
3. ✓ Brave Search integration
4. ✓ Opportunity approval
5. ⚠ Company email notification (manual verification)
6. ⚠ Opportunities display (manual verification)
7. ⚠ Status tracking (manual verification)
8. ⚠ Error handling (manual verification)

## Database Schema

### Tables Modified/Created

1. **opportunity_requests**

   - `email_sent` - Boolean flag for notification status
   - `email_sent_at` - Timestamp of email send
   - `processed_by` - Admin user ID who processed request
   - `processed_at` - Timestamp of processing
   - `search_query_used` - Actual Brave Search query used
   - `search_results` - JSONB of raw search results

2. **opportunities**

   - `company_id` - Company this opportunity is recommended for
   - `recommended_by` - Admin user ID who recommended it
   - `source_type` - Source: brave_search, sam_gov, manual, etc.
   - `search_result_data` - JSONB of Brave Search result
   - `match_score` - Algorithmic match score (0-100)
   - `admin_notes` - Optional notes from admin

3. **applications**
   - `source` - How created: user_created, admin_recommended, ai_generated
   - `recommended_at` - Timestamp when recommended by admin

## API Endpoints

### POST `/api/opportunity-requests/create`

Creates a new opportunity request.

**Auth**: Required (user must be authenticated)

**Response**:

```json
{
  "success": true,
  "request": { ... },
  "message": "Request submitted! Our team will find opportunities for you within 24 hours."
}
```

### POST `/api/admin/search-opportunities`

Searches for opportunities using Brave Search.

**Auth**: Required (admin only - stroomai.com email)

**Body**:

```json
{
  "requestId": "uuid",
  "companyId": "uuid"
}
```

**Response**:

```json
{
  "success": true,
  "query": "government contracts construction Los Angeles California NAICS 236220",
  "results": [ ... ],
  "total_results": 10
}
```

### POST `/api/admin/approve-opportunities`

Approves selected opportunities and sends to company.

**Auth**: Required (admin only)

**Body**:

```json
{
  "requestId": "uuid",
  "companyId": "uuid",
  "selectedOpportunities": [
    {
      "title": "...",
      "url": "...",
      "description": "...",
      "agency": "...",
      "source_data": { ... }
    }
  ]
}
```

**Response**:

```json
{
  "success": true,
  "opportunities_created": 3,
  "message": "Successfully approved 3 opportunities and notified the company"
}
```

## Error Handling

The system includes comprehensive error handling:

- Invalid API keys → Clear error messages
- Failed searches → Graceful fallback
- Email send failures → Logged but don't block workflow
- Missing company data → Validation errors
- Non-admin access → 403 Forbidden
- Rate limiting → Handled by Brave Search API

## Rate Limiting

Brave Search API has rate limits:

- Basic plan: 1 request/second, 15,000 requests/month
- Pro plan: Higher limits

Consider implementing:

- Request throttling
- Caching of search results
- Background job queue for bulk processing

## Future Enhancements

Potential improvements:

1. **AI Pre-fill**: Use Anthropic AI to analyze opportunities and pre-fill application forms
2. **Scheduled Searches**: Automatically search for new opportunities weekly
3. **Multiple Sources**: Integrate SAM.gov, Grants.gov, USASpending.gov
4. **Smart Matching**: ML model to improve match scoring
5. **Notification Preferences**: Allow companies to set search frequency
6. **Opportunity Tracking**: Track which opportunities convert to applications/wins

## Support

For issues or questions:

- Email: parker@stroomai.com
- Check logs in admin panel
- Review test output for validation

## Security Notes

- Admin access is restricted to @stroomai.com email addresses
- Row Level Security (RLS) policies protect company data
- API keys are never exposed to frontend
- Email addresses are validated before sending
- All database operations use parameterized queries
