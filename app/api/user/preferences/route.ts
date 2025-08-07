import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/app/lib/supabaseClient';
import { userSessionService } from '@/app/lib/userSessionService';
import { addCorsHeaders, handleCors } from '@/app/lib/cors';

export async function GET(request: NextRequest) {
  // Handle CORS preflight
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  try {
    // Get user ID from Authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const accessToken = authHeader.substring(7);
    
    // Verify auth with service role client
    const supabase = createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    const userId = user.id;
    const preferences = await userSessionService.getUserPreferences(userId);

    const response = NextResponse.json({ preferences });
    return addCorsHeaders(response, request);
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    const errorResponse = NextResponse.json(
      { error: 'Failed to fetch user preferences' },
      { status: 500 }
    );
    return addCorsHeaders(errorResponse, request);
  }
}

export async function PUT(request: NextRequest) {
  // Handle CORS preflight
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  try {
    // Get user ID from Authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const accessToken = authHeader.substring(7);
    
    // Verify auth with service role client
    const supabase = createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    const preferencesData = await request.json();
    const userId = user.id;
    const preferenceId = await userSessionService.updateUserPreferences(userId, preferencesData);

    const response = NextResponse.json({ 
      message: 'Preferences updated successfully',
      preference_id: preferenceId 
    });
    return addCorsHeaders(response, request);
  } catch (error) {
    console.error('Error updating user preferences:', error);
    const errorResponse = NextResponse.json(
      { error: 'Failed to update user preferences' },
      { status: 500 }
    );
    return addCorsHeaders(errorResponse, request);
  }
}
