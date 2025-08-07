"use client";

import { useState, useEffect } from "react";
import { supabase } from "./lib/supabaseClient";
import { User } from "@supabase/supabase-js";
import NavBar from "./components/NavBar";
import SignInModal from "./components/SignInModal";
import TopicWizard from "./components/TopicWizard";
import BlogPreview from "./components/BlogPreview";
import { Button } from "./components/ui/button";
import { useUserData } from "./hooks/useUserData";
import { getOrCreateUserId } from "./lib/userIdUtils";

interface BlogGenerationRequest {
  topic: string;
  category: string;
  tone: 'academic' | 'casual' | 'professional';
  maxWords: number;
  includeImages: boolean;
}

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
  };
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [generatedBlog, setGeneratedBlog] = useState<BlogGenerationResult | null>(null);

  // User data management (profile + credits)
  const {
    profile,
    credits,
    isProfileLoading,
    isCreditsLoading,
    refreshCredits,
  } = useUserData(user);

  // Authentication useEffect
  useEffect(() => {
    const initAuth = async () => {
      // Get initial session
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setIsAuthLoading(false);

      const userId = getOrCreateUserId();
    };

    initAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleTopicSubmit = async (topic: string, category: string, tone: string) => {
    setIsLoading(true);
    setError("");
    setGeneratedBlog(null);

    try {
      // Get auth token for API request
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const authHeaders: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (session?.access_token) {
        authHeaders["Authorization"] = `Bearer ${session.access_token}`;
      }

      const request: BlogGenerationRequest = {
        topic,
        category,
        tone: tone as 'academic' | 'casual' | 'professional',
        maxWords: 1000,
        includeImages: true,
      };

      const response = await fetch("/api/generate-blog", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate blog post");
      }

      setGeneratedBlog(data);

      // Refresh credits after successful generation
      await refreshCredits();
    } catch (err) {
      console.error("Error generating blog post:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Could add a toast notification here
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  };

  const downloadFile = (
    content: string,
    filename: string,
    type: string = "text/plain"
  ) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar
        setIsModalOpen={setIsModalOpen}
        user={user}
        isAuthLoading={isAuthLoading}
        credits={credits}
        creditsLoading={isCreditsLoading}
        profile={profile}
        profileLoading={isProfileLoading}
      />

      <main>
        {/* Hero Section */}
        <section className="py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <header className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-extrabold text-foreground mb-4 tracking-tight">
                Generate AI-Powered Blog Posts
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
                Create engaging, well-researched blog posts in seconds with our AI-powered content generator.
              </p>

              {user && credits && credits.subscription_type === "free" && (
                <div className="mt-6 max-w-md mx-auto p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    🎉 Welcome! You have{" "}
                    <strong>{credits.remaining_credits} free credits</strong> to
                    try Ekona.
                  </p>
                </div>
              )}
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Topic Submission Section */}
              <div className="space-y-6">
                <TopicWizard
                  onTopicSubmit={handleTopicSubmit}
                  isLoading={isLoading}
                />

                {/* Error Display */}
                {error && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4">
                    <div className="flex">
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-destructive">
                          Error
                        </h3>
                        <div className="mt-2 text-sm text-destructive/80">
                          {error}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Results Section */}
              <div className="space-y-6">
                {isLoading && (
                  <div className="border rounded-lg p-6">
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      <span>Generating your blog post...</span>
                    </div>
                  </div>
                )}

                {generatedBlog && (
                  <BlogPreview 
                    content={generatedBlog.content}
                    title={generatedBlog.title}
                    currentImages={generatedBlog.images}
                    onContentUpdate={(newContent) => {
                      setGeneratedBlog(prev => prev ? {
                        ...prev,
                        content: newContent
                      } : null);
                    }}
                    onEditRequest={async (request: string) => {
                      try {
                        const response = await fetch('/api/edit-blog', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            originalContent: generatedBlog.content,
                            editRequest: request
                          })
                        });

                        if (!response.ok) {
                          throw new Error('Failed to edit blog');
                        }

                        const data = await response.json();
                        return data.content;
                      } catch (error) {
                        console.error('Edit error:', error);
                        throw error;
                      }
                    }}
                    onImageReplace={(oldImageId: string, newImage: any) => {
                      setGeneratedBlog(prev => prev ? {
                        ...prev,
                        images: prev.images.map((img: any) => 
                          img.id === oldImageId ? newImage : img
                        )
                      } : null);
                    }}
                    onImageRemove={(imageId: string) => {
                      setGeneratedBlog(prev => prev ? {
                        ...prev,
                        images: prev.images.filter((img: any) => img.id !== imageId)
                      } : null);
                    }}
                    onSearchImages={async (query: string) => {
                      try {
                        const response = await fetch('/api/search-images', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({ query })
                        });

                        if (!response.ok) {
                          throw new Error('Failed to search images');
                        }

                        const data = await response.json();
                        return data.images;
                      } catch (error) {
                        console.error('Image search error:', error);
                        throw error;
                      }
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        </section>

        {/* How it works section */}
        <section className="py-16 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-extrabold text-foreground">
              How It Works
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              A simple 3-step process to create engaging blog content.
            </p>
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold">
                    1
                  </div>
                  <h3 className="ml-4 text-xl font-semibold text-foreground">
                    Choose Your Topic
                  </h3>
                </div>
                <p className="mt-4 text-muted-foreground">
                  Tell us what you want to write about. Our AI will research the topic and gather relevant information.
                </p>
              </div>
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold">
                    2
                  </div>
                  <h3 className="ml-4 text-xl font-semibold text-foreground">
                    Select Style & Tone
                  </h3>
                </div>
                <p className="mt-4 text-muted-foreground">
                  Choose your preferred writing style and tone. We'll match your content to your audience.
                </p>
              </div>
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold">
                    3
                  </div>
                  <h3 className="ml-4 text-xl font-semibold text-foreground">
                    Get Your Blog Post
                  </h3>
                </div>
                <p className="mt-4 text-muted-foreground">
                  Receive a complete, well-researched blog post with images and references. Ready to publish!
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features section */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-extrabold text-foreground text-center">
              Why Choose Ekona?
            </h2>
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-8 bg-card rounded-lg shadow-md border border-border">
                <h3 className="text-xl font-semibold text-foreground">
                  AI-Powered Research
                </h3>
                <p className="mt-2 text-muted-foreground">
                  Our AI agents research your topic thoroughly, gathering the latest information and relevant sources.
                </p>
              </div>
              <div className="p-8 bg-card rounded-lg shadow-md border border-border">
                <h3 className="text-xl font-semibold text-foreground">
                  Smart Content Generation
                </h3>
                <p className="mt-2 text-muted-foreground">
                  Generate engaging, well-structured blog posts with proper formatting, images, and references.
                </p>
              </div>
              <div className="p-8 bg-card rounded-lg shadow-md border border-border">
                <h3 className="text-xl font-semibold text-foreground">
                  Interactive Editing
                </h3>
                <p className="mt-2 text-muted-foreground">
                  Edit your content naturally with AI assistance. Make changes, refine tone, and perfect your message.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Testing Section */}
        <section className="py-16 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-extrabold text-foreground text-center mb-4">
              Component Testing
            </h2>
            <p className="text-lg text-muted-foreground text-center mb-12">
              Test individual components and features in isolation
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="p-6 bg-card rounded-lg shadow-md border border-border">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Research Agent Test
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Test the research agent with News API and Google Custom Search
                </p>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => window.open('/research-test', '_blank')}
                >
                  Test Research Agent
                </Button>
              </div>
              
              <div className="p-6 bg-card rounded-lg shadow-md border border-border">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Image Retrieval Test
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Test image search and retrieval with Unsplash API
                </p>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => window.open('/image-test', '_blank')}
                >
                  Test Image Retrieval
                </Button>
              </div>
              
              <div className="p-6 bg-card rounded-lg shadow-md border border-border">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Markdown Preview Test
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Test markdown rendering and preview functionality
                </p>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => window.open('/markdown-test', '_blank')}
                >
                  Test Markdown Preview
                </Button>
              </div>
              
              <div className="p-6 bg-card rounded-lg shadow-md border border-border">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  LLM Monitoring Test
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Test LangSmith integration and LLM call monitoring
                </p>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => window.open('/langsmith-test', '_blank')}
                >
                  Test LangSmith Integration
                </Button>
              </div>
              
              <div className="p-6 bg-card rounded-lg shadow-md border border-border">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Monitoring Dashboard
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  View real-time LLM metrics and performance data
                </p>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => window.open('/monitoring', '_blank')}
                >
                  View Monitoring Dashboard
                </Button>
              </div>
              
              <div className="p-6 bg-card rounded-lg shadow-md border border-border">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Blog Posts Management
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  View and manage your generated blog posts
                </p>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => window.open('/blog-posts', '_blank')}
                >
                  Manage Blog Posts
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SignInModal isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen} />
    </div>
  );
}
