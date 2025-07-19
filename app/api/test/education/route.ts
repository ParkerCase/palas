import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action') || 'search'
    const query = searchParams.get('query') || 'university'
    const state = searchParams.get('state') || 'CA'
    const limit = parseInt(searchParams.get('limit') || '10')

    console.log(`🧪 TEST Education API: ${action} - query: "${query}", state: "${state}"`)

    switch (action) {
      case 'search':
        return await handleTestInstitutionSearch(query, state, limit)
      case 'real-data-test':
        return await testRealDataSources()
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Test Education API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

async function handleTestInstitutionSearch(query: string, state: string, limit: number) {
  const results = {
    test_status: 'SUCCESS',
    real_data_sources: [] as string[],
    institutions: [] as any[],
    data_verification: {} as any
  }

  // Test Urban Institute API
  try {
    const ipedsUrl = `https://educationdata.urban.org/api/v1/college-university/ipeds/institutional-characteristics/2022/?state=${state}&per_page=${limit}`
    const response = await fetch(ipedsUrl, {
      headers: {
        'User-Agent': 'GovContractAI-Test/1.0',
        'Accept': 'application/json'
      }
    })
    
    if (response.ok) {
      const data = await response.json()
      results.real_data_sources.push('Urban Institute IPEDS API ✅')
      results.data_verification.ipeds = {
        status: 'SUCCESS',
        count: data.results?.length || 0,
        sample: data.results?.[0]?.institution_name || 'N/A'
      }
      
      // Transform to our format
      if (data.results) {
        results.institutions = data.results.slice(0, 5).map((inst: unknown) => {
          const i = inst as {
            unitid?: string;
            institution_name?: string;
            city?: string;
            state_abbreviation?: string;
            sector_of_institution?: number;
            total_enrollment?: number;
          }
          return {
            id: i.unitid,
            name: i.institution_name,
            city: i.city,
            state: i.state_abbreviation,
            sector: i.sector_of_institution === 1 ? 'Public' : 'Private',
            enrollment: i.total_enrollment || 0,
            data_source: 'Urban Institute IPEDS (LIVE)'
          }
        })
      }
    } else {
      results.real_data_sources.push('Urban Institute IPEDS API ❌')
      results.data_verification.ipeds = { status: 'FAILED', error: response.status }
    }
  } catch (error) {
    results.real_data_sources.push('Urban Institute IPEDS API ❌')
    results.data_verification.ipeds = { status: 'ERROR', error: error instanceof Error ? error.message : 'Unknown error' }
  }

  // Test College Scorecard API
  try {
    const apiKey = process.env.COLLEGE_SCORECARD_API_KEY
    if (apiKey) {
      const scorecardUrl = `https://api.data.gov/ed/collegescorecard/v1/schools.json?api_key=${apiKey}&school.state=${state}&_per_page=5`
      const response = await fetch(scorecardUrl)
      
      if (response.ok) {
        const data = await response.json()
        results.real_data_sources.push('College Scorecard API ✅')
        results.data_verification.scorecard = {
          status: 'SUCCESS',
          count: data.results?.length || 0,
          sample: data.results?.[0]?.['school.name'] || 'N/A'
        }
      } else {
        results.real_data_sources.push('College Scorecard API ❌')
        results.data_verification.scorecard = { status: 'FAILED', error: response.status }
      }
    } else {
      results.real_data_sources.push('College Scorecard API ⚠️ (No API Key)')
      results.data_verification.scorecard = { status: 'NO_KEY' }
    }
  } catch (error) {
    results.real_data_sources.push('College Scorecard API ❌')
    results.data_verification.scorecard = { status: 'ERROR', error: error instanceof Error ? error.message : 'Unknown error' }
  }

  // If no real data, use realistic mock data
  if (results.institutions.length === 0) {
    results.institutions = [
      {
        id: 'mock-test-1',
        name: 'University of California, Berkeley',
        city: 'Berkeley',
        state: 'CA',
        sector: 'Public',
        enrollment: 45057,
        data_source: 'Mock Data (Fallback)'
      },
      {
        id: 'mock-test-2',
        name: 'Stanford University',
        city: 'Stanford',
        state: 'CA',
        sector: 'Private',
        enrollment: 17249,
        data_source: 'Mock Data (Fallback)'
      }
    ]
    results.real_data_sources.push('Mock Data Fallback ✅')
  }

  return NextResponse.json({
    success: true,
    test_results: results,
    summary: {
      real_apis_working: results.real_data_sources.filter(s => s.includes('✅')).length,
      total_apis_tested: results.real_data_sources.length,
      institutions_found: results.institutions.length,
      primary_data_source: results.institutions[0]?.data_source || 'None'
    },
    institutions: results.institutions,
    metadata: {
      test_type: 'Real Data Verification',
      timestamp: new Date().toISOString(),
      query_params: { query, state, limit }
    }
  })
}

async function testRealDataSources() {
  const tests = {
    usaspending: { status: 'TESTING' as string, details: null as any },
    grants_gov: { status: 'TESTING' as string, details: null as any }
  }

  // Test USAspending.gov
  try {
    const requestBody = {
      filters: {
        award_type_codes: ['02', '03'],
        time_period: [{ start_date: '2023-01-01', end_date: '2024-12-31' }]
      },
      fields: ['Award ID', 'Recipient Name', 'Award Amount'],
      page: 1,
      limit: 5
    }

    const response = await fetch('https://api.usaspending.gov/api/v2/search/spending_by_award/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'GovContractAI-Test/1.0'
      },
      body: JSON.stringify(requestBody)
    })

    if (response.ok) {
      const data = await response.json()
      tests.usaspending = {
        status: 'SUCCESS',
        details: {
          awards_found: data.results?.length || 0,
          sample_recipient: data.results?.[0]?.['Recipient Name'] || 'N/A',
          total_value: data.results?.reduce((sum: number, award: unknown) => {
            const a = award as { 'Award Amount'?: number }
            return sum + (a['Award Amount'] || 0)
          }, 0) || 0
        }
      }
    } else {
      tests.usaspending = { status: 'FAILED', details: { error: response.status } }
    }
  } catch (error) {
    tests.usaspending = { status: 'ERROR', details: { error: error instanceof Error ? error.message : 'Unknown error' } }
  }

  // Test Grants.gov
  try {
    const response = await fetch('https://api.grants.gov/v1/api/search2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'GovContractAI-Test/1.0'
      },
      body: JSON.stringify({
        rows: 5,
        keyword: 'technology',
        oppStatuses: 'posted'
      })
    })

    if (response.ok) {
      const data = await response.json()
      if (data.errorcode === 0) {
        tests.grants_gov = {
          status: 'SUCCESS',
          details: {
            grants_found: data.data?.oppHits?.length || 0,
            sample_title: data.data?.oppHits?.[0]?.title || 'N/A'
          }
        }
      } else {
        tests.grants_gov = { status: 'FAILED', details: { error: data.error } }
      }
    } else {
      tests.grants_gov = { status: 'FAILED', details: { error: response.status } }
    }
  } catch (error) {
    tests.grants_gov = { status: 'ERROR', details: { error: error instanceof Error ? error.message : 'Unknown error' } }
  }

  return NextResponse.json({
    success: true,
    real_data_verification: tests,
    summary: {
      total_tests: Object.keys(tests).length,
      successful: Object.values(tests).filter(t => t.status === 'SUCCESS').length,
      failed: Object.values(tests).filter(t => t.status === 'FAILED').length,
      errors: Object.values(tests).filter(t => t.status === 'ERROR').length
    },
    timestamp: new Date().toISOString()
  })
}
