// run the following command to generate the types
// COPY THIS COMMENT FIRST AS IT WILL BE ERASED BY THE COMMAND
// supabase gen types typescript --project-id idwtzqkrzbdwrijwlduz > supabase_SQL/database.types.ts
// project id is found in the supabase project settings

export interface Database {
  public: {
    Tables: {
      blog_posts: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          content: string;
          topic: string;
          tone: 'academic' | 'casual' | 'professional';
          word_count: number;
          generation_time: number | null;
          model_used: string;
          metadata: Json;
          keywords: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          content: string;
          topic: string;
          tone: 'academic' | 'casual' | 'professional';
          word_count: number;
          generation_time?: number | null;
          model_used?: string;
          metadata?: Json;
          keywords?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          content?: string;
          topic?: string;
          tone?: 'academic' | 'casual' | 'professional';
          word_count?: number;
          generation_time?: number | null;
          model_used?: string;
          metadata?: Json;
          keywords?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
      blog_references: {
        Row: {
          id: string;
          blog_post_id: string;
          title: string;
          url: string;
          source: string;
          published_at: string | null;
          relevance_score: number;
          snippet: string | null;
          domain: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          blog_post_id: string;
          title: string;
          url: string;
          source: string;
          published_at?: string | null;
          relevance_score?: number;
          snippet?: string | null;
          domain?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          blog_post_id?: string;
          title?: string;
          url?: string;
          source?: string;
          published_at?: string | null;
          relevance_score?: number;
          snippet?: string | null;
          domain?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      blog_image_metadata: {
        Row: {
          id: string;
          blog_post_id: string;
          image_id: string;
          url: string;
          alt_text: string | null;
          photographer: string | null;
          photographer_url: string | null;
          download_url: string | null;
          relevance_score: number;
          section_index: number | null;
          image_type: string;
          width: number | null;
          height: number | null;
          file_size: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          blog_post_id: string;
          image_id: string;
          url: string;
          alt_text?: string | null;
          photographer?: string | null;
          photographer_url?: string | null;
          download_url?: string | null;
          relevance_score?: number;
          section_index?: number | null;
          image_type?: string;
          width?: number | null;
          height?: number | null;
          file_size?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          blog_post_id?: string;
          image_id?: string;
          url?: string;
          alt_text?: string | null;
          photographer?: string | null;
          photographer_url?: string | null;
          download_url?: string | null;
          relevance_score?: number;
          section_index?: number | null;
          image_type?: string;
          width?: number | null;
          height?: number | null;
          file_size?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_preferences: {
        Row: {
          id: string;
          user_id: string;
          default_tone: 'academic' | 'casual' | 'professional';
          default_word_count: number;
          include_images: boolean;
          include_references: boolean;
          theme: 'light' | 'dark' | 'system';
          language: 'en' | 'es' | 'fr' | 'de';
          auto_save: boolean;
          auto_preview: boolean;
          preferred_categories: string[];
          blocked_domains: string[];
          favorite_topics: string[];
          email_notifications: boolean;
          browser_notifications: boolean;
          weekly_digest: boolean;
          max_generation_time: number;
          retry_attempts: number;
          quality_threshold: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          default_tone?: 'academic' | 'casual' | 'professional';
          default_word_count?: number;
          include_images?: boolean;
          include_references?: boolean;
          theme?: 'light' | 'dark' | 'system';
          language?: 'en' | 'es' | 'fr' | 'de';
          auto_save?: boolean;
          auto_preview?: boolean;
          preferred_categories?: string[];
          blocked_domains?: string[];
          favorite_topics?: string[];
          email_notifications?: boolean;
          browser_notifications?: boolean;
          weekly_digest?: boolean;
          max_generation_time?: number;
          retry_attempts?: number;
          quality_threshold?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          default_tone?: 'academic' | 'casual' | 'professional';
          default_word_count?: number;
          include_images?: boolean;
          include_references?: boolean;
          theme?: 'light' | 'dark' | 'system';
          language?: 'en' | 'es' | 'fr' | 'de';
          auto_save?: boolean;
          auto_preview?: boolean;
          preferred_categories?: string[];
          blocked_domains?: string[];
          favorite_topics?: string[];
          email_notifications?: boolean;
          browser_notifications?: boolean;
          weekly_digest?: boolean;
          max_generation_time?: number;
          retry_attempts?: number;
          quality_threshold?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_session_history: {
        Row: {
          id: string;
          user_id: string;
          session_id: string;
          started_at: string;
          ended_at: string | null;
          duration_seconds: number | null;
          blog_posts_created: number;
          blog_posts_edited: number;
          images_searched: number;
          references_added: number;
          user_agent: string | null;
          ip_address: string | null;
          device_type: string | null;
          browser: string | null;
          os: string | null;
          session_data: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          session_id: string;
          started_at?: string;
          ended_at?: string | null;
          duration_seconds?: number | null;
          blog_posts_created?: number;
          blog_posts_edited?: number;
          images_searched?: number;
          references_added?: number;
          user_agent?: string | null;
          ip_address?: string | null;
          device_type?: string | null;
          browser?: string | null;
          os?: string | null;
          session_data?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          session_id?: string;
          started_at?: string;
          ended_at?: string | null;
          duration_seconds?: number | null;
          blog_posts_created?: number;
          blog_posts_edited?: number;
          images_searched?: number;
          references_added?: number;
          user_agent?: string | null;
          ip_address?: string | null;
          device_type?: string | null;
          browser?: string | null;
          os?: string | null;
          session_data?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_activity_log: {
        Row: {
          id: string;
          user_id: string;
          session_id: string | null;
          activity_type: string;
          activity_data: Json;
          duration_ms: number | null;
          success: boolean;
          error_message: string | null;
          blog_post_id: string | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          session_id?: string | null;
          activity_type: string;
          activity_data?: Json;
          duration_ms?: number | null;
          success?: boolean;
          error_message?: string | null;
          blog_post_id?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          session_id?: string | null;
          activity_type?: string;
          activity_data?: Json;
          duration_ms?: number | null;
          success?: boolean;
          error_message?: string | null;
          blog_post_id?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
      };
      user_workspace_state: {
        Row: {
          id: string;
          user_id: string;
          workspace_id: string;
          draft_content: string | null;
          draft_metadata: Json;
          last_activity: string;
          is_public: boolean;
          collaborators: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          workspace_id: string;
          draft_content?: string | null;
          draft_metadata?: Json;
          last_activity?: string;
          is_public?: boolean;
          collaborators?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          workspace_id?: string;
          draft_content?: string | null;
          draft_metadata?: Json;
          last_activity?: string;
          is_public?: boolean;
          collaborators?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      blog_posts_view: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          topic: string;
          tone: 'academic' | 'casual' | 'professional';
          word_count: number;
          generation_time: number | null;
          model_used: string;
          keywords: string[];
          created_at: string;
          updated_at: string;
          research_data_count: string | null;
          prompt_length: string | null;
          success_rate: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string;
          title?: string;
          topic?: string;
          tone?: 'academic' | 'casual' | 'professional';
          word_count?: number;
          generation_time?: number | null;
          model_used?: string;
          keywords?: string[];
          created_at?: string;
          updated_at?: string;
          research_data_count?: string | null;
          prompt_length?: string | null;
          success_rate?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          topic?: string;
          tone?: 'academic' | 'casual' | 'professional';
          word_count?: number;
          generation_time?: number | null;
          model_used?: string;
          keywords?: string[];
          created_at?: string;
          updated_at?: string;
          research_data_count?: string | null;
          prompt_length?: string | null;
          success_rate?: string | null;
        };
      };
    };
    Functions: {
      search_blog_posts: {
        Args: {
          search_query: string;
          user_id_param?: string;
          limit_count?: number;
        };
        Returns: {
          id: string;
          title: string;
          topic: string;
          tone: string;
          word_count: number;
          created_at: string;
          search_rank: number;
        }[];
      };
      get_blog_post_stats: {
        Args: {
          user_id_param?: string;
        };
        Returns: {
          total_posts: number;
          total_words: number;
          avg_words_per_post: number;
          most_common_tone: string;
          generation_time_avg: number;
        }[];
      };
      get_blog_references: {
        Args: {
          p_blog_post_id: string;
        };
        Returns: {
          id: string;
          title: string;
          url: string;
          source: string;
          published_at: string | null;
          relevance_score: number;
          snippet: string | null;
          domain: string | null;
        }[];
      };
      get_blog_images: {
        Args: {
          p_blog_post_id: string;
        };
        Returns: {
          id: string;
          image_id: string;
          url: string;
          alt_text: string | null;
          photographer: string | null;
          photographer_url: string | null;
          download_url: string | null;
          relevance_score: number;
          section_index: number | null;
          image_type: string;
          width: number | null;
          height: number | null;
        }[];
      };
      add_blog_reference: {
        Args: {
          p_blog_post_id: string;
          p_title: string;
          p_url: string;
          p_source: string;
          p_published_at?: string | null;
          p_relevance_score?: number;
          p_snippet?: string | null;
        };
        Returns: string;
      };
      add_blog_image: {
        Args: {
          p_blog_post_id: string;
          p_image_id: string;
          p_url: string;
          p_alt_text?: string | null;
          p_photographer?: string | null;
          p_photographer_url?: string | null;
          p_download_url?: string | null;
          p_relevance_score?: number;
          p_section_index?: number | null;
          p_image_type?: string;
          p_width?: number | null;
          p_height?: number | null;
        };
        Returns: string;
      };
      get_reference_stats: {
        Args: {
          p_user_id?: string | null;
        };
        Returns: {
          total_references: number;
          unique_domains: number;
          avg_relevance_score: number;
          most_common_domain: string | null;
          references_this_month: number;
        }[];
      };
      get_image_stats: {
        Args: {
          p_user_id?: string | null;
        };
        Returns: {
          total_images: number;
          avg_relevance_score: number;
          most_common_image_type: string | null;
          images_this_month: number;
          total_image_size: number;
        }[];
      };
      get_user_preferences: {
        Args: {
          p_user_id: string;
        };
        Returns: {
          id: string;
          user_id: string;
          default_tone: string;
          default_word_count: number;
          include_images: boolean;
          include_references: boolean;
          theme: string;
          language: string;
          auto_save: boolean;
          auto_preview: boolean;
          preferred_categories: string[];
          blocked_domains: string[];
          favorite_topics: string[];
          email_notifications: boolean;
          browser_notifications: boolean;
          weekly_digest: boolean;
          max_generation_time: number;
          retry_attempts: number;
          quality_threshold: number;
        }[];
      };
      update_user_preferences: {
        Args: {
          p_user_id: string;
          p_default_tone?: string | null;
          p_default_word_count?: number | null;
          p_include_images?: boolean | null;
          p_include_references?: boolean | null;
          p_theme?: string | null;
          p_language?: string | null;
          p_auto_save?: boolean | null;
          p_auto_preview?: boolean | null;
          p_preferred_categories?: string[] | null;
          p_blocked_domains?: string[] | null;
          p_favorite_topics?: string[] | null;
          p_email_notifications?: boolean | null;
          p_browser_notifications?: boolean | null;
          p_weekly_digest?: boolean | null;
          p_max_generation_time?: number | null;
          p_retry_attempts?: number | null;
          p_quality_threshold?: number | null;
        };
        Returns: string;
      };
      start_user_session: {
        Args: {
          p_user_id: string;
          p_session_id: string;
          p_user_agent?: string | null;
          p_ip_address?: string | null;
          p_device_type?: string | null;
          p_browser?: string | null;
          p_os?: string | null;
        };
        Returns: string;
      };
      end_user_session: {
        Args: {
          p_session_id: string;
          p_blog_posts_created?: number | null;
          p_blog_posts_edited?: number | null;
          p_images_searched?: number | null;
          p_references_added?: number | null;
          p_session_data?: Json | null;
        };
        Returns: undefined;
      };
      log_user_activity: {
        Args: {
          p_user_id: string;
          p_session_id?: string | null;
          p_activity_type: string;
          p_activity_data?: Json | null;
          p_duration_ms?: number | null;
          p_success?: boolean | null;
          p_error_message?: string | null;
          p_blog_post_id?: string | null;
          p_ip_address?: string | null;
          p_user_agent?: string | null;
        };
        Returns: string;
      };
      save_workspace_state: {
        Args: {
          p_user_id: string;
          p_workspace_id: string;
          p_draft_content?: string | null;
          p_draft_metadata?: Json | null;
          p_is_public?: boolean | null;
          p_collaborators?: string[] | null;
        };
        Returns: string;
      };
      get_user_session_stats: {
        Args: {
          p_user_id: string;
        };
        Returns: {
          total_sessions: number;
          avg_session_duration: number;
          total_blog_posts_created: number;
          total_blog_posts_edited: number;
          total_images_searched: number;
          total_references_added: number;
          most_active_day: string | null;
          sessions_this_month: number;
        }[];
      };
      cleanup_old_session_data: {
        Args: {
          p_days_to_keep?: number | null;
        };
        Returns: number;
      };
    };
  };
}

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

// Blog post types for application use
export interface BlogPost {
  id: string;
  user_id: string;
  title: string;
  content: string;
  topic: string;
  tone: 'academic' | 'casual' | 'professional';
  word_count: number;
  generation_time: number | null;
  model_used: string;
  metadata: BlogPostMetadata;
  keywords: string[];
  created_at: string;
  updated_at: string;
}

export interface BlogReference {
  id: string;
  blog_post_id: string;
  title: string;
  url: string;
  source: string;
  published_at: string | null;
  relevance_score: number;
  snippet: string | null;
  domain: string | null;
  created_at: string;
  updated_at: string;
}

export interface BlogImageMetadata {
  id: string;
  blog_post_id: string;
  image_id: string;
  url: string;
  alt_text: string | null;
  photographer: string | null;
  photographer_url: string | null;
  download_url: string | null;
  relevance_score: number;
  section_index: number | null;
  image_type: string;
  width: number | null;
  height: number | null;
  file_size: number | null;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  default_tone: 'academic' | 'casual' | 'professional';
  default_word_count: number;
  include_images: boolean;
  include_references: boolean;
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'es' | 'fr' | 'de';
  auto_save: boolean;
  auto_preview: boolean;
  preferred_categories: string[];
  blocked_domains: string[];
  favorite_topics: string[];
  email_notifications: boolean;
  browser_notifications: boolean;
  weekly_digest: boolean;
  max_generation_time: number;
  retry_attempts: number;
  quality_threshold: number;
  created_at: string;
  updated_at: string;
}

export interface UserSessionHistory {
  id: string;
  user_id: string;
  session_id: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  blog_posts_created: number;
  blog_posts_edited: number;
  images_searched: number;
  references_added: number;
  user_agent: string | null;
  ip_address: string | null;
  device_type: string | null;
  browser: string | null;
  os: string | null;
  session_data: Json;
  created_at: string;
  updated_at: string;
}

export interface UserActivityLog {
  id: string;
  user_id: string;
  session_id: string | null;
  activity_type: string;
  activity_data: Json;
  duration_ms: number | null;
  success: boolean;
  error_message: string | null;
  blog_post_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface UserWorkspaceState {
  id: string;
  user_id: string;
  workspace_id: string;
  draft_content: string | null;
  draft_metadata: Json;
  last_activity: string;
  is_public: boolean;
  collaborators: string[];
  created_at: string;
  updated_at: string;
}

export interface BlogPostMetadata {
  researchDataCount?: number;
  promptLength?: number;
  successRate?: number;
  generationTime?: number;
  modelUsed?: string;
  [key: string]: any;
}

export interface ImageData {
  id: string;
  url: string;
  alt: string;
  photographer: string;
  downloadUrl: string;
  relevanceScore?: number;
}

export interface ReferenceData {
  title: string;
  url: string;
  source: string;
  publishedAt?: string;
  relevance?: number;
}

export interface BlogPostStats {
  total_posts: number;
  total_words: number;
  avg_words_per_post: number;
  most_common_tone: string;
  generation_time_avg: number;
}

export interface BlogPostSearchResult {
  id: string;
  title: string;
  topic: string;
  tone: string;
  word_count: number;
  created_at: string;
  search_rank: number;
}
