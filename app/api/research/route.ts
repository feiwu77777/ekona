import { NextRequest, NextResponse } from 'next/server';
import { ResearchAgent } from '@/app/lib/researchAgent';

export async function POST(request: NextRequest) {
  try {
    const { topic } = await request.json();

    if (!topic || typeof topic !== 'string') {
      return NextResponse.json(
        { error: 'Topic is required and must be a string' },
        { status: 400 }
      );
    }

    // Validate topic length
    if (topic.length < 3 || topic.length > 200) {
      return NextResponse.json(
        { error: 'Topic must be between 3 and 200 characters' },
        { status: 400 }
      );
    }

    const researchAgent = new ResearchAgent();
    
    // Get research results
    const results = await researchAgent.researchTopic(topic);
    
    // Get research summary for debugging
    const summary = await researchAgent.getResearchSummary(topic);

    return NextResponse.json({
      topic,
      results,
      summary,
      count: results.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Research API error:', error);
    return NextResponse.json(
      { error: 'Failed to research topic' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const topic = searchParams.get('topic');

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic parameter is required' },
        { status: 400 }
      );
    }

    const researchAgent = new ResearchAgent();
    const results = await researchAgent.researchTopic(topic);
    const summary = await researchAgent.getResearchSummary(topic);

    return NextResponse.json({
      topic,
      results,
      summary,
      count: results.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Research API error:', error);
    return NextResponse.json(
      { error: 'Failed to research topic' },
      { status: 500 }
    );
  }
}
