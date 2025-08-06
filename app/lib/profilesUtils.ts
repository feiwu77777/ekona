import { supabase, createServerSupabase } from "./supabaseClient";

export interface UserProfile {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  subscription_tier: string;
  subscription_status: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  billing_cycle: string | null;
  current_period_end: string | null;
  subscription_cancel_at_period_end: boolean;
  subscription_created_at: string | null;
  last_payment_date: string | null;
  payment_status: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Get user's profile information
 */
export async function getUserProfile(
  userId: string
): Promise<UserProfile | null> {
  console.log("Getting user profile for user:", userId);
  try {
    // Check if we're running on the server (Node.js) or client (browser)
    const isServer = typeof window === "undefined";

    if (isServer) {
      const serverSupabase = createServerSupabase();
      const { data, error } = await serverSupabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error) {
        console.error("Error fetching user profile (server):", error);
        return null;
      }

      return data;
    } else {
      // Client-side: Use API endpoint
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await fetch("/api/user/profile", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session?.access_token || ""}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.error(
          "API request failed:",
          response.status,
          response.statusText
        );
        return null;
      }

      const result = await response.json();
      return result.profile;
    }
  } catch (error) {
    console.error("Error in getUserProfile:", error);
    return null;
  }
}

/**
 * Update user's profile information
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<
    Pick<
      UserProfile,
      | "full_name"
      | "avatar_url"
      | "subscription_tier"
      | "subscription_status"
      | "stripe_customer_id"
      | "stripe_subscription_id"
      | "stripe_price_id"
      | "billing_cycle"
      | "current_period_end"
      | "subscription_cancel_at_period_end"
      | "subscription_created_at"
      | "last_payment_date"
      | "payment_status"
    >
  >
): Promise<boolean> {
  try {
    // Check if we're running on the server (Node.js) or client (browser)
    const isServer = typeof window === "undefined";

    if (isServer) {
      // Server-side: Use service role client directly
      const serverSupabase = createServerSupabase();
      const { error } = await serverSupabase
        .from("profiles")
        .update(updates)
        .eq("user_id", userId);

      if (error) {
        console.error("Error updating user profile (server):", error);
        return false;
      }

      console.log("User profile updated successfully (server)");
      return true;
    } else {
      // Client-side: Use regular supabase client (with RLS)
      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("user_id", userId);

      if (error) {
        console.error("Error updating user profile (client):", error);
        return false;
      }

      console.log("User profile updated successfully (client)");
      return true;
    }
  } catch (error) {
    console.error("Error in updateUserProfile:", error);
    return false;
  }
}

/**
 * Create user profile (fallback if trigger doesn't work)
 */
export async function createUserProfile(
  userId: string,
  email: string,
  fullName?: string
): Promise<boolean> {
  try {
    // Check if we're running on the server (Node.js) or client (browser)
    const isServer = typeof window === "undefined";

    if (isServer) {
      // Server-side: Use service role client directly
      const serverSupabase = createServerSupabase();
      const { error } = await serverSupabase.from("profiles").insert({
        user_id: userId,
        email,
        full_name: fullName || "",
        subscription_tier: "free",
        subscription_status: "active",
      });

      if (error) {
        console.error("Error creating user profile (server):", error);
        return false;
      }

      console.log("User profile created successfully (server)");
      return true;
    } else {
      // Client-side: Use regular supabase client (with RLS)
      const { error } = await supabase.from("profiles").insert({
        user_id: userId,
        email,
        full_name: fullName || "",
        subscription_tier: "free",
        subscription_status: "active",
      });

      if (error) {
        console.error("Error creating user profile (client):", error);
        return false;
      }

      console.log("User profile created successfully (client)");
      return true;
    }
  } catch (error) {
    console.error("Error in createUserProfile:", error);
    return false;
  }
}

/**
 * Update user's subscription information
 */
export async function updateUserSubscription(
  userId: string,
  subscriptionTier: string,
  subscriptionStatus: string,
  stripeCustomerId?: string
): Promise<boolean> {
  try {
    // Check if we're running on the server (Node.js) or client (browser)
    const isServer = typeof window === "undefined";

    const updates: any = {
      subscription_tier: subscriptionTier,
      subscription_status: subscriptionStatus,
    };

    if (stripeCustomerId) {
      updates.stripe_customer_id = stripeCustomerId;
    }

    if (isServer) {
      // Server-side: Use service role client directly
      const serverSupabase = createServerSupabase();
      const { error } = await serverSupabase
        .from("profiles")
        .update(updates)
        .eq("user_id", userId);

      if (error) {
        console.error("Error updating user subscription (server):", error);
        return false;
      }

      console.log("User subscription updated successfully (server)");
      return true;
    } else {
      // Client-side: Use regular supabase client (with RLS)
      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("user_id", userId);

      if (error) {
        console.error("Error updating user subscription (client):", error);
        return false;
      }

      console.log("User subscription updated successfully (client)");
      return true;
    }
  } catch (error) {
    console.error("Error in updateUserSubscription:", error);
    return false;
  }
}

/**
 * Get user profile with credits information (combined query)
 */
export async function getUserProfileWithCredits(userId: string): Promise<{
  profile: UserProfile | null;
  credits: any;
} | null> {
  try {
    // Check if we're running on the server (Node.js) or client (browser)
    const isServer = typeof window === "undefined";

    if (isServer) {
      // Server-side: Use service role client directly
      const serverSupabase = createServerSupabase();
      // Get profile and credits in parallel
      const [profileResult, creditsResult] = await Promise.all([
        serverSupabase
          .from("profiles")
          .select("*")
          .eq("user_id", userId)
          .single(),
        serverSupabase
          .from("user_credits")
          .select("*")
          .eq("user_id", userId)
          .single(),
      ]);

      console.log("User profile with credits fetched (server)");
      return {
        profile: profileResult.error ? null : profileResult.data,
        credits: creditsResult.error ? null : creditsResult.data,
      };
    } else {
      // Client-side: Use API endpoints for consistency
      const { getUserProfile } = await import("./profilesUtils");
      const { getUserCredits } = await import("./creditsUtils");

      const [profile, credits] = await Promise.all([
        getUserProfile(userId),
        getUserCredits(userId),
      ]);

      console.log("User profile with credits fetched (client)");
      return {
        profile,
        credits,
      };
    }
  } catch (error) {
    console.error("Error in getUserProfileWithCredits:", error);
    return null;
  }
}
