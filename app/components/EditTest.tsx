'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EditChatInterface from './EditChatInterface';
import EditHistory from './EditHistory';
import MarkdownPreview from './MarkdownPreview';

interface EditTestProps {
  initialContent?: string;
}

export default function EditTest({ initialContent }: EditTestProps) {
  const [blogContent, setBlogContent] = useState(
    initialContent || 
    `# The Future of Artificial Intelligence

Artificial Intelligence (AI) has rapidly evolved from a theoretical concept to a transformative technology that is reshaping industries and societies worldwide. This blog post explores the current state of AI, its applications, and the exciting possibilities that lie ahead.

## Current Applications

AI is already deeply integrated into our daily lives. From virtual assistants like Siri and Alexa to recommendation systems on Netflix and Amazon, AI algorithms are working behind the scenes to enhance user experiences. In healthcare, AI is being used for disease diagnosis, drug discovery, and personalized treatment plans. The financial sector leverages AI for fraud detection, algorithmic trading, and risk assessment.

## Future Prospects

Looking ahead, AI is poised to revolutionize transportation through autonomous vehicles, transform education with personalized learning systems, and enhance scientific research by processing vast amounts of data. The development of more sophisticated AI models, combined with advances in computing power, suggests that we are only scratching the surface of AI's potential.

## Conclusion

As AI continues to advance, it will create new opportunities while also presenting challenges that society must address. The key to harnessing AI's full potential lies in responsible development, ethical considerations, and thoughtful integration into our lives.`
  );

  const [editHistory, setEditHistory] = useState<Array<{
    id: string;
    request: string;
    timestamp: Date;
    contentSnapshot: string;
  }>>([]);

  const handleEditRequest = async (request: string): Promise<{ content: string; title: string }> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // For demo purposes, we'll simulate different types of edits
    let updatedContent = blogContent;
    let updatedTitle = 'The Future of Artificial Intelligence';
    
    if (request.toLowerCase().includes('more engaging')) {
      updatedContent = blogContent.replace(
        'Artificial Intelligence (AI) has rapidly evolved',
        'Artificial Intelligence (AI) has explosively evolved'
      );
    } else if (request.toLowerCase().includes('add examples')) {
      updatedContent = blogContent.replace(
        'risk assessment.',
        'risk assessment. For example, JPMorgan Chase uses AI to analyze legal documents, reducing review time from 360,000 hours to seconds.'
      );
    } else if (request.toLowerCase().includes('casual')) {
      updatedContent = blogContent.replace(
        'Artificial Intelligence (AI) has rapidly evolved from a theoretical concept to a transformative technology',
        'AI has quickly moved from just an idea to a game-changing technology'
      );
      updatedTitle = 'AI: What\'s Coming Next?';
    } else {
      // Generic edit - just add a note about the edit
      updatedContent = blogContent + '\n\n*[Edit applied: ' + request + ']*';
    }
    
    return { content: updatedContent, title: updatedTitle };
  };

  const handleContentUpdate = (newContent: string, newTitle?: string) => {
    // Add to edit history
    const historyEntry = {
      id: Date.now().toString(),
      request: 'Last edit request',
      timestamp: new Date(),
      contentSnapshot: blogContent
    };
    
    setEditHistory(prev => [historyEntry, ...prev.slice(0, 9)]); // Keep last 10 edits
    setBlogContent(newContent);
  };

  const handleRestore = (content: string) => {
    setBlogContent(content);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Interactive Editing Interface Test</h1>
        <p className="text-gray-600">
          Test the natural language editing interface for blog posts
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Edit Interface */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Edit Chat</h2>
            <EditHistory history={editHistory} onRestore={handleRestore} />
          </div>
          
          <EditChatInterface
            originalContent={blogContent}
            onContentUpdate={handleContentUpdate}
            onEditRequest={handleEditRequest}
          />
          
          <div className="text-sm text-gray-500">
            <p><strong>Try these example edits:</strong></p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>"Make the introduction more engaging"</li>
              <li>"Add more examples in the current applications section"</li>
              <li>"Change the tone to be more casual"</li>
              <li>"Add a section about AI ethics"</li>
            </ul>
          </div>
        </div>

        {/* Blog Preview */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Blog Preview</h2>
          
          <Tabs defaultValue="preview" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="markdown">Markdown</TabsTrigger>
            </TabsList>
            
            <TabsContent value="preview" className="border rounded-lg p-4 max-h-96 overflow-y-auto">
              <MarkdownPreview content={blogContent} />
            </TabsContent>
            
            <TabsContent value="markdown" className="border rounded-lg p-4 max-h-96 overflow-y-auto">
              <pre className="text-sm whitespace-pre-wrap">{blogContent}</pre>
            </TabsContent>
          </Tabs>
          
          <div className="text-sm text-gray-500">
            <p><strong>Word Count:</strong> {blogContent.split(/\s+/).filter(word => word.length > 0).length}</p>
            <p><strong>Character Count:</strong> {blogContent.length}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
