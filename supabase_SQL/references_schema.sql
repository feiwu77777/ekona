-- References and Image Metadata Schema
-- Separate tables with relationships for better organization

-- Create references table
CREATE TABLE IF NOT EXISTS blog_references (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    blog_post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    source TEXT NOT NULL,
    published_at TIMESTAMP WITH TIME ZONE,
    relevance_score NUMERIC(3,2) DEFAULT 0.0,
    snippet TEXT,
    domain TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_relevance_score CHECK (relevance_score >= 0.0 AND relevance_score <= 1.0),
    CONSTRAINT valid_url CHECK (url ~ '^https?://'),
    CONSTRAINT unique_blog_reference UNIQUE (blog_post_id, url)
);

-- Create image_metadata table
CREATE TABLE IF NOT EXISTS blog_image_metadata (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    blog_post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
    image_id TEXT NOT NULL, -- External image ID (e.g., Unsplash ID)
    url TEXT NOT NULL,
    alt_text TEXT,
    photographer TEXT,
    photographer_url TEXT,
    download_url TEXT,
    relevance_score NUMERIC(3,2) DEFAULT 0.0,
    section_index INTEGER, -- Which section this image belongs to
    image_type TEXT DEFAULT 'unsplash', -- unsplash, custom, etc.
    width INTEGER,
    height INTEGER,
    file_size INTEGER, -- in bytes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_relevance_score CHECK (relevance_score >= 0.0 AND relevance_score <= 1.0),
    CONSTRAINT valid_section_index CHECK (section_index >= 0),
    CONSTRAINT valid_url CHECK (url ~ '^https?://'),
    CONSTRAINT unique_blog_image UNIQUE (blog_post_id, image_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_blog_references_blog_post_id ON blog_references(blog_post_id);
CREATE INDEX IF NOT EXISTS idx_blog_references_relevance ON blog_references(relevance_score DESC);
CREATE INDEX IF NOT EXISTS idx_blog_references_domain ON blog_references(domain);
CREATE INDEX IF NOT EXISTS idx_blog_references_published_at ON blog_references(published_at DESC);

CREATE INDEX IF NOT EXISTS idx_blog_image_metadata_blog_post_id ON blog_image_metadata(blog_post_id);
CREATE INDEX IF NOT EXISTS idx_blog_image_metadata_relevance ON blog_image_metadata(relevance_score DESC);
CREATE INDEX IF NOT EXISTS idx_blog_image_metadata_section ON blog_image_metadata(section_index);
CREATE INDEX IF NOT EXISTS idx_blog_image_metadata_type ON blog_image_metadata(image_type);

-- Create updated_at triggers
CREATE TRIGGER update_blog_references_updated_at 
    BEFORE UPDATE ON blog_references 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blog_image_metadata_updated_at 
    BEFORE UPDATE ON blog_image_metadata 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to get references for a blog post
CREATE OR REPLACE FUNCTION get_blog_references(p_blog_post_id UUID)
RETURNS TABLE (
    id UUID,
    title TEXT,
    url TEXT,
    source TEXT,
    published_at TIMESTAMP WITH TIME ZONE,
    relevance_score NUMERIC,
    snippet TEXT,
    domain TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        br.id,
        br.title,
        br.url,
        br.source,
        br.published_at,
        br.relevance_score,
        br.snippet,
        br.domain
    FROM blog_references br
    WHERE br.blog_post_id = p_blog_post_id
    ORDER BY br.relevance_score DESC, br.published_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Create function to get images for a blog post
CREATE OR REPLACE FUNCTION get_blog_images(p_blog_post_id UUID)
RETURNS TABLE (
    id UUID,
    image_id TEXT,
    url TEXT,
    alt_text TEXT,
    photographer TEXT,
    photographer_url TEXT,
    download_url TEXT,
    relevance_score NUMERIC,
    section_index INTEGER,
    image_type TEXT,
    width INTEGER,
    height INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        bim.id,
        bim.image_id,
        bim.url,
        bim.alt_text,
        bim.photographer,
        bim.photographer_url,
        bim.download_url,
        bim.relevance_score,
        bim.section_index,
        bim.image_type,
        bim.width,
        bim.height
    FROM blog_image_metadata bim
    WHERE bim.blog_post_id = p_blog_post_id
    ORDER BY bim.section_index ASC, bim.relevance_score DESC;
END;
$$ LANGUAGE plpgsql;

-- Create function to add reference to blog post
CREATE OR REPLACE FUNCTION add_blog_reference(
    p_blog_post_id UUID,
    p_title TEXT,
    p_url TEXT,
    p_source TEXT,
    p_published_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_relevance_score NUMERIC DEFAULT 0.5,
    p_snippet TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_reference_id UUID;
    v_domain TEXT;
BEGIN
    -- Extract domain from URL
    v_domain := substring(p_url from 'https?://([^/]+)');
    
    INSERT INTO blog_references (
        blog_post_id,
        title,
        url,
        source,
        published_at,
        relevance_score,
        snippet,
        domain
    ) VALUES (
        p_blog_post_id,
        p_title,
        p_url,
        p_source,
        p_published_at,
        p_relevance_score,
        p_snippet,
        v_domain
    ) ON CONFLICT (blog_post_id, url) DO UPDATE SET
        relevance_score = EXCLUDED.relevance_score,
        snippet = EXCLUDED.snippet,
        updated_at = NOW()
    RETURNING id INTO v_reference_id;
    
    RETURN v_reference_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to add image to blog post
CREATE OR REPLACE FUNCTION add_blog_image(
    p_blog_post_id UUID,
    p_image_id TEXT,
    p_url TEXT,
    p_alt_text TEXT DEFAULT NULL,
    p_photographer TEXT DEFAULT NULL,
    p_photographer_url TEXT DEFAULT NULL,
    p_download_url TEXT DEFAULT NULL,
    p_relevance_score NUMERIC DEFAULT 0.5,
    p_section_index INTEGER DEFAULT 0,
    p_image_type TEXT DEFAULT 'unsplash',
    p_width INTEGER DEFAULT NULL,
    p_height INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_image_id UUID;
BEGIN
    INSERT INTO blog_image_metadata (
        blog_post_id,
        image_id,
        url,
        alt_text,
        photographer,
        photographer_url,
        download_url,
        relevance_score,
        section_index,
        image_type,
        width,
        height
    ) VALUES (
        p_blog_post_id,
        p_image_id,
        p_url,
        p_alt_text,
        p_photographer,
        p_photographer_url,
        p_download_url,
        p_relevance_score,
        p_section_index,
        p_image_type,
        p_width,
        p_height
    ) ON CONFLICT (blog_post_id, image_id) DO UPDATE SET
        url = EXCLUDED.url,
        alt_text = EXCLUDED.alt_text,
        relevance_score = EXCLUDED.relevance_score,
        section_index = EXCLUDED.section_index,
        updated_at = NOW()
    RETURNING id INTO v_image_id;
    
    RETURN v_image_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to get reference statistics
CREATE OR REPLACE FUNCTION get_reference_stats(p_user_id UUID DEFAULT NULL)
RETURNS TABLE (
    total_references INTEGER,
    unique_domains INTEGER,
    avg_relevance_score NUMERIC,
    most_common_domain TEXT,
    references_this_month INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_references,
        COUNT(DISTINCT br.domain)::INTEGER as unique_domains,
        ROUND(AVG(br.relevance_score), 3) as avg_relevance_score,
        mode() WITHIN GROUP (ORDER BY br.domain) as most_common_domain,
        COUNT(*) FILTER (WHERE br.created_at >= date_trunc('month', NOW()))::INTEGER as references_this_month
    FROM blog_references br
    JOIN blog_posts bp ON br.blog_post_id = bp.id
    WHERE p_user_id IS NULL OR bp.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to get image statistics
CREATE OR REPLACE FUNCTION get_image_stats(p_user_id UUID DEFAULT NULL)
RETURNS TABLE (
    total_images INTEGER,
    avg_relevance_score NUMERIC,
    most_common_image_type TEXT,
    images_this_month INTEGER,
    total_image_size BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_images,
        ROUND(AVG(bim.relevance_score), 3) as avg_relevance_score,
        mode() WITHIN GROUP (ORDER BY bim.image_type) as most_common_image_type,
        COUNT(*) FILTER (WHERE bim.created_at >= date_trunc('month', NOW()))::INTEGER as images_this_month,
        COALESCE(SUM(bim.file_size), 0) as total_image_size
    FROM blog_image_metadata bim
    JOIN blog_posts bp ON bim.blog_post_id = bp.id
    WHERE p_user_id IS NULL OR bp.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Create RLS policies for references
ALTER TABLE blog_references ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own blog references" ON blog_references
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM blog_posts bp 
            WHERE bp.id = blog_references.blog_post_id 
            AND bp.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own blog references" ON blog_references
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM blog_posts bp 
            WHERE bp.id = blog_references.blog_post_id 
            AND bp.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own blog references" ON blog_references
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM blog_posts bp 
            WHERE bp.id = blog_references.blog_post_id 
            AND bp.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own blog references" ON blog_references
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM blog_posts bp 
            WHERE bp.id = blog_references.blog_post_id 
            AND bp.user_id = auth.uid()
        )
    );

-- Create RLS policies for image metadata
ALTER TABLE blog_image_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own blog images" ON blog_image_metadata
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM blog_posts bp 
            WHERE bp.id = blog_image_metadata.blog_post_id 
            AND bp.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own blog images" ON blog_image_metadata
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM blog_posts bp 
            WHERE bp.id = blog_image_metadata.blog_post_id 
            AND bp.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own blog images" ON blog_image_metadata
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM blog_posts bp 
            WHERE bp.id = blog_image_metadata.blog_post_id 
            AND bp.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own blog images" ON blog_image_metadata
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM blog_posts bp 
            WHERE bp.id = blog_image_metadata.blog_post_id 
            AND bp.user_id = auth.uid()
        )
    );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON blog_references TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON blog_image_metadata TO authenticated;
GRANT EXECUTE ON FUNCTION get_blog_references TO authenticated;
GRANT EXECUTE ON FUNCTION get_blog_images TO authenticated;
GRANT EXECUTE ON FUNCTION add_blog_reference TO authenticated;
GRANT EXECUTE ON FUNCTION add_blog_image TO authenticated;
GRANT EXECUTE ON FUNCTION get_reference_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_image_stats TO authenticated;
