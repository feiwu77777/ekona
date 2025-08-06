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

**Solution Options**:
- **Option A**: Web scraping with Puppeteer/Playwright
  - Pros: Full control, can access any website
  - Cons: Rate limiting, legal considerations, maintenance overhead
- **Option B**: News API + Google Custom Search API
  - Pros: Reliable, legal, structured data
  - Cons: API costs, limited to indexed content
- **Option C**: SerpAPI + DuckDuckGo API
  - Pros: No rate limits, diverse sources
  - Cons: Less structured data, potential quality issues

**Recommended**: Option B with fallback to Option C
**✅ Developer Choice**: Option B - News API + Google Custom Search API

#### 1.2 Image Retrieval Agent
**Purpose**: Find and embed relevant openly licensed images

**Image Search & Embedding Process**:
1. **Topic Analysis**: Extract key concepts and themes from blog content
2. **Search Query Generation**: Create relevant search terms for image APIs
3. **Image Retrieval**: Fetch multiple candidate images from APIs
4. **Relevance Scoring**: AI-powered relevance assessment
5. **License Verification**: Ensure images are freely usable
6. **Embedding**: Insert images at appropriate locations in Markdown

**Solution Options**:

**Option A**: Unsplash API + AI Relevance Scoring
- **Search Process**: 
  - Extract key terms from blog content (e.g., "artificial intelligence", "machine learning")
  - Generate search queries: ["AI technology", "computer science", "digital innovation"]
  - Fetch 10-15 candidate images per query
- **Relevance Scoring**: Use AI to score image relevance to blog topic
- **Embedding**: Insert top-scoring images at section breaks or key points
- **Pros**: High quality, free, clear licensing, good API
- **Cons**: Limited to Unsplash content, requires AI scoring

**Option B**: Multi-Source API (Pixabay + Pexels + Unsplash)
- **Search Process**:
  - Query multiple APIs with same search terms
  - Aggregate results and remove duplicates
  - Score relevance across all sources
- **Embedding**: Select best images from combined pool
- **Pros**: Multiple sources, better variety, redundancy
- **Cons**: API rate limits, varying quality, more complex

**Option C**: Google Custom Search API + Manual Verification
- **Search Process**:
  - Use Google Custom Search for comprehensive results
  - Filter by license type (Creative Commons)
  - Manual verification of licensing
- **Embedding**: Manual placement or AI-suggested locations
- **Pros**: Comprehensive, advanced filtering
- **Cons**: Cost per query, licensing verification needed

**Recommended**: Option A with Option B as backup
**✅ Developer Choice**: Option A - Unsplash API + AI Relevance Scoring

**Option D**: CLIP-Based Image Similarity (Advanced)
- **Search Process**:
  - Use CLIP model to encode text queries and image embeddings
  - Search across multiple image APIs (Unsplash, Pixabay, Pexels)
  - Compute cosine similarity between text embeddings and image embeddings
  - Rank images by similarity score
- **Embedding**: Select images with highest similarity scores
- **Pros**: Most accurate relevance matching, semantic understanding
- **Cons**: Requires CLIP API service, more complex implementation

**CLIP API Service Options**:
- **Option D1**: Hugging Face Inference API
  - Model: `openai/clip-vit-base-patch32`
  - Pros: Easy integration, good documentation
  - Cons: Rate limits, potential costs
- **Option D2**: Replicate API
  - Model: `clip-embeddings` or similar
  - Pros: Reliable, good performance
  - Cons: Pay-per-use pricing
- **Option D3**: Self-hosted CLIP (via Hugging Face)
  - Pros: No API costs, full control
  - Cons: Infrastructure requirements, maintenance
- **Option D4**: Azure Computer Vision (CLIP-like)
  - Pros: Enterprise-grade, good integration
  - Cons: Azure dependency, different API

**Recommended**: Option D1 (Hugging Face) for accuracy, Option A for simplicity

#### 1.3 Content Generation Agent
**Purpose**: Compose structured Markdown blog posts

**Solution Options**:
- **Option A**: Single LLM with structured prompts
  - Pros: Simpler, consistent output
  - Cons: Limited creativity, potential repetition
- **Option B**: Multi-agent system (Researcher + Writer + Editor)
  - Pros: Specialized roles, better quality
  - Cons: Higher cost, complexity
- **Option C**: Chain-of-thought with multiple passes
  - Pros: Better reasoning, iterative improvement
  - Cons: Slower, more expensive

**Recommended**: Option B for quality, Option A for MVP
**✅ Developer Choice**: Option A - Single LLM with structured prompts (Gemini API)

#### 1.4 Reference Management Agent
**Purpose**: Provide structured reference list with links

**Solution Options**:
- **Option A**: Manual extraction from research data
  - Pros: Simple, reliable
  - Cons: Limited to what was found
- **Option B**: AI-powered citation generation
  - Pros: Comprehensive, academic quality
  - Cons: Potential hallucination, complexity
- **Option C**: Hybrid approach (manual + AI verification)
  - Pros: Best of both worlds
  - Cons: More complex implementation

**Recommended**: Option C
**✅ Developer Choice**: Option A - Manual extraction from research data

### 2. Frontend Implementation

#### 2.1 Topic Submission Interface
**Purpose**: Allow users to submit blog topics

**Solution Options**:
- **Option A**: Simple text input with topic suggestions
  - Pros: Clean, fast
  - Cons: Limited guidance
- **Option B**: Guided topic wizard with categories
  - Pros: Better UX, structured input
  - Cons: More complex UI
- **Option C**: AI-powered topic expansion
  - Pros: Intelligent suggestions
  - Cons: Additional API calls

**Recommended**: Option B for better UX
**✅ Developer Choice**: Option B - Guided topic wizard with categories

#### 2.2 Real-time Markdown Preview
**Purpose**: Preview blog posts as they're generated

**Solution Options**:
- **Option A**: React Markdown with syntax highlighting
  - Pros: Fast, lightweight
  - Cons: Basic styling
- **Option B**: Custom Markdown renderer with rich styling
  - Pros: Beautiful, customizable
  - Cons: More development time
- **Option C**: Third-party library (react-markdown + remark)
  - Pros: Feature-rich, well-maintained
  - Cons: Bundle size, dependencies

**Recommended**: Option C for feature completeness
**✅ Developer Choice**: Option C - Third-party library (react-markdown + remark)

#### 2.3 Interactive Editing Interface
**Purpose**: Allow natural language edit requests

**Solution Options**:
- **Option A**: Chat-like interface with edit history
  - Pros: Familiar UX, clear history
  - Cons: Linear editing flow
- **Option B**: Inline editing with AI suggestions
  - Pros: Direct editing, immediate feedback
  - Cons: Complex state management
- **Option C**: Split view (original + edited)
  - Pros: Clear comparison, version control
  - Cons: Screen real estate

**Recommended**: Option A for simplicity
**✅ Developer Choice**: Option A - Chat-like interface with edit history

#### 2.4 Image Review System (Stretch Goal)
**Purpose**: Allow users to review and approve suggested images

**Solution Options**:
- **Option A**: Simple approve/reject interface
  - Pros: Fast, straightforward
  - Cons: Limited control
- **Option B**: Image gallery with search/replace
  - Pros: Full control, better UX
  - Cons: More complex implementation
- **Option C**: AI-powered image selection
  - Pros: Intelligent suggestions
  - Cons: Additional complexity

**Recommended**: Option B for user control
**✅ Developer Choice**: Option B - Image gallery with search/replace

### 3. Backend Implementation

#### 3.1 Agent Orchestration
**Purpose**: Coordinate multiple AI agents

**Solution Options**:
- **Option A**: Sequential processing with state management
  - Pros: Simple, predictable
  - Cons: Slower, no parallelization
- **Option B**: Parallel processing with coordination
  - Pros: Faster, efficient
  - Cons: Complex state management
- **Option C**: Event-driven architecture
  - Pros: Scalable, decoupled
  - Cons: More complex, debugging challenges

**Recommended**: Option A for MVP, Option B for production
**✅ Developer Choice**: Option A - Sequential processing with state management

#### 3.2 API Design
**Purpose**: Provide clean endpoints for frontend interaction

**Solution Options**:
- **Option A**: RESTful API with Next.js routes
  - Pros: Familiar, well-supported
  - Cons: Limited real-time capabilities
- **Option B**: GraphQL with Apollo Server
  - Pros: Flexible queries, real-time subscriptions
  - Cons: Learning curve, complexity
- **Option C**: WebSocket + REST hybrid
  - Pros: Real-time updates, familiar REST
  - Cons: More complex setup

**Recommended**: Option A for simplicity
**✅ Developer Choice**: Option A - RESTful API with Next.js routes

#### 3.3 LLM Call Monitoring (Stretch Goal)
**Purpose**: Track and optimize AI usage

**Solution Options**:
- **Option A**: Simple logging to database
  - Pros: Easy to implement
  - Cons: Limited insights
- **Option B**: Dedicated monitoring service
  - Pros: Rich analytics, alerts
  - Cons: Additional infrastructure
- **Option C**: Integration with existing tools (Sentry, etc.)
  - Pros: Leverages existing setup
  - Cons: Limited customization
- **Option D**: Azure OpenAI Service (if using Azure)
  - Pros: Built-in monitoring, cost tracking, performance metrics
  - Cons: Requires Azure setup, vendor lock-in
- **Option E**: LangChain Monitoring
  - Pros: Framework-agnostic, rich analytics, open-source
  - Cons: Additional setup, requires LangSmith account

**Azure OpenAI Monitoring Features**:
- **Request Logging**: All API calls automatically logged
- **Token Usage**: Detailed token consumption tracking
- **Cost Analytics**: Real-time cost monitoring and alerts
- **Performance Metrics**: Latency, throughput, error rates
- **Custom Dashboards**: Azure Application Insights integration
- **Alerting**: Configurable alerts for cost, errors, performance

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

**Recommended**: Option D if using Azure OpenAI, Option A for MVP with direct APIs
**✅ Developer Choice**: Option E - LangChain Monitoring (with Gemini API)

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

**Schema Options**:
- **Option A**: Single table with JSON fields
  - Pros: Simple, flexible
  - Cons: Limited querying capabilities
- **Option B**: Normalized schema with separate tables
  - Pros: Better performance, data integrity
  - Cons: More complex queries
- **Option C**: Hybrid approach (core data + JSON metadata)
  - Pros: Best of both worlds
  - Cons: Moderate complexity

**Recommended**: Option C
**✅ Developer Choice**: Option C - Hybrid approach (core data + JSON metadata)

#### 4.2 References and Image Metadata
**Purpose**: Store sources and image information

**Schema Options**:
- **Option A**: Embedded in blog post JSON
  - Pros: Simple, atomic
  - Cons: Limited querying
- **Option B**: Separate tables with relationships
  - Pros: Better organization, querying
  - Cons: More complex
- **Option C**: Dedicated reference management system
  - Pros: Comprehensive, reusable
  - Cons: Overkill for MVP

**Recommended**: Option B
**✅ Developer Choice**: Option B - Separate tables with relationships

#### 4.3 User Session State
**Purpose**: Track user progress and preferences

**Schema Options**:
- **Option A**: Simple session storage
  - Pros: Fast, simple
  - Cons: Limited persistence
- **Option B**: Full user state management
  - Pros: Complete history, preferences
  - Cons: More complex
- **Option C**: Hybrid (session + persistent storage)
  - Pros: Best UX, reasonable complexity
  - Cons: Moderate implementation effort

**Recommended**: Option C
**✅ Developer Choice**: Option C - Hybrid (session + persistent storage)

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

### 6. Technical Decisions Needed

#### 6.1 AI Provider Selection
**Option A**: Direct API Integration (Current Approach)
- **Primary**: Claude (existing integration)
- **Secondary**: Gemini (existing integration)
- **Fallback**: OpenAI GPT-4 (new integration needed)
- **Pros**: Direct control, no additional infrastructure
- **Cons**: Limited monitoring, no centralized management

**Option B**: Azure OpenAI Service
- **Primary**: Azure OpenAI (GPT-4, GPT-3.5-turbo)
- **Secondary**: Claude via Azure (if available)
- **Fallback**: Direct API calls
- **Pros**: Built-in monitoring, enterprise features, cost optimization
- **Cons**: Additional Azure setup, potential vendor lock-in

**Option C**: Hybrid Approach
- **Primary**: Azure OpenAI for production
- **Secondary**: Direct APIs for development/testing
- **Fallback**: Multiple providers for redundancy
- **Pros**: Best of both worlds, flexibility
- **Cons**: More complex implementation

**Recommended**: Option B for production, Option A for MVP
**✅ Developer Choice**: Option A - Direct API Integration (Gemini API)

#### 6.2 External API Services
- **Research**: News API + Google Custom Search
- **Images**: Unsplash API
- **Monitoring**: LangChain + LangSmith for LLM monitoring

#### 6.3 Azure OpenAI Service Analysis

**Complexity Assessment**:
- **Setup Complexity**: Medium (requires Azure account, resource creation)
- **Integration Complexity**: Low (similar to direct OpenAI API)
- **Maintenance Complexity**: Low (managed service)

**Implementation Steps for Azure OpenAI**:
1. **Azure Setup**: Create Azure account, OpenAI resource
2. **Environment Configuration**: Add Azure OpenAI endpoint and key
3. **SDK Integration**: Use Azure OpenAI SDK or REST API
4. **Monitoring Setup**: Configure Azure Application Insights
5. **Cost Management**: Set up Azure budgets and alerts

**Monitoring Benefits**:
- **Built-in Analytics**: Request/response logging, token usage
- **Cost Tracking**: Real-time cost monitoring and alerts
- **Performance Metrics**: Latency, throughput, error rates
- **Security**: Azure AD integration, private endpoints
- **Compliance**: SOC 2, GDPR, HIPAA compliance

**Migration Strategy**:
- **Phase 1**: Add Azure OpenAI alongside existing providers
- **Phase 2**: Implement provider selection logic
- **Phase 3**: Gradually migrate to Azure OpenAI as primary
- **Phase 4**: Remove direct API dependencies

#### 6.4 Development Approach
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

1. **Choose Implementation Options**: Select preferred solutions for each feature
2. **Create Detailed Technical Specs**: Define exact implementation details
3. **Set Up Development Environment**: Configure new project structure
4. **Begin Phase 1 Implementation**: Start with core blog generation
5. **Iterate Based on Feedback**: Refine based on testing and user input

## Questions for Clarification

1. **Content Quality**: What level of content quality is expected? Academic, casual, or professional? Can add an option os the user can chose between the 3 tones, and then it will be included in the prompt for the blog generation
2. **Image Requirements**: Should images be automatically embedded or user-reviewed? automatically embedded and then user can modify them manually.
3. **Reference Standards**: What citation format is preferred (APA, MLA, etc.)? no preference
4. **User Authentication**: Should this be a public tool or require user accounts? it is public but to have blog post saved it needs an account
5. **Content Length**: Is 1000 words a strict requirement or flexible? 1000 words maximum
6. **Topic Restrictions**: Any topics that should be avoided or restricted? not for now