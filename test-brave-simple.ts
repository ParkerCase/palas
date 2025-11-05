/**
 * Simple Brave Search Test
 * Test with broader queries to verify API is working
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

const BRAVE_API_KEY = process.env.BRAVE_SEARCH_API_KEY

async function testSimpleSearch() {
  console.log('Testing Brave Search API with simple queries...\n')

  const testQueries = [
    'government contracts',
    'sam.gov contracts',
    'federal contracts 2024',
    'construction contracts site:gsa.gov'
  ]

  for (const query of testQueries) {
    console.log(`\nTesting query: "${query}"`)
    console.log('='.repeat(60))

    try {
      const params = new URLSearchParams({
        q: query,
        count: '5',
        text_decorations: 'false',
        search_lang: 'en',
        country: 'US'
      })

      const response = await fetch(
        `https://api.search.brave.com/res/v1/web/search?${params}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Accept-Encoding': 'gzip',
            'X-Subscription-Token': BRAVE_API_KEY!
          }
        }
      )

      if (!response.ok) {
        console.log(`❌ API Error: ${response.status} ${response.statusText}`)
        const text = await response.text()
        console.log('Response:', text.substring(0, 200))
        continue
      }

      const data = await response.json()
      const results = data.web?.results || []

      console.log(`✓ Found ${results.length} results`)
      
      results.forEach((result: any, index: number) => {
        console.log(`\n${index + 1}. ${result.title}`)
        console.log(`   URL: ${result.url}`)
        console.log(`   ${result.description.substring(0, 80)}...`)
      })

    } catch (error: any) {
      console.log(`❌ Error: ${error.message}`)
    }
  }
}

testSimpleSearch()
  .then(() => {
    console.log('\n\n✓ Test completed')
  })
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })

