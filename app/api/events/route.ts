import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/app/lib/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, category, user_id, is_error = false, error_message, is_dev = false } = body;

    // Validate required fields
    if (!name || !user_id) {
      return NextResponse.json(
        { error: 'Missing required fields: name and user_id are required' },
        { status: 400 }
      );
    }

    // Use server-side Supabase client
    const supabase = createServerSupabase();

    // Log the event
    const { data, error } = await supabase
      .from('events')
      .insert({
        name,
        category,
        user_id,
        is_error,
        error_message,
        is_dev
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to log event:', error);
      return NextResponse.json(
        { error: 'Failed to log event' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in event logging route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 