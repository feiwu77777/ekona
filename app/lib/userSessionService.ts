import { createServerSupabase } from './supabaseClient';
import { Database, UserPreferences, UserSessionHistory, UserActivityLog, UserWorkspaceState } from '@/supabase_SQL/database.types';

const supabase = createServerSupabase();

export class UserSessionService {
  /**
   * Get user preferences
   */
  async getUserPreferences(userId: string): Promise<UserPreferences> {
    const { data, error } = await supabase
      .rpc('get_user_preferences', {
        p_user_id: userId
      });

    if (error) {
      console.error('Error fetching user preferences:', error);
      throw new Error(`Failed to fetch user preferences: ${error.message}`);
    }

    if (!data || data.length === 0) {
      throw new Error('No user preferences found');
    }

    return data[0] as UserPreferences;
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(
    userId: string,
    preferences: Partial<Omit<UserPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
  ): Promise<string> {
    const { data, error } = await supabase
      .rpc('update_user_preferences', {
        p_user_id: userId,
        p_default_tone: preferences.default_tone || null,
        p_default_word_count: preferences.default_word_count || null,
        p_include_images: preferences.include_images || null,
        p_include_references: preferences.include_references || null,
        p_theme: preferences.theme || null,
        p_language: preferences.language || null,
        p_auto_save: preferences.auto_save || null,
        p_auto_preview: preferences.auto_preview || null,
        p_preferred_categories: preferences.preferred_categories || null,
        p_blocked_domains: preferences.blocked_domains || null,
        p_favorite_topics: preferences.favorite_topics || null,
        p_email_notifications: preferences.email_notifications || null,
        p_browser_notifications: preferences.browser_notifications || null,
        p_weekly_digest: preferences.weekly_digest || null,
        p_max_generation_time: preferences.max_generation_time || null,
        p_retry_attempts: preferences.retry_attempts || null,
        p_quality_threshold: preferences.quality_threshold || null
      });

    if (error) {
      console.error('Error updating user preferences:', error);
      throw new Error(`Failed to update user preferences: ${error.message}`);
    }

    return data;
  }

  /**
   * Start a new user session
   */
  async startUserSession(
    userId: string,
    sessionId: string,
    userAgent?: string,
    ipAddress?: string,
    deviceType?: string,
    browser?: string,
    os?: string
  ): Promise<string> {
    const { data, error } = await supabase
      .rpc('start_user_session', {
        p_user_id: userId,
        p_session_id: sessionId,
        p_user_agent: userAgent || null,
        p_ip_address: ipAddress || null,
        p_device_type: deviceType || null,
        p_browser: browser || null,
        p_os: os || null
      });

    if (error) {
      console.error('Error starting user session:', error);
      throw new Error(`Failed to start user session: ${error.message}`);
    }

    return data;
  }

  /**
   * End a user session
   */
  async endUserSession(
    sessionId: string,
    blogPostsCreated: number = 0,
    blogPostsEdited: number = 0,
    imagesSearched: number = 0,
    referencesAdded: number = 0,
    sessionData: any = {}
  ): Promise<void> {
    const { error } = await supabase
      .rpc('end_user_session', {
        p_session_id: sessionId,
        p_blog_posts_created: blogPostsCreated,
        p_blog_posts_edited: blogPostsEdited,
        p_images_searched: imagesSearched,
        p_references_added: referencesAdded,
        p_session_data: sessionData
      });

    if (error) {
      console.error('Error ending user session:', error);
      throw new Error(`Failed to end user session: ${error.message}`);
    }
  }

  /**
   * Log user activity
   */
  async logUserActivity(
    userId: string,
    activityType: string,
    activityData: any = {},
    durationMs?: number,
    success: boolean = true,
    errorMessage?: string,
    blogPostId?: string,
    sessionId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<string> {
    const { data, error } = await supabase
      .rpc('log_user_activity', {
        p_user_id: userId,
        p_session_id: sessionId || null,
        p_activity_type: activityType,
        p_activity_data: activityData,
        p_duration_ms: durationMs || null,
        p_success: success,
        p_error_message: errorMessage || null,
        p_blog_post_id: blogPostId || null,
        p_ip_address: ipAddress || null,
        p_user_agent: userAgent || null
      });

    if (error) {
      console.error('Error logging user activity:', error);
      throw new Error(`Failed to log user activity: ${error.message}`);
    }

    return data;
  }

  /**
   * Save workspace state
   */
  async saveWorkspaceState(
    userId: string,
    workspaceId: string,
    draftContent?: string,
    draftMetadata: any = {},
    isPublic: boolean = false,
    collaborators: string[] = []
  ): Promise<string> {
    const { data, error } = await supabase
      .rpc('save_workspace_state', {
        p_user_id: userId,
        p_workspace_id: workspaceId,
        p_draft_content: draftContent || null,
        p_draft_metadata: draftMetadata,
        p_is_public: isPublic,
        p_collaborators: collaborators
      });

    if (error) {
      console.error('Error saving workspace state:', error);
      throw new Error(`Failed to save workspace state: ${error.message}`);
    }

    return data;
  }

  /**
   * Get workspace state
   */
  async getWorkspaceState(userId: string, workspaceId: string): Promise<UserWorkspaceState | null> {
    const { data, error } = await supabase
      .from('user_workspace_state')
      .select('*')
      .eq('user_id', userId)
      .eq('workspace_id', workspaceId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No workspace found
        return null;
      }
      console.error('Error fetching workspace state:', error);
      throw new Error(`Failed to fetch workspace state: ${error.message}`);
    }

    return data as UserWorkspaceState;
  }

  /**
   * Get user session statistics
   */
  async getUserSessionStats(userId: string): Promise<any> {
    const { data, error } = await supabase
      .rpc('get_user_session_stats', {
        p_user_id: userId
      });

    if (error) {
      console.error('Error fetching user session stats:', error);
      throw new Error(`Failed to fetch user session stats: ${error.message}`);
    }

    return data?.[0] || null;
  }

  /**
   * Get user activity log
   */
  async getUserActivityLog(
    userId: string,
    limit: number = 50,
    offset: number = 0,
    activityType?: string
  ): Promise<UserActivityLog[]> {
    let query = supabase
      .from('user_activity_log')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (activityType) {
      query = query.eq('activity_type', activityType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching user activity log:', error);
      throw new Error(`Failed to fetch user activity log: ${error.message}`);
    }

    return data as UserActivityLog[];
  }

  /**
   * Get user session history
   */
  async getUserSessionHistory(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<UserSessionHistory[]> {
    const { data, error } = await supabase
      .from('user_session_history')
      .select('*')
      .eq('user_id', userId)
      .order('started_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching user session history:', error);
      throw new Error(`Failed to fetch user session history: ${error.message}`);
    }

    return data as UserSessionHistory[];
  }

  /**
   * Cleanup old session data
   */
  async cleanupOldSessionData(daysToKeep: number = 90): Promise<number> {
    const { data, error } = await supabase
      .rpc('cleanup_old_session_data', {
        p_days_to_keep: daysToKeep
      });

    if (error) {
      console.error('Error cleaning up old session data:', error);
      throw new Error(`Failed to cleanup old session data: ${error.message}`);
    }

    return data;
  }

  /**
   * Get user workspaces
   */
  async getUserWorkspaces(userId: string): Promise<UserWorkspaceState[]> {
    const { data, error } = await supabase
      .from('user_workspace_state')
      .select('*')
      .eq('user_id', userId)
      .order('last_activity', { ascending: false });

    if (error) {
      console.error('Error fetching user workspaces:', error);
      throw new Error(`Failed to fetch user workspaces: ${error.message}`);
    }

    return data as UserWorkspaceState[];
  }

  /**
   * Delete workspace state
   */
  async deleteWorkspaceState(userId: string, workspaceId: string): Promise<void> {
    const { error } = await supabase
      .from('user_workspace_state')
      .delete()
      .eq('user_id', userId)
      .eq('workspace_id', workspaceId);

    if (error) {
      console.error('Error deleting workspace state:', error);
      throw new Error(`Failed to delete workspace state: ${error.message}`);
    }
  }

  /**
   * Get recent activity summary
   */
  async getRecentActivitySummary(userId: string, days: number = 7): Promise<any> {
    const { data, error } = await supabase
      .from('user_activity_log')
      .select('activity_type, success, created_at')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching recent activity summary:', error);
      throw new Error(`Failed to fetch recent activity summary: ${error.message}`);
    }

    // Group activities by type and count success/failure
    const summary = data.reduce((acc: any, activity) => {
      if (!acc[activity.activity_type]) {
        acc[activity.activity_type] = { total: 0, success: 0, failure: 0 };
      }
      acc[activity.activity_type].total++;
      if (activity.success) {
        acc[activity.activity_type].success++;
      } else {
        acc[activity.activity_type].failure++;
      }
      return acc;
    }, {});

    return summary;
  }
}

export const userSessionService = new UserSessionService();
