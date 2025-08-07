import { NextRequest, NextResponse } from 'next/server';
import { userSessionService } from '@/app/lib/userSessionService';
import { addCorsHeaders, handleCors } from '@/app/lib/cors';

export async function GET(request: NextRequest) {
  // Handle CORS preflight
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'session'; // session, activity, recent
    const days = parseInt(searchParams.get('days') || '7');

    // For now, use a placeholder user ID
    // In a real implementation, you'd get this from authentication
    const userId = 'user-placeholder';

    let stats;

    switch (type) {
      case 'session':
        stats = await userSessionService.getUserSessionStats(userId);
        break;
      case 'activity':
        const activities = await userSessionService.getUserActivityLog(userId, 100);
        stats = {
          total_activities: activities.length,
          activities_by_type: activities.reduce((acc: any, activity) => {
            acc[activity.activity_type] = (acc[activity.activity_type] || 0) + 1;
            return acc;
          }, {}),
          success_rate: activities.filter(a => a.success).length / activities.length
        };
        break;
      case 'recent':
        stats = await userSessionService.getRecentActivitySummary(userId, days);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid stats type. Use: session, activity, or recent' },
          { status: 400 }
        );
    }

    const response = NextResponse.json({ stats });
    return addCorsHeaders(response, request);
  } catch (error) {
    console.error('Error fetching user stats:', error);
    const errorResponse = NextResponse.json(
      { error: 'Failed to fetch user statistics' },
      { status: 500 }
    );
    return addCorsHeaders(errorResponse, request);
  }
}
