import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client using service role key to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get user ID from Authorization header
    const authHeader = request.headers.get('authorization');
    let userId: string | null = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error) {
          console.error('Auth error:', error);
          return NextResponse.json(
            { error: 'Invalid authentication token. Please sign in again.' },
            { status: 401 }
          );
        }
        userId = user?.id || null;
      } catch (error) {
        console.error('Error getting user from token:', error);
        return NextResponse.json(
          { error: 'Authentication failed. Please sign in again.' },
          { status: 401 }
        );
      }
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in to use this service.' },
        { status: 401 }
      );
    }

    // Fetch the specific tailoring history record
    const { data: historyRecord, error: fetchError } = await supabase
      .from('resume_tailoring_history')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      console.error('Error fetching tailoring history:', fetchError);
      return NextResponse.json(
        { error: 'Tailoring history not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: historyRecord });

  } catch (error) {
    console.error('Error fetching tailoring history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tailoring history' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const {
      status,
      notes,
      applied_with_this_version,
      cover_letter_content,
    } = await request.json();

    // Get user ID from Authorization header
    const authHeader = request.headers.get('authorization');
    let userId: string | null = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error) {
          console.error('Auth error:', error);
          return NextResponse.json(
            { error: 'Invalid authentication token. Please sign in again.' },
            { status: 401 }
          );
        }
        userId = user?.id || null;
      } catch (error) {
        console.error('Error getting user from token:', error);
        return NextResponse.json(
          { error: 'Authentication failed. Please sign in again.' },
          { status: 401 }
        );
      }
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in to use this service.' },
        { status: 401 }
      );
    }

    // Update the tailoring history record
    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (applied_with_this_version !== undefined) updateData.applied_with_this_version = applied_with_this_version;
    if (cover_letter_content !== undefined) updateData.cover_letter_content = cover_letter_content;

    // First check if the record exists and belongs to the user
    const { data: existingRecord, error: checkError } = await supabase
      .from('resume_tailoring_history')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (checkError) {
      console.error('Error checking record existence:', checkError);
      return NextResponse.json(
        { error: 'Record not found or access denied' },
        { status: 404 }
      );
    }

    const { data: updatedRecord, error: updateError } = await supabase
      .from('resume_tailoring_history')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating tailoring history:', updateError);
      return NextResponse.json(
        { error: 'Failed to update tailoring history' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      data: updatedRecord 
    });

  } catch (error) {
    console.error('Error updating tailoring history:', error);
    return NextResponse.json(
      { error: 'Failed to update tailoring history' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get user ID from Authorization header
    const authHeader = request.headers.get('authorization');
    let userId: string | null = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error) {
          console.error('Auth error:', error);
          return NextResponse.json(
            { error: 'Invalid authentication token. Please sign in again.' },
            { status: 401 }
          );
        }
        userId = user?.id || null;
      } catch (error) {
        console.error('Error getting user from token:', error);
        return NextResponse.json(
          { error: 'Authentication failed. Please sign in again.' },
          { status: 401 }
        );
      }
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in to use this service.' },
        { status: 401 }
      );
    }

    // Delete the tailoring history record
    const { error: deleteError } = await supabase
      .from('resume_tailoring_history')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (deleteError) {
      console.error('Error deleting tailoring history:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete tailoring history' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true 
    });

  } catch (error) {
    console.error('Error deleting tailoring history:', error);
    return NextResponse.json(
      { error: 'Failed to delete tailoring history' },
      { status: 500 }
    );
  }
} 