import { NextRequest, NextResponse } from 'next/server';
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

    // For now, use a placeholder user ID
    // In a real implementation, you'd get this from authentication
    const userId = 'user-placeholder';

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
