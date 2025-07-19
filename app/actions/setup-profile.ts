'use server'

import { createServerComponentClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function setupProfile(formData: FormData) {
  try {
    const supabase = await createServerComponentClient()
    
    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      throw new Error('User not authenticated')
    }

    const fullName = formData.get('fullName') as string
    const companyName = formData.get('companyName') as string
    const role = formData.get('role') as string || 'company_owner'

    if (!fullName || !companyName) {
      throw new Error('Full name and company name are required')
    }

    // Create service role client to bypass RLS for initial setup
    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Create company first using service role
    const { data: company, error: companyError } = await serviceClient
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
      throw new Error('Failed to create company')
    }

    // Create profile for the user using service role
    const { data: profile, error: profileError } = await serviceClient
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
      throw new Error('Failed to create profile')
    }

    // Redirect to dashboard
    redirect('/dashboard')
    
  } catch (error) {
    console.error('Profile setup error:', error)
    throw error
  }
} 