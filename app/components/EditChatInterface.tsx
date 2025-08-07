'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

interface EditMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  status?: 'pending' | 'success' | 'error';
}

interface EditChatInterfaceProps {
  originalContent: string;
  onContentUpdate: (newContent: string) => void;
  onEditRequest: (request: string) => Promise<string>;
}

export default function EditChatInterface({ 
  originalContent, 
  onContentUpdate, 
  onEditRequest 
}: EditChatInterfaceProps) {
  const [messages, setMessages] = useState<EditMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isProcessing) return;

    const userMessage: EditMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsProcessing(true);

    try {
      // Add pending assistant message
      const pendingMessage: EditMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Processing your edit request...',
        timestamp: new Date(),
        status: 'pending'
      };

      setMessages(prev => [...prev, pendingMessage]);

      // Process edit request
      const updatedContent = await onEditRequest(inputValue);
      
      // Update pending message with success
      setMessages(prev => prev.map(msg => 
        msg.id === pendingMessage.id 
          ? { ...msg, content: 'Edit applied successfully!', status: 'success' }
          : msg
      ));

      // Update the blog content
      onContentUpdate(updatedContent);

    } catch (error) {
      // Update pending message with error
      setMessages(prev => prev.map(msg => 
        msg.id === (Date.now() + 1).toString()
          ? { ...msg, content: 'Failed to apply edit. Please try again.', status: 'error' }
          : msg
      ));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-96 border rounded-lg">
      {/* Chat header */}
      <div className="bg-gray-50 px-4 py-3 border-b">
        <h3 className="font-medium">Edit Blog Post</h3>
        <p className="text-sm text-gray-500">
          Describe the changes you'd like to make in natural language
        </p>
      </div>

      {/* Messages area */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-blue-500 text-white'
                    : message.status === 'error'
                    ? 'bg-red-100 text-red-800'
                    : message.status === 'success'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <p className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Input area */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="e.g., Make the introduction more engaging, Add more examples, Change the tone to be more casual"
            disabled={isProcessing}
            className="flex-1"
          />
          <Button 
            onClick={handleSendMessage} 
            disabled={!inputValue.trim() || isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Send'}
          </Button>
        </div>
      </div>
    </div>
  );
}
