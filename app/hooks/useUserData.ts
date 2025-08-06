import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { getUserCredits, UserCredits } from '../lib/creditsUtils';
import { getUserProfile, UserProfile } from '../lib/profilesUtils';

export function useUserData(user: User | null) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isCreditsLoading, setIsCreditsLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [creditsError, setCreditsError] = useState<string | null>(null);

  const refreshData = async () => {
    if (!user) {
      setProfile(null);
      setCredits(null);
      return;
    }

    setIsProfileLoading(true);
    setIsCreditsLoading(true);
    setProfileError(null);
    setCreditsError(null);

    try {
      // Fetch profile and credits in parallel
      const [userProfile, userCredits] = await Promise.all([
        getUserProfile(user.id),
        getUserCredits(user.id)
      ]);

      setProfile(userProfile);
      setCredits(userCredits);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load user data';
      setProfileError(errorMessage);
      setCreditsError(errorMessage);
      console.error('Error fetching user data:', err);
    } finally {
      setIsProfileLoading(false);
      setIsCreditsLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (!user) {
      setProfile(null);
      return;
    }

    setIsProfileLoading(true);
    setProfileError(null);

    try {
      const userProfile = await getUserProfile(user.id);
      setProfile(userProfile);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Failed to load profile');
      console.error('Error fetching profile:', err);
    } finally {
      setIsProfileLoading(false);
    }
  };

  const refreshCredits = async () => {
    if (!user) {
      setCredits(null);
      return;
    }

    setIsCreditsLoading(true);
    setCreditsError(null);

    try {
      const userCredits = await getUserCredits(user.id);
      setCredits(userCredits);
    } catch (err) {
      setCreditsError(err instanceof Error ? err.message : 'Failed to load credits');
      console.error('Error fetching credits:', err);
    } finally {
      setIsCreditsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, [user]);

  return {
    profile,
    credits,
    isProfileLoading,
    isCreditsLoading,
    profileError,
    creditsError,
    refreshData,
    refreshProfile,
    refreshCredits,
    // Legacy support for existing code
    isLoading: isCreditsLoading // For backwards compatibility with useCredits
  };
} 