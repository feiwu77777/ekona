import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/app/lib/supabaseClient';
import { blogPostsService } from '@/app/lib/blogPostsService';
import { addCorsHeaders, handleCors } from '@/app/lib/cors';

export async function GET(request: NextRequest): Promise<NextResponse> {
  // Handle CORS preflight
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  try {
    // Get user ID from Authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const accessToken = authHeader.substring(7);
    
    // Verify auth with service role client
    const supabase = createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || undefined;
    const tone = searchParams.get('tone') as 'academic' | 'casual' | 'professional' | undefined;
    const keyword = searchParams.get('keyword') || undefined;

    const userId = user.id;

    let posts;
    let total = 0;
    let hasMore = false;

    if (search) {
      // Use full-text search
      const searchResults = await blogPostsService.searchBlogPosts(search, userId, limit);
      posts = searchResults;
      total = searchResults.length;
      hasMore = false; // Search doesn't support pagination yet
    } else if (tone) {
      // Get posts by tone
      posts = await blogPostsService.getBlogPostsByTone(userId, tone, limit);
      total = posts.length;
      hasMore = false; // Tone filtering doesn't support pagination yet
    } else if (keyword) {
      // Get posts by keyword
      posts = await blogPostsService.getBlogPostsByKeyword(userId, keyword, limit);
      total = posts.length;
      hasMore = false; // Keyword filtering doesn't support pagination yet
    } else {
      // Get paginated posts
      const result = await blogPostsService.getUserBlogPosts(userId, page, limit, search);
      posts = result.posts;
      total = result.total;
      hasMore = result.hasMore;
    }

    const response = NextResponse.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        hasMore
      }
    });

    return addCorsHeaders(response, request);
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    const errorResponse = NextResponse.json(
      { error: 'Failed to fetch blog posts' },
      { status: 500 }
    );
    return addCorsHeaders(errorResponse, request);
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Handle CORS preflight
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  try {
    // Get user ID from Authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const accessToken = authHeader.substring(7);
    
    // Verify auth with service role client
    const supabase = createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    const blogPostData = await request.json();

    // Validate required fields
    if (!blogPostData.title || !blogPostData.content || !blogPostData.topic || !blogPostData.tone) {
      return NextResponse.json(
        { error: 'Missing required fields: title, content, topic, tone' },
        { status: 400 }
      );
    }

    const userId = user.id;

    const savedPost = await blogPostsService.saveBlogPost({
      user_id: userId,
      title: blogPostData.title,
      content: blogPostData.content,
      topic: blogPostData.topic,
      tone: blogPostData.tone,
      word_count: blogPostData.word_count || 0,
      generation_time: blogPostData.generation_time || null,
      model_used: blogPostData.model_used || 'gemini-2.5-pro',
      metadata: blogPostData.metadata || {},
      keywords: blogPostData.keywords || []
    });

    const response = NextResponse.json(savedPost);
    return addCorsHeaders(response, request);
  } catch (error) {
    console.error('Error creating blog post:', error);
    const errorResponse = NextResponse.json(
      { error: 'Failed to create blog post' },
      { status: 500 }
    );
    return addCorsHeaders(errorResponse, request);
  }
}
