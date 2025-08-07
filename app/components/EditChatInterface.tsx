'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import BlogEditComparison from './BlogEditComparison';

interface EditMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  status?: 'pending' | 'success' | 'error';
}

interface EditChatInterfaceProps {
  originalContent: string;
  originalTitle?: string;
  onContentUpdate: (newContent: string, newTitle?: string) => void;
  onEditRequest: (request: string) => Promise<{ content: string; title: string }>;
  onEditRequestStart?: (request: string) => void;
}

export default function EditChatInterface({ 
  originalContent, 
  originalTitle,
  onContentUpdate, 
  onEditRequest,
  onEditRequestStart
}: EditChatInterfaceProps) {
  const [messages, setMessages] = useState<EditMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [editedTitle, setEditedTitle] = useState('');
  const [currentEditRequest, setCurrentEditRequest] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
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
    setCurrentEditRequest(inputValue);
    
    // Notify parent about the edit request
    if (onEditRequestStart) {
      onEditRequestStart(inputValue);
    }
    
    setInputValue('');
    setIsProcessing(true);

    // Add pending assistant message
    const pendingMessageId = (Date.now() + 1).toString();
    const pendingMessage: EditMessage = {
      id: pendingMessageId,
      type: 'assistant',
      content: 'Processing your edit request...',
      timestamp: new Date(),
      status: 'pending'
    };

    setMessages(prev => [...prev, pendingMessage]);

    try {
      // Process edit request
      const editResult = await onEditRequest(userMessage.content);
      
      // Update pending message with success
      setMessages(prev => prev.map(msg => 
        msg.id === pendingMessageId 
          ? { ...msg, content: 'Edit completed! Please review the changes below and choose which version to keep.', status: 'success' }
          : msg
      ));

      // Show comparison view instead of immediately updating
      setEditedContent(editResult.content);
      setEditedTitle(editResult.title);
      console.log('editedResult: ', editResult);
      setShowComparison(true);

    } catch (error) {
      // Update pending message with error
      setMessages(prev => prev.map(msg => 
        msg.id === pendingMessageId
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

  const handleConfirmEdit = async () => {
    setIsConfirming(true);
    try {
      // Apply the edited content and title
      onContentUpdate(editedContent, editedTitle);
      
      // Add confirmation message
      const confirmMessage: EditMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: 'Edit has been applied successfully!',
        timestamp: new Date(),
        status: 'success'
      };
      
      setMessages(prev => [...prev, confirmMessage]);
      
      // Reset comparison state
      setShowComparison(false);
      setEditedContent('');
      setEditedTitle('');
      setCurrentEditRequest('');
    } catch (error) {
      console.error('Failed to apply edit:', error);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleRejectEdit = () => {
    // Add rejection message
    const rejectMessage: EditMessage = {
      id: Date.now().toString(),
      type: 'assistant',
      content: 'Edit was discarded. Original content kept.',
      timestamp: new Date(),
      status: 'success'
    };
    
    setMessages(prev => [...prev, rejectMessage]);
    
    // Reset comparison state
    setShowComparison(false);
    setEditedContent('');
    setEditedTitle('');
    setCurrentEditRequest('');
  };

  return (
    <div className="space-y-6">
      {/* Chat Interface */}
      <div className="flex flex-col h-96 border rounded-lg">
        {/* Chat header */}
        <div className="bg-gray-50 px-4 py-3 border-b flex-shrink-0">
          <h3 className="font-medium">Edit Blog Post</h3>
          <p className="text-sm text-gray-500">
            Describe the changes you'd like to make in natural language
          </p>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
            <div className="space-y-4 pb-4">
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
        </div>

        {/* Input area */}
        <div className="border-t p-4 flex-shrink-0">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="e.g., Make the introduction more engaging, Add more examples, Change the tone to be more casual"
              disabled={isProcessing || showComparison}
              className="flex-1"
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={!inputValue.trim() || isProcessing || showComparison}
            >
              {isProcessing ? 'Processing...' : 'Send'}
            </Button>
          </div>
          {showComparison && (
            <p className="text-xs text-gray-500 mt-2">
              Please review the changes below and choose which version to keep before making another edit.
            </p>
          )}
        </div>
      </div>

      {/* Comparison View */}
      {showComparison && (
        <BlogEditComparison
          originalContent={originalContent}
          editedContent={editedContent}
          originalTitle={originalTitle}
          editedTitle={editedTitle}
          editRequest={currentEditRequest}
          onConfirmEdit={handleConfirmEdit}
          onRejectEdit={handleRejectEdit}
          isConfirming={isConfirming}
        />
      )}
    </div>
  );
}
