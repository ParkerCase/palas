import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { CreateOpportunityRequest, UpdateOpportunityRequest } from '@/types/opportunity-requests'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's company
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.company_id) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Get opportunity requests for the company
    const { data: requests, error } = await supabase
      .from('opportunity_requests')
      .select('*')
      .eq('company_id', profile.company_id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching opportunity requests:', error)
      return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 })
    }

    return NextResponse.json({ requests })
  } catch (error) {
    console.error('Error in GET /api/opportunity-requests:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's company
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.company_id) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Parse request body
    const body: CreateOpportunityRequest = await request.json()
    
    // Validate required fields
    if (!body.request_type || !body.target_counties || !body.industry_codes) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create opportunity request
    const { data: newRequest, error } = await supabase
      .from('opportunity_requests')
      .insert({
        company_id: profile.company_id,
        requested_by: user.id,
        request_type: body.request_type,
        target_counties: body.target_counties,
        target_cities: body.target_cities || [],
        industry_codes: body.industry_codes,
        budget_min: body.budget_min,
        budget_max: body.budget_max,
        notes: body.notes
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating opportunity request:', error)
      return NextResponse.json({ error: 'Failed to create request' }, { status: 500 })
    }

    return NextResponse.json({ request: newRequest }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/opportunity-requests:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's company
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.company_id) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Parse request body
    const body: UpdateOpportunityRequest & { id: string } = await request.json()
    
    if (!body.id) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 })
    }

    // Update opportunity request
    const { data: updatedRequest, error } = await supabase
      .from('opportunity_requests')
      .update({
        request_type: body.request_type,
        target_counties: body.target_counties,
        target_cities: body.target_cities,
        industry_codes: body.industry_codes,
        budget_min: body.budget_min,
        budget_max: body.budget_max,
        status: body.status,
        notes: body.notes
      })
      .eq('id', body.id)
      .eq('company_id', profile.company_id) // Ensure user can only update their company's requests
      .select()
      .single()

    if (error) {
      console.error('Error updating opportunity request:', error)
      return NextResponse.json({ error: 'Failed to update request' }, { status: 500 })
    }

    if (!updatedRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    return NextResponse.json({ request: updatedRequest })
  } catch (error) {
    console.error('Error in PUT /api/opportunity-requests:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's company
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.company_id) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Get request ID from URL
    const { searchParams } = new URL(request.url)
    const requestId = searchParams.get('id')
    
    if (!requestId) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 })
    }

    // Delete opportunity request
    const { error } = await supabase
      .from('opportunity_requests')
      .delete()
      .eq('id', requestId)
      .eq('company_id', profile.company_id) // Ensure user can only delete their company's requests

    if (error) {
      console.error('Error deleting opportunity request:', error)
      return NextResponse.json({ error: 'Failed to delete request' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Request deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/opportunity-requests:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
