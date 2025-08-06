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

// GET /api/resumes - Get all user resumes
export async function GET(request: NextRequest) {
  try {
    // Get user ID from Authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in to access your resumes.' },
        { status: 401 }
      );
    }

    const accessToken = authHeader.substring(7);
    
    // Verify auth with service role client
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { error: 'Invalid authentication token. Please sign in again.' },
        { status: 401 }
      );
    }

    // Use service role client for database operations (bypasses RLS)
    const { data, error } = await supabase
      .from('user_resumes')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch resumes. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ resumes: data || [] });

  } catch (error) {
    console.error('Error fetching resumes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch resumes. Please try again.' },
      { status: 500 }
    );
  }
}

// POST /api/resumes - Create or update a resume
export async function POST(request: NextRequest) {
  try {
    const { title, latexContent, isPrimary, resumeId } = await request.json();

    if (!title || !latexContent) {
      return NextResponse.json(
        { error: 'Title and LaTeX content are required' },
        { status: 400 }
      );
    }

    // Get user ID from Authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in to save your resume.' },
        { status: 401 }
      );
    }

    const accessToken = authHeader.substring(7);
    
    // Verify auth with service role client
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { error: 'Invalid authentication token. Please sign in again.' },
        { status: 401 }
      );
    }

    // Use service role client for database operations (bypasses RLS)
    const resumeData = {
      user_id: user.id,
      title: title.trim() || 'My Resume',
      latex_content: latexContent,
      is_primary: isPrimary || false,
      updated_at: new Date().toISOString()
    };

    let result;
    
    if (resumeId) {
      // Update existing resume
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
      result = data;
    } else {
      // Create new resume
      const { data, error } = await supabase
        .from('user_resumes')
        .insert(resumeData)
        .select()
        .single();

      if (error) {
        console.error('Error creating resume:', error);
        return NextResponse.json(
          { error: 'Failed to save resume. Please try again.' },
          { status: 500 }
        );
      }
      result = data;
    }

    return NextResponse.json({ resume: result });

  } catch (error) {
    console.error('Error saving resume:', error);
    return NextResponse.json(
      { error: 'Failed to save resume. Please try again.' },
      { status: 500 }
    );
  }
} 