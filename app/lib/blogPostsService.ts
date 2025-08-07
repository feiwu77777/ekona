import { createClient } from '@supabase/supabase-js';
import { Database, BlogPost, BlogPostStats, BlogPostSearchResult, BlogReference, BlogImageMetadata } from '@/supabase_SQL/database.types';

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export class BlogPostsService {
  /**
   * Save a new blog post to the database
   */
  async saveBlogPost(blogPost: Omit<BlogPost, 'id' | 'created_at' | 'updated_at'>): Promise<BlogPost> {
    const { data, error } = await supabase
      .from('blog_posts')
      .insert({
        user_id: blogPost.user_id,
        title: blogPost.title,
        content: blogPost.content,
        topic: blogPost.topic,
        tone: blogPost.tone,
        word_count: blogPost.word_count,
        generation_time: blogPost.generation_time,
        model_used: blogPost.model_used,
        metadata: blogPost.metadata,
        keywords: blogPost.keywords
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving blog post:', error);
      throw new Error(`Failed to save blog post: ${error.message}`);
    }

    return data as BlogPost;
  }

  /**
   * Get blog posts for a user with pagination
   */
  async getUserBlogPosts(
    userId: string,
    page: number = 1,
    limit: number = 10,
    search?: string
  ): Promise<{ posts: BlogPost[]; total: number; hasMore: boolean }> {
    let query = supabase
      .from('blog_posts')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`title.ilike.%${search}%,topic.ilike.%${search}%`);
    }

    const { data, error, count } = await query
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      console.error('Error fetching blog posts:', error);
      throw new Error(`Failed to fetch blog posts: ${error.message}`);
    }

    return {
      posts: data as BlogPost[],
      total: count || 0,
      hasMore: (count || 0) > page * limit
    };
  }

  /**
   * Get a single blog post by ID
   */
  async getBlogPost(postId: string, userId: string): Promise<BlogPost | null> {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', postId)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Post not found
      }
      console.error('Error fetching blog post:', error);
      throw new Error(`Failed to fetch blog post: ${error.message}`);
    }

    return data as BlogPost;
  }

  /**
   * Update a blog post
   */
  async updateBlogPost(
    postId: string,
    userId: string,
    updates: Partial<Omit<BlogPost, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
  ): Promise<BlogPost> {
    const { data, error } = await supabase
      .from('blog_posts')
      .update(updates)
      .eq('id', postId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating blog post:', error);
      throw new Error(`Failed to update blog post: ${error.message}`);
    }

    return data as BlogPost;
  }

  /**
   * Delete a blog post
   */
  async deleteBlogPost(postId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', postId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting blog post:', error);
      throw new Error(`Failed to delete blog post: ${error.message}`);
    }
  }

  /**
   * Search blog posts using full-text search
   */
  async searchBlogPosts(
    searchQuery: string,
    userId: string,
    limit: number = 10
  ): Promise<BlogPostSearchResult[]> {
    const { data, error } = await supabase
      .rpc('search_blog_posts', {
        search_query: searchQuery,
        user_id_param: userId,
        limit_count: limit
      });

    if (error) {
      console.error('Error searching blog posts:', error);
      throw new Error(`Failed to search blog posts: ${error.message}`);
    }

    return data as BlogPostSearchResult[];
  }

  /**
   * Get blog post statistics for a user
   */
  async getBlogPostStats(userId: string): Promise<BlogPostStats | null> {
    const { data, error } = await supabase
      .rpc('get_blog_post_stats', {
        user_id_param: userId
      });

    if (error) {
      console.error('Error fetching blog post stats:', error);
      throw new Error(`Failed to fetch blog post stats: ${error.message}`);
    }

    return data?.[0] || null;
  }

  /**
   * Get recent blog posts (for dashboard)
   */
  async getRecentBlogPosts(userId: string, limit: number = 5): Promise<BlogPost[]> {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent blog posts:', error);
      throw new Error(`Failed to fetch recent blog posts: ${error.message}`);
    }

    return data as BlogPost[];
  }

  /**
   * Get blog posts by tone
   */
  async getBlogPostsByTone(
    userId: string,
    tone: 'academic' | 'casual' | 'professional',
    limit: number = 10
  ): Promise<BlogPost[]> {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('user_id', userId)
      .eq('tone', tone)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching blog posts by tone:', error);
      throw new Error(`Failed to fetch blog posts by tone: ${error.message}`);
    }

    return data as BlogPost[];
  }

  /**
   * Get blog posts by keyword
   */
  async getBlogPostsByKeyword(
    userId: string,
    keyword: string,
    limit: number = 10
  ): Promise<BlogPost[]> {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('user_id', userId)
      .contains('keywords', [keyword])
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching blog posts by keyword:', error);
      throw new Error(`Failed to fetch blog posts by keyword: ${error.message}`);
    }

    return data as BlogPost[];
  }

  /**
   * Update blog post metadata
   */
  async updateBlogPostMetadata(
    postId: string,
    userId: string,
    metadata: Record<string, any>
  ): Promise<void> {
    const { error } = await supabase
      .from('blog_posts')
      .update({ metadata })
      .eq('id', postId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating blog post metadata:', error);
      throw new Error(`Failed to update blog post metadata: ${error.message}`);
    }
  }



  /**
   * Add reference to blog post
   */
  async addReferenceToBlogPost(
    postId: string,
    userId: string,
    reference: Omit<BlogReference, 'id' | 'blog_post_id' | 'created_at' | 'updated_at'>
  ): Promise<BlogReference> {
    // Verify the blog post belongs to the user
    const { data: blogPost } = await supabase
      .from('blog_posts')
      .select('id')
      .eq('id', postId)
      .eq('user_id', userId)
      .single();

    if (!blogPost) {
      throw new Error('Blog post not found');
    }

    const { data, error } = await supabase
      .from('blog_references')
      .insert({
        blog_post_id: postId,
        title: reference.title,
        url: reference.url,
        source: reference.source,
        published_at: reference.published_at,
        relevance_score: reference.relevance_score,
        snippet: reference.snippet,
        domain: reference.domain
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding reference to blog post:', error);
      throw new Error(`Failed to add reference to blog post: ${error.message}`);
    }

    return data as BlogReference;
  }

  /**
   * Get references for a blog post
   */
  async getBlogPostReferences(postId: string, userId: string): Promise<BlogReference[]> {
    // Verify the blog post belongs to the user
    const { data: blogPost } = await supabase
      .from('blog_posts')
      .select('id')
      .eq('id', postId)
      .eq('user_id', userId)
      .single();

    if (!blogPost) {
      throw new Error('Blog post not found');
    }

    const { data, error } = await supabase
      .from('blog_references')
      .select('*')
      .eq('blog_post_id', postId)
      .order('relevance_score', { ascending: false });

    if (error) {
      console.error('Error fetching blog post references:', error);
      throw new Error(`Failed to fetch blog post references: ${error.message}`);
    }

    return data as BlogReference[];
  }

  /**
   * Add image to blog post
   */
  async addImageToBlogPost(
    postId: string,
    userId: string,
    image: Omit<BlogImageMetadata, 'id' | 'blog_post_id' | 'created_at' | 'updated_at'>
  ): Promise<BlogImageMetadata> {
    // Verify the blog post belongs to the user
    const { data: blogPost } = await supabase
      .from('blog_posts')
      .select('id')
      .eq('id', postId)
      .eq('user_id', userId)
      .single();

    if (!blogPost) {
      throw new Error('Blog post not found');
    }

    const { data, error } = await supabase
      .from('blog_image_metadata')
      .insert({
        blog_post_id: postId,
        image_id: image.image_id,
        url: image.url,
        alt_text: image.alt_text,
        photographer: image.photographer,
        photographer_url: image.photographer_url,
        download_url: image.download_url,
        relevance_score: image.relevance_score,
        section_index: image.section_index,
        image_type: image.image_type,
        width: image.width,
        height: image.height,
        file_size: image.file_size
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding image to blog post:', error);
      throw new Error(`Failed to add image to blog post: ${error.message}`);
    }

    return data as BlogImageMetadata;
  }

  /**
   * Get images for a blog post
   */
  async getBlogPostImages(postId: string, userId: string): Promise<BlogImageMetadata[]> {
    // Verify the blog post belongs to the user
    const { data: blogPost } = await supabase
      .from('blog_posts')
      .select('id')
      .eq('id', postId)
      .eq('user_id', userId)
      .single();

    if (!blogPost) {
      throw new Error('Blog post not found');
    }

    const { data, error } = await supabase
      .from('blog_image_metadata')
      .select('*')
      .eq('blog_post_id', postId)
      .order('section_index', { ascending: true });

    if (error) {
      console.error('Error fetching blog post images:', error);
      throw new Error(`Failed to fetch blog post images: ${error.message}`);
    }

    return data as BlogImageMetadata[];
  }

  /**
   * Remove image from blog post
   */
  async removeImageFromBlogPost(
    postId: string,
    userId: string,
    imageId: string
  ): Promise<void> {
    // Verify the blog post belongs to the user
    const { data: blogPost } = await supabase
      .from('blog_posts')
      .select('id')
      .eq('id', postId)
      .eq('user_id', userId)
      .single();

    if (!blogPost) {
      throw new Error('Blog post not found');
    }

    const { error } = await supabase
      .from('blog_image_metadata')
      .delete()
      .eq('blog_post_id', postId)
      .eq('image_id', imageId);

    if (error) {
      console.error('Error removing image from blog post:', error);
      throw new Error(`Failed to remove image from blog post: ${error.message}`);
    }
  }

  /**
   * Get reference statistics for a user
   */
  async getReferenceStats(userId: string): Promise<any> {
    const { data, error } = await supabase
      .rpc('get_reference_stats', {
        p_user_id: userId
      });

    if (error) {
      console.error('Error fetching reference stats:', error);
      throw new Error(`Failed to fetch reference stats: ${error.message}`);
    }

    return data?.[0] || null;
  }

  /**
   * Get image statistics for a user
   */
  async getImageStats(userId: string): Promise<any> {
    const { data, error } = await supabase
      .rpc('get_image_stats', {
        p_user_id: userId
      });

    if (error) {
      console.error('Error fetching image stats:', error);
      throw new Error(`Failed to fetch image stats: ${error.message}`);
    }

    return data?.[0] || null;
  }
}

export const blogPostsService = new BlogPostsService();
