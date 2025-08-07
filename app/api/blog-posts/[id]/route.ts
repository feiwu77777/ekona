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
): Promise<NextResponse> {
  // Handle CORS preflight
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  try {
    const postId = params.id;
    const userId = await getAuthenticatedUserId(request);

    const blogPost = await blogPostsService.getBlogPost(postId, userId);

    if (!blogPost) {
      return NextResponse.json(
        { error: 'Blog post not found' },
        { status: 404 }
      );
    }

    const response = NextResponse.json(blogPost);
    return addCorsHeaders(response, request);
  } catch (error) {
    console.error('Error fetching blog post:', error);
    
    if (error instanceof Error && (error.message === 'Authentication required' || error.message === 'Invalid authentication token')) {
      const errorResponse = NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
      return addCorsHeaders(errorResponse, request);
    }
    
    const errorResponse = NextResponse.json(
      { error: 'Failed to fetch blog post' },
      { status: 500 }
    );
    return addCorsHeaders(errorResponse, request);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Handle CORS preflight
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  try {
    const postId = params.id;
    const updateData = await request.json();
    const userId = await getAuthenticatedUserId(request);

    // Validate that the blog post exists and belongs to the user
    const existingPost = await blogPostsService.getBlogPost(postId, userId);
    if (!existingPost) {
      return NextResponse.json(
        { error: 'Blog post not found' },
        { status: 404 }
      );
    }

    // Update the blog post
    const updatedPost = await blogPostsService.updateBlogPost(postId, userId, updateData);

    const response = NextResponse.json(updatedPost);
    return addCorsHeaders(response, request);
  } catch (error) {
    console.error('Error updating blog post:', error);
    
    if (error instanceof Error && (error.message === 'Authentication required' || error.message === 'Invalid authentication token')) {
      const errorResponse = NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
      return addCorsHeaders(errorResponse, request);
    }
    
    const errorResponse = NextResponse.json(
      { error: 'Failed to update blog post' },
      { status: 500 }
    );
    return addCorsHeaders(errorResponse, request);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Handle CORS preflight
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  try {
    const postId = params.id;
    const userId = await getAuthenticatedUserId(request);

    // Validate that the blog post exists and belongs to the user
    const existingPost = await blogPostsService.getBlogPost(postId, userId);
    if (!existingPost) {
      return NextResponse.json(
        { error: 'Blog post not found' },
        { status: 404 }
      );
    }

    // Delete the blog post
    await blogPostsService.deleteBlogPost(postId, userId);

    const response = NextResponse.json({ message: 'Blog post deleted successfully' });
    return addCorsHeaders(response, request);
  } catch (error) {
    console.error('Error deleting blog post:', error);
    
    if (error instanceof Error && (error.message === 'Authentication required' || error.message === 'Invalid authentication token')) {
      const errorResponse = NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
      return addCorsHeaders(errorResponse, request);
    }
    
    const errorResponse = NextResponse.json(
      { error: 'Failed to delete blog post' },
      { status: 500 }
    );
    return addCorsHeaders(errorResponse, request);
  }
}
