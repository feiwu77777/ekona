'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BlogPost } from '@/supabase_SQL/database.types';
import MarkdownPreview from '@/app/components/MarkdownPreview';

export default function BlogPostPage() {
  const [blogPost, setBlogPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;

  useEffect(() => {
    if (postId) {
      fetchBlogPost();
    }
  }, [postId]);

  const fetchBlogPost = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/blog-posts/${postId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Blog post not found');
        }
        throw new Error('Failed to fetch blog post');
      }

      const data = await response.json();
      setBlogPost(data.post);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    router.push(`/blog-posts/${postId}/edit`);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this blog post?')) {
      return;
    }

    try {
      const response = await fetch(`/api/blog-posts/${postId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete blog post');
      }

      router.push('/blog-posts');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete blog post');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getToneColor = (tone: string) => {
    switch (tone) {
      case 'academic':
        return 'bg-blue-100 text-blue-800';
      case 'professional':
        return 'bg-green-100 text-green-800';
      case 'casual':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading blog post...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
            <p className="text-muted-foreground mb-4">{error}</p>
            <div className="space-x-4">
              <Button onClick={fetchBlogPost}>Try Again</Button>
              <Button variant="outline" onClick={() => router.push('/blog-posts')}>
                Back to Blog Posts
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!blogPost) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Blog Post Not Found</h1>
            <Button onClick={() => router.push('/blog-posts')}>
              Back to Blog Posts
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Button 
              variant="outline" 
              onClick={() => router.push('/blog-posts')}
              className="mb-4"
            >
              ← Back to Blog Posts
            </Button>
            <div className="flex space-x-2">
              <Button onClick={handleEdit}>
                Edit
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Delete
              </Button>
            </div>
          </div>
          
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between mb-4">
                <Badge className={getToneColor(blogPost.tone)}>
                  {blogPost.tone.charAt(0).toUpperCase() + blogPost.tone.slice(1)}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {blogPost.word_count} words
                </span>
              </div>
              <CardTitle className="text-3xl mb-2">{blogPost.title}</CardTitle>
              <div className="text-muted-foreground">
                <p className="mb-2">Topic: {blogPost.topic}</p>
                <p className="mb-2">Created: {formatDate(blogPost.created_at)}</p>
                {blogPost.generation_time && (
                  <p>Generated in: {Math.round(blogPost.generation_time / 1000)}s</p>
                )}
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Content */}
        <Card>
          <CardContent className="p-8">
            <MarkdownPreview content={blogPost.content} />
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center">
          <Button onClick={() => router.push('/')}>
            Create New Blog Post
          </Button>
        </div>
      </div>
    </div>
  );
}
