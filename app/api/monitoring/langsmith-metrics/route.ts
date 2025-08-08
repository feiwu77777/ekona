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

    // Set filter date to August 8th, 2025 at 3pm CET
    const filterDate = new Date('2025-08-08T13:00:00.000+02:00'); // 2pm CET

    // Fetch runs from LangSmith (all runs, we'll filter by time in processing)
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
    let runsWithLatency = 0;

    // Process each run
    let processedRuns = 0;
    for await (const run of runs) {
      // Filter out runs before August 8th, 2025 at 3pm CET
      const runStartTime = new Date(run.start_time || 0);
      if (runStartTime < filterDate) {
        continue; // Skip runs before the filter date
      }
      
      totalCalls++;
      processedRuns++;
      
      // Debug: Log the run structure to see what's available
      console.log(`Run ${run.id} structure:`, {
        status: run.status,
        extra: run.extra,
        start_time: run.start_time,
        end_time: run.end_time
      });
      
      if (run.status === 'success') {
        successfulCalls++;
      } else {
        failedCalls++;
      }

      // Extract token usage from run metadata - check multiple possible locations
      let runTokens = 0;
      if (run.extra?.tokenUsage) {
        // Check our custom tokenUsage field first
        const tokens = run.extra.tokenUsage;
        const inputTokens = tokens.inputTokens || 0;
        const outputTokens = tokens.outputTokens || 0;
        runTokens = inputTokens + outputTokens;
        console.log(`Run ${run.id}: custom tokenUsage - ${inputTokens} input + ${outputTokens} output tokens`);
      } else if ((run as any).total_tokens) {
        // Check LangSmith's built-in total_tokens field (if available)
        runTokens = (run as any).total_tokens;
        console.log(`Run ${run.id}: LangSmith total_tokens - ${runTokens} tokens`);
      } else if ((run as any).prompt_tokens && (run as any).completion_tokens) {
        // Check LangSmith's separate prompt and completion token fields (if available)
        const promptTokens = (run as any).prompt_tokens || 0;
        const completionTokens = (run as any).completion_tokens || 0;
        runTokens = promptTokens + completionTokens;
        console.log(`Run ${run.id}: LangSmith prompt/completion tokens - ${promptTokens} + ${completionTokens} = ${runTokens} tokens`);
      }
      totalTokens += runTokens;

      // Calculate latency
      let runLatency = 0;
      if (run.start_time && run.end_time) {
        const startTime = new Date(run.start_time).getTime();
        const endTime = new Date(run.end_time).getTime();
        runLatency = endTime - startTime;
        totalLatency += runLatency;
        runsWithLatency++;
        console.log(`Run ${run.id}: latency ${runLatency}ms (${(runLatency / 1000).toFixed(2)}s)`);
      } else {
        console.log(`Run ${run.id}: no start/end time available for latency calculation`);
      }

      // Extract cost from run metadata - check multiple possible locations
      let runCost = 0;
      if (run.extra?.estimatedCost) {
        // Check our custom estimatedCost field first
        runCost = run.extra.estimatedCost;
        console.log(`Run ${run.id}: custom estimatedCost - ${runCost}`);
      } else if ((run as any).total_cost) {
        // Check LangSmith's built-in total_cost field (if available)
        runCost = (run as any).total_cost;
        console.log(`Run ${run.id}: LangSmith total_cost - ${runCost}`);
      } else if ((run as any).prompt_cost && (run as any).completion_cost) {
        // Check LangSmith's separate prompt and completion cost fields (if available)
        const promptCost = (run as any).prompt_cost || 0;
        const completionCost = (run as any).completion_cost || 0;
        runCost = promptCost + completionCost;
        console.log(`Run ${run.id}: LangSmith prompt/completion cost - ${promptCost} + ${completionCost} = ${runCost}`);
      } else if (runTokens > 0) {
        // Calculate cost from token usage if no cost data is available
        const modelName = run.extra?.modelName || 'gemini-2.0-flash-lite';
        const rates = {
          'gemini-2.0-flash-lite': { input: 0.000075, output: 0.0003 },
          'gemini-2.0-flash': { input: 0.000075, output: 0.0003 },
          'gemini-2.0-pro': { input: 0.000375, output: 0.0015 },
          'gemini-1.5-pro': { input: 0.000375, output: 0.0015 },
          'gemini-1.5-flash': { input: 0.000075, output: 0.0003 }
        };
        const rate = rates[modelName as keyof typeof rates] || rates['gemini-2.0-flash-lite'];
        // Estimate 60% input, 40% output tokens for cost calculation
        const estimatedInputTokens = Math.round(runTokens * 0.6);
        const estimatedOutputTokens = runTokens - estimatedInputTokens;
        const inputCost = estimatedInputTokens * rate.input / 1000;
        const outputCost = estimatedOutputTokens * rate.output / 1000;
        runCost = inputCost + outputCost;
        console.log(`Run ${run.id}: calculated cost ${runCost} from ${runTokens} tokens`);
      }
      totalCost += runCost;
    }

    console.log(`Processed ${processedRuns} runs from the last 24 hours`);
    console.log(`Total tokens: ${totalTokens}, Total cost: ${totalCost}`);
    console.log(`Total latency: ${totalLatency}ms (${(totalLatency / 1000).toFixed(2)}s)`);
    console.log(`Runs with latency data: ${runsWithLatency}`);
    console.log(`Average latency: ${runsWithLatency > 0 ? (totalLatency / runsWithLatency).toFixed(2) : 0}ms`);

    const averageLatency = runsWithLatency > 0 ? totalLatency / runsWithLatency : 0;

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
      filterDate: filterDate.toISOString(),
      note: `Processed ${processedRuns} runs since August 8th, 2025 3pm CET. Total tokens: ${totalTokens}, Total cost: $${totalCost.toFixed(4)}, Avg latency: ${averageLatency.toFixed(2)}ms`
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
