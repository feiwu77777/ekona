import { NextRequest, NextResponse } from 'next/server';
import { AgentOrchestrator } from '@/app/lib/agentOrchestrator';

export async function POST(request: NextRequest) {
  try {
    const { topic, tone, maxWords, includeImages } = await request.json();

    // Validate request
    if (!topic || !tone || !maxWords) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const orchestrator = new AgentOrchestrator();
    
    // Use Server-Sent Events for real-time progress
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        const onProgress = (state: any) => {
          const data = `data: ${JSON.stringify(state)}\n\n`;
          controller.enqueue(encoder.encode(data));
        };

        orchestrator.generateBlogWithProgress({
          topic,
          tone,
          maxWords: Math.min(maxWords, 1000),
          includeImages: includeImages ?? true
        }, onProgress).then(result => {
          const data = `data: ${JSON.stringify({ type: 'complete', result })}\n\n`;
          controller.enqueue(encoder.encode(data));
          controller.close();
        }).catch(error => {
          const data = `data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`;
          controller.enqueue(encoder.encode(data));
          controller.close();
        });
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Progress tracking error:', error);
    return NextResponse.json(
      { error: 'Failed to start progress tracking' },
      { status: 500 }
    );
  }
}
