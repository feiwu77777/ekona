import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/app/lib/supabaseClient';
import { AgentOrchestrator } from '@/app/lib/agentOrchestrator';
import { blogPostsService } from '@/app/lib/blogPostsService';
import { blogGenerationRateLimit } from '@/app/lib/rateLimit';
import { addCorsHeaders, handleCors } from '@/app/lib/cors';


export async function POST(request: NextRequest) {
  // Handle CORS preflight
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  try {
    const { topic, tone, maxWords, includeImages } = await request.json();

    // Validate request
    if (!topic || !tone || !maxWords) {
      return NextResponse.json(
        { error: 'Missing required fields: topic, tone, maxWords' },
        { status: 400 }
      );
    }

    // Validate tone
    const validTones = ['academic', 'casual', 'professional'];
    if (!validTones.includes(tone)) {
      return NextResponse.json(
        { error: 'Invalid tone. Must be one of: academic, casual, professional' },
        { status: 400 }
      );
    }

    // Validate word count
    if (maxWords < 100 || maxWords > 2000) {
      return NextResponse.json(
        { error: 'Word count must be between 100 and 2000' },
        { status: 400 }
      );
    }

    // Get user ID from auth
    const authHeader = request.headers.get('authorization');
    let userId: string | null = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
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
      
      userId = user.id;
    }

    // Rate limiting
    const rateLimitId = userId || request.headers.get('x-forwarded-for') || 'anonymous';
    const rateLimit = blogGenerationRateLimit(rateLimitId);
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded. Please try again later.',
          resetTime: rateLimit.resetTime
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': rateLimit.resetTime.toString()
          }
        }
      );
    }

    // Initialize agent orchestrator
    const orchestrator = new AgentOrchestrator();

    // Generate blog using full agent workflow
    const result = await orchestrator.generateBlog({
      topic,
      tone: tone as 'academic' | 'casual' | 'professional',
      maxWords: Math.min(maxWords, 2000), // Enforce 2000 word limit
      includeImages: includeImages ?? true
    });

    // Save to database if user is authenticated
    let savedBlogPost = null;
    if (userId) {
      try {
        savedBlogPost = await blogPostsService.saveBlogPost({
          user_id: userId,
          title: result.title,
          content: result.content,
          topic,
          tone: tone as 'academic' | 'casual' | 'professional',
          word_count: result.metadata.wordCount,
          generation_time: result.metadata.generationTime,
          model_used: result.metadata.modelUsed,
          metadata: {
            ...result.metadata,
            researchSources: result.metadata.researchSources,
            imagesFound: result.metadata.imagesFound,
            referencesCount: result.metadata.referencesCount
          },
          keywords: [] // Keywords will be extracted from content later if needed
        });
      } catch (saveError) {
        console.error('Error saving blog post:', saveError);
        // Don't fail the request if saving fails
      }
    }

    // Prepare response data
    const responseData = {
      title: result.title,
      content: result.content,
      images: result.images,
      allImages: result.allImages,
      references: result.references,
      metadata: {
        ...result.metadata,
        researchSources: result.metadata.researchSources,
        imagesFound: result.metadata.imagesFound,
        referencesCount: result.metadata.referencesCount,
        blogPostId: savedBlogPost?.id || null
      }
    };

    const response = NextResponse.json(responseData);
    return addCorsHeaders(response, request);
  } catch (error) {
    console.error('Blog generation error:', error);
    const errorResponse = NextResponse.json(
      { error: 'Failed to generate blog post' },
      { status: 500 }
    );
    return addCorsHeaders(errorResponse, request);
  }
}
