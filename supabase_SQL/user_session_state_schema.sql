-- User Session State Schema
-- Hybrid approach combining session storage with persistent user preferences

-- Create user preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Blog generation preferences
    default_tone TEXT DEFAULT 'professional' CHECK (default_tone IN ('academic', 'casual', 'professional')),
    default_word_count INTEGER DEFAULT 500 CHECK (default_word_count >= 100 AND default_word_count <= 2000),
    include_images BOOLEAN DEFAULT true,
    include_references BOOLEAN DEFAULT true,
    
    -- UI preferences
    theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'system')),
    language TEXT DEFAULT 'en' CHECK (language IN ('en', 'es', 'fr', 'de')),
    auto_save BOOLEAN DEFAULT true,
    auto_preview BOOLEAN DEFAULT true,
    
    -- Content preferences
    preferred_categories TEXT[] DEFAULT '{}',
    blocked_domains TEXT[] DEFAULT '{}',
    favorite_topics TEXT[] DEFAULT '{}',
    
    -- Notification preferences
    email_notifications BOOLEAN DEFAULT false,
    browser_notifications BOOLEAN DEFAULT true,
    weekly_digest BOOLEAN DEFAULT false,
    
    -- Advanced settings
    max_generation_time INTEGER DEFAULT 120000, -- milliseconds
    retry_attempts INTEGER DEFAULT 3 CHECK (retry_attempts >= 1 AND retry_attempts <= 5),
    quality_threshold NUMERIC(3,2) DEFAULT 0.7 CHECK (quality_threshold >= 0.0 AND quality_threshold <= 1.0),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one preference record per user
    UNIQUE(user_id)
);

-- Create user session history table
CREATE TABLE IF NOT EXISTS user_session_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL,
    
    -- Session metadata
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    
    -- Session activity
    blog_posts_created INTEGER DEFAULT 0,
    blog_posts_edited INTEGER DEFAULT 0,
    images_searched INTEGER DEFAULT 0,
    references_added INTEGER DEFAULT 0,
    
    -- Device information
    user_agent TEXT,
    ip_address INET,
    device_type TEXT, -- desktop, mobile, tablet
    browser TEXT,
    os TEXT,
    
    -- Session state (JSON for flexibility)
    session_data JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user activity log table
CREATE TABLE IF NOT EXISTS user_activity_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id TEXT,
    
    -- Activity details
    activity_type TEXT NOT NULL, -- blog_generated, blog_edited, image_searched, etc.
    activity_data JSONB DEFAULT '{}',
    
    -- Performance metrics
    duration_ms INTEGER,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    
    -- Context
    blog_post_id UUID REFERENCES blog_posts(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user workspace state table (for draft management)
CREATE TABLE IF NOT EXISTS user_workspace_state (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    workspace_id TEXT NOT NULL,
    
    -- Workspace content
    draft_content TEXT,
    draft_metadata JSONB DEFAULT '{}',
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Workspace settings
    is_public BOOLEAN DEFAULT false,
    collaborators TEXT[] DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique workspace per user
    UNIQUE(user_id, workspace_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_session_history_user_id ON user_session_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_session_history_session_id ON user_session_history(session_id);
CREATE INDEX IF NOT EXISTS idx_user_session_history_started_at ON user_session_history(started_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_activity_log_user_id ON user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_activity_type ON user_activity_log(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_created_at ON user_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_session_id ON user_activity_log(session_id);

CREATE INDEX IF NOT EXISTS idx_user_workspace_state_user_id ON user_workspace_state(user_id);
CREATE INDEX IF NOT EXISTS idx_user_workspace_state_workspace_id ON user_workspace_state(workspace_id);
CREATE INDEX IF NOT EXISTS idx_user_workspace_state_last_activity ON user_workspace_state(last_activity DESC);

-- Create updated_at triggers
CREATE TRIGGER update_user_preferences_updated_at 
    BEFORE UPDATE ON user_preferences 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_session_history_updated_at 
    BEFORE UPDATE ON user_session_history 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_workspace_state_updated_at 
    BEFORE UPDATE ON user_workspace_state 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to get or create user preferences
CREATE OR REPLACE FUNCTION get_user_preferences(p_user_id UUID DEFAULT NULL)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    default_tone TEXT,
    default_word_count INTEGER,
    include_images BOOLEAN,
    include_references BOOLEAN,
    theme TEXT,
    language TEXT,
    auto_save BOOLEAN,
    auto_preview BOOLEAN,
    preferred_categories TEXT[],
    blocked_domains TEXT[],
    favorite_topics TEXT[],
    email_notifications BOOLEAN,
    browser_notifications BOOLEAN,
    weekly_digest BOOLEAN,
    max_generation_time INTEGER,
    retry_attempts INTEGER,
    quality_threshold NUMERIC
) AS $$
BEGIN
    -- Validate required parameters
    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'p_user_id cannot be NULL';
    END IF;
    
    RETURN QUERY
    SELECT 
        up.id,
        up.user_id,
        up.default_tone,
        up.default_word_count,
        up.include_images,
        up.include_references,
        up.theme,
        up.language,
        up.auto_save,
        up.auto_preview,
        up.preferred_categories,
        up.blocked_domains,
        up.favorite_topics,
        up.email_notifications,
        up.browser_notifications,
        up.weekly_digest,
        up.max_generation_time,
        up.retry_attempts,
        up.quality_threshold
    FROM user_preferences up
    WHERE up.user_id = p_user_id;
    
    -- If no preferences exist, return default values
    IF NOT FOUND THEN
        RETURN QUERY
        SELECT 
            gen_random_uuid() as id,
            p_user_id as user_id,
            'professional' as default_tone,
            500 as default_word_count,
            true as include_images,
            true as include_references,
            'light' as theme,
            'en' as language,
            true as auto_save,
            true as auto_preview,
            '{}' as preferred_categories,
            '{}' as blocked_domains,
            '{}' as favorite_topics,
            false as email_notifications,
            true as browser_notifications,
            false as weekly_digest,
            120000 as max_generation_time,
            3 as retry_attempts,
            0.7 as quality_threshold;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create function to update user preferences
CREATE OR REPLACE FUNCTION update_user_preferences(
    p_user_id UUID DEFAULT NULL,
    p_default_tone TEXT DEFAULT NULL,
    p_default_word_count INTEGER DEFAULT NULL,
    p_include_images BOOLEAN DEFAULT NULL,
    p_include_references BOOLEAN DEFAULT NULL,
    p_theme TEXT DEFAULT NULL,
    p_language TEXT DEFAULT NULL,
    p_auto_save BOOLEAN DEFAULT NULL,
    p_auto_preview BOOLEAN DEFAULT NULL,
    p_preferred_categories TEXT[] DEFAULT NULL,
    p_blocked_domains TEXT[] DEFAULT NULL,
    p_favorite_topics TEXT[] DEFAULT NULL,
    p_email_notifications BOOLEAN DEFAULT NULL,
    p_browser_notifications BOOLEAN DEFAULT NULL,
    p_weekly_digest BOOLEAN DEFAULT NULL,
    p_max_generation_time INTEGER DEFAULT NULL,
    p_retry_attempts INTEGER DEFAULT NULL,
    p_quality_threshold NUMERIC DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_preference_id UUID;
BEGIN
    -- Validate required parameters
    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'p_user_id cannot be NULL';
    END IF;
    
    INSERT INTO user_preferences (
        user_id,
        default_tone,
        default_word_count,
        include_images,
        include_references,
        theme,
        language,
        auto_save,
        auto_preview,
        preferred_categories,
        blocked_domains,
        favorite_topics,
        email_notifications,
        browser_notifications,
        weekly_digest,
        max_generation_time,
        retry_attempts,
        quality_threshold
    ) VALUES (
        p_user_id,
        COALESCE(p_default_tone, 'professional'),
        COALESCE(p_default_word_count, 500),
        COALESCE(p_include_images, true),
        COALESCE(p_include_references, true),
        COALESCE(p_theme, 'light'),
        COALESCE(p_language, 'en'),
        COALESCE(p_auto_save, true),
        COALESCE(p_auto_preview, true),
        COALESCE(p_preferred_categories, '{}'),
        COALESCE(p_blocked_domains, '{}'),
        COALESCE(p_favorite_topics, '{}'),
        COALESCE(p_email_notifications, false),
        COALESCE(p_browser_notifications, true),
        COALESCE(p_weekly_digest, false),
        COALESCE(p_max_generation_time, 120000),
        COALESCE(p_retry_attempts, 3),
        COALESCE(p_quality_threshold, 0.7)
    ) ON CONFLICT (user_id) DO UPDATE SET
        default_tone = COALESCE(EXCLUDED.default_tone, user_preferences.default_tone),
        default_word_count = COALESCE(EXCLUDED.default_word_count, user_preferences.default_word_count),
        include_images = COALESCE(EXCLUDED.include_images, user_preferences.include_images),
        include_references = COALESCE(EXCLUDED.include_references, user_preferences.include_references),
        theme = COALESCE(EXCLUDED.theme, user_preferences.theme),
        language = COALESCE(EXCLUDED.language, user_preferences.language),
        auto_save = COALESCE(EXCLUDED.auto_save, user_preferences.auto_save),
        auto_preview = COALESCE(EXCLUDED.auto_preview, user_preferences.auto_preview),
        preferred_categories = COALESCE(EXCLUDED.preferred_categories, user_preferences.preferred_categories),
        blocked_domains = COALESCE(EXCLUDED.blocked_domains, user_preferences.blocked_domains),
        favorite_topics = COALESCE(EXCLUDED.favorite_topics, user_preferences.favorite_topics),
        email_notifications = COALESCE(EXCLUDED.email_notifications, user_preferences.email_notifications),
        browser_notifications = COALESCE(EXCLUDED.browser_notifications, user_preferences.browser_notifications),
        weekly_digest = COALESCE(EXCLUDED.weekly_digest, user_preferences.weekly_digest),
        max_generation_time = COALESCE(EXCLUDED.max_generation_time, user_preferences.max_generation_time),
        retry_attempts = COALESCE(EXCLUDED.retry_attempts, user_preferences.retry_attempts),
        quality_threshold = COALESCE(EXCLUDED.quality_threshold, user_preferences.quality_threshold),
        updated_at = NOW()
    RETURNING id INTO v_preference_id;
    
    RETURN v_preference_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to start a new session
CREATE OR REPLACE FUNCTION start_user_session(
    p_user_id UUID DEFAULT NULL,
    p_session_id TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_device_type TEXT DEFAULT NULL,
    p_browser TEXT DEFAULT NULL,
    p_os TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_session_id UUID;
BEGIN
    -- Validate required parameters
    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'p_user_id cannot be NULL';
    END IF;
    
    IF p_session_id IS NULL THEN
        RAISE EXCEPTION 'p_session_id cannot be NULL';
    END IF;
    
    INSERT INTO user_session_history (
        user_id,
        session_id,
        user_agent,
        ip_address,
        device_type,
        browser,
        os
    ) VALUES (
        p_user_id,
        p_session_id,
        p_user_agent,
        p_ip_address,
        p_device_type,
        p_browser,
        p_os
    ) RETURNING id INTO v_session_id;
    
    RETURN v_session_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to end a session
CREATE OR REPLACE FUNCTION end_user_session(
    p_session_id TEXT,
    p_blog_posts_created INTEGER DEFAULT 0,
    p_blog_posts_edited INTEGER DEFAULT 0,
    p_images_searched INTEGER DEFAULT 0,
    p_references_added INTEGER DEFAULT 0,
    p_session_data JSONB DEFAULT '{}'
)
RETURNS VOID AS $$
BEGIN
    UPDATE user_session_history
    SET 
        ended_at = NOW(),
        duration_seconds = EXTRACT(EPOCH FROM (NOW() - started_at))::INTEGER,
        blog_posts_created = p_blog_posts_created,
        blog_posts_edited = p_blog_posts_edited,
        images_searched = p_images_searched,
        references_added = p_references_added,
        session_data = p_session_data,
        updated_at = NOW()
    WHERE session_id = p_session_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to log user activity
CREATE OR REPLACE FUNCTION log_user_activity(
    p_user_id UUID,
    p_session_id TEXT DEFAULT NULL,
    p_activity_type TEXT DEFAULT 'general',
    p_activity_data JSONB DEFAULT '{}',
    p_duration_ms INTEGER DEFAULT NULL,
    p_success BOOLEAN DEFAULT true,
    p_error_message TEXT DEFAULT NULL,
    p_blog_post_id UUID DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_activity_id UUID;
BEGIN
    INSERT INTO user_activity_log (
        user_id,
        session_id,
        activity_type,
        activity_data,
        duration_ms,
        success,
        error_message,
        blog_post_id,
        ip_address,
        user_agent
    ) VALUES (
        p_user_id,
        p_session_id,
        p_activity_type,
        p_activity_data,
        p_duration_ms,
        p_success,
        p_error_message,
        p_blog_post_id,
        p_ip_address,
        p_user_agent
    ) RETURNING id INTO v_activity_id;
    
    RETURN v_activity_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to save workspace state
CREATE OR REPLACE FUNCTION save_workspace_state(
    p_user_id UUID DEFAULT NULL,
    p_workspace_id TEXT DEFAULT NULL,
    p_draft_content TEXT DEFAULT NULL,
    p_draft_metadata JSONB DEFAULT '{}',
    p_is_public BOOLEAN DEFAULT false,
    p_collaborators TEXT[] DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    v_workspace_id UUID;
BEGIN
    -- Validate required parameters
    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'p_user_id cannot be NULL';
    END IF;
    
    IF p_workspace_id IS NULL THEN
        RAISE EXCEPTION 'p_workspace_id cannot be NULL';
    END IF;
    
    INSERT INTO user_workspace_state (
        user_id,
        workspace_id,
        draft_content,
        draft_metadata,
        is_public,
        collaborators,
        last_activity
    ) VALUES (
        p_user_id,
        p_workspace_id,
        p_draft_content,
        p_draft_metadata,
        p_is_public,
        p_collaborators,
        NOW()
    ) ON CONFLICT (user_id, workspace_id) DO UPDATE SET
        draft_content = COALESCE(EXCLUDED.draft_content, user_workspace_state.draft_content),
        draft_metadata = COALESCE(EXCLUDED.draft_metadata, user_workspace_state.draft_metadata),
        is_public = COALESCE(EXCLUDED.is_public, user_workspace_state.is_public),
        collaborators = COALESCE(EXCLUDED.collaborators, user_workspace_state.collaborators),
        last_activity = NOW(),
        updated_at = NOW()
    RETURNING id INTO v_workspace_id;
    
    RETURN v_workspace_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to get user session statistics
CREATE OR REPLACE FUNCTION get_user_session_stats(p_user_id UUID DEFAULT NULL)
RETURNS TABLE (
    total_sessions INTEGER,
    avg_session_duration INTEGER,
    total_blog_posts_created INTEGER,
    total_blog_posts_edited INTEGER,
    total_images_searched INTEGER,
    total_references_added INTEGER,
    most_active_day TEXT,
    sessions_this_month INTEGER
) AS $$
BEGIN
    -- Validate required parameters
    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'p_user_id cannot be NULL';
    END IF;
    
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_sessions,
        ROUND(AVG(duration_seconds))::INTEGER as avg_session_duration,
        SUM(blog_posts_created)::INTEGER as total_blog_posts_created,
        SUM(blog_posts_edited)::INTEGER as total_blog_posts_edited,
        SUM(images_searched)::INTEGER as total_images_searched,
        SUM(references_added)::INTEGER as total_references_added,
        to_char(started_at, 'Day') as most_active_day,
        COUNT(*) FILTER (WHERE started_at >= date_trunc('month', NOW()))::INTEGER as sessions_this_month
    FROM user_session_history
    WHERE user_id = p_user_id AND ended_at IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Create function to cleanup old session data
CREATE OR REPLACE FUNCTION cleanup_old_session_data(p_days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    -- Delete old session history
    DELETE FROM user_session_history 
    WHERE started_at < NOW() - INTERVAL '1 day' * p_days_to_keep
    AND ended_at IS NOT NULL;
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    -- Delete old activity logs
    DELETE FROM user_activity_log 
    WHERE created_at < NOW() - INTERVAL '1 day' * p_days_to_keep;
    
    -- Delete old workspace states (keep only recent ones)
    DELETE FROM user_workspace_state 
    WHERE last_activity < NOW() - INTERVAL '1 day' * 30;
    
    RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create RLS policies for user preferences
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences" ON user_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON user_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON user_preferences
    FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for session history
ALTER TABLE user_session_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own session history" ON user_session_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own session history" ON user_session_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own session history" ON user_session_history
    FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for activity log
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activity log" ON user_activity_log
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity log" ON user_activity_log
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for workspace state
ALTER TABLE user_workspace_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own workspace state" ON user_workspace_state
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workspace state" ON user_workspace_state
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workspace state" ON user_workspace_state
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workspace state" ON user_workspace_state
    FOR DELETE USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON user_preferences TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_session_history TO authenticated;
GRANT SELECT, INSERT ON user_activity_log TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_workspace_state TO authenticated;

GRANT EXECUTE ON FUNCTION get_user_preferences TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_preferences TO authenticated;
GRANT EXECUTE ON FUNCTION start_user_session TO authenticated;
GRANT EXECUTE ON FUNCTION end_user_session TO authenticated;
GRANT EXECUTE ON FUNCTION log_user_activity TO authenticated;
GRANT EXECUTE ON FUNCTION save_workspace_state TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_session_stats TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_session_data TO authenticated;
