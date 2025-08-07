'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface Reference {
  title: string;
  url: string;
  source: string;
  publishedAt?: string;
}

interface ReferenceResponse {
  references: Reference[];
  markdownReferences: string;
  blogWithReferences: string;
  summary: {
    totalReferences: number;
    sources: string[];
    dateRange: { earliest?: string; latest?: string };
    generatedAt: string;
  };
  validation: {
    isValid: boolean;
    issues: string[];
    suggestions: string[];
  };
  metadata: {
    totalReferences: number;
    generatedAt: string;
  };
}

export default function ReferenceTest() {
  const [researchData, setResearchData] = useState('');
  const [blogContent, setBlogContent] = useState('');
  const [results, setResults] = useState<ReferenceResponse | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const handleProcessReferences = async () => {
    if (!researchData.trim() || !blogContent.trim()) return;

    setIsProcessing(true);
    setError('');
    setResults(null);

    try {
      // Parse research data
      let parsedResearchData: any[];
      try {
        parsedResearchData = JSON.parse(researchData);
      } catch (e) {
        throw new Error('Invalid JSON in research data');
      }

      const response = await fetch('/api/references', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          researchData: parsedResearchData,
          blogContent
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process references');
      }

      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const loadSampleData = () => {
    const sampleResearchData = [
      {
        title: "The Future of Artificial Intelligence in Healthcare",
        url: "https://example.com/ai-healthcare-2024",
        source: "Tech Journal",
        publishedAt: "2024-01-15T10:00:00Z"
      },
      {
        title: "Machine Learning Applications in Modern Medicine",
        url: "https://example.com/ml-medicine",
        source: "Medical Research Quarterly",
        publishedAt: "2023-11-20T14:30:00Z"
      },
      {
        title: "AI Ethics and Healthcare: A Comprehensive Review",
        url: "https://example.com/ai-ethics-healthcare",
        source: "Ethics in Technology",
        publishedAt: "2024-02-01T09:15:00Z"
      }
    ];

    const sampleBlogContent = `# The Impact of AI on Healthcare

Artificial intelligence is revolutionizing the healthcare industry in unprecedented ways.

## Current Applications

AI is currently being used for diagnostic imaging, drug discovery, and patient care management.

## Future Prospects

The future of AI in healthcare looks promising with advancements in machine learning and data analysis.

## Conclusion

AI will continue to transform healthcare delivery and improve patient outcomes.`;

    setResearchData(JSON.stringify(sampleResearchData, null, 2));
    setBlogContent(sampleBlogContent);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Reference Management Agent Test</h2>
        <p className="text-muted-foreground">
          Test the reference extraction and formatting functionality
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="researchData">Research Data (JSON)</Label>
            <Textarea
              id="researchData"
              value={researchData}
              onChange={(e) => setResearchData(e.target.value)}
              placeholder='[{"title": "Article Title", "url": "https://example.com", "source": "Source Name", "publishedAt": "2024-01-01T00:00:00Z"}]'
              className="mt-2 min-h-[200px]"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Paste research data in JSON format
            </p>
          </div>

          <div>
            <Label htmlFor="blogContent">Blog Content</Label>
            <Textarea
              id="blogContent"
              value={blogContent}
              onChange={(e) => setBlogContent(e.target.value)}
              placeholder="Paste your blog content here..."
              className="mt-2 min-h-[200px]"
            />
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={loadSampleData}
              variant="outline"
              className="flex-1"
            >
              Load Sample Data
            </Button>
            <Button 
              onClick={handleProcessReferences} 
              disabled={!researchData.trim() || !blogContent.trim() || isProcessing}
              className="flex-1"
            >
              {isProcessing ? 'Processing...' : 'Process References'}
            </Button>
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-4">
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

          {isProcessing && (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <span>Processing references...</span>
            </div>
          )}

          {results && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="bg-muted/30 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Reference Summary</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium">Total References</div>
                    <div>{results.summary.totalReferences}</div>
                  </div>
                  <div>
                    <div className="font-medium">Sources</div>
                    <div>{results.summary.sources.length}</div>
                  </div>
                  <div>
                    <div className="font-medium">Date Range</div>
                    <div>
                      {results.summary.dateRange.earliest && results.summary.dateRange.latest 
                        ? `${new Date(results.summary.dateRange.earliest).getFullYear()} - ${new Date(results.summary.dateRange.latest).getFullYear()}`
                        : 'N/A'
                      }
                    </div>
                  </div>
                  <div>
                    <div className="font-medium">Validation</div>
                    <div className={results.validation.isValid ? 'text-green-600' : 'text-yellow-600'}>
                      {results.validation.isValid ? 'Valid' : 'Issues Found'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Validation Issues */}
              {results.validation.issues.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <h4 className="font-medium text-yellow-800 mb-2">Validation Issues</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    {results.validation.issues.map((issue, index) => (
                      <li key={index}>• {issue}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Validation Suggestions */}
              {results.validation.suggestions.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <h4 className="font-medium text-blue-800 mb-2">Suggestions</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    {results.validation.suggestions.map((suggestion, index) => (
                      <li key={index}>• {suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* References List */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b">
                  <h3 className="font-medium">Extracted References</h3>
                </div>
                <div className="p-4 max-h-64 overflow-y-auto">
                  <div className="space-y-2">
                    {results.references.map((ref, index) => (
                      <div key={index} className="border-b pb-2 last:border-b-0">
                        <div className="font-medium text-sm">{index + 1}. {ref.title}</div>
                        <div className="text-xs text-gray-500">
                          {ref.source}
                          {ref.publishedAt && ` • ${new Date(ref.publishedAt).getFullYear()}`}
                        </div>
                        <a 
                          href={ref.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-800 break-all"
                        >
                          {ref.url}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Markdown References */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b">
                  <h3 className="font-medium">Markdown References</h3>
                </div>
                <div className="p-4">
                  <pre className="text-sm bg-gray-50 p-3 rounded overflow-x-auto">
                    {results.markdownReferences}
                  </pre>
                </div>
              </div>

              {/* Blog with References */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b">
                  <h3 className="font-medium">Blog with Embedded References</h3>
                </div>
                <div className="p-4 max-h-64 overflow-y-auto">
                  <pre className="text-sm whitespace-pre-wrap">
                    {results.blogWithReferences}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
