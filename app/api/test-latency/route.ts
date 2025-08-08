import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Test the latency calculation with the exact format from LangSmith
    const startTime = '2025-08-07T11:58:57.462001';
    const endTime = '2025-08-07T11:59:27.469000';
    
    const startTimeMs = new Date(startTime).getTime();
    const endTimeMs = new Date(endTime).getTime();
    const latency = endTimeMs - startTimeMs;
    
    return NextResponse.json({
      startTime,
      endTime,
      startTimeMs,
      endTimeMs,
      latencyMs: latency,
      latencySeconds: (latency / 1000).toFixed(2),
      message: 'Latency calculation test completed successfully'
    });
  } catch (error) {
    console.error('Latency test error:', error);
    return NextResponse.json(
      { error: 'Failed to test latency calculation' },
      { status: 500 }
    );
  }
}
