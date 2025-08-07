import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/app/lib/supabaseClient';
import { userSessionService } from '@/app/lib/userSessionService';
import { addCorsHeaders, handleCors } from '@/app/lib/cors';

export async function POST(request: NextRequest) {
  // Handle CORS preflight
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  try {
    const { sessionId, userAgent, ipAddress, deviceType, browser, os } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing required field: sessionId' },
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
    const sessionIdResult = await userSessionService.startUserSession(
      userId,
      sessionId,
      userAgent,
      ipAddress,
      deviceType,
      browser,
      os
    );

    const response = NextResponse.json({ 
      message: 'Session started successfully',
      session_id: sessionIdResult 
    });
    return addCorsHeaders(response, request);
  } catch (error) {
    console.error('Error starting user session:', error);
    
    if (error instanceof Error && (error.message === 'Authentication required' || error.message === 'Invalid authentication token')) {
      const errorResponse = NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
      return addCorsHeaders(errorResponse, request);
    }
    
    const errorResponse = NextResponse.json(
      { error: 'Failed to start user session' },
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
    const { 
      sessionId, 
      blogPostsCreated = 0, 
      blogPostsEdited = 0, 
      imagesSearched = 0, 
      referencesAdded = 0, 
      sessionData = {} 
    } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing required field: sessionId' },
        { status: 400 }
      );
    }

    await userSessionService.endUserSession(
      sessionId,
      blogPostsCreated,
      blogPostsEdited,
      imagesSearched,
      referencesAdded,
      sessionData
    );

    const response = NextResponse.json({ 
      message: 'Session ended successfully' 
    });
    return addCorsHeaders(response, request);
  } catch (error) {
    console.error('Error ending user session:', error);
    const errorResponse = NextResponse.json(
      { error: 'Failed to end user session' },
      { status: 500 }
    );
    return addCorsHeaders(errorResponse, request);
  }
}
