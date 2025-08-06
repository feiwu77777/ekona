# Resume Tailor - Application Functionality Documentation

## Overview
Resume Tailor is a Next.js application that provides AI-powered resume customization services. Users can upload their LaTeX resumes and job descriptions to receive tailored resumes, cover letters, and interview question responses.

## Core Features

### 1. Resume Tailoring Engine
**Location**: `app/page.tsx` (main functionality), `app/api/tailor-resume/route.ts`

**Functionality**:
- AI-powered resume customization based on job descriptions
- Support for multiple LLM providers (Gemini, Claude)
- LaTeX format preservation and enhancement
- Keyword integration from job offers
- Missing skills acknowledgment with learning statements

**Key Components**:
- `InputSection.tsx` - Job offer and resume input forms
- `ResultsSection.tsx` - Display tailored results
- `LLMProviderSelector.tsx` - Choose between AI providers

### 2. Authentication System
**Location**: `app/components/SignInModal.tsx`, `app/lib/supabaseClient.ts`

**Functionality**:
- Email-based authentication (magic links)
- Google OAuth integration
- Anonymous user tracking
- Web3Forms email notifications on sign-in

**Features**:
- Passwordless authentication
- Session management
- User profile creation
- Anonymous user ID generation

### 3. Resume Management
**Location**: `app/components/ResumeManager.tsx`, `app/hooks/useResumes.ts`, `app/api/resumes/`

**Functionality**:
- Multiple resume storage
- Primary resume designation
- Resume editing capabilities
- LaTeX preview and validation
- Resume versioning

**API Endpoints**:
- `GET /api/resumes` - Fetch user resumes
- `POST /api/resumes` - Save new resume
- `PUT /api/resumes/[id]` - Update existing resume
- `DELETE /api/resumes/[id]` - Delete resume

### 4. User Profile & Credits System
**Location**: `app/profile/page.tsx`, `app/hooks/useUserData.ts`, `app/lib/creditsUtils.ts`

**Functionality**:
- User profile management
- Credit tracking and consumption
- Subscription status display
- Billing portal access
- Account settings

**Features**:
- Credit balance display
- Usage history
- Profile information editing
- Subscription management

### 5. Subscription & Billing System
**Location**: `app/pricing/page.tsx`, `app/api/stripe/`, `app/lib/stripeUtils.ts`

**Functionality**:
- Three-tier pricing (Starter, Professional, Enterprise)
- Monthly and yearly billing cycles
- Stripe integration for payments
- Subscription management portal
- Plan switching capabilities

**Pricing Tiers**:
- **Starter**: $4.99/month ($4.17/year) - 30 credits
- **Professional**: $12.99/month ($10.83/year) - 120 credits
- **Enterprise**: $24.99/month ($20.83/year) - 500 credits

**API Endpoints**:
- `POST /api/stripe/create-checkout-session` - Create payment session
- `POST /api/stripe/create-portal-session` - Access billing portal
- `POST /api/stripe/cancel-subscription` - Cancel subscription
- `POST /api/webhooks/stripe` - Handle Stripe webhooks

### 6. LaTeX Processing & Validation
**Location**: `app/lib/latexUtils.ts`, `app/components/LaTeXPreviewDialog.tsx`

**Functionality**:
- LaTeX syntax validation
- Special character escaping
- PDF generation capabilities
- Preview rendering
- Error detection and reporting

**Features**:
- Real-time LaTeX validation
- Syntax highlighting
- Error suggestions
- PDF export functionality

### 7. Event Tracking & Analytics
**Location**: `app/lib/eventUtils.ts`, `app/api/events/route.ts`

**Functionality**:
- User behavior tracking
- Feature usage analytics
- Error monitoring
- Anonymous user tracking
- Performance metrics

**Tracked Events**:
- Page loads
- Sign-in attempts
- Resume generations
- Credit purchases
- Feature usage

## Component Architecture

### Core Components (`app/components/`)

1. **NavBar.tsx**
   - Navigation menu
   - User authentication status
   - Credit balance display
   - Profile access

2. **InputSection.tsx**
   - Job description input
   - Resume upload/editing
   - Generation options (cover letter, questions)
   - Form validation

3. **ResultsSection.tsx**
   - Display tailored results
   - Copy to clipboard functionality
   - Download options
   - LaTeX preview

4. **ResumeManager.tsx**
   - Resume storage interface
   - Resume editing capabilities
   - Primary resume selection
   - Resume deletion

5. **SignInModal.tsx**
   - Authentication interface
   - Email and Google sign-in
   - Web3Forms notifications

6. **LLMProviderSelector.tsx**
   - AI provider selection
   - Model configuration
   - Provider-specific settings

### UI Components (`app/components/ui/`)
- `button.tsx` - Reusable button components
- `dialog.tsx` - Modal dialog components
- `input.tsx` - Form input components
- `label.tsx` - Form label components
- `badge.tsx` - Status badge components

## Hooks (`app/hooks/`)

1. **useUserData.ts**
   - User profile management
   - Credit balance tracking
   - Subscription status

2. **useResumes.ts**
   - Resume CRUD operations
   - Primary resume management
   - Resume synchronization

3. **useCredits.ts**
   - Credit consumption tracking
   - Balance updates
   - Usage validation

## Utility Libraries (`app/lib/`)

1. **prompts.ts** & **promptVersions/**
   - AI prompt management
   - Version control for prompts
   - Prompt customization

2. **stripeUtils.ts**
   - Stripe integration
   - Payment processing
   - Subscription management

3. **resumesUtils.ts**
   - Resume data operations
   - Database interactions
   - Resume validation

4. **creditsUtils.ts**
   - Credit system logic
   - Balance calculations
   - Usage tracking

5. **latexUtils.ts**
   - LaTeX processing
   - Syntax validation
   - PDF generation

6. **eventUtils.ts**
   - Analytics tracking
   - Event logging
   - Performance monitoring

7. **userIdUtils.ts**
   - Anonymous user management
   - User ID generation
   - Session tracking

## API Routes (`app/api/`)

### Authentication & User Management
- `user/profile/route.ts` - User profile operations
- `user/credits/route.ts` - Credit management

### Resume Operations
- `resumes/route.ts` - Resume CRUD operations
- `resumes/[id]/route.ts` - Individual resume operations

### Payment & Billing
- `stripe/create-checkout-session/route.ts` - Payment initiation
- `stripe/create-portal-session/route.ts` - Billing portal
- `stripe/cancel-subscription/route.ts` - Subscription cancellation
- `webhooks/stripe/route.ts` - Stripe webhook handling

### Core Functionality
- `tailor-resume/route.ts` - Main AI processing endpoint
- `events/route.ts` - Analytics event logging

## Pages (`app/`)

1. **page.tsx** (Home)
   - Main application interface
   - Resume tailoring workflow
   - User dashboard

2. **profile/page.tsx**
   - User profile management
   - Account settings
   - Subscription details

3. **pricing/page.tsx**
   - Subscription plans
   - Payment processing
   - Plan comparison

## Database Schema

The application uses Supabase with the following main tables:
- `profiles` - User profiles and subscription data
- `resumes` - User resume storage
- `credits` - Credit balance and usage tracking
- `events` - Analytics and user behavior tracking

## Environment Variables

Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret
- `NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY` - Web3Forms access key
- `GEMINI_API_KEY` - Google Gemini API key
- `ANTHROPIC_API_KEY` - Anthropic Claude API key

## Security Features

1. **Row Level Security (RLS)** - Database-level access control
2. **Authentication Guards** - Protected routes and components
3. **Input Validation** - Form and API input sanitization
4. **Rate Limiting** - API usage restrictions
5. **Anonymous User Tracking** - Non-intrusive analytics

## Performance Optimizations

1. **Client-side State Management** - React hooks for local state
2. **Lazy Loading** - Component and route optimization
3. **Caching** - Supabase query caching
4. **Error Boundaries** - Graceful error handling
5. **Loading States** - User experience improvements

## Deployment

The application is configured for deployment on Vercel with:
- Automatic builds from Git repository
- Environment variable management
- Edge function support
- CDN optimization
- Analytics integration

## Future Enhancements

Planned features include:
- Resume templates library
- Advanced LaTeX customization
- Multi-language support
- Team collaboration features
- Advanced analytics dashboard
- Mobile application