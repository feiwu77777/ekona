import { NextRequest, NextResponse } from 'next/server';
import { blogPostsService } from '@/app/lib/blogPostsService';
import { addCorsHeaders, handleCors } from '@/app/lib/cors';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Handle CORS preflight
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  try {
    const postId = params.id;
    
    // For now, use a placeholder user ID
    // In a real implementation, you'd get this from authentication
    const userId = 'user-placeholder';

    const references = await blogPostsService.getBlogPostReferences(postId, userId);

    const response = NextResponse.json({ references });
    return addCorsHeaders(response, request);
  } catch (error) {
    console.error('Error fetching blog post references:', error);
    const errorResponse = NextResponse.json(
      { error: 'Failed to fetch blog post references' },
      { status: 500 }
    );
    return addCorsHeaders(errorResponse, request);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Handle CORS preflight
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  try {
    const postId = params.id;
    const referenceData = await request.json();

    // Validate required fields
    if (!referenceData.title || !referenceData.url || !referenceData.source) {
      return NextResponse.json(
        { error: 'Missing required fields: title, url, source' },
        { status: 400 }
      );
    }

    // For now, use a placeholder user ID
    // In a real implementation, you'd get this from authentication
    const userId = 'user-placeholder';

    const reference = await blogPostsService.addReferenceToBlogPost(postId, userId, {
      title: referenceData.title,
      url: referenceData.url,
      source: referenceData.source,
      published_at: referenceData.published_at || null,
      relevance_score: referenceData.relevance_score || 0.5,
      snippet: referenceData.snippet || null,
      domain: referenceData.domain || null
    });

    const response = NextResponse.json({ reference });
    return addCorsHeaders(response, request);
  } catch (error) {
    console.error('Error adding reference to blog post:', error);
    const errorResponse = NextResponse.json(
      { error: 'Failed to add reference to blog post' },
      { status: 500 }
    );
    return addCorsHeaders(errorResponse, request);
  }
}
