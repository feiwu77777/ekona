'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function LangSmithTest() {
  const [prompt, setPrompt] = useState('Write a short blog post about artificial intelligence');
  const [result, setResult] = useState('');
  const [tokenUsage, setTokenUsage] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const testLangSmith = async () => {
    setIsLoading(true);
    setError('');
    setResult('');

    try {
      const response = await fetch('/api/test-langsmith', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setResult(data.result);
      setTokenUsage(data.tokenUsage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">LangSmith Integration Test</h1>
        <p className="text-gray-600">
          Test the LangSmith tracing integration with Gemini API
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Test LangSmith Tracing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Prompt</label>
            <Input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter a prompt to test..."
              className="w-full"
            />
          </div>

          <Button 
            onClick={testLangSmith} 
            disabled={isLoading || !prompt.trim()}
            className="w-full"
          >
            {isLoading ? 'Testing...' : 'Test LangSmith Integration'}
          </Button>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-medium">Error:</p>
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {result && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-medium mb-2">Result:</p>
              <div className="text-green-700 whitespace-pre-wrap">{result}</div>
            </div>
          )}

          {tokenUsage && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 font-medium mb-2">Token Usage:</p>
              <div className="text-blue-700">
                <p>Input Tokens: {tokenUsage.inputTokens}</p>
                <p>Output Tokens: {tokenUsage.outputTokens}</p>
                <p>Total Tokens: {tokenUsage.inputTokens + tokenUsage.outputTokens}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>1. Enter a prompt in the input field above</p>
            <p>2. Click "Test LangSmith Integration"</p>
            <p>3. Check your LangSmith dashboard to see the traced call</p>
            <p>4. The call should appear in your project with full details</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
