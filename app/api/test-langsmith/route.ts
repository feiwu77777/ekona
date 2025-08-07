import { NextRequest, NextResponse } from 'next/server';
import { traceableGemini } from '@/app/lib/langchainClient';

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Test the LangSmith tracing
    const result = await traceableGemini(prompt);

    return NextResponse.json({
      result,
      timestamp: new Date().toISOString(),
      message: 'LangSmith tracing test completed successfully'
    });

  } catch (error) {
    console.error('LangSmith test error:', error);
    return NextResponse.json(
      { error: 'Failed to test LangSmith integration' },
      { status: 500 }
    );
  }
}
