-- Resume Storage Setup for Resume Tailor Application
-- Run this script in your Supabase SQL Editor to add resume storage functionality

-- 1. Create the user_resumes table
CREATE TABLE IF NOT EXISTS user_resumes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL DEFAULT 'My Resume',
  latex_content TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, title)
);

-- 2. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_resumes_user_id ON user_resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_resumes_primary ON user_resumes(user_id, is_primary) WHERE is_primary = true;

-- 3. Enable Row Level Security (RLS)
ALTER TABLE user_resumes ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies
CREATE POLICY "Users can view their own resumes" ON user_resumes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own resumes" ON user_resumes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own resumes" ON user_resumes
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own resumes" ON user_resumes
    FOR DELETE USING (auth.uid() = user_id);

-- 5. Create function to ensure only one primary resume per user
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

-- 6. Create trigger to enforce single primary resume
DROP TRIGGER IF EXISTS on_resume_primary_update ON user_resumes;
CREATE TRIGGER on_resume_primary_update
  BEFORE INSERT OR UPDATE ON user_resumes
  FOR EACH ROW EXECUTE FUNCTION handle_primary_resume();

-- 7. Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create trigger to automatically update updated_at timestamp
DROP TRIGGER IF EXISTS update_user_resumes_updated_at ON user_resumes;
CREATE TRIGGER update_user_resumes_updated_at
    BEFORE UPDATE ON user_resumes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. Create a function to safely set a resume as primary (optional helper)
CREATE OR REPLACE FUNCTION set_primary_resume(p_user_id UUID, p_resume_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  resume_exists BOOLEAN;
BEGIN
  -- Check if the resume exists and belongs to the user
  SELECT EXISTS(
    SELECT 1 FROM user_resumes 
    WHERE id = p_resume_id AND user_id = p_user_id
  ) INTO resume_exists;
  
  IF NOT resume_exists THEN
    RETURN FALSE;
  END IF;
  
  -- Update the resume to be primary (trigger will handle unsetting others)
  UPDATE user_resumes 
  SET is_primary = TRUE, updated_at = NOW()
  WHERE id = p_resume_id AND user_id = p_user_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verification queries (run these to check if everything was created correctly)
-- SELECT table_name FROM information_schema.tables WHERE table_name = 'user_resumes';
-- SELECT * FROM pg_policies WHERE tablename = 'user_resumes';
-- SELECT trigger_name FROM information_schema.triggers WHERE event_object_table = 'user_resumes'; 