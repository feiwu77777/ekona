# Ekona AI Blog Post Generator - Feature File Mapping

## Project Overview
This document maps all files relevant to each feature in the ekona AI blog post generator project. Each feature includes a brief explanation of its functionality.

---

## 1. AI Multi-Agent Workflow

### 1.1 Research Agent
**What it does:** Automatically researches topics by fetching recent articles from News API and comprehensive search results from Google Custom Search API. Combines and filters results to provide relevant, up-to-date information for blog content.

**Core Files:**
- `app/lib/researchAgent.ts` - Main ResearchAgent class implementation
- `app/api/research/route.ts` - Research API endpoint
- `app/components/ResearchTest.tsx` - Test component for research functionality
- `app/research-test/page.tsx` - Test page for research feature

**Configuration Files:**
- `.env.local` - Environment variables for API keys
- `docs/project_planning/planning_refined.md` - Implementation specifications
- `docs/project_planning/planning_progression.md` - Progress tracking

**Dependencies:**
- News API integration
- Google Custom Search API integration

### 1.2 Image Retrieval Agent
**What it does:** Searches for relevant images using Unsplash API, scores them for relevance to the blog topic using AI, and automatically embeds them into the markdown content with proper attribution.

**Core Files:**
- `app/lib/imageRetrievalAgent.ts` - Main ImageRetrievalAgent class implementation
- `app/api/images/route.ts` - Images API endpoint
- `app/components/ImageTest.tsx` - Test component for image functionality
- `app/image-test/page.tsx` - Test page for image feature

**Configuration Files:**
- `.env.local` - Unsplash API key configuration
- `docs/project_planning/planning_refined.md` - Implementation specifications
- `docs/project_planning/planning_progression.md` - Progress tracking

**Dependencies:**
- Unsplash API integration
- Image attribution and compliance handling

### 1.3 Content Generation Agent
**What it does:** Uses Google Gemini API to generate structured blog content based on research data, user preferences (tone, word count), and topic. Creates well-formatted markdown with proper headings, sections, and conclusions.

**Core Files:**
- `app/lib/contentGenerationAgent.ts` - Main ContentGenerationAgent class implementation
- `app/api/generate-blog/route.ts` - Blog generation API endpoint
- `app/api/edit-blog/route.ts` - Blog editing API endpoint

**Configuration Files:**
- `.env.local` - Gemini API key configuration
- `app/lib/prompts.ts` - Prompt templates and versions
- `app/lib/promptVersions/` - Versioned prompt files

**Dependencies:**
- Google Gemini API integration
- LangChain monitoring (future)

### 1.4 Reference Management Agent
**What it does:** Processes research sources, extracts key information, formats references in proper citation style, and embeds them into the blog content for credibility and attribution.

**Core Files:**
- `app/lib/referenceManagementAgent.ts` - Main ReferenceManagementAgent class implementation
- `app/api/references/route.ts` - References API endpoint

**Configuration Files:**
- `docs/project_planning/planning_refined.md` - Implementation specifications
- `docs/project_planning/planning_progression.md` - Progress tracking

---


## 2. Frontend Implementation

### 2.1 Topic Submission Interface
**What it does:** Provides a step-by-step wizard interface for users to input their blog topic, select writing tone (academic, casual, professional), and specify word count preferences before generating content.

**Core Files:**
- `app/components/TopicWizard.tsx` - Main topic wizard component
- `app/page.tsx` - Main page integration with blog generation workflow

**UI Components:**
- `app/components/ui/button.tsx` - Button component
- `app/components/ui/input.tsx` - Input component
- `app/components/ui/label.tsx` - Label component
- `app/components/ui/card.tsx` - Card component
- `app/components/ui/badge.tsx` - Badge component

**Styling:**
- `app/globals.css` - Global styles
- `tailwind.config.js` - Tailwind configuration

### 2.2 Real-time Markdown Preview
**What it does:** Renders generated blog content in real-time with both preview and raw markdown views. Allows users to see how their content will look when published and provides copy/download functionality for the markdown.

**Core Files:**
- `app/components/MarkdownPreview.tsx` - Markdown rendering component
- `app/components/BlogPreview.tsx` - Blog preview component
- `app/components/MarkdownTest.tsx` - Test component for markdown functionality
- `app/markdown-test/page.tsx` - Test page for markdown feature
- `app/components/ui/tabs.tsx` - Tabs component for preview/markdown switching

**Dependencies:**
- `package.json` - react-markdown, remark-gfm, @radix-ui/react-tabs
- `app/globals.css` - Markdown styling

**Integration:**
- `app/page.tsx` - Main page integration with BlogPreview component

### 2.3 Interactive Editing Interface
**What it does:** Provides a chat-based interface for users to request edits to their generated blog content. Uses AI to understand edit requests and applies changes while maintaining a history of all edits made.

**Core Files:**
- `app/components/EditChatInterface.tsx` - Chat interface for editing
- `app/components/EditHistory.tsx` - Edit history component

**UI Components:**
- `app/components/ui/dialog.tsx` - Dialog component
- `app/components/ui/scroll-area.tsx` - Scroll area component

**Integration:**
- `app/page.tsx` - Main page integration

### 2.4 Image Review System
**What it does:** Allows users to review, replace, and manage images in their blog posts. Provides a gallery interface to see all available images, search for new ones, and make changes before finalizing the blog post.

**Core Files:**
- `app/components/ImageReviewGallery.tsx` - Image review component
- `app/hooks/useImageManagement.ts` - Image management hook

**UI Components:**
- `app/components/ui/dialog.tsx` - Dialog component
- `app/components/ui/badge.tsx` - Badge component

### 2.5 Blog Posts Management Interface
**What it does:** Provides a complete interface for users to view, manage, and edit their saved blog posts. Shows a list of all generated posts with metadata and allows users to access individual posts for viewing or further editing.

**Core Files:**
- `app/blog-posts/page.tsx` - Blog posts list page
- `app/blog-posts/[id]/page.tsx` - Individual blog post view page
- `app/components/BlogPreview.tsx` - Blog preview component with editing capabilities

**UI Components:**
- `app/components/ui/card.tsx` - Card component for blog post display
- `app/components/ui/badge.tsx` - Badge component for tone indicators
- `app/components/ui/button.tsx` - Button component for actions
- `app/components/MarkdownPreview.tsx` - Markdown rendering component

**Integration:**
- `app/components/NavBar.tsx` - Navigation with "My Blog Posts" link
- `app/lib/blogPostsService.ts` - Service layer for blog post operations

---

## 3. Backend Implementation

### 3.1 Agent Orchestration
**What it does:** Coordinates all AI agents in a sequential workflow to generate complete blog posts. Manages the flow from research → content generation → image retrieval → reference management, ensuring each step completes before moving to the next.

**Core Files:**
- `app/lib/agentOrchestrator.ts` - Main orchestration class
- `app/api/generate-blog/route.ts` - Main blog generation endpoint

**Integration:**
- `app/page.tsx` - Frontend integration
- `app/lib/researchAgent.ts` - Research agent integration
- `app/lib/contentGenerationAgent.ts` - Content generation integration
- `app/lib/imageRetrievalAgent.ts` - Image retrieval integration
- `app/lib/referenceManagementAgent.ts` - Reference management integration

### 3.2 API Design
**What it does:** Provides a comprehensive REST API for all blog generation, management, and user functionality. Handles authentication, data persistence, and provides endpoints for frontend integration.

**Core API Routes:**
- `app/api/generate-blog/route.ts` - Main blog generation
- `app/api/edit-blog/route.ts` - Blog editing
- `app/api/blog-posts/route.ts` - Blog posts CRUD operations
- `app/api/blog-posts/[id]/route.ts` - Individual blog post operations
- `app/api/blog-posts/stats/route.ts` - Blog post statistics
- `app/api/blog-posts/[id]/references/route.ts` - References management
- `app/api/blog-posts/[id]/images/route.ts` - Images management
- `app/api/blog-posts/stats/references/route.ts` - Reference statistics
- `app/api/blog-posts/stats/images/route.ts` - Image statistics

**User Management API Routes:**
- `app/api/user/preferences/route.ts` - User preferences
- `app/api/user/session/route.ts` - User sessions
- `app/api/user/activity/route.ts` - User activity
- `app/api/user/workspace/route.ts` - User workspaces
- `app/api/user/stats/route.ts` - User statistics
- `app/api/user/profile/route.ts` - User profile
- `app/api/user/credits/route.ts` - User credits

**Authentication:**
- `app/lib/supabaseClient.ts` - Supabase client
- `app/lib/userIdUtils.ts` - User ID utilities

**Error Handling:**
- `app/lib/eventUtils.ts` - Event logging
- `app/lib/errorUtils.ts` - Error handling utilities
- `app/lib/cors.ts` - CORS handling utilities

### 3.3 LLM Call Monitoring
**What it does:** Tracks and monitors all AI/LLM API calls for performance, cost, and usage analytics. Integrates with LangSmith to provide detailed insights into token usage, latency, and costs across all Gemini API calls.

**Core Files:**
- `app/lib/langchainClient.ts` - LangChain client setup with traceable Gemini
- `app/lib/monitoring.ts` - Monitoring utilities and metrics tracking

**API Routes:**
- `app/api/monitoring/metrics/route.ts` - LLM metrics API
- `app/api/monitoring/reset/route.ts` - Metrics reset API
- `app/api/test-langsmith/route.ts` - LangSmith integration test API

**Components:**
- `app/components/MonitoringDashboard.tsx` - Real-time monitoring dashboard
- `app/components/LangSmithTest.tsx` - LangSmith integration test component

**Pages:**
- `app/monitoring/page.tsx` - Monitoring dashboard page
- `app/langsmith-test/page.tsx` - LangSmith test page

**Configuration:**
- `.env.local` - LangSmith API key and project configuration

---

## 4. Database Schema Design

### 4.1 Blog Posts Storage
**What it does:** Stores all generated blog posts with metadata including title, content, generation parameters, and user information. Provides persistent storage and retrieval for user's blog post history.

**Database Files:**
- `supabase_SQL/blog_posts_schema.sql` - Blog posts table schema
- `supabase_SQL/database.types.ts` - TypeScript types

**Integration:**
- `app/lib/supabaseClient.ts` - Database client
- `app/api/blog-posts/route.ts` - Blog posts API

### 4.2 References and Image Metadata
**What it does:** Stores metadata for research references and images used in blog posts, including URLs, attribution information, and relevance scores. Enables tracking and management of sources and visual content.

**Database Files:**
- `supabase_SQL/references_and_images_schema.sql` - References and image metadata tables schema
- `supabase_SQL/database.types.ts` - Updated TypeScript types for references and images

**API Routes:**
- `app/api/blog-posts/[id]/references/route.ts` - References management API
- `app/api/blog-posts/[id]/images/route.ts` - Images management API
- `app/api/blog-posts/stats/references/route.ts` - Reference statistics API
- `app/api/blog-posts/stats/images/route.ts` - Image statistics API

**Integration:**
- `app/lib/blogPostsService.ts` - Service layer for references and images
- `app/lib/referenceManagementAgent.ts` - Reference management
- `app/lib/imageRetrievalAgent.ts` - Image metadata storage

### 4.3 User Session State
**What it does:** Manages user preferences, session data, activity tracking, and workspace state. Stores user-specific settings and provides personalized experience across sessions.

**Database Files:**
- `supabase_SQL/user_session_state_schema.sql` - Complete user session state schema
- `supabase_SQL/database.types.ts` - Updated TypeScript types for user session state

**API Routes:**
- `app/api/user/preferences/route.ts` - User preferences management
- `app/api/user/session/route.ts` - User session management
- `app/api/user/activity/route.ts` - User activity logging
- `app/api/user/workspace/route.ts` - User workspace state management
- `app/api/user/stats/route.ts` - User statistics

**Service Layer:**
- `app/lib/userSessionService.ts` - Complete user session state service

**Integration:**
- `app/hooks/useUserData.ts` - User data management
- `app/lib/sessionUtils.ts` - Session utilities

---

## 5. Integration & Setup

### 5.1 Environment Setup
**What it does:** Manages all configuration and environment variables needed for the application to run, including API keys, database connections, and deployment settings.

**Configuration Files:**
- `.env.local` - Environment variables
- `.env.example` - Environment template
- `next.config.ts` - Next.js configuration

**Documentation:**
- `docs/backend/SUPABASE_SETUP.md` - Supabase setup guide
- `docs/backend/API_KEYS_SETUP.md` - API keys setup guide

### 5.2 Authentication Integration
**What it does:** Handles user authentication using Supabase Auth with email OTP. Manages user sessions, provides secure access to user-specific features, and integrates with the database for user data persistence.

**Core Files:**
- `app/lib/supabaseClient.ts` - Supabase client
- `app/components/SignInModal.tsx` - Sign-in modal (email OTP only)
- `app/components/NavBar.tsx` - Navigation with auth and blog posts link

**Hooks:**
- `app/hooks/useUserData.ts` - User data management
- `app/hooks/useAuth.ts` - Authentication hook

**Updated Features:**
- Removed Google sign-in option from SignInModal
- Updated NavBar branding to "Ekona - AI Blog Generator"
- Added "My Blog Posts" navigation link for authenticated users
- Removed pricing section from navigation

### 5.3 UI Component Integration
**What it does:** Provides a consistent design system using Shadcn UI components with Tailwind CSS. Ensures uniform styling, accessibility, and user experience across all application interfaces.

**Core Components:**
- `app/components/ui/` - All UI components
- `components.json` - Component configuration
- `lib/utils.ts` - Utility functions

**Styling:**
- `app/globals.css` - Global styles
- `tailwind.config.js` - Tailwind configuration

---

## 6. Testing & Quality Assurance

### 6.1 Unit Testing
**Test Files:**
- `__tests__/agents/` - Agent unit tests
- `__tests__/api/` - API endpoint tests
- `__tests__/components/` - Component tests

**Configuration:**
- `jest.config.js` - Jest configuration
- `package.json` - Test scripts

### 6.2 Integration Testing
**Test Files:**
- `__tests__/integration/` - Integration tests
- `__tests__/e2e/` - End-to-end tests

**Test Pages:**
- `app/research-test/page.tsx` - Research testing
- `app/image-test/page.tsx` - Image testing

### 6.3 Performance Testing
**Test Files:**
- `__tests__/performance/` - Performance tests
- `scripts/benchmark.js` - Benchmarking scripts

---

## 7. Deployment & Monitoring

### 7.1 Production Deployment
**Configuration Files:**
- `vercel.json` - Vercel deployment config
- `package.json` - Build scripts
- `next.config.ts` - Production configuration

**Environment:**
- `.env.production` - Production environment variables
- `docs/deployment/` - Deployment guides

### 7.2 User Testing
**Test Files:**
- `docs/testing/user_acceptance_tests.md` - User acceptance tests
- `docs/testing/feedback_collection.md` - Feedback collection

---

## File Organization Summary

### Core Application Files
- `app/page.tsx` - Main application page with blog generation workflow
- `app/layout.tsx` - Root layout
- `app/globals.css` - Global styles

### Agent Implementation Files
- `app/lib/researchAgent.ts` - Research agent with News API and Google Custom Search
- `app/lib/imageRetrievalAgent.ts` - Image retrieval agent with Unsplash API
- `app/lib/contentGenerationAgent.ts` - Content generation agent with Gemini API
- `app/lib/referenceManagementAgent.ts` - Reference management agent
- `app/lib/agentOrchestrator.ts` - Multi-agent orchestration

### API Route Files
- `app/api/research/route.ts` - Research API endpoint
- `app/api/images/route.ts` - Image search API endpoint
- `app/api/generate-blog/route.ts` - Main blog generation endpoint
- `app/api/edit-blog/route.ts` - Blog editing endpoint
- `app/api/blog-posts/route.ts` - Blog posts CRUD operations
- `app/api/blog-posts/[id]/route.ts` - Individual blog post operations
- `app/api/blog-posts/stats/route.ts` - Blog post statistics
- `app/api/blog-posts/[id]/references/route.ts` - References management
- `app/api/blog-posts/[id]/images/route.ts` - Images management
- `app/api/user/preferences/route.ts` - User preferences
- `app/api/user/session/route.ts` - User sessions
- `app/api/user/activity/route.ts` - User activity
- `app/api/user/workspace/route.ts` - User workspaces
- `app/api/user/stats/route.ts` - User statistics
- `app/api/monitoring/metrics/route.ts` - LLM monitoring metrics
- `app/api/monitoring/reset/route.ts` - Monitoring reset
- `app/api/test-langsmith/route.ts` - LangSmith integration test

### Component Files
- `app/components/TopicWizard.tsx` - Topic submission wizard
- `app/components/MarkdownPreview.tsx` - Markdown rendering component
- `app/components/BlogPreview.tsx` - Blog preview with editing capabilities
- `app/components/EditChatInterface.tsx` - Chat interface for editing
- `app/components/ImageReviewGallery.tsx` - Image review gallery
- `app/components/MonitoringDashboard.tsx` - LLM monitoring dashboard
- `app/components/LangSmithTest.tsx` - LangSmith integration test
- `app/components/SignInModal.tsx` - Email OTP sign-in modal
- `app/components/NavBar.tsx` - Updated navigation with Ekona branding
- `app/components/ui/` - All UI components (button, input, card, badge, etc.)

### Page Files
- `app/blog-posts/page.tsx` - Blog posts list page
- `app/blog-posts/[id]/page.tsx` - Individual blog post view page
- `app/monitoring/page.tsx` - Monitoring dashboard page
- `app/langsmith-test/page.tsx` - LangSmith test page

### Configuration Files
- `.env.local` - Environment variables (API keys, LangSmith config)
- `tailwind.config.js` - Tailwind configuration
- `next.config.ts` - Next.js configuration
- `package.json` - Dependencies and scripts
- `components.json` - UI component configuration

### Documentation Files
- `docs/project_planning/planning_refined.md` - Refined implementation plan
- `docs/project_planning/planning_progression.md` - Progress tracking (100% complete)
- `docs/project_planning/planning_files.md` - This file mapping document
- `docs/backend/` - Backend documentation
- `docs/testing/` - Testing documentation

### Service Layer Files
- `app/lib/blogPostsService.ts` - Blog posts database operations
- `app/lib/userSessionService.ts` - User session state operations
- `app/lib/langchainClient.ts` - LangChain client with traceable Gemini
- `app/lib/monitoring.ts` - LLM monitoring utilities

### Database Schema Files
- `supabase_SQL/blog_posts_schema.sql` - Blog posts table schema
- `supabase_SQL/references_and_images_schema.sql` - References and images schema
- `supabase_SQL/user_session_state_schema.sql` - User session state schema
- `supabase_SQL/database.types.ts` - Complete TypeScript type definitions

---

*Last Updated: December 2024*
*Total Files Mapped: 80+ files across 7 major feature areas*
*Implementation Status: 100% Complete*
