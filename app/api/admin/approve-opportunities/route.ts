import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { emailService } from '@/lib/email'
import { isAdmin } from '@/lib/config/admin'

export const dynamic = 'force-dynamic'

interface SelectedOpportunity {
  title: string
  url: string
  description: string
  agency?: string
  deadline?: string
  source_data: any
  admin_notes?: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get the current user and verify admin access
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin (authorized emails only)
    if (!isAdmin(user.email)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Get request data
    const body = await request.json()
    const { requestId, companyId, selectedOpportunities } = body as {
      requestId: string
      companyId: string
      selectedOpportunities: SelectedOpportunity[]
    }

    if (!requestId || !companyId || !selectedOpportunities || selectedOpportunities.length === 0) {
      return NextResponse.json(
        { error: 'Request ID, Company ID, and selected opportunities are required' },
        { status: 400 }
      )
    }

    // Validate that we have exactly 3 opportunities (or allow 1-5)
    if (selectedOpportunities.length > 5) {
      return NextResponse.json(
        { error: 'Maximum 5 opportunities can be approved at once' },
        { status: 400 }
      )
    }

    // Get company and user info
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single()

    if (companyError || !company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      )
    }

    // Get the opportunity request to find the user
    const { data: opportunityRequest, error: requestError } = await supabase
      .from('opportunity_requests')
      .select('*, profiles(*)')
      .eq('id', requestId)
      .single()

    if (requestError || !opportunityRequest) {
      return NextResponse.json(
        { error: 'Opportunity request not found' },
        { status: 404 }
      )
    }

    const userProfile = opportunityRequest.profiles as any

    // Create opportunities and applications
    const createdOpportunities = []
    for (let i = 0; i < selectedOpportunities.length; i++) {
      const opp = selectedOpportunities[i]
      
      // Create opportunity
      const { data: opportunity, error: oppError } = await supabase
        .from('opportunities')
        .insert({
          title: opp.title,
          description: opp.description || opp.source_data?.snippet || opp.source_data?.description,
          agency: opp.agency || opp.source_data?.domain || 'Government Agency',
          source_url: opp.url,
          source_type: 'brave_search',
          company_id: companyId,
          recommended_by: user.id,
          match_score: opp.source_data?.score || 85,
          admin_notes: opp.admin_notes,
          search_result_data: opp.source_data,
          status: 'open',
          opportunity_type: 'solicitation',
          jurisdiction: 'federal',
          cache_tier: 'tier2_hourly'
        })
        .select()
        .single()

      if (oppError) {
        console.error('Error creating opportunity:', oppError)
        continue
      }

      // Create application with status 'recommended'
      const { error: appError } = await supabase
        .from('applications')
        .insert({
          company_id: companyId,
          opportunity_id: opportunity.id,
          created_by: opportunityRequest.user_id,
          title: opp.title,
          status: 'draft',
          source: 'admin_recommended',
          recommended_at: new Date().toISOString(),
          workflow_stage: 'discovery',
          is_submitted: false,
          time_spent: 0
        })

      if (appError) {
        console.error('Error creating application:', appError)
      }

      createdOpportunities.push({
        title: opportunity.title,
        agency: opportunity.agency || 'Government Agency',
        deadline: opportunity.submission_deadline || undefined,
        url: `${process.env.NEXT_PUBLIC_APP_URL}/my-opportunities`
      })
    }

    // Update opportunity request status to completed
    const { error: updateError } = await supabase
      .from('opportunity_requests')
      .update({
        status: 'completed',
        processed_by: user.id,
        processed_at: new Date().toISOString()
      })
      .eq('id', requestId)

    if (updateError) {
      console.error('Error updating request status:', updateError)
    }

    // Send email to company with opportunities
    try {
      if (userProfile?.email && createdOpportunities.length > 0) {
        await emailService.sendOpportunitiesReadyEmail(
          userProfile.email,
          userProfile.full_name || 'there',
          createdOpportunities
        )
      }
    } catch (emailError) {
      console.error('Error sending email notification:', emailError)
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      opportunities_created: createdOpportunities.length,
      message: `Successfully approved ${createdOpportunities.length} opportunities and notified the company`
    })

  } catch (error) {
    console.error('Error in opportunity approval:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

