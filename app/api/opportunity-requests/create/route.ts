import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { emailService } from '@/lib/email'
import { braveSearchService } from '@/lib/search/brave'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient(request)
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's profile and company
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*, companies(*)')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || !profile.companies) {
      return NextResponse.json(
        { error: 'Company profile not found' },
        { status: 404 }
      )
    }

    const company = profile.companies as any

    // Extract location from headquarters_address
    let city = ''
    let state = ''
    if (company.headquarters_address) {
      if (typeof company.headquarters_address === 'object') {
        const addr = company.headquarters_address as any
        city = addr.city || ''
        state = addr.state || ''
      } else if (typeof company.headquarters_address === 'string') {
        const parts = company.headquarters_address.split(',').map((p: string) => p.trim())
        if (parts.length >= 2) {
          city = parts[0]
          state = parts[1]
        }
      }
    }

    // Get NAICS codes
    let naicsCodes: string[] = []
    if (company.profile_data?.naics_codes) {
      naicsCodes = company.profile_data.naics_codes
    }

    // Extract location from headquarters_address
    let location = 'Not specified'
    if (company.headquarters_address) {
      if (typeof company.headquarters_address === 'string') {
        location = company.headquarters_address
      } else if (typeof company.headquarters_address === 'object') {
        const addr = company.headquarters_address as any
        location = `${addr.city || ''}, ${addr.state || ''}`
      }
    }

    // Create opportunity request
    const { data: opportunityRequest, error: createError } = await supabase
      .from('opportunity_requests')
      .insert({
        user_id: user.id,
        company_id: company.id,
        request_type: 'opportunity_search',
        description: `Looking for ${company.industry || 'contract'} opportunities in ${location}`,
        location_preference: location,
        industry_focus: company.industry || '',
        status: 'pending', // Start as pending - admin will search and approve
        email_sent: false
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating opportunity request:', createError)
      return NextResponse.json(
        { error: 'Failed to create opportunity request' },
        { status: 500 }
      )
    }

    // Send email notification to admin (for review)
    try {
      const emailResult = await emailService.sendAdminOpportunityRequestNotification(
        opportunityRequest.id,
        company.name,
        company.industry || 'Not specified',
        location,
        company.business_type || 'Not specified',
        naicsCodes
      )

      if (emailResult.success) {
        await supabase
          .from('opportunity_requests')
          .update({ 
            email_sent: true, 
            email_sent_at: new Date().toISOString() 
          })
          .eq('id', opportunityRequest.id)
      }
    } catch (emailError) {
      console.error('Error sending admin email notification:', emailError)
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      request: opportunityRequest,
      message: 'Request submitted! Our team will find opportunities for you within 24 hours.'
    })

  } catch (error) {
    console.error('Error in opportunity request creation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
