'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/app/lib/supabaseClient';
import { BlogPost } from '@/supabase_SQL/database.types';

export default function BlogPostsPage() {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchBlogPosts();
  }, []);

  const fetchBlogPosts = async () => {
    try {
      setLoading(true);
      
      // For now, use a placeholder user ID
      // In a real implementation, you'd get this from authentication
      const userId = 'user-placeholder';

      const response = await fetch(`/api/blog-posts?userId=${userId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch blog posts');
      }

      const data = await response.json();
      setBlogPosts(data.posts || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleViewPost = (postId: string) => {
    router.push(`/blog-posts/${postId}`);
  };

  const handleEditPost = (postId: string) => {
    router.push(`/blog-posts/${postId}/edit`);
  };

  const handleDeletePost = async (postId: string) => {
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

      // Remove the post from the local state
      setBlogPosts(prev => prev.filter(post => post.id !== postId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete blog post');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading your blog posts...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchBlogPosts}>Try Again</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">My Blog Posts</h1>
          <p className="text-muted-foreground">
            View and manage your generated blog posts
          </p>
        </div>

        {blogPosts.length === 0 ? (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="text-6xl mb-4">📝</div>
              <h2 className="text-xl font-semibold text-foreground mb-2">No blog posts yet</h2>
              <p className="text-muted-foreground mb-6">
                Start creating amazing blog posts with AI assistance
              </p>
              <Button onClick={() => router.push('/')}>
                Create Your First Blog Post
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {blogPosts.map((post) => (
              <Card key={post.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <Badge className={getToneColor(post.tone)}>
                      {post.tone.charAt(0).toUpperCase() + post.tone.slice(1)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {post.word_count} words
                    </span>
                  </div>
                  <CardTitle className="text-lg line-clamp-2">{post.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {post.topic}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm text-muted-foreground">
                      Created: {formatDate(post.created_at)}
                    </div>
                    {post.generation_time && (
                      <div className="text-sm text-muted-foreground">
                        Generated in: {Math.round(post.generation_time / 1000)}s
                      </div>
                    )}
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleViewPost(post.id)}
                        className="flex-1"
                      >
                        View
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleEditPost(post.id)}
                        className="flex-1"
                      >
                        Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => handleDeletePost(post.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {blogPosts.length > 0 && (
          <div className="mt-8 text-center">
            <Button onClick={() => router.push('/')}>
              Create New Blog Post
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
