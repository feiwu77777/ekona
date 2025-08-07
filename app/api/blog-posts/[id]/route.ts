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

    // For now, use a placeholder user ID
    // In a real implementation, you'd get this from authentication
    const userId = 'user-placeholder';

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
    
    // For now, use a placeholder user ID
    // In a real implementation, you'd get this from authentication
    const userId = 'user-placeholder';

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
    const errorResponse = NextResponse.json(
      { error: 'Failed to delete blog post' },
      { status: 500 }
    );
    return addCorsHeaders(errorResponse, request);
  }
}
