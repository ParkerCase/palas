import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient(request)
    
    // Test if companies table exists
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('count')
      .limit(1)
    
    // Test if profiles table exists
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
    
    return NextResponse.json({
      companies: {
        exists: !companiesError,
        error: companiesError?.message
      },
      profiles: {
        exists: !profilesError,
        error: profilesError?.message
      }
    })
    
  } catch (error) {
    console.error('Database test error:', error)
    return NextResponse.json({ error: 'Database test failed' }, { status: 500 })
  }
} 