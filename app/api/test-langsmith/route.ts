import { NextRequest, NextResponse } from 'next/server';
import { createLangChainGemini } from '@/app/lib/langchainClient';

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Test the enhanced LangChain integration with token tracking
    const geminiLLM = createLangChainGemini('gemini-2.0-flash-lite');
    const response = await geminiLLM.invoke([{ role: 'user', content: prompt }]);
    const result = response.content as string;
    
    // Get token usage from the callback handler
    const tokenUsage = (geminiLLM as any).getTokenUsage();

    return NextResponse.json({
      result,
      tokenUsage,
      timestamp: new Date().toISOString(),
      message: 'Enhanced LangChain integration with token tracking completed successfully'
    });

  } catch (error) {
    console.error('LangSmith test error:', error);
    return NextResponse.json(
      { error: 'Failed to test LangSmith integration' },
      { status: 500 }
    );
  }
}
