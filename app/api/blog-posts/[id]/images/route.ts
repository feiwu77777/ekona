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

    const images = await blogPostsService.getBlogPostImages(postId, userId);

    const response = NextResponse.json({ images });
    return addCorsHeaders(response, request);
  } catch (error) {
    console.error('Error fetching blog post images:', error);
    const errorResponse = NextResponse.json(
      { error: 'Failed to fetch blog post images' },
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
    const imageData = await request.json();

    // Validate required fields
    if (!imageData.image_id || !imageData.url) {
      return NextResponse.json(
        { error: 'Missing required fields: image_id, url' },
        { status: 400 }
      );
    }

    // For now, use a placeholder user ID
    // In a real implementation, you'd get this from authentication
    const userId = 'user-placeholder';

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
    const errorResponse = NextResponse.json(
      { error: 'Failed to add image to blog post' },
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
    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get('image_id');

    if (!imageId) {
      return NextResponse.json(
        { error: 'Missing image_id parameter' },
        { status: 400 }
      );
    }

    // For now, use a placeholder user ID
    // In a real implementation, you'd get this from authentication
    const userId = 'user-placeholder';

    await blogPostsService.removeImageFromBlogPost(postId, userId, imageId);

    const response = NextResponse.json({ message: 'Image removed successfully' });
    return addCorsHeaders(response, request);
  } catch (error) {
    console.error('Error removing image from blog post:', error);
    const errorResponse = NextResponse.json(
      { error: 'Failed to remove image from blog post' },
      { status: 500 }
    );
    return addCorsHeaders(errorResponse, request);
  }
}
