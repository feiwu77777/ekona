'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MonitoringMetrics {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  totalTokens: number;
  averageLatency: number;
  totalCost: number;
}

export default function MonitoringDashboard() {
  const [metrics, setMetrics] = useState<MonitoringMetrics>({
    totalCalls: 0,
    successfulCalls: 0,
    failedCalls: 0,
    totalTokens: 0,
    averageLatency: 0,
    totalCost: 0
  });
  const [isLoading, setIsLoading] = useState(false);

  const fetchMetrics = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/monitoring/langsmith-metrics');
      if (response.ok) {
        const data = await response.json();
        setMetrics(data.metrics);
        console.log('Metrics data:', data);
        console.log('Metrics source:', data.source, data.note);
        console.log('Token count:', data.metrics.totalTokens);
        console.log('Total cost:', data.metrics.totalCost);
        console.log('Average latency:', data.metrics.averageLatency, 'ms');
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetMetrics = async () => {
    try {
      await fetch('/api/monitoring/reset', { method: 'POST' });
      await fetchMetrics();
    } catch (error) {
      console.error('Failed to reset metrics:', error);
    }
  };

  useEffect(() => {
    fetchMetrics();
    // Refresh metrics every 30 seconds
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const successRate = metrics.totalCalls > 0 
    ? ((metrics.successfulCalls / metrics.totalCalls) * 100).toFixed(1)
    : '0';

  const averageTokens = metrics.successfulCalls > 0
    ? Math.round(metrics.totalTokens / metrics.successfulCalls)
    : 0;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">LLM Monitoring Dashboard</h1>
        <p className="text-gray-600">
          Real-time monitoring of Gemini API usage and performance
        </p>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button onClick={fetchMetrics} disabled={isLoading}>
            {isLoading ? 'Refreshing...' : 'Refresh Metrics'}
          </Button>
          <Button variant="outline" onClick={resetMetrics}>
            Reset Metrics
          </Button>
        </div>
        <div className="text-sm text-gray-500">
          Auto-refresh every 30 seconds
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total Calls */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalCalls}</div>
            <p className="text-xs text-muted-foreground">
              All LLM API calls
            </p>
          </CardContent>
        </Card>

        {/* Success Rate */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate}%</div>
            <p className="text-xs text-muted-foreground">
              {metrics.successfulCalls} successful / {metrics.failedCalls} failed
            </p>
          </CardContent>
        </Card>

        {/* Total Tokens */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalTokens.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              ~{averageTokens} tokens per call
            </p>
          </CardContent>
        </Card>

        {/* Average Latency */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Latency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.averageLatency > 0 
                ? `${Math.round(metrics.averageLatency)}ms` 
                : '0ms'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.averageLatency > 0 
                ? `~${(metrics.averageLatency / 1000).toFixed(1)}s per call` 
                : 'No data available'
              }
            </p>
          </CardContent>
        </Card>

        {/* Total Cost */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.totalCost.toFixed(4)}</div>
            <p className="text-xs text-muted-foreground">
              Gemini API costs
            </p>
          </CardContent>
        </Card>

        {/* Model Info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Model</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Gemini 2.0 Flash Lite</div>
            <p className="text-xs text-muted-foreground">
              Google AI Studio
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Call Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Successful Calls</span>
                <Badge variant="default">{metrics.successfulCalls}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Failed Calls</span>
                <Badge variant="destructive">{metrics.failedCalls}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Success Rate</span>
                <Badge variant="secondary">{successRate}%</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Average Tokens/Call</span>
                <Badge variant="outline">{averageTokens}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Average Latency</span>
                <Badge variant="outline">
                  {metrics.averageLatency > 0 
                    ? `${Math.round(metrics.averageLatency)}ms` 
                    : '0ms'
                  }
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Total Cost</span>
                <Badge variant="outline">${metrics.totalCost.toFixed(4)}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* LangSmith Integration */}
      <Card>
        <CardHeader>
          <CardTitle>LangSmith Integration</CardTitle>
        </CardHeader>
        <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
          All LLM calls are automatically logged to LangSmith for detailed analysis and visualization.
          {metrics.totalCalls === 0 && (
            <span className="block mt-2 text-orange-600">
              No data found. Make sure your LangSmith API key is configured and you have generated some blog posts.
            </span>
          )}
        </p>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                const langsmithUrl = `https://smith.langchain.com/`;
                window.open(langsmithUrl, '_blank');
              }}
            >
              View LangSmith Dashboard
            </Button>
            {/* <Button variant="outline" size="sm">
              Export Data
            </Button> */}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
