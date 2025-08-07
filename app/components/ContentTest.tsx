'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface GeneratedBlog {
  title: string;
  content: string;
  wordCount: number;
  sections: string[];
  metadata: {
    tone: string;
    generatedAt: string;
    modelUsed: string;
    generationTime: number;
    validation: {
      isValid: boolean;
      issues: string[];
      suggestions: string[];
    };
  };
}

interface EditResponse {
  content: string;
  metadata: {
    editTime: number;
    originalWordCount: number;
    newWordCount: number;
    validation: {
      isValid: boolean;
      issues: string[];
      suggestions: string[];
    };
  };
}

export default function ContentTest() {
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState<'academic' | 'casual' | 'professional'>('professional');
  const [maxWords, setMaxWords] = useState(1000);
  const [researchData, setResearchData] = useState('');
  const [generatedBlog, setGeneratedBlog] = useState<GeneratedBlog | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  // Edit functionality
  const [editRequest, setEditRequest] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState<string | null>(null);

  const handleGenerateBlog = async () => {
    if (!topic.trim()) return;

    setIsGenerating(true);
    setError('');
    setGeneratedBlog(null);
    setEditedContent(null);

    try {
      // Parse research data if provided
      let parsedResearchData: any[] = [];
      if (researchData.trim()) {
        try {
          parsedResearchData = JSON.parse(researchData);
        } catch (e) {
          console.warn('Failed to parse research data, using empty array');
        }
      }

      const response = await fetch('/api/generate-blog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          tone,
          maxWords,
          researchData: parsedResearchData,
          includeImages: true
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate blog post');
      }

      setGeneratedBlog(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEditBlog = async () => {
    if (!generatedBlog || !editRequest.trim()) return;

    setIsEditing(true);
    setError('');

    try {
      const response = await fetch('/api/edit-blog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalContent: `# ${generatedBlog.title}\n\n${generatedBlog.content}`,
          editRequest
        }),
      });

      const data: EditResponse = await response.json();

      if (!response.ok) {
        throw new Error('Failed to edit blog post');
      }

      setEditedContent(data.content);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsEditing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Content Generation Agent Test</h2>
        <p className="text-muted-foreground">
          Test the blog content generation and editing functionality
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
              placeholder="e.g., The Future of Artificial Intelligence"
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

          <div>
            <Label htmlFor="researchData">Research Data (JSON)</Label>
            <Textarea
              id="researchData"
              value={researchData}
              onChange={(e) => setResearchData(e.target.value)}
              placeholder='[{"title": "Article Title", "source": "Source Name", "snippet": "Article snippet..."}]'
              className="mt-2 min-h-[100px]"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Optional: Paste research data in JSON format
            </p>
          </div>

          <Button 
            onClick={handleGenerateBlog} 
            disabled={!topic.trim() || isGenerating}
            className="w-full"
          >
            {isGenerating ? 'Generating...' : 'Generate Blog Post'}
          </Button>
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

          {isGenerating && (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <span>Generating blog post...</span>
            </div>
          )}

          {generatedBlog && (
            <div className="space-y-4">
              {/* Blog Summary */}
              <div className="bg-muted/30 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Generated Blog Summary</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium">Title</div>
                    <div>{generatedBlog.title}</div>
                  </div>
                  <div>
                    <div className="font-medium">Word Count</div>
                    <div>{generatedBlog.wordCount}</div>
                  </div>
                  <div>
                    <div className="font-medium">Tone</div>
                    <div className="capitalize">{generatedBlog.metadata.tone}</div>
                  </div>
                  <div>
                    <div className="font-medium">Generation Time</div>
                    <div>{generatedBlog.metadata.generationTime}ms</div>
                  </div>
                  <div>
                    <div className="font-medium">Sections</div>
                    <div>{generatedBlog.sections.length}</div>
                  </div>
                  <div>
                    <div className="font-medium">Validation</div>
                    <div className={generatedBlog.metadata.validation.isValid ? 'text-green-600' : 'text-yellow-600'}>
                      {generatedBlog.metadata.validation.isValid ? 'Valid' : 'Issues Found'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Validation Issues */}
              {generatedBlog.metadata.validation.issues.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <h4 className="font-medium text-yellow-800 mb-2">Validation Issues</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    {generatedBlog.metadata.validation.issues.map((issue, index) => (
                      <li key={index}>• {issue}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Validation Suggestions */}
              {generatedBlog.metadata.validation.suggestions.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <h4 className="font-medium text-blue-800 mb-2">Suggestions</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    {generatedBlog.metadata.validation.suggestions.map((suggestion, index) => (
                      <li key={index}>• {suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Blog Content */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b">
                  <h3 className="font-medium">Generated Content</h3>
                </div>
                <div className="p-4 max-h-96 overflow-y-auto">
                  <h2 className="text-xl font-bold mb-4">{generatedBlog.title}</h2>
                  <div className="prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap text-sm">{generatedBlog.content}</pre>
                  </div>
                </div>
              </div>

              {/* Edit Section */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2">Edit Blog Post</h3>
                <Textarea
                  value={editRequest}
                  onChange={(e) => setEditRequest(e.target.value)}
                  placeholder="Describe the changes you'd like to make..."
                  className="mb-2"
                />
                <Button 
                  onClick={handleEditBlog} 
                  disabled={!editRequest.trim() || isEditing}
                  size="sm"
                >
                  {isEditing ? 'Editing...' : 'Apply Edit'}
                </Button>
              </div>

              {/* Edited Content */}
              {editedContent && (
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-green-50 px-4 py-3 border-b">
                    <h3 className="font-medium text-green-800">Edited Content</h3>
                  </div>
                  <div className="p-4 max-h-96 overflow-y-auto">
                    <div className="prose prose-sm max-w-none">
                      <pre className="whitespace-pre-wrap text-sm">{editedContent}</pre>
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
