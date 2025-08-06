-- =====================================================
-- RESUME TAILORING HISTORY SETUP
-- =====================================================
-- This file sets up the resume_tailoring_history table for tracking
-- all resume tailoring sessions performed by users.
-- 
-- Purpose: Store complete history of resume tailoring sessions including
-- job details, user inputs, AI-generated outputs, and tailoring metadata.
-- =====================================================

-- Create the resume_tailoring_history table
CREATE TABLE resume_tailoring_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Job Information
  job_title TEXT,
  company_name TEXT,
  job_description TEXT NOT NULL,
  job_url TEXT,
  tailoring_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- User Input Data
  original_resume_id UUID REFERENCES user_resumes(id),
  original_resume_content TEXT, -- Snapshot of resume at time of tailoring
  generation_options JSONB, -- Cover letter, questions, etc.
  
  -- Generated Output
  tailored_resume_content TEXT NOT NULL,
  cover_letter_content TEXT,
  standard_answers JSONB, -- Why this job, why you fit
  custom_answers JSONB, -- Array of custom question responses
  
  -- AI Processing Details
  llm_provider TEXT NOT NULL, -- 'gemini' or 'claude'
  model_used TEXT NOT NULL, -- 'gemini-2.5-pro', etc.
  prompt_version TEXT, -- 'v1.3.0', etc.
  
  -- Tailoring Metadata
  status TEXT DEFAULT 'created' CHECK (status IN ('created', 'applied', 'interviewed', 'rejected', 'accepted', 'withdrawn')),
  notes TEXT, -- User notes about this tailoring session
  applied_with_this_version BOOLEAN DEFAULT FALSE, -- Whether this version was actually used for an application
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments to explain table and column purposes
COMMENT ON TABLE resume_tailoring_history IS 'Stores complete history of resume tailoring sessions performed by users';
COMMENT ON COLUMN resume_tailoring_history.job_title IS 'The job title for which the resume was tailored (optional)';
COMMENT ON COLUMN resume_tailoring_history.company_name IS 'The company name for which the resume was tailored (optional)';
COMMENT ON COLUMN resume_tailoring_history.job_description IS 'The full job description provided by the user for tailoring';
COMMENT ON COLUMN resume_tailoring_history.job_url IS 'URL to the job posting (optional)';
COMMENT ON COLUMN resume_tailoring_history.tailoring_date IS 'When the resume tailoring was performed';
COMMENT ON COLUMN resume_tailoring_history.original_resume_id IS 'Reference to the resume used for this tailoring session';
COMMENT ON COLUMN resume_tailoring_history.original_resume_content IS 'Snapshot of the original resume content at time of tailoring';
COMMENT ON COLUMN resume_tailoring_history.generation_options IS 'JSON object containing generation options (cover letter, questions, etc.)';
COMMENT ON COLUMN resume_tailoring_history.tailored_resume_content IS 'The AI-generated tailored resume content';
COMMENT ON COLUMN resume_tailoring_history.cover_letter_content IS 'The AI-generated cover letter (if requested)';
COMMENT ON COLUMN resume_tailoring_history.standard_answers IS 'JSON object containing standard interview answers';
COMMENT ON COLUMN resume_tailoring_history.custom_answers IS 'JSON array containing custom question responses';
COMMENT ON COLUMN resume_tailoring_history.llm_provider IS 'Which AI provider was used (gemini/claude)';
COMMENT ON COLUMN resume_tailoring_history.model_used IS 'Specific model version used (e.g., gemini-2.5-pro)';
COMMENT ON COLUMN resume_tailoring_history.prompt_version IS 'Version of the prompt used for generation';
COMMENT ON COLUMN resume_tailoring_history.status IS 'Current status of this tailoring session (if applied)';
COMMENT ON COLUMN resume_tailoring_history.notes IS 'User notes about this tailoring session';
COMMENT ON COLUMN resume_tailoring_history.applied_with_this_version IS 'Whether this tailored version was actually used for a job application';

-- Create indexes for performance optimization
CREATE INDEX idx_resume_tailoring_history_user_id ON resume_tailoring_history(user_id);
CREATE INDEX idx_resume_tailoring_history_status ON resume_tailoring_history(status);
CREATE INDEX idx_resume_tailoring_history_tailoring_date ON resume_tailoring_history(tailoring_date);
CREATE INDEX idx_resume_tailoring_history_company_name ON resume_tailoring_history(company_name);
CREATE INDEX idx_resume_tailoring_history_job_title ON resume_tailoring_history(job_title);
CREATE INDEX idx_resume_tailoring_history_applied_with_this_version ON resume_tailoring_history(applied_with_this_version);

-- Create composite indexes for common query patterns
CREATE INDEX idx_resume_tailoring_history_user_status ON resume_tailoring_history(user_id, status);
CREATE INDEX idx_resume_tailoring_history_user_date ON resume_tailoring_history(user_id, tailoring_date DESC);
CREATE INDEX idx_resume_tailoring_history_user_applied ON resume_tailoring_history(user_id, applied_with_this_version);

-- Enable Row Level Security
ALTER TABLE resume_tailoring_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for secure data access
CREATE POLICY "Users can view their own tailoring history"
  ON resume_tailoring_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tailoring history"
  ON resume_tailoring_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tailoring history"
  ON resume_tailoring_history FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tailoring history"
  ON resume_tailoring_history FOR DELETE
  USING (auth.uid() = user_id);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_resume_tailoring_history_updated_at
    BEFORE UPDATE ON resume_tailoring_history
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create a function to get tailoring statistics for a user
CREATE OR REPLACE FUNCTION get_user_tailoring_stats(p_user_id UUID)
RETURNS TABLE (
    total_tailorings BIGINT,
    tailorings_this_month BIGINT,
    applied_versions BIGINT,
    interviews BIGINT,
    offers BIGINT,
    success_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_tailorings,
        COUNT(CASE WHEN tailoring_date >= date_trunc('month', NOW()) THEN 1 END)::BIGINT as tailorings_this_month,
        COUNT(CASE WHEN applied_with_this_version = TRUE THEN 1 END)::BIGINT as applied_versions,
        COUNT(CASE WHEN status = 'interviewed' THEN 1 END)::BIGINT as interviews,
        COUNT(CASE WHEN status = 'accepted' THEN 1 END)::BIGINT as offers,
        CASE 
            WHEN COUNT(CASE WHEN applied_with_this_version = TRUE THEN 1 END) > 0 THEN 
                ROUND((COUNT(CASE WHEN status = 'accepted' THEN 1 END)::NUMERIC / COUNT(CASE WHEN applied_with_this_version = TRUE THEN 1 END)::NUMERIC) * 100, 2)
            ELSE 0 
        END as success_rate
    FROM resume_tailoring_history 
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON resume_tailoring_history TO authenticated;

-- Create a view for tailoring summary (useful for analytics)
CREATE VIEW resume_tailoring_summary AS
SELECT 
    user_id,
    COUNT(*) as total_tailorings,
    COUNT(CASE WHEN applied_with_this_version = TRUE THEN 1 END) as applied_versions,
    COUNT(CASE WHEN status = 'interviewed' THEN 1 END) as interviews,
    COUNT(CASE WHEN status = 'accepted' THEN 1 END) as offers,
    COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejections,
    COUNT(CASE WHEN status = 'withdrawn' THEN 1 END) as withdrawals,
    MAX(tailoring_date) as last_tailoring_date,
    MIN(tailoring_date) as first_tailoring_date
FROM resume_tailoring_history
GROUP BY user_id;

-- Grant access to the view
GRANT SELECT ON resume_tailoring_summary TO authenticated;

-- =====================================================
-- USAGE EXAMPLES
-- =====================================================

-- Example: Get all tailoring sessions for a user
-- SELECT * FROM resume_tailoring_history WHERE user_id = 'user-uuid' ORDER BY tailoring_date DESC;

-- Example: Get tailoring sessions by status
-- SELECT * FROM resume_tailoring_history WHERE user_id = 'user-uuid' AND status = 'interviewed';

-- Example: Get only applied versions
-- SELECT * FROM resume_tailoring_history WHERE user_id = 'user-uuid' AND applied_with_this_version = TRUE;

-- Example: Get tailoring statistics
-- SELECT * FROM get_user_tailoring_stats('user-uuid');

-- Example: Search tailoring sessions by company or job title
-- SELECT * FROM resume_tailoring_history 
-- WHERE user_id = 'user-uuid' 
-- AND (company_name ILIKE '%google%' OR job_title ILIKE '%engineer%');

-- =====================================================
-- MIGRATION NOTES
-- =====================================================
-- 
-- To add this table to an existing database:
-- 1. Run this entire script in your Supabase SQL editor
-- 2. Update your database.types.ts file to include the new table
-- 3. Test the RLS policies work correctly
-- 4. Verify indexes are created and working
--
-- To rollback:
-- DROP VIEW IF EXISTS resume_tailoring_summary;
-- DROP FUNCTION IF EXISTS get_user_tailoring_stats(UUID);
-- DROP TRIGGER IF EXISTS update_resume_tailoring_history_updated_at ON resume_tailoring_history;
-- DROP FUNCTION IF EXISTS update_updated_at_column();
-- DROP TABLE IF EXISTS resume_tailoring_history; 