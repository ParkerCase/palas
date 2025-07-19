import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient(request)
    
    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    
    // Test inserting a company
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({
        name: 'Test Company RLS',
        slug: 'test-company-rls',
        industry: 'Technology',
        business_type: 'Small Business',
        company_size: '1-10 employees',
        is_active: true
      })
      .select()
      .single()
    
    // Test inserting a profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email!,
        full_name: 'Test User RLS',
        role: 'company_owner',
        company_id: company?.id,
        email_verified: true,
        onboarding_completed: true
      })
      .select()
      .single()
    
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email
      },
      company: {
        success: !companyError,
        error: companyError?.message,
        data: company
      },
      profile: {
        success: !profileError,
        error: profileError?.message,
        data: profile
      }
    })
    
  } catch (error) {
    console.error('RLS test error:', error)
    return NextResponse.json({ error: 'RLS test failed' }, { status: 500 })
  }
} 