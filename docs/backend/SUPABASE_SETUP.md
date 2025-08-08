# Supabase Setup Guide

This guide will walk you through setting up a Supabase project for the Resume Tailor application.

## 1. Create a Supabase Project

1.  Go to [supabase.com](https://supabase.com/) and sign in or create a new account.
2.  On the dashboard, click on **New Project**.
3.  Choose your organization and give your project a name (e.g., `resume-tailor`).
4.  Generate a secure database password and save it somewhere safe.
5.  Select a region that is closest to you or your users.
6.  Click **Create Project**. Supabase will take a few minutes to set up your new project.

## 2. Get Your API Keys

Once your project is ready, you need to get both client-side and server-side API keys.

1.  In the Supabase dashboard, go to the **Project Settings** (the gear icon in the left sidebar).
2.  Click on the **API** tab.
3.  You will find your **Project URL** and the **Project API keys**.
4.  Copy the following keys:
    - **`URL`** - Your project URL
    - **`anon` (public) key** - Safe to expose on client-side
    - **`service_role` (secret) key** - Keep this secret, server-side only

## 3. Set Up Environment Variables

You need to add both client-side and server-side API keys to your Next.js application as environment variables.

1.  Create a new file named `.env.local` in the root of your project directory (at the same level as `package.json`).
2.  Add the following lines to your `.env.local` file, replacing the placeholders with the values you copied from your Supabase dashboard:

    ```
    # Client-side keys (NEXT_PUBLIC_ prefix makes them accessible in browser)
    NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
    NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
    
    # Server-side key (NO NEXT_PUBLIC_ prefix - keeps it secret)
    SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
    ```

## 4. LangSmith Setup (Optional but Recommended)

For LLM monitoring and cost tracking, set up LangSmith:

1.  Go to [smith.langchain.com](https://smith.langchain.com/) and create an account
2.  Create a new project (e.g., `ekona-blog-generator`)
3.  Get your API key from the project settings
4.  Add these environment variables to your `.env.local`:

    ```
    # LangSmith Configuration
    LANGSMITH_API_KEY=your_langsmith_api_key
    LANGSMITH_PROJECT=ekona-blog-generator
    LANGSMITH_TRACING=true
    LANGSMITH_ENDPOINT=https://api.smith.langchain.com
    ```

## 5. AI Provider Setup

For the blog generation functionality, you'll need API keys for AI providers:

```
# Google Gemini API (for blog generation)
GEMINI_API_KEY=your_gemini_api_key

# News API (for research)
NEWS_API_KEY=your_news_api_key

# Google Custom Search API (for research)
GOOGLE_CUSTOM_SEARCH_API_KEY=your_google_api_key
GOOGLE_CUSTOM_SEARCH_ENGINE_ID=your_search_engine_id

# Unsplash API (for images)
UNSPLASH_ACCESS_KEY=your_unsplash_access_key
```

## 5. Set Up User Profiles and Credits System

To implement user profiles and the credit system for tracking user usage, you need to create custom tables and triggers.

### 5.1 Create the User Profiles Table

1. In your Supabase dashboard, go to the **SQL Editor** (in the left sidebar).
2. Run the following SQL to create the user profiles table:

```sql
-- Create profiles table for additional user information
CREATE TABLE profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255),
  full_name VARCHAR(255),
  avatar_url TEXT,
  subscription_tier VARCHAR(50) DEFAULT 'free',
  subscription_status VARCHAR(50) DEFAULT 'active',
  stripe_customer_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create function to handle new user profile creation (simplified)
CREATE OR REPLACE FUNCTION handle_new_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id, 
    NEW.email,
    '' -- Always insert empty string for full_name
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the user creation
    RAISE LOG 'Failed to create user profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile for new users
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_profile();
```

### 5.2 Create the User Credits Table

1. In your Supabase dashboard, go to the **SQL Editor** (in the left sidebar).
2. Run the following SQL to create the user credits table:

```sql
-- Create user_credits table
CREATE TABLE user_credits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_credits INTEGER NOT NULL DEFAULT 0,
  used_credits INTEGER NOT NULL DEFAULT 0,
  remaining_credits INTEGER GENERATED ALWAYS AS (total_credits - used_credits) STORED,
  last_reset_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  subscription_type VARCHAR(50) DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;

-- Create policies for user_credits
CREATE POLICY "Users can view their own credits" ON user_credits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own credits" ON user_credits
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "User can insert their own credits" ON user_credits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create function to handle new user credit allocation
CREATE OR REPLACE FUNCTION handle_new_user_credits()
RETURNS TRIGGER AS $$
BEGIN
  -- Log that we're starting the function
  RAISE LOG 'Starting handle_new_user_credits for user %', NEW.id;
  
  -- Check if user_credits table exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_credits') THEN
    RAISE LOG 'user_credits table does not exist in information_schema';
  ELSE
    RAISE LOG 'user_credits table found in information_schema';
  END IF;
  
  -- Try to insert credits
  INSERT INTO public.user_credits (user_id, total_credits, used_credits, subscription_type)
  VALUES (NEW.id, 5, 0, 'free');
  
  RAISE LOG 'Successfully created credits for user %', NEW.id;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log detailed error information
    RAISE LOG 'Failed to create user credits for user %: SQLSTATE = %, SQLERRM = %', NEW.id, SQLSTATE, SQLERRM;
    RAISE LOG 'Search path: %', current_setting('search_path');
    RAISE LOG 'Current schema: %', current_schema();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically give new users 5 free credits
CREATE TRIGGER on_auth_user_created_credits
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_credits();

-- Create function to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at on user_credits changes
CREATE TRIGGER update_user_credits_updated_at
  BEFORE UPDATE ON user_credits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to update updated_at on profiles changes
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 5.4 Update Profiles Table for Stripe Integration

Add Stripe-specific columns to the profiles table:

```sql
-- Add Stripe integration columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_cancel_at_period_end BOOLEAN DEFAULT FALSE;

-- Create index for faster Stripe customer lookups
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_subscription_id ON profiles(stripe_subscription_id);
```

### 5.3 Create Credit Usage Function

Add this function to handle credit deduction:

```sql
-- Function to deduct credits for a user
CREATE OR REPLACE FUNCTION deduct_user_credit(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_remaining INTEGER;
BEGIN
  -- Get current remaining credits
  SELECT remaining_credits INTO current_remaining
  FROM user_credits
  WHERE user_id = p_user_id;
  
  -- Check if user has credits
  IF current_remaining IS NULL OR current_remaining <= 0 THEN
    RETURN FALSE;
  END IF;
  
  -- Deduct one credit
  UPDATE user_credits
  SET used_credits = used_credits + 1
  WHERE user_id = p_user_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 5.5 Create Events Tracking Table

1. In your Supabase dashboard, go to the **SQL Editor** (in the left sidebar).
2. Run the following SQL to create the events tracking table:

```sql
-- Create simplified events table
CREATE TABLE events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(255),
  user_id VARCHAR(255), -- Can store both UUID and temporary IDs
  is_error BOOLEAN DEFAULT false,
  error_message TEXT,
  is_dev BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for common queries
CREATE INDEX events_user_id_idx ON events(user_id);
CREATE INDEX events_name_idx ON events(name);
CREATE INDEX events_category_idx ON events(category);
CREATE INDEX events_created_at_idx ON events(created_at);

-- Enable Row Level Security
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Allow insert for everyone (both authenticated and anonymous)
CREATE POLICY "Anyone can insert events" ON events
  FOR INSERT
  WITH CHECK (true);

-- Create helper function to log events
CREATE OR REPLACE FUNCTION log_event(
  p_name VARCHAR(255),
  p_category VARCHAR(255) DEFAULT NULL,
  p_user_id VARCHAR(255) DEFAULT NULL,
  p_is_error BOOLEAN DEFAULT false,
  p_error_message TEXT DEFAULT NULL,
  p_is_dev BOOLEAN DEFAULT false
)
RETURNS UUID AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO events (
    name,
    category,
    user_id,
    is_error,
    error_message,
    is_dev
  ) VALUES (
    p_name,
    p_category,
    p_user_id,
    p_is_error,
    p_error_message,
    p_is_dev
  )
  RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```