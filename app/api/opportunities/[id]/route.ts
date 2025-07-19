import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

// Replace the entire handleGet function in /app/api/opportunities/[id]/route.ts

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: opportunityId } = await params

    // Parse the opportunity ID to determine source
    let opportunityDetails = null

    if (opportunityId.startsWith('usa-spending-')) {
      opportunityDetails = await fetchUSASpendingDetails(opportunityId)
    } else if (opportunityId.startsWith('grant-')) {
      opportunityDetails = await fetchGrantsGovDetails(opportunityId)
    } else {
      // For existing database opportunities
      opportunityDetails = await fetchDatabaseOpportunity(opportunityId)
    }

    if (!opportunityDetails) {
      return NextResponse.json(
        { error: 'Opportunity not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      opportunity: opportunityDetails
    })

  } catch (error) {
    console.error('Opportunity details error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function fetchUSASpendingDetails(opportunityId: string) {
  try {
    // Extract Award ID from the opportunity ID
    const awardId = opportunityId.replace('usa-spending-', '')
    
    const requestBody = {
      filters: {
        award_ids: [awardId]
      },
      fields: [
        'Award ID', 'Recipient Name', 'Awarding Agency', 'Awarding Sub Agency',
        'Award Amount', 'Start Date', 'End Date', 'Description', 'NAICS Code',
        'NAICS Description', 'primary_place_of_performance_city_name',
        'primary_place_of_performance_state_code', 'Award Type'
      ],
      page: 1,
      limit: 1
    }

    const response = await fetch('https://api.usaspending.gov/api/v2/search/spending_by_award/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'GovContractAI/1.0'
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      throw new Error(`USASpending API error: ${response.status}`)
    }

    const data = await response.json()
    const award = data.results?.[0]

    if (!award) {
      return null
    }

    return {
      id: opportunityId,
      title: award['Description'] || `${award['NAICS Description']} - ${award['Recipient Name']}`,
      description: `Federal contract awarded to ${award['Recipient Name']} by ${award['Awarding Agency']}${award['Awarding Sub Agency'] ? ` (${award['Awarding Sub Agency']})` : ''}. NAICS: ${award['NAICS Code']} - ${award['NAICS Description']}. Performance period: ${award['Start Date']} to ${award['End Date']}.`,
      organization: award['Awarding Agency'],
      department: award['Awarding Sub Agency'] || award['Awarding Agency'],
      postedDate: award['Start Date'],
      deadline: award['End Date'] || 'See contract details',
      awardAmount: award['Award Amount'] ? `$${award['Award Amount'].toLocaleString()}` : null,
      location: `${award['primary_place_of_performance_city_name'] || 'Various'}, ${award['primary_place_of_performance_state_code'] || 'USA'}`,
      naicsCodes: award['NAICS Code'] ? [award['NAICS Code']] : [],
      setAside: 'See USAspending.gov for contract details',
      contact: {
        fullName: 'See USAspending.gov',
        email: 'See USAspending.gov',
        phone: 'See USAspending.gov'
      },
      links: [
        { rel: 'usaspending', href: `https://usaspending.gov/award/${awardId}` }
      ],
      source: 'USAspending.gov',
      type: 'contract',
      realDataSource: 'USAspending.gov API',
      note: 'This is historical contract data. For active opportunities, check SAM.gov.'
    }

  } catch (error) {
    console.error('Error fetching USASpending details:', error)
    return null
  }
}

async function fetchGrantsGovDetails(opportunityId: string) {
  try {
    // Extract the grants.gov opportunity number
    const oppNumber = opportunityId.replace('grant-', '')
    
    const requestBody = {
      rows: 1,
      keyword: '',
      oppNum: oppNumber,
      eligibilities: '',
      agencies: '',
      oppStatuses: 'forecasted|posted|closed',
      aln: '',
      fundingCategories: ''
    }

    const response = await fetch('https://api.grants.gov/v1/api/search2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'GovContractAI/1.0'
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      throw new Error(`Grants.gov API error: ${response.status}`)
    }

    const data = await response.json()
    const grant = data.data?.oppHits?.[0]

    if (!grant) {
      return null
    }

    return {
      id: opportunityId,
      title: grant.title,
      description: grant.description || `${grant.docType} opportunity from ${grant.agencyName}`,
      organization: grant.agencyName,
      department: grant.agencyCode,
      postedDate: grant.openDate,
      deadline: grant.closeDate || 'TBD',
      awardAmount: grant.estimatedTotalProgramFunding ? `$${grant.estimatedTotalProgramFunding.toLocaleString()}` : 'See grant details',
      location: 'Eligible locations vary - see grant details',
      naicsCodes: [],
      setAside: grant.alnist ? grant.alnist.join(', ') : 'See grant details',
      contact: {
        fullName: 'See Grants.gov for contact details',
        email: 'See Grants.gov',
        phone: 'See Grants.gov'
      },
      links: [
        { rel: 'grants.gov', href: `https://grants.gov/search-results-detail/${grant.id}` },
        ...(grant.grantsGovApplicationPackageUrl ? [{ rel: 'application', href: grant.grantsGovApplicationPackageUrl }] : [])
      ],
      source: 'Grants.gov',
      type: 'grant',
      realDataSource: 'Grants.gov API',
      estimatedAwards: grant.expectedNumberOfAwards,
      applicationDeadline: grant.closeDate
    }

  } catch (error) {
    console.error('Error fetching Grants.gov details:', error)
    return null
  }
}

async function fetchDatabaseOpportunity(opportunityId: string) {
  // This would fetch from your database if you have stored opportunities
  // For now, return null since you're using live APIs
  return null
}
