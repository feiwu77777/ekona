import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client using service role key to bypass RLS
// API routes are already secured by authentication checks
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

async function getAuthenticatedUser(request: NextRequest): Promise<any | null> {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  try {
    const accessToken = authHeader.substring(7);
    
    // Verify auth with service role client
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      console.error('Auth error:', error);
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('Error getting user from token:', error);
    return null;
  }
}

// DELETE /api/resumes/[id] - Delete a specific resume
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in.' },
        { status: 401 }
      );
    }

    const params = await context.params;
    const { id: resumeId } = params;
    
    if (!resumeId) {
      return NextResponse.json(
        { error: 'Resume ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('user_resumes')
      .delete()
      .eq('id', resumeId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting resume:', error);
      return NextResponse.json(
        { error: 'Failed to delete resume. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting resume:', error);
    return NextResponse.json(
      { error: 'Failed to delete resume. Please try again.' },
      { status: 500 }
    );
  }
}

// PATCH /api/resumes/[id] - Update resume or set as primary
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in.' },
        { status: 401 }
      );
    }

    const params = await context.params;
    const { id: resumeId } = params;
    const body = await request.json();
    
    if (!resumeId) {
      return NextResponse.json(
        { error: 'Resume ID is required' },
        { status: 400 }
      );
    }

    // Handle setting as primary
    if (body.setPrimary === true) {
      const { error } = await supabase
        .from('user_resumes')
        .update({ is_primary: true, updated_at: new Date().toISOString() })
        .eq('id', resumeId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error setting primary resume:', error);
        return NextResponse.json(
          { error: 'Failed to set resume as primary. Please try again.' },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true });
    }

    // Handle general update
    const { title, latexContent, isPrimary } = body;
    
    if (!title || !latexContent) {
      return NextResponse.json(
        { error: 'Title and LaTeX content are required for updates' },
        { status: 400 }
      );
    }

    const resumeData = {
      user_id: user.id,
      title: title.trim() || 'My Resume',
      latex_content: latexContent,
      is_primary: isPrimary || false,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('user_resumes')
      .update(resumeData)
      .eq('id', resumeId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating resume:', error);
      return NextResponse.json(
        { error: 'Failed to update resume. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ resume: data });

  } catch (error) {
    console.error('Error updating resume:', error);
    return NextResponse.json(
      { error: 'Failed to update resume. Please try again.' },
      { status: 500 }
    );
  }
}

// GET /api/resumes/[id] - Get a specific resume
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in.' },
        { status: 401 }
      );
    }

    const params = await context.params;
    const { id: resumeId } = params;
    
    if (!resumeId) {
      return NextResponse.json(
        { error: 'Resume ID is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('user_resumes')
      .select('*')
      .eq('id', resumeId)
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching resume by ID:', error);
      return NextResponse.json(
        { error: 'Resume not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ resume: data });

  } catch (error) {
    console.error('Error fetching resume:', error);
    return NextResponse.json(
      { error: 'Failed to fetch resume. Please try again.' },
      { status: 500 }
    );
  }
} 