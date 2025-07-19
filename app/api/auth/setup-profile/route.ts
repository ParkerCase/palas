import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth/api'
import { createRouteHandlerClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    console.log('[SETUP PROFILE] Request received')
    console.log('[SETUP PROFILE] Available cookies:', request.cookies.getAll().map(c => c.name))
    
    // Get authenticated user
    const user = await getAuthUserFromRequest(request)
    
    console.log('[SETUP PROFILE] Auth result:', { hasUser: !!user, userId: user?.id })
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { companyName, fullName, role = 'company_owner' } = await request.json()

    if (!companyName || !fullName) {
      return NextResponse.json({ 
        error: 'Company name and full name are required' 
      }, { status: 400 })
    }

    const supabase = createRouteHandlerClient(request)

    // Create company first
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({
        name: companyName,
        slug: companyName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        industry: 'Technology', // Default, can be updated later
        business_type: 'Small Business',
        company_size: '1-10 employees',
        is_active: true
      })
      .select()
      .single()

    if (companyError) {
      console.error('Company creation error:', companyError)
      return NextResponse.json({ 
        error: 'Failed to create company' 
      }, { status: 500 })
    }

    // Create profile for the user
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email!,
        full_name: fullName,
        role: role as 'admin' | 'company_owner' | 'team_member',
        company_id: company.id,
        email_verified: user.email_confirmed_at ? true : false,
        onboarding_completed: true
      })
      .select()
      .single()

    if (profileError) {
      console.error('Profile creation error:', profileError)
      return NextResponse.json({ 
        error: 'Failed to create profile' 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Profile and company created successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          full_name: fullName,
          role: role
        },
        company: {
          id: company.id,
          name: company.name,
          slug: company.slug
        }
      }
    })

  } catch (error) {
    console.error('Profile setup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 