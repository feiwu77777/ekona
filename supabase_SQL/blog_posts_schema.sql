-- Blog Posts Storage Schema
-- Hybrid approach: core data in structured columns + flexible metadata in JSON

-- Create blog_posts table
CREATE TABLE IF NOT EXISTS blog_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    topic TEXT NOT NULL,
    tone TEXT NOT NULL CHECK (tone IN ('academic', 'casual', 'professional')),
    word_count INTEGER NOT NULL,
    generation_time INTEGER, -- milliseconds
    model_used TEXT DEFAULT 'gemini-2.5-pro',
    
    -- JSON metadata for flexible data
    metadata JSONB DEFAULT '{}',
    
    -- Images and references as JSON arrays
    images JSONB DEFAULT '[]',
    
    -- Keywords for search and categorization
    keywords TEXT[] DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes for performance
    CONSTRAINT valid_word_count CHECK (word_count > 0 AND word_count <= 10000)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_user_id ON blog_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_created_at ON blog_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_topic ON blog_posts USING GIN(to_tsvector('english', topic));
CREATE INDEX IF NOT EXISTS idx_blog_posts_title ON blog_posts USING GIN(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_blog_posts_keywords ON blog_posts USING GIN(keywords);
CREATE INDEX IF NOT EXISTS idx_blog_posts_metadata ON blog_posts USING GIN(metadata);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_blog_posts_updated_at 
    BEFORE UPDATE ON blog_posts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create full-text search function
CREATE OR REPLACE FUNCTION search_blog_posts(
    search_query TEXT,
    user_id_param UUID DEFAULT NULL,
    limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    topic TEXT,
    tone TEXT,
    word_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE,
    search_rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        bp.id,
        bp.title,
        bp.topic,
        bp.tone,
        bp.word_count,
        bp.created_at,
        ts_rank(
            to_tsvector('english', bp.title || ' ' || bp.topic || ' ' || array_to_string(bp.keywords, ' ')),
            plainto_tsquery('english', search_query)
        ) as search_rank
    FROM blog_posts bp
    WHERE 
        (user_id_param IS NULL OR bp.user_id = user_id_param)
        AND to_tsvector('english', bp.title || ' ' || bp.topic || ' ' || array_to_string(bp.keywords, ' ')) @@ plainto_tsquery('english', search_query)
    ORDER BY search_rank DESC, bp.created_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to get blog post statistics
CREATE OR REPLACE FUNCTION get_blog_post_stats(user_id_param UUID DEFAULT NULL)
RETURNS TABLE (
    total_posts INTEGER,
    total_words INTEGER,
    avg_words_per_post NUMERIC,
    most_common_tone TEXT,
    generation_time_avg NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_posts,
        SUM(word_count)::INTEGER as total_words,
        ROUND(AVG(word_count), 2) as avg_words_per_post,
        mode() WITHIN GROUP (ORDER BY tone) as most_common_tone,
        ROUND(AVG(generation_time), 2) as generation_time_avg
    FROM blog_posts
    WHERE user_id_param IS NULL OR user_id = user_id_param;
END;
$$ LANGUAGE plpgsql;

-- Create RLS (Row Level Security) policies
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own blog posts
CREATE POLICY "Users can view own blog posts" ON blog_posts
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own blog posts
CREATE POLICY "Users can insert own blog posts" ON blog_posts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own blog posts
CREATE POLICY "Users can update own blog posts" ON blog_posts
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own blog posts
CREATE POLICY "Users can delete own blog posts" ON blog_posts
    FOR DELETE USING (auth.uid() = user_id);

-- Create view for easier querying
CREATE OR REPLACE VIEW blog_posts_view AS
SELECT 
    id,
    user_id,
    title,
    topic,
    tone,
    word_count,
    generation_time,
    model_used,
    keywords,
    created_at,
    updated_at,
    -- Extract specific metadata fields
    metadata->>'researchDataCount' as research_data_count,
    metadata->>'promptLength' as prompt_length,
    metadata->>'successRate' as success_rate
FROM blog_posts;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON blog_posts TO authenticated;
GRANT SELECT ON blog_posts_view TO authenticated;
GRANT EXECUTE ON FUNCTION search_blog_posts TO authenticated;
GRANT EXECUTE ON FUNCTION get_blog_post_stats TO authenticated;
