import { NextRequest, NextResponse } from 'next/server';
import { blogPostsService } from '@/app/lib/blogPostsService';
import { addCorsHeaders, handleCors } from '@/app/lib/cors';

export async function GET(request: NextRequest) {
  // Handle CORS preflight
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  try {
    // For now, use a placeholder user ID
    // In a real implementation, you'd get this from authentication
    const userId = 'user-placeholder';

    const stats = await blogPostsService.getImageStats(userId);

    if (!stats) {
      return NextResponse.json({
        total_images: 0,
        avg_relevance_score: 0,
        most_common_image_type: null,
        images_this_month: 0,
        total_image_size: 0
      });
    }

    const response = NextResponse.json(stats);
    return addCorsHeaders(response, request);
  } catch (error) {
    console.error('Error fetching image stats:', error);
    const errorResponse = NextResponse.json(
      { error: 'Failed to fetch image statistics' },
      { status: 500 }
    );
    return addCorsHeaders(errorResponse, request);
  }
}
