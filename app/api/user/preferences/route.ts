import { NextRequest, NextResponse } from 'next/server';
import { userSessionService } from '@/app/lib/userSessionService';
import { addCorsHeaders, handleCors } from '@/app/lib/cors';

export async function GET(request: NextRequest) {
  // Handle CORS preflight
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  try {
    // For now, use a placeholder user ID
    // In a real implementation, you'd get this from authentication
    const userId = 'user-placeholder';

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
    const preferencesData = await request.json();

    // For now, use a placeholder user ID
    // In a real implementation, you'd get this from authentication
    const userId = 'user-placeholder';

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
