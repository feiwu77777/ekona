'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface ImageData {
  id: string;
  url: string;
  alt: string;
  photographer: string;
  photographerUsername: string;
  downloadUrl: string;
  relevanceScore?: number;
}

interface ImageSearchResponse {
  images: ImageData[];
  summary: {
    topic?: string;
    keyConcepts?: string[];
    searchQueries?: string[];
    totalImagesFound: number;
    scoredImages?: number;
    finalImages?: number;
    query?: string;
    type?: string;
  };
  count: number;
  timestamp: string;
}

export default function ImageTest() {
  const [blogContent, setBlogContent] = useState('');
  const [topic, setTopic] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ImageSearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchMode, setSearchMode] = useState<'blog' | 'query'>('blog');

  const handleImageSearch = async () => {
    setIsLoading(true);
    setError('');
    setResults(null);

    try {
      const requestBody = searchMode === 'blog' 
        ? { blogContent, topic }
        : { query };

      const response = await fetch('/api/images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to search images');
      }

      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Image Retrieval Agent Test</h2>
        <p className="text-muted-foreground">
          Test the image search and retrieval functionality
        </p>
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg max-w-2xl mx-auto">
          <p className="text-sm text-blue-800">
            <strong>Compliance Notice:</strong> This implementation follows Unsplash API Terms of Use, including proper attribution and download tracking.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Search Mode Toggle */}
        <div className="flex gap-2">
          <Button
            variant={searchMode === 'blog' ? 'default' : 'outline'}
            onClick={() => setSearchMode('blog')}
          >
            Blog Content Search
          </Button>
          <Button
            variant={searchMode === 'query' ? 'default' : 'outline'}
            onClick={() => setSearchMode('query')}
          >
            Direct Query Search
          </Button>
        </div>

        {/* Blog Content Search */}
        {searchMode === 'blog' && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="blogContent">Blog Content</Label>
              <Textarea
                id="blogContent"
                value={blogContent}
                onChange={(e) => setBlogContent(e.target.value)}
                placeholder="Paste your blog content here to extract key concepts and find relevant images..."
                className="mt-2 min-h-[100px]"
              />
            </div>
            <div>
              <Label htmlFor="topic">Topic</Label>
              <Input
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., artificial intelligence trends"
                className="mt-2"
              />
            </div>
          </div>
        )}

        {/* Direct Query Search */}
        {searchMode === 'query' && (
          <div>
            <Label htmlFor="query">Search Query</Label>
            <Input
              id="query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., artificial intelligence, technology, innovation"
              className="mt-2"
            />
          </div>
        )}

        <Button 
          onClick={handleImageSearch} 
          disabled={
            isLoading || 
            (searchMode === 'blog' && (!blogContent.trim() || !topic.trim())) ||
            (searchMode === 'query' && !query.trim())
          }
        >
          {isLoading ? 'Searching...' : 'Search Images'}
        </Button>

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
            <span>Searching for images...</span>
          </div>
        )}

        {results && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-muted/30 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Search Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="font-medium">Total Images Found</div>
                  <div>{results.summary.totalImagesFound}</div>
                </div>
                {results.summary.finalImages && (
                  <div>
                    <div className="font-medium">Final Images</div>
                    <div>{results.summary.finalImages}</div>
                  </div>
                )}
                {results.summary.keyConcepts && (
                  <div>
                    <div className="font-medium">Key Concepts</div>
                    <div className="text-xs">{results.summary.keyConcepts.join(', ')}</div>
                  </div>
                )}
                {results.summary.searchQueries && (
                  <div>
                    <div className="font-medium">Search Queries</div>
                    <div className="text-xs">{results.summary.searchQueries.join(', ')}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Images Grid */}
            <div>
              <h3 className="font-semibold mb-4">Found Images ({results.count})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.images.map((image, index) => (
                  <div key={image.id} className="border rounded-lg overflow-hidden">
                    <img
                      src={image.url}
                      alt={image.alt}
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-4">
                      <p className="text-sm font-medium mb-2">{image.alt}</p>
                      <p className="text-xs text-muted-foreground mb-2">
                        By {image.photographer}
                      </p>
                      {image.relevanceScore && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            Relevance: {image.relevanceScore}/10
                          </span>
                          <a
                            href={`https://unsplash.com/@${image.photographerUsername}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            View Profile
                          </a>
                        </div>
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
