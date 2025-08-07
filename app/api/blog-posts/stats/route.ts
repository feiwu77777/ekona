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

    const stats = await blogPostsService.getBlogPostStats(userId);

    if (!stats) {
      return NextResponse.json({
        total_posts: 0,
        total_words: 0,
        avg_words_per_post: 0,
        most_common_tone: null,
        generation_time_avg: 0
      });
    }

    const response = NextResponse.json(stats);
    return addCorsHeaders(response, request);
  } catch (error) {
    console.error('Error fetching blog post stats:', error);
    const errorResponse = NextResponse.json(
      { error: 'Failed to fetch blog post statistics' },
      { status: 500 }
    );
    return addCorsHeaders(errorResponse, request);
  }
}
