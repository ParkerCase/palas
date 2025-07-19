import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// GET /api/companies - List user's companies
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies });
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's profile to get company_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile?.company_id) {
      return NextResponse.json({ error: 'No company found for user' }, { status: 404 });
    }

    // Get company details
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', profile.company_id)
      .single();

    if (companyError) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    return NextResponse.json({ company });
  } catch (error) {
    console.error('Companies API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/companies - Create new company
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies });
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, industry, size, location, description } = body;

    if (!name) {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 });
    }

    // Create company
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({
        name,
        industry: industry || 'General',
        size: size || 'Small',
        location: location || 'United States',
        description: description || '',
        created_by: user.id
      })
      .select()
      .single();

    if (companyError) {
      console.error('Company creation error:', companyError);
      return NextResponse.json({ error: 'Failed to create company' }, { status: 500 });
    }

    // Update user profile with company_id
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        user_id: user.id,
        company_id: company.id,
        updated_at: new Date().toISOString()
      });

    if (profileError) {
      console.error('Profile update error:', profileError);
      // Continue anyway as company was created
    }

    return NextResponse.json({ company }, { status: 201 });
  } catch (error) {
    console.error('Companies API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/companies - Update company
export async function PUT(request: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies });
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, industry, size, location, description } = body;

    // Get user's company_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile?.company_id) {
      return NextResponse.json({ error: 'No company found for user' }, { status: 404 });
    }

    // Update company
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .update({
        name: name || undefined,
        industry: industry || undefined,
        size: size || undefined,
        location: location || undefined,
        description: description || undefined,
        updated_at: new Date().toISOString()
      })
      .eq('id', profile.company_id)
      .select()
      .single();

    if (companyError) {
      console.error('Company update error:', companyError);
      return NextResponse.json({ error: 'Failed to update company' }, { status: 500 });
    }

    return NextResponse.json({ company });
  } catch (error) {
    console.error('Companies API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/companies - Delete company
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies });
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's company_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile?.company_id) {
      return NextResponse.json({ error: 'No company found for user' }, { status: 404 });
    }

    // Delete company
    const { error: companyError } = await supabase
      .from('companies')
      .delete()
      .eq('id', profile.company_id);

    if (companyError) {
      console.error('Company deletion error:', companyError);
      return NextResponse.json({ error: 'Failed to delete company' }, { status: 500 });
    }

    // Remove company_id from profile
    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update({ company_id: null })
      .eq('user_id', user.id);

    if (profileUpdateError) {
      console.error('Profile update error:', profileUpdateError);
      // Continue anyway as company was deleted
    }

    return NextResponse.json({ message: 'Company deleted successfully' });
  } catch (error) {
    console.error('Companies API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 