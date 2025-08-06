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

export async function POST(request: NextRequest) {
  try {
    const {
      job_title,
      company_name,
      job_description,
      job_url,
      original_resume_id,
      original_resume_content,
      generation_options,
      tailored_resume_content,
      cover_letter_content,
      standard_answers,
      custom_answers,
      llm_provider,
      model_used,
      prompt_version,
    } = await request.json();

    if (!job_description || !tailored_resume_content || !llm_provider || !model_used) {
      return NextResponse.json(
        { error: 'Missing required fields: job_description, tailored_resume_content, llm_provider, model_used' },
        { status: 400 }
      );
    }

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

    // Insert the tailoring history record
    const { data: historyRecord, error: insertError } = await supabase
      .from('resume_tailoring_history')
      .insert({
        user_id: userId,
        job_title,
        company_name,
        job_description,
        job_url,
        original_resume_id,
        original_resume_content,
        generation_options,
        tailored_resume_content,
        cover_letter_content,
        standard_answers,
        custom_answers,
        llm_provider,
        model_used,
        prompt_version,
        status: 'created',
        applied_with_this_version: false,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting tailoring history:', insertError);
      return NextResponse.json(
        { error: 'Failed to save tailoring history' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      id: historyRecord.id 
    });

  } catch (error) {
    console.error('Error saving tailoring history:', error);
    return NextResponse.json(
      { error: 'Failed to save tailoring history' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
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

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const appliedOnly = searchParams.get('applied_only') === 'true';
    const company = searchParams.get('company');
    const jobTitle = searchParams.get('job_title');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = supabase
      .from('resume_tailoring_history')
      .select('*')
      .eq('user_id', userId)
      .order('tailoring_date', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (appliedOnly) {
      query = query.eq('applied_with_this_version', true);
    }

    if (company) {
      query = query.ilike('company_name', `%${company}%`);
    }

    if (jobTitle) {
      query = query.ilike('job_title', `%${jobTitle}%`);
    }

    const { data: historyRecords, error: fetchError } = await query;

    if (fetchError) {
      console.error('Error fetching tailoring history:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch tailoring history' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      data: historyRecords,
      pagination: {
        limit,
        offset,
        hasMore: historyRecords.length === limit
      }
    });

  } catch (error) {
    console.error('Error fetching tailoring history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tailoring history' },
      { status: 500 }
    );
  }
} 