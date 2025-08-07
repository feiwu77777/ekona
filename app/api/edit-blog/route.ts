import { NextRequest, NextResponse } from 'next/server';
import { ContentGenerationAgent } from '@/app/lib/contentGenerationAgent';
import { createClient } from '@supabase/supabase-js';
import { editRateLimit } from '@/app/lib/rateLimit';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const contentAgent = new ContentGenerationAgent();

export async function POST(request: NextRequest) {
  try {
    // Get user from auth header
    const authHeader = request.headers.get('authorization');
    let userId: string | null = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (!error && user) {
        userId = user.id;
      }
    }

    // Optional: Require authentication for editing
    // if (!userId) {
    //   return NextResponse.json(
    //     { error: 'Authentication required' },
    //     { status: 401 }
    //   );
    // }

    // Rate limiting
    const rateLimitId = userId || request.headers.get('x-forwarded-for') || 'anonymous';
    const rateLimit = editRateLimit(rateLimitId);
    
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

    const { originalContent, editRequest } = await request.json();

    if (!originalContent || !editRequest) {
      return NextResponse.json(
        { error: 'Missing required fields: originalContent, editRequest' },
        { status: 400 }
      );
    }

    // Validate content length
    if (originalContent.length > 10000) {
      return NextResponse.json(
        { error: 'Original content is too long (max 10,000 characters)' },
        { status: 400 }
      );
    }

    if (editRequest.length > 1000) {
      return NextResponse.json(
        { error: 'Edit request is too long (max 1,000 characters)' },
        { status: 400 }
      );
    }

    // Generate edited content
    const startTime = Date.now();
    const editResult = await contentAgent.editBlog(originalContent, editRequest);
    const editTime = Date.now() - startTime;

    return NextResponse.json({
      content: editResult.content,
      title: editResult.title,
      metadata: {
        editTime,
        originalWordCount: originalContent.split(/\s+/).length,
        newWordCount: editResult.content.split(/\s+/).length
      }
    });

  } catch (error) {
    console.error('Blog editing error:', error);
    return NextResponse.json(
      { error: 'Failed to edit blog post' },
      { status: 500 }
    );
  }
}
