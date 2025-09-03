import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      requestId,
      userEmail,
      userName,
      companyName,
      requestType,
      description,
      budgetRange,
      locationPreference,
      industryFocus,
      companyProfile
    } = body

    // Validate required fields
    if (!requestId || !userEmail || !companyName || !requestType || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Send email notification to admin
    const emailContent = `
New Opportunity Request

Request ID: ${requestId}
User: ${userName} (${userEmail})
Company: ${companyName}

Request Details:
- Type: ${requestType}
- Description: ${description}
- Budget Range: ${budgetRange || 'Not specified'}
- Location Preference: ${locationPreference || 'Not specified'}
- Industry Focus: ${industryFocus || 'Not specified'}

Company Profile:
- Industry: ${companyProfile?.industry || 'Not specified'}
- Business Type: ${companyProfile?.businessType || 'Not specified'}
- Company Size: ${companyProfile?.companySize || 'Not specified'}
- Headquarters: ${companyProfile?.headquarters || 'Not specified'}
- NAICS Codes: ${companyProfile?.naicsCodes?.join(', ') || 'Not specified'}
- Annual Revenue: ${companyProfile?.annualRevenue || 'Not specified'}
- Years in Business: ${companyProfile?.yearsInBusiness || 'Not specified'}
- Employee Count: ${companyProfile?.employeeCount || 'Not specified'}

Please review this request and find matching opportunities from MatchAwards.com for this user.
    `.trim()

    // For now, we'll log the email content since we don't have email service configured
    console.log('OPPORTUNITY REQUEST NOTIFICATION:')
    console.log(emailContent)

    // TODO: Integrate with email service to send to parker@stroomai.com
    // For now, we'll store the notification in the database
    const { error: notificationError } = await supabase
      .from('admin_notifications')
      .insert({
        type: 'opportunity_request',
        user_id: user.id,
        user_email: userEmail,
        company_name: companyName,
        request_id: requestId,
        content: emailContent,
        status: 'pending',
        created_at: new Date().toISOString()
      })

    if (notificationError) {
      console.error('Failed to store notification:', notificationError)
    }

    return NextResponse.json({
      success: true,
      message: 'Opportunity request notification sent',
      requestId
    })

  } catch (error) {
    console.error('Opportunity request notification error:', error)
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    )
  }
}
