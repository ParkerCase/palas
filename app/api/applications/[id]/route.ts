import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's company from profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.company_id) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    const { data: application, error } = await supabase
      .from('applications')
      .select(`
        *,
        opportunities (*)
      `)
      .eq('id', params.id)
      .eq('company_id', profile.company_id)
      .single()

    if (error || !application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    return NextResponse.json(application)
  } catch (error) {
    console.error('Get application error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's company from profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.company_id) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    const updateData = await request.json()

    // Verify application belongs to company
    const { data: existing, error: checkError } = await supabase
      .from('applications')
      .select('status')
      .eq('id', params.id)
      .eq('company_id', profile.company_id)
      .single()

    if (checkError || !existing) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    // Don't allow updates to submitted applications unless it's status change
    if (existing.status === 'submitted' && updateData.status !== existing.status) {
      const allowedUpdates = ['status', 'notes']
      const hasDisallowedUpdates = Object.keys(updateData).some(key => !allowedUpdates.includes(key))
      
      if (hasDisallowedUpdates) {
        return NextResponse.json({ error: 'Cannot modify submitted application' }, { status: 400 })
      }
    }

    const { data: application, error } = await supabase
      .from('applications')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
        // Set submitted_at when status changes to submitted
        ...(updateData.status === 'submitted' && existing.status !== 'submitted' ? {
          submitted_at: new Date().toISOString()
        } : {})
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating application:', error)
      return NextResponse.json({ error: 'Failed to update application' }, { status: 500 })
    }

    return NextResponse.json(application)
  } catch (error) {
    console.error('Update application error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's company from profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.company_id) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Verify application belongs to company and is not submitted
    const { data: existing, error: checkError } = await supabase
      .from('applications')
      .select('status')
      .eq('id', params.id)
      .eq('company_id', profile.company_id)
      .single()

    if (checkError || !existing) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    if (existing.status !== 'draft') {
      return NextResponse.json({ error: 'Cannot delete non-draft application' }, { status: 400 })
    }

    const { error } = await supabase
      .from('applications')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Error deleting application:', error)
      return NextResponse.json({ error: 'Failed to delete application' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete application error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
