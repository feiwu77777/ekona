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
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  // Handle CORS preflight
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  try {
    const { id: postId } = await params;
    const userId = await getAuthenticatedUserId(request);

    const images = await blogPostsService.getBlogPostImages(postId, userId);

    const response = NextResponse.json({ images });
    return addCorsHeaders(response, request);
  } catch (error) {
    console.error('Error fetching blog post images:', error);
    
    if (error instanceof Error && (error.message === 'Authentication required' || error.message === 'Invalid authentication token')) {
      const errorResponse = NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
      return addCorsHeaders(errorResponse, request);
    }
    
    const errorResponse = NextResponse.json(
      { error: 'Failed to fetch blog post images' },
      { status: 500 }
    );
    return addCorsHeaders(errorResponse, request);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  // Handle CORS preflight
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  try {
    const { id: postId } = await params;
    const imageData = await request.json();

    // Validate required fields
    if (!imageData.image_id || !imageData.url) {
      return NextResponse.json(
        { error: 'Missing required fields: image_id, url' },
        { status: 400 }
      );
    }

    const userId = await getAuthenticatedUserId(request);

    const image = await blogPostsService.addImageToBlogPost(postId, userId, {
      image_id: imageData.image_id,
      url: imageData.url,
      alt_text: imageData.alt_text || null,
      photographer: imageData.photographer || null,
      photographer_url: imageData.photographer_url || null,
      download_url: imageData.download_url || null,
      relevance_score: imageData.relevance_score || 0.5,
      section_index: imageData.section_index || 0,
      image_type: imageData.image_type || 'unsplash',
      width: imageData.width || null,
      height: imageData.height || null,
      file_size: imageData.file_size || null
    });

    const response = NextResponse.json({ image });
    return addCorsHeaders(response, request);
  } catch (error) {
    console.error('Error adding image to blog post:', error);
    
    if (error instanceof Error && (error.message === 'Authentication required' || error.message === 'Invalid authentication token')) {
      const errorResponse = NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
      return addCorsHeaders(errorResponse, request);
    }
    
    const errorResponse = NextResponse.json(
      { error: 'Failed to add image to blog post' },
      { status: 500 }
    );
    return addCorsHeaders(errorResponse, request);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  // Handle CORS preflight
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  try {
    const { id: postId } = await params;
    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get('image_id');

    if (!imageId) {
      return NextResponse.json(
        { error: 'Missing image_id parameter' },
        { status: 400 }
      );
    }

    const userId = await getAuthenticatedUserId(request);

    await blogPostsService.removeImageFromBlogPost(postId, userId, imageId);

    const response = NextResponse.json({ message: 'Image removed successfully' });
    return addCorsHeaders(response, request);
  } catch (error) {
    console.error('Error removing image from blog post:', error);
    
    if (error instanceof Error && (error.message === 'Authentication required' || error.message === 'Invalid authentication token')) {
      const errorResponse = NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
      return addCorsHeaders(errorResponse, request);
    }
    
    const errorResponse = NextResponse.json(
      { error: 'Failed to remove image from blog post' },
      { status: 500 }
    );
    return addCorsHeaders(errorResponse, request);
  }
}
