import { NextRequest, NextResponse } from 'next/server';
import { llmMonitoring } from '@/app/lib/monitoring';

export async function GET(request: NextRequest) {
  try {
    const metrics = llmMonitoring.getMetrics();
    
    return NextResponse.json({
      metrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to fetch metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}
