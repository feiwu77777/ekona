import { NextRequest, NextResponse } from 'next/server';
import { langSmithClient } from '@/app/lib/langchainClient';

export async function GET(request: NextRequest) {
  try {
    // Check if LangSmith API key is configured
    if (!process.env.LANGSMITH_API_KEY) {
      return NextResponse.json({
        metrics: {
          totalCalls: 0,
          successfulCalls: 0,
          failedCalls: 0,
          totalTokens: 0,
          averageLatency: 0,
          totalCost: 0
        },
        timestamp: new Date().toISOString(),
        source: 'langsmith-disabled',
        note: 'LangSmith API key not configured. Add LANGSMITH_API_KEY to your environment variables.'
      });
    }

    // Get the last 24 hours of runs
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago

    // Fetch runs from LangSmith - using basic parameters
    const runs = await langSmithClient.listRuns({
      projectName: process.env.LANGSMITH_PROJECT || "ekona-blog-generator"
    });

    // Calculate metrics from LangSmith runs
    let totalCalls = 0;
    let successfulCalls = 0;
    let failedCalls = 0;
    let totalTokens = 0;
    let totalLatency = 0;
    let totalCost = 0;

    // Process each run
    for await (const run of runs) {
      totalCalls++;
      
      if (run.status === 'completed') {
        successfulCalls++;
      } else {
        failedCalls++;
      }

      // Extract token usage from run metadata
      if (run.extra?.tokenUsage) {
        const tokens = run.extra.tokenUsage;
        totalTokens += (tokens.inputTokens || 0) + (tokens.outputTokens || 0);
      }

      // Calculate latency
      if (run.start_time && run.end_time) {
        const latency = new Date(run.end_time).getTime() - new Date(run.start_time).getTime();
        totalLatency += latency;
      }

      // Extract cost from run metadata
      if (run.extra?.cost) {
        totalCost += run.extra.cost;
      }
    }

    const averageLatency = successfulCalls > 0 ? totalLatency / successfulCalls : 0;

    const metrics = {
      totalCalls,
      successfulCalls,
      failedCalls,
      totalTokens,
      averageLatency,
      totalCost
    };

    return NextResponse.json({
      metrics,
      timestamp: new Date().toISOString(),
      source: 'langsmith',
      note: `Fetched ${totalCalls} runs from the last 24 hours`
    });
  } catch (error) {
    console.error('Failed to fetch LangSmith metrics:', error);
    
    // Return error with fallback metrics
    return NextResponse.json({
      metrics: {
        totalCalls: 0,
        successfulCalls: 0,
        failedCalls: 0,
        totalTokens: 0,
        averageLatency: 0,
        totalCost: 0
      },
      timestamp: new Date().toISOString(),
      source: 'langsmith-error',
      error: error instanceof Error ? error.message : 'Unknown error',
      note: 'Failed to fetch data from LangSmith. Check your API key and project configuration.'
    });
  }
}
