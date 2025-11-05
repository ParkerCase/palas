# How to Get Brave Search API Key

## Test Results Summary

✅ **Query Builder Working**: The system correctly builds search queries including:

- Company industry
- City AND State (e.g., "Los Angeles California")
- NAICS codes
- Business type

**Example Query Generated:**

```
"government contracts Construction Los Angeles California NAICS 236220 237310 Small Business"
```

❌ **Missing API Key**: `BRAVE_SEARCH_API_KEY` is not set in your environment

---

## Step 1: Get Brave Search API Key

### Option A: Sign Up for Brave Search API (Recommended)

1. **Go to Brave Search API**: https://brave.com/search/api/

2. **Create an Account**:

   - Click "Get Started" or "Sign Up"
   - Use your work email (veteransccsd@gmail.com or parker@stroomai.com)

3. **Choose a Plan**:

   - **Free Tier**: 2,000 queries/month (good for testing)
   - **Data for AI**: $5/1,000 queries
   - **Basic**: $15/month (15,000 queries)
   - **Pro**: Custom pricing

4. **Get Your API Key**:
   - After signing up, go to Dashboard
   - Click "API Keys" or "Credentials"
   - Copy your API key (starts with `BSA...`)

### Option B: Use Alternative Search API (If Brave Not Available)

If Brave Search is not available, you can use:

- **Google Custom Search API** (free tier available)
- **Bing Web Search API** (free tier available)
- **SerpAPI** (paid but has government search)

---

## Step 2: Add API Key to Your Project

### Add to `.env.local` file:

1. Open (or create) `.env.local` in your project root
2. Add this line:

```bash
BRAVE_SEARCH_API_KEY=your_brave_api_key_here
```

**Full Example `.env.local`:**

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key

# Email Service
RESEND_API_KEY=your_resend_key

# Brave Search API
BRAVE_SEARCH_API_KEY=BSAxxxxxxxxxxxxxxxxxx

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Step 3: Test the API

After adding the API key, run:

```bash
npx tsx test-brave-search.ts
```

**Expected Output:**

```
✓ BRAVE_SEARCH_API_KEY is set
Building search query...
✓ Query includes both city AND state
✓ Query includes NAICS codes
Performing Brave Search...
✓ Search completed successfully!

Found 10 results:
1. GSA Schedules - Construction Services
   URL: https://gsa.gov/...
   Domain: gsa.gov
   ...
```

---

## Step 4: Test Full Workflow

Once Brave Search is working, test the complete workflow:

```bash
# Start your Next.js server
npm run dev

# In another terminal, test the workflow
node test-opportunity-workflow.js
```

---

## Expected Search Results

The Brave Search should return results like:

### Government Contract Sources:

- ✅ **SAM.gov** - Federal contract opportunities
- ✅ **Grants.gov** - Federal grants
- ✅ **FedBizOpps** - Federal business opportunities
- ✅ **GSA.gov** - General Services Administration
- ✅ **State government sites** (e.g., California.gov)
- ✅ **Local government sites** (e.g., LA County)

### Result Quality Indicators:

- Domain ends in `.gov`
- Contains keywords: contract, solicitation, RFP, bid, procurement
- Matches location (Los Angeles, California)
- Mentions NAICS codes or industry

---

## Troubleshooting

### "API Key Invalid" Error

- Double-check the key is copied correctly (no spaces)
- Verify the key is active in Brave dashboard
- Check if free tier quota is exceeded

### "No Results Found"

- The query is very specific - this is normal
- Government sites may not have current opportunities
- Try a broader search in Brave dashboard directly

### "Rate Limit Exceeded"

- Free tier: 2,000 queries/month
- Wait or upgrade to paid plan
- Implement result caching to reduce API calls

### "CORS or Network Errors"

- Brave Search API should work from Node.js/server-side
- If testing from browser, use proxy or server endpoint
- Check firewall/VPN isn't blocking requests

---

## Alternative: Mock Results for Testing

If you want to test the workflow without Brave API, you can:

1. Create mock search results in the admin panel
2. Manually add opportunities to database
3. Use the "Add Manual Opportunity" button

---

## Cost Estimation

**For typical usage (1 search per company request):**

- **10 companies/month**: Free tier sufficient
- **100 companies/month**: ~$30/month (Basic plan)
- **1,000 companies/month**: ~$300/month (Pro plan)

**Optimization tips:**

- Cache search results for 24 hours
- Limit searches to pending requests only
- Batch multiple companies with similar profiles

---

## Security Best Practices

✅ **DO:**

- Keep API key in `.env.local` (not committed to git)
- Use server-side only (never expose to frontend)
- Rotate keys periodically
- Monitor usage in Brave dashboard

❌ **DON'T:**

- Commit API keys to git
- Share keys in public repos
- Use same key across multiple projects
- Hardcode keys in source files

---

## Support

- **Brave Search API Docs**: https://brave.com/search/api/docs
- **Status Page**: https://status.brave.com
- **Support Email**: Contact through Brave dashboard

For this project:

- Email: parker@stroomai.com
- Check: `test-brave-search.ts` for detailed error messages
