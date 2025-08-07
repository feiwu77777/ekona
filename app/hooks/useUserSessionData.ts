import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { UserPreferences } from '@/supabase_SQL/database.types';

export function useUserSessionData(user: User | null) {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [sessionStats, setSessionStats] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshData = async () => {
    if (!user) {
      setPreferences(null);
      setSessionStats(null);
      setRecentActivity(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get access token for API calls
      const { data: { session } } = await import('../lib/supabaseClient').then(m => m.supabase.auth.getSession());
      
      if (!session?.access_token) {
        throw new Error('No access token available');
      }

      const headers = {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      };

      // Fetch all data in parallel
      const [preferencesResponse, statsResponse, activityResponse] = await Promise.all([
        fetch('/api/user/preferences', { headers }).catch(() => ({ ok: false, json: () => null })),
        fetch('/api/user/stats?type=session', { headers }).catch(() => ({ ok: false, json: () => null })),
        fetch('/api/user/stats?type=recent', { headers }).catch(() => ({ ok: false, json: () => null }))
      ]);

      // Handle preferences
      if (preferencesResponse.ok) {
        const data = await preferencesResponse.json();
        setPreferences(data.preferences);
      }

      // Handle session stats
      if (statsResponse.ok) {
        const data = await statsResponse.json();
        setSessionStats(data.stats);
      }

      // Handle recent activity
      if (activityResponse.ok) {
        const data = await activityResponse.json();
        setRecentActivity(data.stats);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load user data';
      setError(errorMessage);
      console.error('Error fetching user session data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreferences = async (newPreferences: Partial<UserPreferences>) => {
    if (!user) return;

    try {
      const { data: { session } } = await import('../lib/supabaseClient').then(m => m.supabase.auth.getSession());
      
      if (!session?.access_token) {
        throw new Error('No access token available');
      }

      const response = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newPreferences)
      });

      if (!response.ok) {
        throw new Error('Failed to update preferences');
      }

      // Refresh preferences after update
      await refreshData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update preferences';
      setError(errorMessage);
      console.error('Error updating preferences:', err);
      throw err;
    }
  };

  useEffect(() => {
    refreshData();
  }, [user]);

  return {
    preferences,
    sessionStats,
    recentActivity,
    isLoading,
    error,
    refreshData,
    updatePreferences
  };
}
