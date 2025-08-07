'use client';

import { useState, useEffect } from 'react';
import MarkdownPreview from './MarkdownPreview';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import EditChatInterface from './EditChatInterface';
import EditHistory from './EditHistory';
import ImageReviewGallery from './ImageReviewGallery';

interface BlogPreviewProps {
  content: string;
  title?: string;
  onContentUpdate?: (newContent: string) => void;
  onEditRequest?: (request: string) => Promise<string>;
  onImageReplace?: (oldImageId: string, newImage: any) => void;
  onImageRemove?: (imageId: string) => void;
  onSearchImages?: (query: string) => Promise<any[]>;
  currentImages?: any[];
  className?: string;
}

export default function BlogPreview({ 
  content, 
  title, 
  onContentUpdate, 
  onEditRequest, 
  onImageReplace,
  onImageRemove,
  onSearchImages,
  currentImages = [],
  className 
}: BlogPreviewProps) {
  const [wordCount, setWordCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);
  const [readingTime, setReadingTime] = useState(0);
  const [showEditInterface, setShowEditInterface] = useState(false);
  const [editHistory, setEditHistory] = useState<Array<{
    id: string;
    request: string;
    timestamp: Date;
    contentSnapshot: string;
  }>>([]);

  useEffect(() => {
    // Calculate word count
    const words = content.split(/\s+/).filter(word => word.length > 0).length;
    setWordCount(words);
    
    // Calculate character count
    setCharacterCount(content.length);
    
    // Calculate reading time (average 200 words per minute)
    setReadingTime(Math.ceil(words / 200));
  }, [content]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(content);
      // Could add a toast notification here
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const downloadMarkdown = () => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || 'blog-post'}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleEditRequest = async (request: string): Promise<string> => {
    if (!onEditRequest) {
      throw new Error('Edit functionality not available');
    }
    return await onEditRequest(request);
  };

  const handleContentUpdate = (newContent: string) => {
    // Add to edit history
    const historyEntry = {
      id: Date.now().toString(),
      request: 'Last edit request',
      timestamp: new Date(),
      contentSnapshot: content
    };
    
    setEditHistory(prev => [historyEntry, ...prev.slice(0, 9)]); // Keep last 10 edits
    
    // Call parent's onContentUpdate if provided
    if (onContentUpdate) {
      onContentUpdate(newContent);
    }
  };

  const handleRestore = (contentSnapshot: string) => {
    if (onContentUpdate) {
      onContentUpdate(contentSnapshot);
    }
  };

  return (
    <div className={`border rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gray-50 px-4 py-3 border-b flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h3 className="font-medium">Blog Preview</h3>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary">{wordCount} words</Badge>
            <Badge variant="outline">{characterCount} chars</Badge>
            <Badge variant="outline">{readingTime} min read</Badge>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {onEditRequest && (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowEditInterface(!showEditInterface)}
              >
                {showEditInterface ? 'Hide Edit' : 'Edit'}
              </Button>
              <EditHistory history={editHistory} onRestore={handleRestore} />
            </>
          )}
          {onSearchImages && currentImages.length > 0 && (
            <ImageReviewGallery
              currentImages={currentImages}
              onImageReplace={onImageReplace || (() => {})}
              onImageRemove={onImageRemove || (() => {})}
              onSearchImages={onSearchImages}
            />
          )}
          <Button variant="outline" size="sm" onClick={copyToClipboard}>
            Copy
          </Button>
          <Button variant="outline" size="sm" onClick={downloadMarkdown}>
            Download
          </Button>
        </div>
      </div>
      
      {/* Edit Interface */}
      {showEditInterface && onEditRequest && (
        <div className="border-t p-4">
          <EditChatInterface
            originalContent={content}
            onContentUpdate={handleContentUpdate}
            onEditRequest={handleEditRequest}
          />
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="preview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="markdown">Markdown</TabsTrigger>
        </TabsList>
        
        <TabsContent value="preview" className="p-6">
          {title && (
            <h1 className="text-3xl font-bold mb-6 text-gray-900">{title}</h1>
          )}
          <MarkdownPreview content={content} />
        </TabsContent>
        
        <TabsContent value="markdown" className="p-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <pre className="text-sm text-gray-800 whitespace-pre-wrap overflow-x-auto">
              {content}
            </pre>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
