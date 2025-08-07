'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ResearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
  publishedAt?: string;
}

interface ResearchResponse {
  topic: string;
  results: ResearchResult[];
  summary: {
    topic: string;
    newsCount: number;
    searchCount: number;
    totalResults: number;
    filteredResults: number;
    finalResults: number;
  };
  count: number;
  timestamp: string;
}

export default function ResearchTest() {
  const [topic, setTopic] = useState('');
  const [results, setResults] = useState<ResearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleResearch = async () => {
    if (!topic.trim()) return;

    setIsLoading(true);
    setError('');
    setResults(null);

    try {
      const response = await fetch('/api/research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to research topic');
      }

      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Research Agent Test</h2>
        <p className="text-muted-foreground">
          Test the research functionality before integrating with blog generation
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="topic">Research Topic</Label>
          <div className="flex gap-2 mt-2">
            <Input
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., artificial intelligence trends 2024"
              onKeyPress={(e) => e.key === 'Enter' && handleResearch()}
            />
            <Button onClick={handleResearch} disabled={!topic.trim() || isLoading}>
              {isLoading ? 'Researching...' : 'Research'}
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-destructive">Error</h3>
                <div className="mt-2 text-sm text-destructive/80">{error}</div>
              </div>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span>Researching topic...</span>
          </div>
        )}

        {results && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-muted/30 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Research Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                <div>
                  <div className="font-medium">News Articles</div>
                  <div>{results.summary.newsCount}</div>
                </div>
                <div>
                  <div className="font-medium">Search Results</div>
                  <div>{results.summary.searchCount}</div>
                </div>
                <div>
                  <div className="font-medium">Total Combined</div>
                  <div>{results.summary.totalResults}</div>
                </div>
                <div>
                  <div className="font-medium">After Filtering</div>
                  <div>{results.summary.filteredResults}</div>
                </div>
                <div>
                  <div className="font-medium">Final Results</div>
                  <div>{results.summary.finalResults}</div>
                </div>
              </div>
            </div>

            {/* Results */}
            <div>
              <h3 className="font-semibold mb-4">Research Results ({results.count})</h3>
              <div className="space-y-4">
                {results.results.map((result, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-blue-600 hover:text-blue-800">
                        <a href={result.url} target="_blank" rel="noopener noreferrer">
                          {result.title}
                        </a>
                      </h4>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                        {result.source}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{result.snippet}</p>
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>{result.url}</span>
                      {result.publishedAt && (
                        <span>{new Date(result.publishedAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
