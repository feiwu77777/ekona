# Ekona AI Blog Post Generator - Implementation Planning

## Project Overview
Transform the existing resume-tailor project into an AI-powered blog post generator that can autonomously research topics, compose structured content, and provide interactive editing capabilities.

## Current Infrastructure Analysis
- **Frontend**: Next.js 15 with React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes with Supabase integration
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with Google OAuth
- **AI Integration**: Anthropic Claude and Google Gemini SDKs
- **UI Components**: Radix UI components with custom styling

## Feature Implementation Planning

### 1. AI Multi-Agent Workflow

#### 1.1 Research Agent
**Purpose**: Fetch recent, relevant articles from the internet

**✅ Developer Choice**: Option B - News API + Google Custom Search API
- **Search Process**: 
  - Use News API for recent articles and breaking news
  - Use Google Custom Search API for comprehensive coverage
  - Combine results and remove duplicates
- **Pros**: Reliable, legal, structured data
- **Cons**: API costs, limited to indexed content

**Implementation Instructions**:
```typescript
// 1. Set up API keys and environment variables
// .env.local
NEWS_API_KEY=your_news_api_key
GOOGLE_CUSTOM_SEARCH_API_KEY=your_google_api_key
GOOGLE_CUSTOM_SEARCH_ENGINE_ID=your_search_engine_id

// 2. Create research agent service
// app/lib/researchAgent.ts
interface ResearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
  publishedAt?: string;
}

export class ResearchAgent {
  private newsApiKey: string;
  private googleApiKey: string;
  private searchEngineId: string;

  constructor() {
    this.newsApiKey = process.env.NEWS_API_KEY!;
    this.googleApiKey = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY!;
    this.searchEngineId = process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID!;
  }

  async researchTopic(topic: string): Promise<ResearchResult[]> {
    // Step 1: Get recent news articles
    const newsResults = await this.getNewsArticles(topic);
    
    // Step 2: Get comprehensive search results
    const searchResults = await this.getSearchResults(topic);
    
    // Step 3: Combine and deduplicate results
    const combinedResults = this.combineAndDeduplicate(newsResults, searchResults);
    
    // Step 4: Filter for relevance and quality
    const filteredResults = this.filterResults(combinedResults, topic);
    
    return filteredResults.slice(0, 10); // Return top 10 results
  }

  private async getNewsArticles(topic: string): Promise<ResearchResult[]> {
    const response = await fetch(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(topic)}&sortBy=publishedAt&language=en&pageSize=20&apiKey=${this.newsApiKey}`
    );
    
    const data = await response.json();
    return data.articles.map((article: any) => ({
      title: article.title,
      url: article.url,
      snippet: article.description,
      source: article.source.name,
      publishedAt: article.publishedAt
    }));
  }

  private async getSearchResults(topic: string): Promise<ResearchResult[]> {
    const response = await fetch(
      `https://www.googleapis.com/customsearch/v1?key=${this.googleApiKey}&cx=${this.searchEngineId}&q=${encodeURIComponent(topic)}&num=10`
    );
    
    const data = await response.json();
    return data.items.map((item: any) => ({
      title: item.title,
      url: item.link,
      snippet: item.snippet,
      source: new URL(item.link).hostname
    }));
  }

  private combineAndDeduplicate(news: ResearchResult[], search: ResearchResult[]): ResearchResult[] {
    const allResults = [...news, ...search];
    const seen = new Set();
    
    return allResults.filter(result => {
      const key = result.url;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private filterResults(results: ResearchResult[], topic: string): ResearchResult[] {
    // Filter out low-quality sources, irrelevant content
    const blockedDomains = ['facebook.com', 'twitter.com', 'instagram.com'];
    
    return results.filter(result => {
      const domain = new URL(result.url).hostname;
      return !blockedDomains.some(blocked => domain.includes(blocked));
    });
  }
}
```

**Setup Steps**:
1. **News API Setup**: Sign up at newsapi.org, get API key
2. **Google Custom Search**: Create search engine at https://cse.google.com/
3. **Environment Variables**: Add API keys to .env.local
4. **API Route**: Create `/api/research` endpoint using ResearchAgent
5. **Error Handling**: Implement rate limiting and fallback mechanisms

#### 1.2 Image Retrieval Agent
**Purpose**: Find and embed relevant openly licensed images

**Image Search & Embedding Process**:
1. **Topic Analysis**: Extract key concepts and themes from blog content
2. **Search Query Generation**: Create relevant search terms for image APIs
3. **Image Retrieval**: Fetch multiple candidate images from APIs
4. **Relevance Scoring**: AI-powered relevance assessment
5. **License Verification**: Ensure images are freely usable
6. **Embedding**: Insert images at appropriate locations in Markdown

**✅ Developer Choice**: Option A - Unsplash API + AI Relevance Scoring
- **Search Process**: 
  - Extract key terms from blog content (e.g., "artificial intelligence", "machine learning")
  - Generate search queries: ["AI technology", "computer science", "digital innovation"]
  - Fetch 10-15 candidate images per query
- **Relevance Scoring**: Use AI to score image relevance to blog topic
- **Embedding**: Insert top-scoring images at section breaks or key points
- **Pros**: High quality, free, clear licensing, good API
- **Cons**: Limited to Unsplash content, requires AI scoring

**Implementation Instructions**:
```typescript
// 1. Set up Unsplash API
// .env.local
UNSPLASH_ACCESS_KEY=your_unsplash_access_key

// 2. Create image retrieval agent
// app/lib/imageRetrievalAgent.ts
interface ImageData {
  id: string;
  url: string;
  alt: string;
  photographer: string;
  downloadUrl: string;
  relevanceScore?: number;
}

export class ImageRetrievalAgent {
  private unsplashAccessKey: string;
  private geminiLLM: any; // Your Gemini instance

  constructor() {
    this.unsplashAccessKey = process.env.UNSPLASH_ACCESS_KEY!;
  }

  async findRelevantImages(blogContent: string, topic: string): Promise<ImageData[]> {
    // Step 1: Extract key concepts from blog content
    const keyConcepts = await this.extractKeyConcepts(blogContent);
    
    // Step 2: Generate search queries
    const searchQueries = this.generateSearchQueries(keyConcepts);
    
    // Step 3: Search for images
    const allImages = await this.searchImages(searchQueries);
    
    // Step 4: Score relevance using AI
    const scoredImages = await this.scoreImageRelevance(allImages, topic);
    
    // Step 5: Select top images
    return scoredImages
      .filter(img => img.relevanceScore! >= 7)
      .sort((a, b) => b.relevanceScore! - a.relevanceScore!)
      .slice(0, 3);
  }

  private async extractKeyConcepts(content: string): Promise<string[]> {
    const prompt = `
      Extract 5-7 key visual concepts from this blog content that would be good for image search:
      "${content}"
      
      Return only the concepts, one per line, no explanations.
    `;
    
    const response = await this.geminiLLM.generateContent(prompt);
    const concepts = response.text().split('\n').filter(c => c.trim());
    return concepts;
  }

  private generateSearchQueries(concepts: string[]): string[] {
    return concepts.map(concept => [
      concept,
      `${concept} technology`,
      `${concept} illustration`,
      `${concept} concept`
    ]).flat().slice(0, 5); // Limit to 5 queries
  }

  private async searchImages(queries: string[]): Promise<ImageData[]> {
    const allImages: ImageData[] = [];
    
    for (const query of queries) {
      try {
        const response = await fetch(
          `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=10&orientation=landscape`,
          {
            headers: {
              'Authorization': `Client-ID ${this.unsplashAccessKey}`
            }
          }
        );
        
        const data = await response.json();
        const images = data.results.map((photo: any) => ({
          id: photo.id,
          url: photo.urls.regular,
          alt: photo.alt_description || query,
          photographer: photo.user.name,
          downloadUrl: photo.links.download
        }));
        
        allImages.push(...images);
      } catch (error) {
        console.error(`Failed to search for "${query}":`, error);
      }
    }
    
    return allImages;
  }

  private async scoreImageRelevance(images: ImageData[], topic: string): Promise<ImageData[]> {
    const scoredImages = await Promise.all(
      images.map(async (image) => {
        const prompt = `
          Rate the relevance of this image to the blog topic: "${topic}"
          Image description: ${image.alt}
          
          Rate from 1-10 where 10 is highly relevant.
          Consider: visual connection, thematic alignment, professional appropriateness.
          
          Return only the number.
        `;
        
        try {
          const response = await this.geminiLLM.generateContent(prompt);
          const score = parseInt(response.text().trim());
          return { ...image, relevanceScore: score };
        } catch (error) {
          return { ...image, relevanceScore: 5 }; // Default score
        }
      })
    );
    
    return scoredImages;
  }

  async embedImagesInMarkdown(markdown: string, images: ImageData[]): Promise<string> {
    const sections = markdown.split('\n## ');
    const embeddedSections = sections.map((section, index) => {
      if (index === 0) return section; // Skip title section
      
      const relevantImage = this.findRelevantImageForSection(section, images);
      
      if (relevantImage) {
        return `\n![${relevantImage.alt}](${relevantImage.url})\n\n## ${section}`;
      }
      
      return `\n## ${section}`;
    });
    
    return embeddedSections.join('');
  }

  private findRelevantImageForSection(section: string, images: ImageData[]): ImageData | null {
    // Simple keyword matching - could be enhanced with AI
    const sectionLower = section.toLowerCase();
    
    for (const image of images) {
      const imageKeywords = image.alt.toLowerCase().split(' ');
      const hasMatch = imageKeywords.some(keyword => 
        sectionLower.includes(keyword) && keyword.length > 3
      );
      
      if (hasMatch) return image;
    }
    
    return images[0] || null; // Return first image if no match
  }
}
```

**Setup Steps**:
1. **Unsplash API**: Sign up at unsplash.com/developers, get access key
2. **Environment Variables**: Add UNSPLASH_ACCESS_KEY to .env.local
3. **API Route**: Create `/api/images` endpoint using ImageRetrievalAgent
4. **Image Attribution**: Ensure proper Unsplash attribution in generated content
5. **Rate Limiting**: Implement proper rate limiting for Unsplash API calls

#### 1.3 Content Generation Agent
**Purpose**: Compose structured Markdown blog posts

**✅ Developer Choice**: Option A - Single LLM with structured prompts (Gemini API)
- **Implementation**: Use Gemini 2.5 Pro with well-structured prompts
- **Pros**: Simpler, consistent output, cost-effective
- **Cons**: Limited creativity, potential repetition

**Implementation Instructions**:
```typescript
// 1. Set up Gemini API
// .env.local
GEMINI_API_KEY=your_gemini_api_key

// 2. Create content generation agent
// app/lib/contentGenerationAgent.ts
interface BlogGenerationOptions {
  topic: string;
  tone: 'academic' | 'casual' | 'professional';
  maxWords: number;
  researchData: any[];
  includeImages: boolean;
}

interface GeneratedBlog {
  title: string;
  content: string;
  wordCount: number;
  sections: string[];
  metadata: {
    tone: string;
    generatedAt: string;
    modelUsed: string;
  };
}

export class ContentGenerationAgent {
  private geminiLLM: any;

  constructor() {
    this.geminiLLM = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  }

  async generateBlog(options: BlogGenerationOptions): Promise<GeneratedBlog> {
    // Step 1: Create structured prompt
    const prompt = this.buildPrompt(options);
    
    // Step 2: Generate content with Gemini
    const response = await this.geminiLLM.getGenerativeModel({ model: "gemini-2.5-pro" })
      .generateContent(prompt);
    
    const generatedText = response.response.text();
    
    // Step 3: Parse and structure the response
    const parsedBlog = this.parseGeneratedContent(generatedText, options);
    
    return parsedBlog;
  }

  private buildPrompt(options: BlogGenerationOptions): string {
    const toneInstructions = {
      academic: "Write in an academic style with formal language, citations, and scholarly tone.",
      casual: "Write in a conversational, friendly tone suitable for a general audience.",
      professional: "Write in a professional business tone, clear and authoritative."
    };

    return `
You are an expert blog writer. Create a comprehensive blog post on "${options.topic}".

**Requirements:**
- Maximum ${options.maxWords} words
- ${toneInstructions[options.tone]}
- Include proper Markdown formatting
- Use the provided research data for accuracy
- Structure with clear headings (## for main sections)
- Include an engaging introduction and conclusion

**Research Data:**
${options.researchData.map(item => `- ${item.title}: ${item.snippet}`).join('\n')}

**Output Format:**
Return the blog post in this exact format:

# [Blog Title]

[Introduction paragraph]

## [Section 1 Title]
[Section 1 content]

## [Section 2 Title]
[Section 2 content]

## [Section 3 Title]
[Section 3 content]

## Conclusion
[Conclusion paragraph]

**Word Count:** [exact number]

Write the blog post now:
`;
  }

  private parseGeneratedContent(content: string, options: BlogGenerationOptions): GeneratedBlog {
    // Extract title (first line starting with #)
    const titleMatch = content.match(/^# (.+)$/m);
    const title = titleMatch ? titleMatch[1] : options.topic;
    
    // Remove title from content
    const contentWithoutTitle = content.replace(/^# .+$/m, '').trim();
    
    // Split into sections
    const sections = contentWithoutTitle.split(/\n## /).map(section => section.trim());
    
    // Count words
    const wordCount = contentWithoutTitle.split(/\s+/).length;
    
    return {
      title,
      content: contentWithoutTitle,
      wordCount,
      sections,
      metadata: {
        tone: options.tone,
        generatedAt: new Date().toISOString(),
        modelUsed: "gemini-2.5-pro"
      }
    };
  }

  async editBlog(originalContent: string, editRequest: string): Promise<string> {
    const prompt = `
Original blog content:
${originalContent}

Edit request: ${editRequest}

Please provide the edited blog content with the requested changes. Maintain the same structure and tone.
`;

    const response = await this.geminiLLM.getGenerativeModel({ model: "gemini-2.5-pro" })
      .generateContent(prompt);
    
    return response.response.text();
  }
}
```

**Setup Steps**:
1. **Gemini API**: Get API key from Google AI Studio
2. **LangSmith**: Sign up at https://smith.langchain.com/ and get API key
3. **Environment Variables**: Add API keys to .env.local
4. **API Route**: Create `/api/generate-blog` endpoint using ContentGenerationAgent
5. **Prompt Engineering**: Test and refine prompts for different tones
6. **Error Handling**: Implement retry logic and fallback responses

**Environment Variables**:
```bash
# Add to .env.local
LANGSMITH_TRACING="true"
LANGSMITH_ENDPOINT="https://api.smith.langchain.com"
LANGSMITH_API_KEY="your_langsmith_api_key"
LANGSMITH_PROJECT="your_project_name"
GEMINI_API_KEY="your_gemini_api_key"
```

#### 1.4 Reference Management Agent
**Purpose**: Provide structured reference list with links

**✅ Developer Choice**: Option A - Simplified extraction from research data
- **Implementation**: Use research data directly without additional processing
- **Pros**: Simple, reliable, fast, no complex filtering needed
- **Cons**: Limited to what was found, no customization

**Implementation Instructions**:
```typescript
// 1. Create reference management agent
// app/lib/referenceManagementAgent.ts
interface Reference {
  title: string;
  url: string;
  source: string;
  publishedAt?: string;
  relevance: number;
}

interface ReferenceList {
  references: Reference[];
  totalCount: number;
  generatedAt: string;
}

export class ReferenceManagementAgent {
  async extractReferences(researchData: any[], blogContent: string): Promise<ReferenceList> {
    // Simply use the research data as-is, no additional filtering needed
    const references = this.formatReferences(researchData);
    
    return {
      references,
      totalCount: references.length,
      generatedAt: new Date().toISOString()
    };
  }

  private formatReferences(researchData: any[]): Reference[] {
    return researchData.map(ref => ({
      title: ref.title,
      url: ref.url,
      source: ref.source,
      publishedAt: ref.publishedAt
    }));
  }

  generateMarkdownReferences(references: Reference[]): string {
    let markdown = '\n## References\n\n';
    
    references.forEach((ref, index) => {
      const date = ref.publishedAt ? ` (${new Date(ref.publishedAt).getFullYear()})` : '';
      markdown += `${index + 1}. [${ref.title}](${ref.url}) - ${ref.source}${date}\n`;
    });
    
    return markdown;
  }

  async embedReferencesInBlog(blogContent: string, references: Reference[]): Promise<string> {
    // Remove existing references section if present
    const contentWithoutRefs = blogContent.replace(/\n## References[\s\S]*$/, '');
    
    // Add new references section
    const referencesMarkdown = this.generateMarkdownReferences(references);
    
    return contentWithoutRefs + referencesMarkdown;
  }
}
```

**Setup Steps**:
1. **Integration**: Integrate with ResearchAgent to get research data
2. **API Route**: Create `/api/references` endpoint using ReferenceManagementAgent
3. **Database Storage**: Store references with blog posts in database
4. **Validation**: Ensure all URLs are valid and accessible
5. **Attribution**: Include proper attribution for all sources

### 2. Frontend Implementation

#### 2.1 Topic Submission Interface
**Purpose**: Allow users to submit blog topics

**✅ Developer Choice**: Option B - Guided topic wizard with categories
- **Implementation**: Create step-by-step wizard with predefined categories
- **Pros**: Better UX, structured input
- **Cons**: More complex UI

**Implementation Instructions**:
```typescript
// 1. Create topic wizard component
// app/components/TopicWizard.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface TopicWizardProps {
  onTopicSubmit: (topic: string, category: string, tone: string) => void;
  isLoading?: boolean;
}

const CATEGORIES = [
  'Technology',
  'Business',
  'Science',
  'Health',
  'Education',
  'Entertainment',
  'Sports',
  'Politics',
  'Environment',
  'Other'
];

const TONES = [
  { value: 'casual', label: 'Casual', description: 'Friendly and conversational' },
  { value: 'professional', label: 'Professional', description: 'Business-like and authoritative' },
  { value: 'academic', label: 'Academic', description: 'Formal and scholarly' }
];

export default function TopicWizard({ onTopicSubmit, isLoading }: TopicWizardProps) {
  const [step, setStep] = useState(1);
  const [topic, setTopic] = useState('');
  const [category, setCategory] = useState('');
  const [tone, setTone] = useState('');

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = () => {
    if (topic && category && tone) {
      onTopicSubmit(topic, category, tone);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center justify-between mb-8">
        {[1, 2, 3].map((stepNumber) => (
          <div key={stepNumber} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step >= stepNumber ? 'bg-primary text-primary-foreground' : 'bg-muted'
            }`}>
              {stepNumber}
            </div>
            {stepNumber < 3 && (
              <div className={`w-16 h-1 mx-2 ${
                step > stepNumber ? 'bg-primary' : 'bg-muted'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Topic Input */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="topic">What would you like to write about?</Label>
            <Input
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., The Future of Artificial Intelligence"
              className="mt-2"
            />
          </div>
          <Button onClick={handleNext} disabled={!topic.trim()}>
            Next
          </Button>
        </div>
      )}

      {/* Step 2: Category Selection */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <Label>Choose a category</Label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              {CATEGORIES.map((cat) => (
                <Button
                  key={cat}
                  variant={category === cat ? 'default' : 'outline'}
                  onClick={() => setCategory(cat)}
                  className="justify-start"
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleBack}>
              Back
            </Button>
            <Button onClick={handleNext} disabled={!category}>
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Tone Selection */}
      {step === 3 && (
        <div className="space-y-4">
          <div>
            <Label>Choose your writing tone</Label>
            <div className="space-y-3 mt-2">
              {TONES.map((toneOption) => (
                <div
                  key={toneOption.value}
                  className={`p-4 border rounded-lg cursor-pointer ${
                    tone === toneOption.value ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                  onClick={() => setTone(toneOption.value)}
                >
                  <div className="font-medium">{toneOption.label}</div>
                  <div className="text-sm text-muted-foreground">
                    {toneOption.description}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleBack}>
              Back
            </Button>
            <Button onClick={handleSubmit} disabled={!tone || isLoading}>
              {isLoading ? 'Generating...' : 'Generate Blog Post'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
```

**Setup Steps**:
1. **Component Creation**: Create TopicWizard component in app/components/
2. **Styling**: Use existing Tailwind classes and UI components
3. **State Management**: Handle wizard state and form validation
4. **Integration**: Connect to blog generation API
5. **Accessibility**: Add proper ARIA labels and keyboard navigation

#### 2.2 Real-time Markdown Preview
**Purpose**: Preview blog posts as they're generated

**✅ Developer Choice**: Option C - Third-party library (react-markdown + remark)
- **Implementation**: Use react-markdown with remark plugins
- **Pros**: Feature-rich, well-maintained
- **Cons**: Bundle size, dependencies

**Implementation Instructions**:
```typescript
// 1. Install dependencies
// npm install react-markdown remark-gfm remark-highlight.js

// 2. Create markdown preview component
// app/components/MarkdownPreview.tsx
'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkHighlight from 'remark-highlight.js';
import 'highlight.js/styles/github.css';

interface MarkdownPreviewProps {
  content: string;
  className?: string;
}

export default function MarkdownPreview({ content, className }: MarkdownPreviewProps) {
  return (
    <div className={`prose prose-lg max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkHighlight]}
        components={{
          // Custom image component with error handling
          img: ({ src, alt, ...props }) => (
            <img
              src={src}
              alt={alt}
              className="max-w-full h-auto rounded-lg shadow-md"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
              {...props}
            />
          ),
          // Custom heading styles
          h1: ({ children, ...props }) => (
            <h1 className="text-3xl font-bold text-gray-900 mb-4" {...props}>
              {children}
            </h1>
          ),
          h2: ({ children, ...props }) => (
            <h2 className="text-2xl font-semibold text-gray-800 mb-3 mt-6" {...props}>
              {children}
            </h2>
          ),
          h3: ({ children, ...props }) => (
            <h3 className="text-xl font-medium text-gray-700 mb-2 mt-4" {...props}>
              {children}
            </h3>
          ),
          // Custom paragraph styles
          p: ({ children, ...props }) => (
            <p className="text-gray-700 leading-relaxed mb-4" {...props}>
              {children}
            </p>
          ),
          // Custom link styles
          a: ({ href, children, ...props }) => (
            <a
              href={href}
              className="text-blue-600 hover:text-blue-800 underline"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            >
              {children}
            </a>
          ),
          // Custom list styles
          ul: ({ children, ...props }) => (
            <ul className="list-disc list-inside mb-4 space-y-1" {...props}>
              {children}
            </ul>
          ),
          ol: ({ children, ...props }) => (
            <ol className="list-decimal list-inside mb-4 space-y-1" {...props}>
              {children}
            </ol>
          ),
          // Custom blockquote styles
          blockquote: ({ children, ...props }) => (
            <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-600 mb-4" {...props}>
              {children}
            </blockquote>
          ),
          // Custom code styles
          code: ({ children, className, ...props }) => {
            const isInline = !className;
            return isInline ? (
              <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono" {...props}>
                {children}
              </code>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          pre: ({ children, ...props }) => (
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto mb-4" {...props}>
              {children}
            </pre>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

// 3. Create blog preview component with real-time updates
// app/components/BlogPreview.tsx
'use client';

import { useState, useEffect } from 'react';
import MarkdownPreview from './MarkdownPreview';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface BlogPreviewProps {
  content: string;
  title?: string;
  onEdit?: () => void;
}

export default function BlogPreview({ content, title, onEdit }: BlogPreviewProps) {
  const [wordCount, setWordCount] = useState(0);

  useEffect(() => {
    const words = content.split(/\s+/).filter(word => word.length > 0).length;
    setWordCount(words);
  }, [content]);

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-gray-50 px-4 py-3 border-b flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h3 className="font-medium">Blog Preview</h3>
          <span className="text-sm text-gray-500">{wordCount} words</span>
        </div>
        {onEdit && (
          <Button variant="outline" size="sm" onClick={onEdit}>
            Edit
          </Button>
        )}
      </div>
      
      <Tabs defaultValue="preview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="markdown">Markdown</TabsTrigger>
        </TabsList>
        
        <TabsContent value="preview" className="p-6">
          {title && <h1 className="text-3xl font-bold mb-6">{title}</h1>}
          <MarkdownPreview content={content} />
        </TabsContent>
        
        <TabsContent value="markdown" className="p-6">
          <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm">
            {content}
          </pre>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

**Setup Steps**:
1. **Dependencies**: Install react-markdown and remark plugins
2. **Component Creation**: Create MarkdownPreview and BlogPreview components
3. **Styling**: Add custom styles for different markdown elements
4. **Error Handling**: Add image error handling and fallbacks
5. **Performance**: Implement lazy loading for large content

#### 2.3 Interactive Editing Interface
**Purpose**: Allow natural language edit requests

**✅ Developer Choice**: Option A - Chat-like interface with edit history
- **Implementation**: Create chat interface for natural language edit requests
- **Pros**: Familiar UX, clear history
- **Cons**: Linear editing flow

**Implementation Instructions**:
```typescript
// 1. Create chat interface component
// app/components/EditChatInterface.tsx
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

// 2. Create edit history component
// app/components/EditHistory.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface EditHistoryProps {
  history: Array<{
    id: string;
    request: string;
    timestamp: Date;
    contentSnapshot: string;
  }>;
  onRestore: (content: string) => void;
}

export default function EditHistory({ history, onRestore }: EditHistoryProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Edit History ({history.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-96">
        <DialogHeader>
          <DialogTitle>Edit History</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 overflow-y-auto">
          {history.map((edit) => (
            <div key={edit.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <p className="font-medium">{edit.request}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onRestore(edit.contentSnapshot);
                    setIsOpen(false);
                  }}
                >
                  Restore
                </Button>
              </div>
              <p className="text-sm text-gray-500">
                {edit.timestamp.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

**Setup Steps**:
1. **Component Creation**: Create EditChatInterface and EditHistory components
2. **State Management**: Handle chat messages and edit history
3. **API Integration**: Connect to blog editing API
4. **Error Handling**: Add proper error states and retry logic
5. **Accessibility**: Add keyboard navigation and screen reader support

#### 2.4 Image Review System (Stretch Goal)
**Purpose**: Allow users to review and approve suggested images

**✅ Developer Choice**: Option B - Image gallery with search/replace
- **Implementation**: Allow users to review and search for alternative images
- **Pros**: Full control, better UX
- **Cons**: More complex implementation

**Implementation Instructions**:
```typescript
// 1. Create image review component
// app/components/ImageReviewGallery.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface ImageData {
  id: string;
  url: string;
  alt: string;
  photographer: string;
  downloadUrl: string;
  relevanceScore?: number;
}

interface ImageReviewGalleryProps {
  currentImages: ImageData[];
  onImageReplace: (oldImageId: string, newImage: ImageData) => void;
  onImageRemove: (imageId: string) => void;
  onSearchImages: (query: string) => Promise<ImageData[]>;
}

export default function ImageReviewGallery({
  currentImages,
  onImageReplace,
  onImageRemove,
  onSearchImages
}: ImageReviewGalleryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ImageData[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const results = await onSearchImages(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Failed to search images:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleReplaceImage = (newImage: ImageData) => {
    if (selectedImageId) {
      onImageReplace(selectedImageId, newImage);
      setSelectedImageId(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          Review Images ({currentImages.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Image Review & Management</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Current Images */}
          <div>
            <h3 className="font-medium mb-4">Current Images</h3>
            <div className="space-y-4">
              {currentImages.map((image) => (
                <div key={image.id} className="border rounded-lg p-4">
                  <div className="flex items-start gap-4">
                    <img
                      src={image.url}
                      alt={image.alt}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{image.alt}</p>
                      <p className="text-xs text-gray-500">By {image.photographer}</p>
                      {image.relevanceScore && (
                        <Badge variant="secondary" className="mt-1">
                          Score: {image.relevanceScore}/10
                        </Badge>
                      )}
                      <div className="flex gap-2 mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedImageId(image.id)}
                        >
                          Replace
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => onImageRemove(image.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Search & Replace */}
          <div>
            <h3 className="font-medium mb-4">Search New Images</h3>
            
            {selectedImageId && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  Select a new image to replace the current one
                </p>
              </div>
            )}

            <div className="flex gap-2 mb-4">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for images..."
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={isSearching}>
                {isSearching ? 'Searching...' : 'Search'}
              </Button>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {searchResults.map((image) => (
                  <div key={image.id} className="border rounded-lg p-4">
                    <div className="flex items-start gap-4">
                      <img
                        src={image.url}
                        alt={image.alt}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{image.alt}</p>
                        <p className="text-xs text-gray-500">By {image.photographer}</p>
                        {image.relevanceScore && (
                          <Badge variant="secondary" className="mt-1">
                            Score: {image.relevanceScore}/10
                          </Badge>
                        )}
                        {selectedImageId && (
                          <Button
                            size="sm"
                            className="mt-2"
                            onClick={() => handleReplaceImage(image)}
                          >
                            Use This Image
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// 2. Create image management hook
// app/hooks/useImageManagement.ts
import { useState } from 'react';

export function useImageManagement(initialImages: ImageData[] = []) {
  const [images, setImages] = useState<ImageData[]>(initialImages);

  const addImage = (image: ImageData) => {
    setImages(prev => [...prev, image]);
  };

  const removeImage = (imageId: string) => {
    setImages(prev => prev.filter(img => img.id !== imageId));
  };

  const replaceImage = (oldImageId: string, newImage: ImageData) => {
    setImages(prev => prev.map(img => 
      img.id === oldImageId ? newImage : img
    ));
  };

  const reorderImages = (fromIndex: number, toIndex: number) => {
    setImages(prev => {
      const newImages = [...prev];
      const [movedImage] = newImages.splice(fromIndex, 1);
      newImages.splice(toIndex, 0, movedImage);
      return newImages;
    });
  };

  return {
    images,
    addImage,
    removeImage,
    replaceImage,
    reorderImages
  };
}
```

**Setup Steps**:
1. **Component Creation**: Create ImageReviewGallery component
2. **Hook Creation**: Create useImageManagement hook for state management
3. **API Integration**: Connect to Unsplash API for image search
4. **Image Optimization**: Implement lazy loading and error handling
5. **Drag & Drop**: Add drag-and-drop functionality for image reordering

### 3. Backend Implementation

#### 3.1 Agent Orchestration
**Purpose**: Coordinate multiple AI agents

**✅ Developer Choice**: Option A - Sequential processing with state management
- **Implementation**: Process research → content generation → image retrieval → reference management in sequence
- **Pros**: Simple, predictable
- **Cons**: Slower, no parallelization

**Implementation Instructions**:
```typescript
// 1. Create agent orchestration service
// app/lib/agentOrchestrator.ts
import { ResearchAgent } from './researchAgent';
import { ContentGenerationAgent } from './contentGenerationAgent';
import { ImageRetrievalAgent } from './imageRetrievalAgent';
import { ReferenceManagementAgent } from './referenceManagementAgent';

interface BlogGenerationRequest {
  topic: string;
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

interface GenerationState {
  step: 'research' | 'content' | 'images' | 'references' | 'complete' | 'error';
  progress: number;
  message: string;
  data?: any;
}

export class AgentOrchestrator {
  private researchAgent: ResearchAgent;
  private contentAgent: ContentGenerationAgent;
  private imageAgent: ImageRetrievalAgent;
  private referenceAgent: ReferenceManagementAgent;

  constructor() {
    this.researchAgent = new ResearchAgent();
    this.contentAgent = new ContentGenerationAgent();
    this.imageAgent = new ImageRetrievalAgent();
    this.referenceAgent = new ReferenceManagementAgent();
  }

  async generateBlog(request: BlogGenerationRequest): Promise<BlogGenerationResult> {
    const startTime = Date.now();
    let researchData: any[] = [];
    let generatedContent = '';
    let images: any[] = [];
    let references: any[] = [];

    try {
      // Step 1: Research
      console.log('Starting research phase...');
      researchData = await this.researchAgent.researchTopic(request.topic);
      console.log(`Found ${researchData.length} research sources`);

      // Step 2: Content Generation
      console.log('Starting content generation...');
      const blogResult = await this.contentAgent.generateBlog({
        topic: request.topic,
        tone: request.tone,
        maxWords: request.maxWords,
        researchData,
        includeImages: request.includeImages
      });
      generatedContent = blogResult.content;
      console.log(`Generated ${blogResult.wordCount} words`);

      // Step 3: Image Retrieval (if requested)
      if (request.includeImages) {
        console.log('Starting image retrieval...');
        images = await this.imageAgent.findRelevantImages(generatedContent, request.topic);
        console.log(`Found ${images.length} relevant images`);
        
        // Embed images in content
        generatedContent = await this.imageAgent.embedImagesInMarkdown(generatedContent, images);
      }

      // Step 4: Reference Management
      console.log('Starting reference management...');
      const referenceResult = await this.referenceAgent.extractReferences(researchData, generatedContent);
      references = referenceResult.references;
      console.log(`Extracted ${references.length} references`);

      // Embed references in content
      generatedContent = await this.referenceAgent.embedReferencesInBlog(generatedContent, references);

      const generationTime = Date.now() - startTime;

      return {
        title: blogResult.title,
        content: generatedContent,
        images,
        references,
        metadata: {
          generationTime,
          wordCount: blogResult.wordCount,
          modelUsed: blogResult.metadata.modelUsed,
          generatedAt: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('Blog generation failed:', error);
      throw new Error(`Blog generation failed: ${error.message}`);
    }
  }

  async generateBlogWithProgress(
    request: BlogGenerationRequest,
    onProgress: (state: GenerationState) => void
  ): Promise<BlogGenerationResult> {
    const steps = [
      { name: 'research', weight: 0.2 },
      { name: 'content', weight: 0.5 },
      { name: 'images', weight: 0.2 },
      { name: 'references', weight: 0.1 }
    ];

    let currentStep = 0;
    let accumulatedProgress = 0;

    const updateProgress = (stepName: string, message: string, data?: any) => {
      const stepIndex = steps.findIndex(s => s.name === stepName);
      if (stepIndex > currentStep) {
        accumulatedProgress += steps[currentStep].weight;
        currentStep = stepIndex;
      }
      
      onProgress({
        step: stepName as any,
        progress: Math.min(accumulatedProgress + (steps[currentStep]?.weight || 0), 1),
        message,
        data
      });
    };

    try {
      // Step 1: Research
      updateProgress('research', 'Researching your topic...');
      const researchData = await this.researchAgent.researchTopic(request.topic);
      updateProgress('research', `Found ${researchData.length} sources`, researchData);

      // Step 2: Content Generation
      updateProgress('content', 'Generating blog content...');
      const blogResult = await this.contentAgent.generateBlog({
        topic: request.topic,
        tone: request.tone,
        maxWords: request.maxWords,
        researchData,
        includeImages: request.includeImages
      });
      updateProgress('content', `Generated ${blogResult.wordCount} words`, blogResult);

      // Step 3: Images
      let images: any[] = [];
      if (request.includeImages) {
        updateProgress('images', 'Finding relevant images...');
        images = await this.imageAgent.findRelevantImages(blogResult.content, request.topic);
        updateProgress('images', `Found ${images.length} images`, images);
        
        blogResult.content = await this.imageAgent.embedImagesInMarkdown(blogResult.content, images);
      }

      // Step 4: References
      updateProgress('references', 'Extracting references...');
      const referenceResult = await this.referenceAgent.extractReferences(researchData, blogResult.content);
      updateProgress('references', `Extracted ${referenceResult.references.length} references`, referenceResult);

      blogResult.content = await this.referenceAgent.embedReferencesInBlog(blogResult.content, referenceResult.references);

      updateProgress('complete', 'Blog generation complete!', {
        title: blogResult.title,
        content: blogResult.content,
        images,
        references: referenceResult.references
      });

      return {
        title: blogResult.title,
        content: blogResult.content,
        images,
        references: referenceResult.references,
        metadata: {
          generationTime: Date.now(),
          wordCount: blogResult.wordCount,
          modelUsed: blogResult.metadata.modelUsed,
          generatedAt: new Date().toISOString()
        }
      };

    } catch (error) {
      updateProgress('error', `Generation failed: ${error.message}`);
      throw error;
    }
  }
}
```

**Setup Steps**:
1. **Service Creation**: Create AgentOrchestrator class
2. **Error Handling**: Implement comprehensive error handling and retry logic
3. **Progress Tracking**: Add progress callbacks for real-time updates
4. **State Management**: Handle generation state and recovery
5. **Logging**: Add detailed logging for debugging and monitoring

#### 3.2 API Design
**Purpose**: Provide clean endpoints for frontend interaction

**✅ Developer Choice**: Option A - RESTful API with Next.js routes
- **Implementation**: Use Next.js API routes for all backend functionality
- **Pros**: Familiar, well-supported, follows existing patterns
- **Cons**: Limited real-time capabilities

**Implementation Instructions**:
```typescript
// 1. Create main blog generation API route
// app/api/generate-blog/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { AgentOrchestrator } from '@/lib/agentOrchestrator';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { topic, tone, maxWords, includeImages } = await request.json();

    // Validate request
    if (!topic || !tone || !maxWords) {
      return NextResponse.json(
        { error: 'Missing required fields: topic, tone, maxWords' },
        { status: 400 }
      );
    }

    // Get user ID from auth
    const authHeader = request.headers.get('authorization');
    let userId: string | null = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (!error && user) {
        userId = user.id;
      }
    }

    // Initialize orchestrator
    const orchestrator = new AgentOrchestrator();

    // Generate blog
    const result = await orchestrator.generateBlog({
      topic,
      tone,
      maxWords: Math.min(maxWords, 1000), // Enforce 1000 word limit
      includeImages: includeImages ?? true
    });

    // Save to database if user is authenticated
    if (userId) {
      const { error: saveError } = await supabase
        .from('blog_posts')
        .insert({
          user_id: userId,
          title: result.title,
          content: result.content,
          topic,
          tone,
          word_count: result.metadata.wordCount,
          generation_time: result.metadata.generationTime,
          model_used: result.metadata.modelUsed,
          images: result.images,
          references: result.references,
          metadata: result.metadata
        });

      if (saveError) {
        console.error('Failed to save blog post:', saveError);
      }
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Blog generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate blog post' },
      { status: 500 }
    );
  }
}

// 2. Create blog editing API route
// app/api/edit-blog/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ContentGenerationAgent } from '@/lib/contentGenerationAgent';

const contentAgent = new ContentGenerationAgent();

export async function POST(request: NextRequest) {
  try {
    const { originalContent, editRequest } = await request.json();

    if (!originalContent || !editRequest) {
      return NextResponse.json(
        { error: 'Missing required fields: originalContent, editRequest' },
        { status: 400 }
      );
    }

    const updatedContent = await contentAgent.editBlog(originalContent, editRequest);

    return NextResponse.json({ content: updatedContent });

  } catch (error) {
    console.error('Blog editing error:', error);
    return NextResponse.json(
      { error: 'Failed to edit blog post' },
      { status: 500 }
    );
  }
}

// 3. Create image search API route
// app/api/search-images/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ImageRetrievalAgent } from '@/lib/imageRetrievalAgent';

const imageAgent = new ImageRetrievalAgent();

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: 'Missing query parameter' },
        { status: 400 }
      );
    }

    const images = await imageAgent.searchImages([query]);

    return NextResponse.json({ images });

  } catch (error) {
    console.error('Image search error:', error);
    return NextResponse.json(
      { error: 'Failed to search images' },
      { status: 500 }
    );
  }
}

// 4. Create blog posts retrieval API route
// app/api/blog-posts/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    let userId: string | null = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (!error && user) {
        userId = user.id;
      }
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { data: posts, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ posts });

  } catch (error) {
    console.error('Failed to fetch blog posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blog posts' },
      { status: 500 }
    );
  }
}

// 5. Create progress tracking API route (for real-time updates)
// app/api/generate-blog/progress/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { topic, tone, maxWords, includeImages } = await request.json();

    // Validate request
    if (!topic || !tone || !maxWords) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const orchestrator = new AgentOrchestrator();
    
    // Use Server-Sent Events for real-time progress
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        const onProgress = (state: any) => {
          const data = `data: ${JSON.stringify(state)}\n\n`;
          controller.enqueue(encoder.encode(data));
        };

        orchestrator.generateBlogWithProgress({
          topic,
          tone,
          maxWords: Math.min(maxWords, 1000),
          includeImages: includeImages ?? true
        }, onProgress).then(result => {
          const data = `data: ${JSON.stringify({ type: 'complete', result })}\n\n`;
          controller.enqueue(encoder.encode(data));
          controller.close();
        }).catch(error => {
          const data = `data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`;
          controller.enqueue(encoder.encode(data));
          controller.close();
        });
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Progress tracking error:', error);
    return NextResponse.json(
      { error: 'Failed to start progress tracking' },
      { status: 500 }
    );
  }
}
```

**Setup Steps**:
1. **API Routes**: Create all necessary API routes in app/api/
2. **Authentication**: Implement proper auth checks for protected routes
3. **Error Handling**: Add comprehensive error handling and validation
4. **Rate Limiting**: Implement rate limiting for API endpoints
5. **CORS**: Configure CORS for cross-origin requests

#### 3.3 LLM Call Monitoring (Stretch Goal)
**Purpose**: Track and optimize AI usage

**✅ Developer Choice**: Option E - LangChain Monitoring (with Gemini API)

**LangChain Monitoring Features**:
- **Request Tracking**: All LLM calls automatically logged
- **Token Usage**: Detailed token consumption tracking
- **Cost Analytics**: Real-time cost monitoring across providers
- **Performance Metrics**: Latency, throughput, error rates
- **Chain Visualization**: Visual representation of multi-step workflows
- **Debugging Tools**: Step-by-step execution tracking
- **Custom Dashboards**: LangSmith integration for analytics
- **Alerting**: Configurable alerts for cost, errors, performance

**LangSmith Dashboard Benefits**:
- **Workflow Visualization**: See your multi-agent workflow as a graph
- **Cost Tracking**: Monitor costs across different LLM providers
- **Performance Analysis**: Identify bottlenecks in your chains
- **Debugging**: Step through each agent's execution
- **A/B Testing**: Compare different prompt versions
- **Team Collaboration**: Share insights with team members

**Gemini API + LangChain Implementation**:
```typescript
// Gemini API with LangChain monitoring
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Client } from "langsmith";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

// Initialize LangSmith client
const client = new Client({
  apiKey: process.env.LANGCHAIN_API_KEY,
  project: "ekona-blog-generator"
});

// Configure Gemini with LangChain monitoring
const geminiLLM = new ChatGoogleGenerativeAI({
  modelName: "gemini-2.5-pro",
  temperature: 0.7,
  maxOutputTokens: 4000,
  callbacks: [
    {
      handleLLMStart: async (llm, prompts) => {
        console.log("Gemini call started:", { model: llm.modelName, prompts });
      },
      handleLLMEnd: async (output, runId) => {
        console.log("Gemini call completed:", { 
          output: output.generations[0][0].text,
          runId,
          tokenUsage: output.llmOutput?.tokenUsage
        });
      },
      handleLLMError: async (error, runId) => {
        console.error("Gemini call failed:", { error, runId });
      }
    }
  ]
});

// Blog generation chain with monitoring
const blogGenerationChain = new SequentialChain({
  chains: [
    researchChain,
    contentGenerationChain,
    imageRetrievalChain,
    referenceChain
  ],
  callbacks: [
    {
      handleChainStart: async (chain) => {
        console.log("Chain started:", chain.name);
      },
      handleChainEnd: async (outputs, runId) => {
        console.log("Chain completed:", { outputs, runId });
      }
    }
  ]
});
```

**Benefits of This Approach**:
- **Cost Effective**: Gemini API is generally cheaper than GPT-4
- **Good Performance**: Gemini 2.5 Pro has excellent capabilities
- **Rich Monitoring**: LangSmith provides detailed insights
- **No Vendor Lock-in**: Can easily switch providers if needed
- **Workflow Visualization**: See your entire blog generation process

### 4. Database Schema Design

#### 4.1 Blog Posts Storage
**Purpose**: Store generated blog posts and metadata

**✅ Developer Choice**: Option C - Hybrid approach (core data + JSON metadata)
- **Implementation**: Store core blog data in structured tables with JSON fields for flexible metadata
- **Pros**: Best of both worlds - performance and flexibility
- **Cons**: Moderate complexity

#### 4.2 References and Image Metadata
**Purpose**: Store sources and image information

**✅ Developer Choice**: Option B - Separate tables with relationships
- **Implementation**: Create separate tables for references and image metadata with proper relationships to blog posts
- **Pros**: Better organization, querying capabilities
- **Cons**: More complex

#### 4.3 User Session State
**Purpose**: Track user progress and preferences

**✅ Developer Choice**: Option C - Hybrid (session + persistent storage)
- **Implementation**: Combine fast session storage with persistent user preferences and history
- **Pros**: Best UX, reasonable complexity
- **Cons**: Moderate implementation effort

### 5. Integration Strategy

#### 5.1 Existing Code Adaptation
**Approach**: 
1. **Authentication**: Reuse existing Supabase auth system
2. **UI Components**: Adapt existing components for blog interface
3. **API Structure**: Follow existing Next.js API patterns
4. **Database**: Extend existing Supabase schema
5. **Styling**: Maintain existing Tailwind/Radix UI system

#### 5.2 Migration Plan
**Phase 1**: Core blog generation functionality
- Implement research and content generation agents
- Create basic topic submission interface
- Set up database schema for blogs

**Phase 2**: Enhanced features
- Add image retrieval and review system
- Implement interactive editing
- Add reference management

**Phase 3**: Polish and optimization
- Add monitoring and analytics
- Optimize performance
- Enhance UX

### 6. Technical Decisions

#### 6.1 AI Provider Selection
**✅ Developer Choice**: Option A - Direct API Integration (Gemini API)
- **Primary**: Gemini 2.5 Pro for all blog generation tasks
- **Pros**: Cost effective, good performance, no vendor lock-in
- **Cons**: Limited monitoring, no centralized management

#### 6.2 External API Services
- **Research**: News API + Google Custom Search
- **Images**: Unsplash API
- **Monitoring**: LangChain + LangSmith for LLM monitoring

#### 6.3 Development Approach
- **MVP First**: Focus on core blog generation
- **Iterative**: Add features based on user feedback
- **AI-Assisted**: Use Cursor and other AI tools for development

### 7. Success Metrics

#### 7.1 Technical Metrics
- Blog generation time < 2 minutes
- 95%+ successful image retrieval
- < 5% error rate in content generation

#### 7.2 User Experience Metrics
- Topic submission to preview < 30 seconds
- Edit request response < 10 seconds
- User satisfaction with generated content

#### 7.3 Business Metrics
- User engagement with editing features
- Content quality ratings
- Feature adoption rates

## Next Steps

1. **Create Detailed Technical Specs**: Define exact implementation details
2. **Set Up Development Environment**: Configure new project structure
3. **Begin Phase 1 Implementation**: Start with core blog generation
4. **Iterate Based on Feedback**: Refine based on testing and user input

## Clarified Requirements

1. **Content Quality**: Add option for users to choose between academic, casual, or professional tone, included in the prompt for blog generation
2. **Image Requirements**: Automatically embedded and then user can modify them manually
3. **Reference Standards**: No preference for citation format
4. **User Authentication**: Public tool but requires account to save blog posts
5. **Content Length**: 1000 words maximum
6. **Topic Restrictions**: No restrictions for now