import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// GET /api/grants - List available grants
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies });
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const category = searchParams.get('category');
    const agency = searchParams.get('agency');

    // Build query
    let query = supabase
      .from('grants')
      .select('*')
      .order('deadline', { ascending: true })
      .range(offset, offset + limit - 1);

    if (category) {
      query = query.eq('category', category);
    }

    if (agency) {
      query = query.eq('agency', agency);
    }

    const { data: grants, error } = await query;

    if (error) {
      console.error('Grants fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch grants' }, { status: 500 });
    }

    return NextResponse.json({ grants });
  } catch (error) {
    console.error('Grants API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/grants - Create new grant opportunity
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies });
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      agency,
      category,
      amount,
      deadline,
      eligibility,
      requirements,
      contact_info
    } = body;

    if (!title || !description || !agency || !amount || !deadline) {
      return NextResponse.json({ 
        error: 'Title, description, agency, amount, and deadline are required' 
      }, { status: 400 });
    }

    // Create grant
    const { data: grant, error } = await supabase
      .from('grants')
      .insert({
        title,
        description,
        agency,
        category: category || 'General',
        amount,
        deadline,
        eligibility: eligibility || 'Open to all qualified applicants',
        requirements: requirements || 'Standard application requirements',
        contact_info: contact_info || {},
        created_by: user.id,
        status: 'active'
      })
      .select()
      .single();

    if (error) {
      console.error('Grant creation error:', error);
      return NextResponse.json({ error: 'Failed to create grant' }, { status: 500 });
    }

    return NextResponse.json({ grant }, { status: 201 });
  } catch (error) {
    console.error('Grants API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/grants - Update grant
export async function PUT(request: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies });
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Grant ID is required' }, { status: 400 });
    }

    // Update grant
    const { data: grant, error } = await supabase
      .from('grants')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Grant update error:', error);
      return NextResponse.json({ error: 'Failed to update grant' }, { status: 500 });
    }

    return NextResponse.json({ grant });
  } catch (error) {
    console.error('Grants API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/grants - Delete grant
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies });
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Grant ID is required' }, { status: 400 });
    }

    // Delete grant
    const { error } = await supabase
      .from('grants')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Grant deletion error:', error);
      return NextResponse.json({ error: 'Failed to delete grant' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Grant deleted successfully' });
  } catch (error) {
    console.error('Grants API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 