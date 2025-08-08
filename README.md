# Ekona - AI-Powered Blog Post Generator

A full-stack AI multi-agent system that autonomously generates complete blog posts with research, images, and references. Built with Next.js, Supabase, and Google Gemini AI.

## 🚀 Live Demo

**Access the application:** [https://ekona.vercel.app](https://ekona.vercel.app)

## ✨ Features

### ✅ Core Requirements (100% Complete)
- **AI Multi-Agent Workflow**: Research → Content Generation → Image Retrieval → Reference Management
- **Autonomous Blog Generation**: 1000+ word structured Markdown posts
- **Real-time Research**: Recent articles from News API and Google Custom Search
- **Image Integration**: Relevant images from Unsplash with proper attribution
- **Reference Management**: Complete source citations and links
- **Interactive Editing**: Natural language edit requests via chat interface
- **Live Preview**: Real-time Markdown rendering with copy/download functionality

### 🎯 Stretch Goals (Completed)
- **Image Review System**: Gallery interface for reviewing and replacing images
- **LLM Monitoring**: LangSmith integration for token usage, cost, and performance tracking
- **User Authentication**: Email OTP-based authentication with Supabase
- **Blog Management**: Save, view, and edit previously generated posts
- **Advanced UI**: Modern interface with Shadcn UI components

## 🏗️ Architecture

### AI Multi-Agent Workflow
```
Topic Input → Research Agent → Content Generation → Image Retrieval → Reference Management → Final Blog Post
```

**Agents:**
- **Research Agent**: Fetches recent articles and search results
- **Content Generation Agent**: Creates structured blog content using Gemini AI
- **Image Retrieval Agent**: Finds and scores relevant images
- **Reference Management Agent**: Processes and formats sources

### Tech Stack
- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: Next.js API Routes, Supabase (PostgreSQL)
- **AI/LLM**: Google Gemini API, LangChain, LangSmith
- **APIs**: News API, Google Custom Search, Unsplash
- **Authentication**: Supabase Auth
- **Deployment**: Vercel

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- Google Cloud account (for Gemini API)

### 1. Clone Repository
```bash
git clone https://github.com/feiwu77777/ekona.git
cd ekona
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Create `.env.local` file:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI/LLM
GEMINI_API_KEY=your_gemini_api_key

# LangSmith (Optional)
LANGSMITH_API_KEY=your_langsmith_api_key
LANGSMITH_PROJECT=your_project_name

# APIs
NEWS_API_KEY=your_news_api_key
GOOGLE_CUSTOM_SEARCH_API_KEY=your_google_api_key
GOOGLE_CUSTOM_SEARCH_ENGINE_ID=your_search_engine_id
UNSPLASH_ACCESS_KEY=your_unsplash_access_key

# Monitoring
NEXT_PUBLIC_ENABLE_MONITORING=true
```

### 4. Database Setup
Run the SQL scripts in `supabase_SQL/`:
```sql
-- Execute these in your Supabase SQL editor
-- blog_posts_schema.sql
-- references_schema.sql  
-- user_session_state_schema.sql
```

### 5. Start Development Server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 🧪 Testing

### Quick Test
1. Open the application
2. Enter a topic (e.g., "The Future of AI in Healthcare")
3. Select tone and word count
4. Click "Generate Blog Post"
5. Wait for the multi-agent workflow to complete
6. Review the generated content, images, and references
7. Try the edit interface with natural language requests

### Component Testing
Individual components can be tested through dedicated test pages accessible from the main home page bottom:

- **Research Test**: `/research-test` - Test the research agent functionality
- **Content Test**: `/content-test` - Test content generation and editing
- **Image Test**: `/image-test` - Test image retrieval and management
- **Markdown Test**: `/markdown-test` - Test markdown rendering and preview
- **Edit Test**: `/edit-test` - Test the interactive editing interface
- **Image Review Test**: `/image-review-test` - Test the image review gallery
- **LangSmith Test**: `/langsmith-test` - Test LangSmith integration and monitoring
- **Orchestrator Test**: `/orchestrator-test` - Test the multi-agent orchestration
- **Reference Test**: `/reference-test` - Test reference management functionality

These test pages provide isolated environments to verify each component's functionality independently.

### Monitoring Dashboard
Visit `/monitoring` to view LLM call metrics, token usage, and costs.

## 📊 Success Criteria Achievement

### ✅ Requirements Met

**1. AI Multi-Agent Workflow**
- ✅ Research Agent: Fetches recent articles from News API and Google Custom Search
- ✅ Content Generation: Creates structured 1000+ word Markdown posts
- ✅ Image Retrieval: Finds relevant images with AI scoring
- ✅ Reference Management: Provides complete source citations

**2. Frontend Interface**
- ✅ Topic submission with tone/word count selection
- ✅ Real-time Markdown preview with tabs
- ✅ Interactive editing via chat interface
- ✅ Image review gallery (stretch goal)

**3. Backend Services**
- ✅ Agent orchestration with sequential workflow
- ✅ RESTful API endpoints for all operations
- ✅ LLM call monitoring with LangSmith integration

**4. Data Persistence**
- ✅ Blog posts storage with metadata
- ✅ References and image metadata tracking
- ✅ User session state management

### 🎯 Quality Indicators
- **Clean Architecture**: Modular agent system with clear separation of concerns
- **Documentation**: Comprehensive code comments and feature documentation
- **Error Handling**: Robust error handling and user feedback
- **Performance**: Optimized API calls and efficient data processing
- **Security**: Proper authentication and API key management

## 🤖 AI Tools Usage & Contribution

### AI-Assisted Development Workflow

**Primary AI Tool: Cursor (Claude Sonnet 4)**
- **Code Generation**: 80% of initial implementation
- **Architecture Design**: Multi-agent workflow planning
- **Debugging**: Complex state management and API integration issues
- **Documentation**: README and code comments
- **Refactoring**: Code optimization and best practices

**Specific Contributions:**
1. **Agent Implementation**: Generated complete agent classes with proper error handling
2. **API Integration**: Implemented News API, Google Custom Search, and Unsplash integrations
3. **State Management**: Complex React state for image review and editing workflows
4. **Database Schema**: Designed and implemented Supabase tables
5. **UI Components**: Created responsive components with Shadcn UI
6. **LangSmith Integration**: Implemented monitoring and metrics tracking

**Development Acceleration:**
- **Time Saved**: ~70% compared to manual development
- **Code Quality**: AI-generated code required minimal modifications
- **Learning**: AI helped explore new technologies (LangChain, LangSmith)
- **Iteration**: Rapid prototyping and feature refinement

### AI Tool Transparency
- **Cursor**: Primary development assistant for code generation and debugging
- **GitHub Copilot**: Secondary assistance for code completion
- **ChatGPT**: Research and problem-solving for complex integration issues

## 🔮 Future Enhancements (AI generated, I (Fei Wu) kept it for suggestions)

### Phase 2 Features (2-4 weeks)
- **Multi-language Support**: Generate content in different languages
- **SEO Optimization**: Automatic meta tags and keyword optimization
- **Content Templates**: Pre-built templates for different blog types
- **Collaborative Editing**: Real-time collaboration features
- **Advanced Analytics**: Detailed content performance metrics

### Phase 3 Features (1-2 months)
- **Voice-to-Text**: Voice input for topic and edit requests
- **Content Scheduling**: Automated publishing to various platforms
- **A/B Testing**: Test different content variations
- **Advanced AI Models**: Integration with Claude, GPT-4, or local models
- **Mobile App**: Native mobile application

### Technical Improvements
- **Performance**: Caching layer for API responses
- **Scalability**: Microservices architecture
- **Security**: Advanced authentication and rate limiting
- **Testing**: Comprehensive unit and integration tests
- **CI/CD**: Automated deployment pipelines

## 📁 Project Structure

```
ekona/
├── app/
│   ├── api/                    # API routes
│   ├── components/             # React components
│   ├── lib/                    # Core libraries and agents
│   ├── hooks/                  # Custom React hooks
│   └── blog-posts/             # Blog management pages
├── supabase_SQL/              # Database schemas
├── docs/                      # Documentation
└── public/                    # Static assets
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 📞 Support

For questions or support:
- **Email**: feiwu75000@outlook.com
- **Issues**: [GitHub Issues](https://github.com/feiwu77777/ekona/issues)

---

**Status**: ✅ **PRODUCTION READY** - All core requirements completed with stretch goals achieved.

**Last Updated**: August 2025
**Version**: 1.0.0
