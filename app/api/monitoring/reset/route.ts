import { NextRequest, NextResponse } from 'next/server';
import { llmMonitoring } from '@/app/lib/monitoring';

export async function POST(request: NextRequest) {
  try {
    llmMonitoring.resetMetrics();
    
    return NextResponse.json({
      message: 'Metrics reset successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to reset metrics:', error);
    return NextResponse.json(
      { error: 'Failed to reset metrics' },
      { status: 500 }
    );
  }
}
