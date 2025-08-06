import { supabase, createServerSupabase } from './supabaseClient';

export interface UserResume {
  id: string;
  user_id: string;
  title: string;
  latex_content: string;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Get all resumes for a user
 */
export async function getUserResumes(userId: string): Promise<UserResume[]> {
  try {
    // Check if we're running on the server (Node.js) or client (browser)
    const isServer = typeof window === 'undefined';
    
    if (isServer) {
      // Server-side: Use service role client directly
      const serverSupabase = createServerSupabase();
      const { data, error } = await serverSupabase
        .from('user_resumes')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching user resumes (server):', error);
        return [];
      }

      console.log(`Fetched ${data?.length || 0} resumes (server)`);
      return data || [];
    } else {
      // Client-side: Use API endpoint for consistency
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch('/api/resumes', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session?.access_token || ''}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('API request failed:', response.status, response.statusText);
        return [];
      }

      const result = await response.json();
      console.log(`Fetched ${result.resumes?.length || 0} resumes (client)`);
      return result.resumes || [];
    }
  } catch (error) {
    console.error('Error in getUserResumes:', error);
    return [];
  }
}

/**
 * Get user's primary resume
 */
export async function getPrimaryResume(userId: string): Promise<UserResume | null> {
  try {
    // Check if we're running on the server (Node.js) or client (browser)
    const isServer = typeof window === 'undefined';
    
    if (isServer) {
      // Server-side: Use service role client directly
      const serverSupabase = createServerSupabase();
      const { data, error } = await serverSupabase
        .from('user_resumes')
        .select('*')
        .eq('user_id', userId)
        .eq('is_primary', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned - user has no primary resume
          console.log('No primary resume found (server)');
          return null;
        }
        console.error('Error fetching primary resume (server):', error);
        return null;
      }

      console.log('Primary resume fetched (server)');
      return data;
    } else {
      // Client-side: Get all resumes and find primary (using existing API)
      const resumes = await getUserResumes(userId);
      const primaryResume = resumes.find(resume => resume.is_primary);
      
      if (primaryResume) {
        console.log('Primary resume found (client)');
      } else {
        console.log('No primary resume found (client)');
      }
      
      return primaryResume || null;
    }
  } catch (error) {
    console.error('Error in getPrimaryResume:', error);
    return null;
  }
}

/**
 * Save a new resume or update existing one
 */
export async function saveResume(
  userId: string,
  title: string,
  latexContent: string,
  isPrimary: boolean = false,
  resumeId?: string
): Promise<UserResume | null> {
  try {
    // Check if we're running on the server (Node.js) or client (browser)
    const isServer = typeof window === 'undefined';
    
    const resumeData = {
      user_id: userId,
      title: title.trim() || 'My Resume',
      latex_content: latexContent,
      is_primary: isPrimary,
      updated_at: new Date().toISOString()
    };

    let result;

    if (isServer) {
      // Server-side: Use service role client directly
      const serverSupabase = createServerSupabase();
      if (resumeId) {
        // Update existing resume
        const { data, error } = await serverSupabase
          .from('user_resumes')
          .update(resumeData)
          .eq('id', resumeId)
          .eq('user_id', userId)
          .select()
          .single();

        if (error) {
          console.error('Error updating resume (server):', error);
          return null;
        }
        result = data;
        console.log('Resume updated successfully (server)');
      } else {
        // Create new resume
        const { data, error } = await serverSupabase
          .from('user_resumes')
          .insert(resumeData)
          .select()
          .single();

        if (error) {
          console.error('Error creating resume (server):', error);
          return null;
        }
        result = data;
        console.log('Resume created successfully (server)');
      }
    } else {
      // Client-side: Use API endpoint for consistency
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch('/api/resumes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token || ''}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: resumeData.title,
          latexContent: resumeData.latex_content,
          isPrimary: resumeData.is_primary,
          resumeId: resumeId
        }),
      });

      if (!response.ok) {
        console.error('API request failed:', response.status, response.statusText);
        return null;
      }

      const apiResult = await response.json();
      result = apiResult.resume;
      console.log(`Resume ${resumeId ? 'updated' : 'created'} successfully (client)`);
    }

    return result;
  } catch (error) {
    console.error('Error in saveResume:', error);
    return null;
  }
}

/**
 * Delete a resume
 */
export async function deleteResume(userId: string, resumeId: string): Promise<boolean> {
  try {
    // Check if we're running on the server (Node.js) or client (browser)
    const isServer = typeof window === 'undefined';
    
    if (isServer) {
      // Server-side: Use service role client directly
      const serverSupabase = createServerSupabase();
      const { error } = await serverSupabase
        .from('user_resumes')
        .delete()
        .eq('id', resumeId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error deleting resume (server):', error);
        return false;
      }

      console.log('Resume deleted successfully (server)');
      return true;
    } else {
      // Client-side: Use regular supabase client (with RLS)
      const { error } = await supabase
        .from('user_resumes')
        .delete()
        .eq('id', resumeId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error deleting resume (client):', error);
        return false;
      }

      console.log('Resume deleted successfully (client)');
      return true;
    }
  } catch (error) {
    console.error('Error in deleteResume:', error);
    return false;
  }
}

/**
 * Set a resume as primary (and unset others)
 */
export async function setPrimaryResume(userId: string, resumeId: string): Promise<boolean> {
  try {
    // Check if we're running on the server (Node.js) or client (browser)
    const isServer = typeof window === 'undefined';
    
    if (isServer) {
      // Server-side: Use service role client directly
      const serverSupabase = createServerSupabase();
      const { error } = await serverSupabase
        .from('user_resumes')
        .update({ is_primary: true, updated_at: new Date().toISOString() })
        .eq('id', resumeId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error setting primary resume (server):', error);
        return false;
      }

      console.log('Primary resume set successfully (server)');
      return true;
    } else {
      // Client-side: Use regular supabase client (with RLS)
      const { error } = await supabase
        .from('user_resumes')
        .update({ is_primary: true, updated_at: new Date().toISOString() })
        .eq('id', resumeId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error setting primary resume (client):', error);
        return false;
      }

      console.log('Primary resume set successfully (client)');
      return true;
    }
  } catch (error) {
    console.error('Error in setPrimaryResume:', error);
    return false;
  }
}

/**
 * Get a specific resume by ID
 */
export async function getResumeById(userId: string, resumeId: string): Promise<UserResume | null> {
  try {
    // Check if we're running on the server (Node.js) or client (browser)
    const isServer = typeof window === 'undefined';
    
    if (isServer) {
      // Server-side: Use service role client directly  
      const serverSupabase = createServerSupabase();
      const { data, error } = await serverSupabase
        .from('user_resumes')
        .select('*')
        .eq('id', resumeId)
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching resume by ID (server):', error);
        return null;
      }

      console.log('Resume fetched by ID (server)');
      return data;
    } else {
      // Client-side: Get all resumes and find the specific one
      const resumes = await getUserResumes(userId);
      const resume = resumes.find(r => r.id === resumeId);
      
      if (resume) {
        console.log('Resume found by ID (client)');
      } else {
        console.log('Resume not found by ID (client)');
      }
      
      return resume || null;
    }
  } catch (error) {
    console.error('Error in getResumeById:', error);
    return null;
  }
}

/**
 * Auto-save user's first resume when they paste LaTeX content
 */
export async function autoSaveFirstResume(userId: string, latexContent: string): Promise<UserResume | null> {
  try {
    // Check if user already has any resumes
    const existingResumes = await getUserResumes(userId);
    
    if (existingResumes.length > 0) {
      // User already has resumes, don't auto-save
      return null;
    }

    // Save as their first primary resume
    return await saveResume(userId, 'My Resume', latexContent, true);
  } catch (error) {
    console.error('Error in autoSaveFirstResume:', error);
    return null;
  }
} 