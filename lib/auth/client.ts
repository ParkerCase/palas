'use client'

import { supabase } from '@/lib/supabaseClient'

export async function signIn(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      return { success: false, error: error.message }
    }

    // Update last login time
    if (data.user) {
      await supabase
        .from('profiles')
        .update({ last_sign_in_at: new Date().toISOString() })
        .eq('id', data.user.id)
    }

    return { success: true }
  } catch (error) {
    console.error('Sign in error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function signUp(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  companyName: string,
  companySlug: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if company slug is available
    const { data: existingCompany } = await supabase
      .from('companies')
      .select('id')
      .eq('slug', companySlug)
      .single()

    if (existingCompany) {
      return { success: false, error: 'Company name is already taken' }
    }

    // Sign up user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          company_name: companyName,
          email: email
        }
      }
    })

    if (authError || !authData.user) {
      return { success: false, error: authError?.message || 'Failed to create account' }
    }

    // Create user profile in the database
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: email,
        full_name: `${firstName} ${lastName}`,
        company_name: companyName,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (profileError) {
      console.error('Profile creation error:', profileError)
      // Don't fail the signup if profile creation fails - it can be created later
    }

    // Create company record
    const { error: companyError } = await supabase
      .from('companies')
      .insert({
        name: companyName,
        slug: companySlug,
        owner_id: authData.user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (companyError) {
      console.error('Company creation error:', companyError)
      // Don't fail the signup if company creation fails - it can be created later
    }

    return { success: true }
  } catch (error) {
    console.error('Sign up error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function signOut(): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Sign out error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Reset password error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function updatePassword(
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Update password error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
