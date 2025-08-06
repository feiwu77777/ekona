import { supabase, createServerSupabase } from './supabaseClient';

export interface UserCredits {
  id: string;
  user_id: string;
  total_credits: number;
  used_credits: number;
  remaining_credits: number;
  last_reset_date: string;
  subscription_type: string;
  created_at: string;
  updated_at: string;
}

/**
 * Get user's credit information
 */
export async function getUserCredits(userId: string): Promise<UserCredits | null> {
  try {
    // Check if we're running on the server (Node.js) or client (browser)
    const isServer = typeof window === 'undefined';
    
    if (isServer) {
      // Server-side: Use service role client directly
      const serverSupabase = createServerSupabase();
      const { data, error } = await serverSupabase
        .from('user_credits')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching user credits (server):', error);
        return null;
      }

      return data;
    } else {
      // Client-side: Use API endpoint
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch('/api/user/credits', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session?.access_token || ''}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('API request failed:', response.status, response.statusText);
        return null;
      }

      const result = await response.json();
      return result.credits;
    }
  } catch (error) {
    console.error('Error in getUserCredits:', error);
    return null;
  }
}

/**
 * Check if user has enough credits
 */
export async function hasEnoughCredits(userId: string, requiredCredits: number = 1): Promise<boolean> {
  try {
    const credits = await getUserCredits(userId);
    return credits ? credits.remaining_credits >= requiredCredits : false;
  } catch (error) {
    console.error('Error checking credits:', error);
    return false;
  }
}

/**
 * Deduct credits from user account
 */
export async function deductUserCredit(userId: string): Promise<boolean> {
  try {
    // Check if we're running on the server (Node.js) or client (browser)
    const isServer = typeof window === 'undefined';
    
    if (isServer) {
      // Server-side: Use service role client directly
      const serverSupabase = createServerSupabase();
      const { data, error } = await serverSupabase.rpc('deduct_user_credit', {
        p_user_id: userId
      });

      if (error) {
        console.error('Error deducting credit (server):', error);
        return false;
      }

      console.log('Credit deducted successfully (server)');
      return data === true;
    } else {
      // Client-side: Use regular supabase client (with RLS)
      const { data, error } = await supabase.rpc('deduct_user_credit', {
        p_user_id: userId
      });

      if (error) {
        console.error('Error deducting credit (client):', error);
        return false;
      }

      console.log('Credit deducted successfully (client)');
      return data === true;
    }
  } catch (error) {
    console.error('Error in deductUserCredit:', error);
    return false;
  }
}

/**
 * Add credits to user account (for subscriptions or purchases)
 */
export async function addUserCredits(userId: string, creditsToAdd: number): Promise<boolean> {
  try {
    // Check if we're running on the server (Node.js) or client (browser)
    const isServer = typeof window === 'undefined';
    
    // First get current credits, then update
    const currentCredits = await getUserCredits(userId);
    if (!currentCredits) {
      return false;
    }

    if (isServer) {
      // Server-side: Use service role client directly
      const serverSupabase = createServerSupabase();
      const { error } = await serverSupabase
        .from('user_credits')
        .update({
          total_credits: currentCredits.total_credits + creditsToAdd
        })
        .eq('user_id', userId);

      if (error) {
        console.error('Error adding credits (server):', error);
        return false;
      }

      console.log(`Added ${creditsToAdd} credits successfully (server)`);
      return true;
    } else {
      // Client-side: Use regular supabase client (with RLS)
      const { error } = await supabase
        .from('user_credits')
        .update({
          total_credits: currentCredits.total_credits + creditsToAdd
        })
        .eq('user_id', userId);

      if (error) {
        console.error('Error adding credits (client):', error);
        return false;
      }

      console.log(`Added ${creditsToAdd} credits successfully (client)`);
      return true;
    }
  } catch (error) {
    console.error('Error in addUserCredits:', error);
    return false;
  }
}

/**
 * Reset user credits to a specific amount (for subscription renewals)
 */
export async function resetUserCredits(userId: string, newTotalCredits: number, subscriptionType: string = 'free'): Promise<boolean> {
  try {
    // Check if we're running on the server (Node.js) or client (browser)
    const isServer = typeof window === 'undefined';
    
    if (isServer) {
      // Server-side: Use service role client directly
      const serverSupabase = createServerSupabase();
      const { error } = await serverSupabase
        .from('user_credits')
        .update({
          total_credits: newTotalCredits,
          used_credits: 0,
          last_reset_date: new Date().toISOString(),
          subscription_type: subscriptionType
        })
        .eq('user_id', userId);

      if (error) {
        console.error('Error resetting credits (server):', error);
        return false;
      }

      console.log(`Credits reset to ${newTotalCredits} successfully (server)`);
      return true;
    } else {
      // Client-side: Use regular supabase client (with RLS)
      const { error } = await supabase
        .from('user_credits')
        .update({
          total_credits: newTotalCredits,
          used_credits: 0,
          last_reset_date: new Date().toISOString(),
          subscription_type: subscriptionType
        })
        .eq('user_id', userId);

      if (error) {
        console.error('Error resetting credits (client):', error);
        return false;
      }

      console.log(`Credits reset to ${newTotalCredits} successfully (client)`);
      return true;
    }
  } catch (error) {
    console.error('Error in resetUserCredits:', error);
    return false;
  }
}

/**
 * Create initial credits for a new user (fallback if trigger doesn't work)
 */
export async function createInitialCredits(userId: string): Promise<boolean> {
  try {
    // Check if we're running on the server (Node.js) or client (browser)
    const isServer = typeof window === 'undefined';
    
    if (isServer) {
      // Server-side: Use service role client directly
      const serverSupabase = createServerSupabase();
      const { error } = await serverSupabase
        .from('user_credits')
        .insert({
          user_id: userId,
          total_credits: 5,
          used_credits: 0,
          subscription_type: 'free'
        });

      if (error) {
        console.error('Error creating initial credits (server):', error);
        return false;
      }

      console.log('Initial credits created successfully (server)');
      return true;
    } else {
      // Client-side: Use regular supabase client (with RLS)
      const { error } = await supabase
        .from('user_credits')
        .insert({
          user_id: userId,
          total_credits: 5,
          used_credits: 0,
          subscription_type: 'free'
        });

      if (error) {
        console.error('Error creating initial credits (client):', error);
        return false;
      }

      console.log('Initial credits created successfully (client)');
      return true;
    }
  } catch (error) {
    console.error('Error in createInitialCredits:', error);
    return false;
  }
} 