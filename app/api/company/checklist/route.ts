import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's company
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (!profile?.company_id) {
      return NextResponse.json({ error: 'No company found' }, { status: 404 })
    }

    // Get checklist for company
    const { data: checklist, error } = await supabase
      .from('company_checklist')
      .select('*')
      .eq('company_id', profile.company_id)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      throw error
    }

    if (!checklist) {
      // Create new checklist if it doesn't exist
      const { data: newChecklist, error: createError } = await supabase
        .from('company_checklist')
        .insert({
          company_id: profile.company_id,
          // All boolean fields default to false
        })
        .select()
        .single()

      if (createError) throw createError
      return NextResponse.json(newChecklist)
    }

    return NextResponse.json(checklist)
  } catch (error) {
    console.error('Error fetching checklist:', error)
    return NextResponse.json(
      { error: 'Failed to fetch checklist' },
      { status: 500 }
    )
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
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id, role')
      .eq('id', user.id)
      .single()

    if (!profile?.company_id) {
      return NextResponse.json({ error: 'No company found' }, { status: 404 })
    }

    // Check if user can manage checklist
    if (profile.role !== 'company_owner' && profile.role !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { field, value } = body

    if (!field || (typeof value !== 'boolean' && typeof value !== 'string')) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    // Update checklist
    const { data: updatedChecklist, error } = await supabase
      .from('company_checklist')
      .update({ 
        [field]: value,
        last_updated_by: user.id
      })
      .eq('company_id', profile.company_id)
      .select()
      .single()

    if (error) {
      // If checklist doesn't exist, create it
      if (error.code === 'PGRST116') {
        const { data: newChecklist, error: createError } = await supabase
          .from('company_checklist')
          .insert({
            company_id: profile.company_id,
            [field]: value,
            last_updated_by: user.id
          })
          .select()
          .single()

        if (createError) throw createError
        return NextResponse.json(newChecklist)
      }
      throw error
    }

    return NextResponse.json(updatedChecklist)
  } catch (error) {
    console.error('Error updating checklist:', error)
    return NextResponse.json(
      { error: 'Failed to update checklist' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's company
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id, role')
      .eq('id', user.id)
      .single()

    if (!profile?.company_id) {
      return NextResponse.json({ error: 'No company found' }, { status: 404 })
    }

    // Check if user can manage checklist
    if (profile.role !== 'company_owner' && profile.role !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { updates, notes } = body

    if (!updates || typeof updates !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    // Prepare update object
    const updateData: any = {
      last_updated_by: user.id
    }

    // Add boolean field updates
    Object.keys(updates).forEach(key => {
      if (typeof updates[key] === 'boolean') {
        updateData[key] = updates[key]
      }
    })

    // Add notes if provided
    if (notes !== undefined) {
      updateData.notes = notes
    }

    // Update checklist
    const { data: updatedChecklist, error } = await supabase
      .from('company_checklist')
      .update(updateData)
      .eq('company_id', profile.company_id)
      .select()
      .single()

    if (error) {
      // If checklist doesn't exist, create it
      if (error.code === 'PGRST116') {
        const { data: newChecklist, error: createError } = await supabase
          .from('company_checklist')
          .insert({
            company_id: profile.company_id,
            ...updateData
          })
          .select()
          .single()

        if (createError) throw createError
        return NextResponse.json(newChecklist)
      }
      throw error
    }

    return NextResponse.json(updatedChecklist)
  } catch (error) {
    console.error('Error updating checklist:', error)
    return NextResponse.json(
      { error: 'Failed to update checklist' },
      { status: 500 }
    )
  }
}
