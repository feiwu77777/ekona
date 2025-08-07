'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MarkdownPreview from './MarkdownPreview';

interface BlogEditComparisonProps {
  originalContent: string;
  editedContent: string;
  originalTitle?: string;
  editedTitle?: string;
  editRequest: string;
  onConfirmEdit: () => void;
  onRejectEdit: () => void;
  isConfirming?: boolean;
}

export default function BlogEditComparison({
  originalContent,
  editedContent,
  originalTitle,
  editedTitle,
  editRequest,
  onConfirmEdit,
  onRejectEdit,
  isConfirming = false
}: BlogEditComparisonProps) {
  const [wordCountOriginal] = useState(() => 
    originalContent.split(/\s+/).filter(word => word.length > 0).length
  );
  const [wordCountEdited] = useState(() => 
    editedContent.split(/\s+/).filter(word => word.length > 0).length
  );

  return (
    <div className="space-y-6">
      {/* Edit Request Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Edit Request</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-700 italic">"{editRequest}"</p>
        </CardContent>
      </Card>

      {/* Side-by-side comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Original Content */}
        <Card className="h-[600px] flex flex-col">
          <CardHeader className="flex-shrink-0">
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Original</span>
              <span className="text-sm font-normal text-gray-500">
                {wordCountOriginal} words
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto border rounded-lg p-4 bg-gray-50 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {originalTitle && (
                <h1 className="text-2xl font-bold mb-4 text-gray-900">{originalTitle}</h1>
              )}
              <MarkdownPreview content={originalContent} />
            </div>
          </CardContent>
        </Card>

        {/* Edited Content */}
        <Card className="h-[600px] flex flex-col">
          <CardHeader className="flex-shrink-0">
            <CardTitle className="text-lg flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span>Edited</span>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  NEW
                </span>
              </span>
              <span className="text-sm font-normal text-gray-500">
                {wordCountEdited} words
                {wordCountEdited !== wordCountOriginal && (
                  <span className={`ml-2 text-xs ${
                    wordCountEdited > wordCountOriginal ? 'text-green-600' : 'text-red-600'
                  }`}>
                    ({wordCountEdited > wordCountOriginal ? '+' : ''}{wordCountEdited - wordCountOriginal})
                  </span>
                )}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto border rounded-lg p-4 bg-blue-50 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {editedTitle && (
                <h1 className="text-2xl font-bold mb-4 text-gray-900">{editedTitle}</h1>
              )}
              <MarkdownPreview content={editedContent} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-4 pt-4 border-t">
        <Button
          variant="outline"
          onClick={onRejectEdit}
          disabled={isConfirming}
          className="min-w-[120px]"
        >
          Keep Original
        </Button>
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-2">
            Choose which version to keep
          </p>
        </div>
        <Button
          onClick={onConfirmEdit}
          disabled={isConfirming}
          className="min-w-[120px]"
        >
          {isConfirming ? 'Applying...' : 'Use Edited Version'}
        </Button>
      </div>

      {/* Statistics comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Change Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-500">Word Count Change</p>
              <p className={`font-medium ${
                wordCountEdited > wordCountOriginal ? 'text-green-600' : 
                wordCountEdited < wordCountOriginal ? 'text-red-600' : 'text-gray-700'
              }`}>
                {wordCountEdited > wordCountOriginal ? '+' : ''}{wordCountEdited - wordCountOriginal}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Original Length</p>
              <p className="font-medium text-gray-700">{wordCountOriginal} words</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">New Length</p>
              <p className="font-medium text-gray-700">{wordCountEdited} words</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
