import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/app/lib/supabaseClient';
import { blogPostsService } from '@/app/lib/blogPostsService';
import { addCorsHeaders, handleCors } from '@/app/lib/cors';

// Helper function to get authenticated user ID
async function getAuthenticatedUserId(request: NextRequest): Promise<string> {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Authentication required');
  }

  const accessToken = authHeader.substring(7);
  
  // Verify auth with service role client
  const supabase = createServerSupabase();
  const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
  
  if (authError || !user) {
    console.error('Auth error:', authError);
    throw new Error('Invalid authentication token');
  }

  return user.id;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Handle CORS preflight
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  try {
    const postId = params.id;
    const userId = await getAuthenticatedUserId(request);

    const references = await blogPostsService.getBlogPostReferences(postId, userId);

    const response = NextResponse.json({ references });
    return addCorsHeaders(response, request);
  } catch (error) {
    console.error('Error fetching blog post references:', error);
    
    if (error instanceof Error && (error.message === 'Authentication required' || error.message === 'Invalid authentication token')) {
      const errorResponse = NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
      return addCorsHeaders(errorResponse, request);
    }
    
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

    const userId = await getAuthenticatedUserId(request);

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
    
    if (error instanceof Error && (error.message === 'Authentication required' || error.message === 'Invalid authentication token')) {
      const errorResponse = NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
      return addCorsHeaders(errorResponse, request);
    }
    
    const errorResponse = NextResponse.json(
      { error: 'Failed to add reference to blog post' },
      { status: 500 }
    );
    return addCorsHeaders(errorResponse, request);
  }
}
