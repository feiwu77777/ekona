import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/app/lib/supabaseClient';
import { userSessionService } from '@/app/lib/userSessionService';
import { addCorsHeaders, handleCors } from '@/app/lib/cors';

export async function POST(request: NextRequest) {
  // Handle CORS preflight
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  try {
    const {
      activityType,
      activityData = {},
      durationMs,
      success = true,
      errorMessage,
      blogPostId,
      sessionId,
      ipAddress,
      userAgent
    } = await request.json();

    if (!activityType) {
      return NextResponse.json(
        { error: 'Missing required field: activityType' },
        { status: 400 }
      );
    }

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
    const activityId = await userSessionService.logUserActivity(
      userId,
      activityType,
      activityData,
      durationMs,
      success,
      errorMessage,
      blogPostId,
      sessionId,
      ipAddress,
      userAgent
    );

    const response = NextResponse.json({ 
      message: 'Activity logged successfully',
      activity_id: activityId 
    });
    return addCorsHeaders(response, request);
  } catch (error) {
    console.error('Error logging user activity:', error);
    
    if (error instanceof Error && (error.message === 'Authentication required' || error.message === 'Invalid authentication token')) {
      const errorResponse = NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
      return addCorsHeaders(errorResponse, request);
    }
    
    const errorResponse = NextResponse.json(
      { error: 'Failed to log user activity' },
      { status: 500 }
    );
    return addCorsHeaders(errorResponse, request);
  }
}

export async function GET(request: NextRequest) {
  // Handle CORS preflight
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const activityType = searchParams.get('activityType') || undefined;

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
    const activities = await userSessionService.getUserActivityLog(
      userId,
      limit,
      offset,
      activityType
    );

    const response = NextResponse.json({ activities });
    return addCorsHeaders(response, request);
  } catch (error) {
    console.error('Error fetching user activity log:', error);
    
    if (error instanceof Error && (error.message === 'Authentication required' || error.message === 'Invalid authentication token')) {
      const errorResponse = NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
      return addCorsHeaders(errorResponse, request);
    }
    
    const errorResponse = NextResponse.json(
      { error: 'Failed to fetch user activity log' },
      { status: 500 }
    );
    return addCorsHeaders(errorResponse, request);
  }
}
