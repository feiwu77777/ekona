# Database Schema Documentation

This document outlines the database structure for Resume Tailor, including user management and credit tracking.

## Overview

The Resume Tailor application uses Supabase (PostgreSQL) with the following main components:
- **auth.users**: Built-in Supabase authentication table
- **profiles**: Custom user profile information
- **user_credits**: Credit tracking and usage
- **user_resumes**: User's saved LaTeX resume templates

## Database Tables

### 1. auth.users (Built-in Supabase)
This is Supabase's built-in authentication table that stores core user authentication data.

**Key Fields:**
- `id` (UUID): Primary key, referenced by other tables
- `email` (VARCHAR): User's email address
- `encrypted_password` (VARCHAR): Hashed password
- `email_confirmed_at` (TIMESTAMP): Email confirmation timestamp
- `raw_user_meta_data` (JSONB): Additional data from OAuth providers
- `created_at` (TIMESTAMP): Account creation time

### 2. profiles (Custom)
Stores additional user information and preferences.

```sql
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
```

**Fields:**
- `id`: Primary key
- `user_id`: Foreign key to auth.users(id)
- `email`: Copy of user's email for easier access
- `full_name`: User's display name (from OAuth or manual entry)
- `avatar_url`: Profile picture URL
- `subscription_tier`: 'free', 'starter', 'professional', 'enterprise'
- `subscription_status`: 'active', 'cancelled', 'expired'
- `stripe_customer_id`: Stripe customer ID for billing
- `created_at`: Profile creation timestamp
- `updated_at`: Last update timestamp

### 3. user_credits (Custom)
Tracks user credit allocation and usage.

```sql
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
```

**Fields:**
- `id`: Primary key
- `user_id`: Foreign key to auth.users(id)
- `total_credits`: Total credits allocated to user
- `used_credits`: Number of credits consumed
- `remaining_credits`: Computed field (total - used)
- `last_reset_date`: When credits were last reset (for subscriptions)
- `subscription_type`: Current subscription type
- `created_at`: Record creation timestamp
- `updated_at`: Last update timestamp

### 4. user_resumes (Custom)
Stores user's LaTeX resume templates for reuse.

```sql
CREATE TABLE user_resumes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL DEFAULT 'My Resume',
  latex_content TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, title)
);
```

**Fields:**
- `id`: Primary key
- `user_id`: Foreign key to auth.users(id)
- `title`: User-defined name for the resume template
- `latex_content`: The LaTeX code of the resume
- `is_primary`: Whether this is the user's default/primary resume
- `created_at`: Record creation timestamp
- `updated_at`: Last update timestamp

**Constraints:**
- Each user can have multiple resumes with different titles
- Each user can only have one primary resume at a time

## Automatic Triggers

### New User Profile Creation
When a user signs up, a profile is automatically created:

```sql
CREATE OR REPLACE FUNCTION handle_new_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (user_id, email, full_name)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_profile();
```

### New User Credits Allocation
New users automatically receive 5 free credits:

```sql
CREATE OR REPLACE FUNCTION handle_new_user_credits()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_credits (user_id, total_credits, used_credits, subscription_type)
  VALUES (NEW.id, 5, 0, 'free');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created_credits
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_credits();
```

### Ensure Single Primary Resume
When a resume is marked as primary, unmark all other resumes for that user:

```sql
CREATE OR REPLACE FUNCTION handle_primary_resume()
RETURNS TRIGGER AS $$
BEGIN
  -- If this resume is being set as primary, unmark all others for this user
  IF NEW.is_primary = TRUE THEN
    UPDATE user_resumes 
    SET is_primary = FALSE 
    WHERE user_id = NEW.user_id AND id != NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_resume_primary_update
  BEFORE INSERT OR UPDATE ON user_resumes
  FOR EACH ROW EXECUTE FUNCTION handle_primary_resume();
```

## Row Level Security (RLS)

All custom tables have RLS enabled with policies ensuring users can only access their own data:

### profiles policies:
- `"Users can view their own profile"`: SELECT using `auth.uid() = user_id`
- `"Users can update their own profile"`: UPDATE using `auth.uid() = user_id`
- `"Users can insert their own profile"`: INSERT with check `auth.uid() = user_id`

### user_credits policies:
- `"Users can view their own credits"`: SELECT using `auth.uid() = user_id`
- `"Users can update their own credits"`: UPDATE using `auth.uid() = user_id`

### user_resumes policies:
- `"Users can view their own resumes"`: SELECT using `auth.uid() = user_id`
- `"Users can update their own resumes"`: UPDATE using `auth.uid() = user_id`
- `"Users can insert their own resumes"`: INSERT with check `auth.uid() = user_id`
- `"Users can delete their own resumes"`: DELETE using `auth.uid() = user_id`

## Credit Management Functions

### Deduct Credit
```sql
CREATE OR REPLACE FUNCTION deduct_user_credit(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_remaining INTEGER;
BEGIN
  SELECT remaining_credits INTO current_remaining
  FROM user_credits WHERE user_id = p_user_id;
  
  IF current_remaining IS NULL OR current_remaining <= 0 THEN
    RETURN FALSE;
  END IF;
  
  UPDATE user_credits SET used_credits = used_credits + 1
  WHERE user_id = p_user_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## User Journey

1. **Sign Up**: User creates account via email/Google OAuth
2. **Auto-Creation**: Triggers create profile and allocate 5 free credits
3. **First Resume**: User uploads LaTeX resume - gets saved automatically
4. **Usage**: Each resume generation deducts 1 credit
5. **Resume Management**: User can save multiple resume templates and edit them
6. **Upgrade**: User can purchase subscription for more credits
7. **Reset**: Subscription credits reset monthly

## API Integration

The frontend uses utility functions to interact with these tables:
- `profilesUtils.ts`: Profile CRUD operations
- `creditsUtils.ts`: Credit management operations
- `resumesUtils.ts`: Resume CRUD operations
- `useUserData.ts`: React hook for combined profile + credits data

This structure provides a complete user management system with credit tracking, subscription management, resume storage, and secure data access. 