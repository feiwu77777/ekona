"use client";

import { useState, useEffect } from "react";
import { supabase } from "./lib/supabaseClient";
import { User } from "@supabase/supabase-js";
import NavBar from "./components/NavBar";
import SignInModal from "./components/SignInModal";
import TopicWizard from "./components/TopicWizard";
import BlogPreview from "./components/BlogPreview";
import { Button } from "./components/ui/button";
import { Card, CardContent } from "./components/ui/card";
import { Badge } from "./components/ui/badge";
import { Sparkles, PenTool, Zap, Search, FileText, Settings, BarChart3, Database, ImageIcon, Code, Monitor, AlertCircle, CheckCircle2, ArrowRight, Lightbulb, Target, Rocket } from 'lucide-react';

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
  allImages: any[];
  references: any[];
  metadata: {
    generationTime: number;
    wordCount: number;
    modelUsed: string;
    generatedAt: string;
    blogPostId?: string | null;
    editCount?: number;
    topic?: string;
    tone?: string;
    researchSources?: any[];
    imagesFound?: number;
    referencesCount?: number;
  };
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [generatedBlog, setGeneratedBlog] = useState<BlogGenerationResult | null>(null);
  const [removedIndices, setRemovedIndices] = useState<string[]>([]);

  // Authentication useEffect
  useEffect(() => {
    const initAuth = async () => {
      // Get initial session
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setIsAuthLoading(false);
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

      setGeneratedBlog({
        ...data,
        metadata: {
          ...data.metadata,
          topic,
          tone: tone as 'academic' | 'casual' | 'professional'
        }
      });
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

  const testingComponents = [
    {
      title: "Research Agent",
      description: "Test the research agent with News API and Google Custom Search",
      icon: Search,
      url: "/research-test",
      color: "bg-blue-500"
    },
    {
      title: "Image Retrieval",
      description: "Test image search and retrieval with Unsplash API",
      icon: ImageIcon,
      url: "/image-test",
      color: "bg-green-500"
    },
    {
      title: "Markdown Preview",
      description: "Test markdown rendering and preview functionality",
      icon: FileText,
      url: "/markdown-test",
      color: "bg-purple-500"
    },
    {
      title: "LLM Monitoring",
      description: "Test LangSmith integration and LLM call monitoring",
      icon: BarChart3,
      url: "/langsmith-test",
      color: "bg-orange-500"
    },
    {
      title: "Monitoring Dashboard",
      description: "View real-time LLM metrics and performance data",
      icon: Monitor,
      url: "/monitoring",
      color: "bg-red-500"
    },
    {
      title: "Blog Management",
      description: "View and manage your generated blog posts",
      icon: Database,
      url: "/blog-posts",
      color: "bg-indigo-500"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <NavBar
        setIsModalOpen={setIsModalOpen}
        user={user}
        isAuthLoading={isAuthLoading}
      />

      <main className="relative">
        {/* Hero Section */}
        <section className="relative py-20 md:py-32 overflow-hidden">
          {/* Background Elements */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5" />
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">             
              <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text text-transparent mb-6 leading-tight">
                Generate Stunning
                <br />
                <span className="bg-gradient-to-r from-primary bg-clip-text text-transparent">
                  Blog Posts
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed mb-8">
                Sign in to save your blog posts.
              </p>
            </div>

            {/* Topic Submission Section */}
            <div className="max-w-4xl mx-auto">
              <Card className="border-0 shadow-2xl bg-card/80 backdrop-blur-sm">
                <CardContent className="p-8">
                  <TopicWizard
                    onTopicSubmit={handleTopicSubmit}
                    isLoading={isLoading}
                  />

                  {/* Error Display */}
                  {error && (
                    <div className="mt-6 bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                        <div>
                          <h3 className="text-sm font-medium text-destructive mb-1">
                            Generation Failed
                          </h3>
                          <p className="text-sm text-destructive/80">{error}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Loading State */}
                  {isLoading && (
                    <div className="mt-6 border rounded-lg p-6 bg-muted/30">
                      <div className="flex items-center justify-center space-x-3">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
                        <div className="text-center">
                          <p className="font-medium">Generating your blog post...</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            This may take a few moments while we research and write your content
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Results Section */}
            {generatedBlog && (
              <div className="mt-12 max-w-6xl mx-auto">
                <BlogPreview
                  content={generatedBlog.content}
                  title={generatedBlog.title}
                  currentImages={generatedBlog.images}
                  allAvailableImages={generatedBlog.allImages}
                  removedImages={removedIndices}
                  onContentUpdate={async (newContent, newTitle) => {
                    setGeneratedBlog(prev => prev ? {
                      ...prev,
                      content: newContent,
                      title: newTitle || prev.title
                    } : null);

                    // Save the edited blog post to database when user confirms the edit
                    try {
                      const {
                        data: { session },
                      } = await supabase.auth.getSession();

                      const authHeaders: Record<string, string> = {
                        "Content-Type": "application/json",
                      };

                      if (session?.access_token) {
                        authHeaders["Authorization"] = `Bearer ${session.access_token}`;
                      }

                      if (generatedBlog?.metadata?.blogPostId) {
                        // Update existing blog post
                        const saveResponse = await fetch(`/api/blog-posts/${generatedBlog.metadata.blogPostId}`, {
                          method: 'PUT',
                          headers: authHeaders,
                          body: JSON.stringify({
                            content: newContent,
                            title: newTitle || generatedBlog.title,
                            metadata: {
                              ...generatedBlog.metadata,
                              lastEdited: new Date().toISOString(),
                              editCount: (generatedBlog.metadata.editCount || 0) + 1
                            }
                          })
                        });

                        if (!saveResponse.ok) {
                          console.warn('Failed to save edited blog post to database');
                        }
                      } else {
                        console.warn('Blog post not found in database: ', generatedBlog);
                      }
                    } catch (error) {
                      console.error('Failed to save edited blog post:', error);
                    }
                  }}
                  onEditRequest={async (request: string) => {
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

                      // Step 1: Get edited content from API
                      const editResponse = await fetch('/api/edit-blog', {
                        method: 'POST',
                        headers: authHeaders,
                        body: JSON.stringify({
                          originalContent: generatedBlog.content,
                          editRequest: request
                        })
                      });

                      if (!editResponse.ok) {
                        throw new Error('Failed to edit blog');
                      }

                      const editData = await editResponse.json();
                      const editedContent = editData.content;
                      const editedTitle = editData.title;

                      return { content: editedContent, title: editedTitle };
                    } catch (error) {
                      console.error('Edit error:', error);
                      throw error;
                    }
                  }}
                  onImageReplace={(imageIndex: string, newImage: any) => {
                    setGeneratedBlog(prev => {
                      if (!prev) return null;

                      // Convert string index to number, or find index by ID if it's an ID
                      let index: number;
                      if (imageIndex === '') {
                        // Empty string means append (but we don't want this for fixed-length)
                        return prev;
                      } else if (!isNaN(Number(imageIndex))) {
                        // It's a numeric index
                        index = Number(imageIndex);
                      } else {
                        // It's an ID, find the index
                        index = prev.images.findIndex(img => img.id === imageIndex);
                        if (index === -1) return prev;
                      }

                      // Get the old image at this index
                      const oldImage = prev.images[index];
                      if (!oldImage) return prev;

                      // Update the images array by index
                      const updatedImages = [...prev.images];
                      updatedImages[index] = newImage;

                      // Update the blog content
                      let updatedContent = prev.content;
                      const newImageMarkdown = `\n![${newImage.alt}](${newImage.url})\n\n*Photo by [${newImage.photographer}](https://unsplash.com/@${newImage.photographerUsername}) on [Unsplash](https://unsplash.com)*\n\n`;

                      // Replace image in the specific section by index
                      const contentSections = updatedContent.split(/\n(?=##\s)/);
                      
                      if (contentSections.length > index + 1) {
                        const targetSection = contentSections[index + 1];
                        
                        // Remove any existing image markdown from this section
                        const imageMarkdownPattern = /\n!\[[^\]]*\]\([^)]+\)\n\n\*Photo by \[[^\]]*\]\([^)]+\) on \[Unsplash\]\([^)]+\)\*\n\n/g;
                        const sectionWithoutImage = targetSection.replace(imageMarkdownPattern, '\n\n');
                        
                        // Insert new image at the end of the section (after all content)
                        contentSections[index + 1] = sectionWithoutImage + newImageMarkdown;
                        updatedContent = contentSections.join('\n');
                      }
                      
                      // Remove from removedIndices since we're adding an image back
                      setRemovedIndices(prev => prev.filter(idx => idx !== index.toString()));

                      return {
                        ...prev,
                        images: updatedImages,
                        content: updatedContent
                      };
                    });
                  }}
                  onImageRemove={(imageIndex: string) => {
                    // Track the removed index
                    setRemovedIndices(prev => [...prev, imageIndex]);
                    
                    // Update the blog content to remove the image markdown
                    setGeneratedBlog(prev => {
                      if (!prev) return null;
                      
                      // Remove image from the specific section by index
                      const index = parseInt(imageIndex);
                      let updatedContent = prev.content;
                      
                      // Split content by sections and remove image from the specific section
                      const contentSections = updatedContent.split(/\n(?=##\s)/);
                      
                      if (contentSections.length > index + 1) {
                        const targetSection = contentSections[index + 1];
                        
                        // Remove any image markdown from this section
                        const imageMarkdownPattern = /\n!\[[^\]]*\]\([^)]+\)\n\n\*Photo by \[[^\]]*\]\([^)]+\) on \[Unsplash\]\([^)]+\)\*\n\n/g;
                        const sectionWithoutImage = targetSection.replace(imageMarkdownPattern, '\n\n');
                        
                        contentSections[index + 1] = sectionWithoutImage;
                        updatedContent = contentSections.join('\n');
                      }
                      
                      return {
                        ...prev,
                        content: updatedContent
                      };
                    });
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
              </div>
            )}
          </div>
        </section>

        {/* How it works section */}
        <section className="py-20 bg-gradient-to-b from-muted/30 to-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4">
                <Lightbulb className="w-4 h-4 mr-2" />
                How It Works
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                Create Content in 3 Simple Steps
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Our AI-powered platform makes content creation effortless and professional
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  step: "1",
                  title: "Choose Your Topic",
                  description: "Tell us what you want to write about. Our AI will research the topic and gather relevant information from trusted sources.",
                  icon: Target,
                  color: "from-blue-500 to-cyan-500"
                },
                {
                  step: "2",
                  title: "Select Style & Tone",
                  description: "Choose your preferred writing style and tone. We'll match your content to your audience and brand voice.",
                  icon: PenTool,
                  color: "from-purple-500 to-pink-500"
                },
                {
                  step: "3",
                  title: "Get Your Blog Post",
                  description: "Receive a complete, well-researched blog post with images and references. Ready to publish immediately!",
                  icon: Rocket,
                  color: "from-green-500 to-emerald-500"
                }
              ].map((item, index) => (
                <Card key={index} className="relative group hover:shadow-xl transition-all duration-300 border-0 bg-card/50 backdrop-blur-sm">
                  <CardContent className="p-8">
                    <div className="flex items-center mb-6">
                      <div className={`flex-shrink-0 h-14 w-14 rounded-2xl bg-gradient-to-r ${item.color} text-white flex items-center justify-center text-xl font-bold shadow-lg`}>
                        {item.step}
                      </div>
                      <div className="ml-4">
                        <item.icon className="h-8 w-8 text-muted-foreground" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-4">
                      {item.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  </CardContent>
                  
                  {/* Arrow for desktop */}
                  {index < 2 && (
                    <div className="hidden md:block absolute -right-8 top-1/2 transform -translate-y-1/2 z-10">
                      <div className="bg-background/90 backdrop-blur-sm rounded-full p-3 shadow-lg border border-border/30">
                        <ArrowRight className="h-5 w-5 text-muted-foreground/60" />
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Developer Tools Section */}
        <section className="py-20 bg-gradient-to-b from-background to-muted/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4">
                <Code className="w-4 h-4 mr-2" />
                Developer Tools
              </Badge>
              <h2 className="text-4xl font-bold text-foreground mb-4">
                Testing & Monitoring
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Advanced tools for testing components and monitoring system performance
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {testingComponents.map((component, index) => (
                <Card key={index} className="group hover:shadow-lg transition-all duration-300 border border-border/50 bg-card/80 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-xl ${component.color} text-white shadow-lg`}>
                        <component.icon className="h-6 w-6" />
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        Test
                      </Badge>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                      {component.title}
                    </h3>
                    
                    <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                      {component.description}
                    </p>
                    
                    <Button 
                      variant="outline" 
                      className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300"
                      onClick={() => window.open(component.url, '_blank')}
                    >
                      <span>Test Component</span>
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      <SignInModal isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen} />
    </div>
  );
}
