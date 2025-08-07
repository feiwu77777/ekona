'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface BlogGenerationResult {
  title: string;
  content: string;
  images: any[];
  references: any[];
  metadata: {
    generationTime: number;
    wordCount: number;
    modelUsed: string;
    generatedAt: string;
    researchSources: number;
    imagesFound: number;
    referencesCount: number;
  };
}

export default function OrchestratorTest() {
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState<'academic' | 'casual' | 'professional'>('professional');
  const [maxWords, setMaxWords] = useState(1000);
  const [includeImages, setIncludeImages] = useState(true);
  const [result, setResult] = useState<BlogGenerationResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const handleGenerateBlog = async () => {
    if (!topic.trim()) return;

    setIsProcessing(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/generate-blog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          tone,
          maxWords,
          includeImages
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate blog post');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const loadSampleTopic = () => {
    setTopic('The Future of Artificial Intelligence in Healthcare');
    setTone('professional');
    setMaxWords(800);
    setIncludeImages(true);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Agent Orchestration Test</h2>
        <p className="text-muted-foreground">
          Test the complete AI Multi-Agent Workflow for blog generation
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="topic">Blog Topic</Label>
            <Input
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., The Future of Artificial Intelligence in Healthcare"
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="tone">Writing Tone</Label>
            <Select value={tone} onValueChange={(value: any) => setTone(value)}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="casual">Casual</SelectItem>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="academic">Academic</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="maxWords">Maximum Words</Label>
            <Input
              id="maxWords"
              type="number"
              value={maxWords}
              onChange={(e) => setMaxWords(parseInt(e.target.value) || 1000)}
              min="100"
              max="2000"
              className="mt-2"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              id="includeImages"
              type="checkbox"
              checked={includeImages}
              onChange={(e) => setIncludeImages(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="includeImages">Include Images</Label>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={loadSampleTopic}
              variant="outline"
              className="flex-1"
            >
              Load Sample
            </Button>
            <Button 
              onClick={handleGenerateBlog} 
              disabled={!topic.trim() || isProcessing}
              className="flex-1"
            >
              {isProcessing ? 'Generating...' : 'Generate Blog'}
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
            <div className="border rounded-lg p-6">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span>Generating blog post with AI agents...</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                This may take 30-60 seconds as we research, generate content, find images, and format references.
              </p>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              {/* Generation Summary */}
              <div className="bg-muted/30 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Generation Summary</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium">Generation Time</div>
                    <div>{result.metadata.generationTime}ms</div>
                  </div>
                  <div>
                    <div className="font-medium">Word Count</div>
                    <div>{result.metadata.wordCount} words</div>
                  </div>
                  <div>
                    <div className="font-medium">Research Sources</div>
                    <div>{result.metadata.researchSources} sources</div>
                  </div>
                  <div>
                    <div className="font-medium">Images Found</div>
                    <div>{result.metadata.imagesFound} images</div>
                  </div>
                  <div>
                    <div className="font-medium">References</div>
                    <div>{result.metadata.referencesCount} references</div>
                  </div>
                  <div>
                    <div className="font-medium">Model Used</div>
                    <div>{result.metadata.modelUsed}</div>
                  </div>
                </div>
              </div>

              {/* Blog Content */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b">
                  <h3 className="font-medium">Generated Blog Post</h3>
                  <p className="text-sm text-gray-500">
                    {result.metadata.wordCount} words • {result.metadata.generationTime}ms
                  </p>
                </div>
                <div className="p-4 max-h-96 overflow-y-auto">
                  <h2 className="text-2xl font-bold mb-4">{result.title}</h2>
                  <div className="prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap text-sm">
                      {result.content}
                    </pre>
                  </div>
                </div>
              </div>

              {/* Images */}
              {result.images.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b">
                    <h3 className="font-medium">Found Images ({result.images.length})</h3>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-2 gap-4">
                      {result.images.map((image, index) => (
                        <div key={index} className="space-y-2">
                          <img
                            src={image.url}
                            alt={image.alt}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <p className="text-xs text-gray-500">
                            By {image.photographer}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* References */}
              {result.references.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b">
                    <h3 className="font-medium">References ({result.references.length})</h3>
                  </div>
                  <div className="p-4 max-h-64 overflow-y-auto">
                    <div className="space-y-2">
                      {result.references.map((ref, index) => (
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
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
