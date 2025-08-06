'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { useUserData } from '../hooks/useUserData';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import SignInModal from '../components/SignInModal';

export default function ProfilePage() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  
  const { profile, credits, isProfileLoading, isCreditsLoading } = useUserData(user);

  // Authentication useEffect
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsAuthLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  // TODO: Implement account deletion logic in the future
  // const handleDeleteAccount = () => {
  //   if (confirm('This action will permanently delete your account and all associated data. This cannot be undone.')) {
  //     console.log('Delete account logic to be implemented');
  //   }
  // };

  const handlePurchaseCredits = () => {
    router.push('/pricing');
  };

  const handleManageSubscription = async () => {
    if (!user) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        console.error('No access token available');
        return;
      }

      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          returnUrl: `${window.location.origin}/profile`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create portal session');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Error managing subscription:', error);
      alert('Failed to open subscription management. Please try again.');
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar 
          setIsModalOpen={setIsModalOpen}
          user={user}
          isAuthLoading={isAuthLoading}
          credits={credits}
          creditsLoading={isCreditsLoading}
          profile={profile}
          profileLoading={isProfileLoading}
        />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-lg text-muted-foreground">Loading...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar 
          setIsModalOpen={setIsModalOpen}
          user={user}
          isAuthLoading={isAuthLoading}
          credits={credits}
          creditsLoading={isCreditsLoading}
          profile={profile}
          profileLoading={isProfileLoading}
        />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-lg text-muted-foreground">Please sign in to view your profile.</div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar 
        setIsModalOpen={setIsModalOpen}
        user={user}
        isAuthLoading={isAuthLoading}
        credits={credits}
        creditsLoading={isCreditsLoading}
        profile={profile}
        profileLoading={isProfileLoading}
      />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-foreground mb-8">Account & Billing</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* My Profile Section */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold text-foreground mb-6">My Profile</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-border">
                <span className="text-muted-foreground">Email</span>
                <span className="text-foreground">{user.email}</span>
              </div>
              
              <div className="flex justify-between items-center py-3 border-b border-border">
                <span className="text-muted-foreground">Account Created</span>
                <span className="text-foreground">
                  {new Date(user.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="w-full mt-6 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors flex items-center justify-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Sign Out</span>
            </button>

            {/* Danger Zone - Commented out for future implementation */}
            {/* <div className="mt-8 pt-6 border-t border-destructive/20">
              <h3 className="text-destructive font-semibold mb-3">Danger Zone</h3>
              <p className="text-sm text-muted-foreground mb-4">
                This action will permanently delete your account and all associated data. This cannot be undone.
              </p>
              <button
                onClick={handleDeleteAccount}
                className="w-full px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors"
              >
                Delete Account
              </button>
            </div> */}
          </div>

          {/* Credits Section */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-foreground">Credits</h2>
              <button className="text-muted-foreground hover:text-foreground">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-border">
                <span className="text-muted-foreground">Available Credits</span>
                <span className="text-foreground font-semibold text-lg">
                  {isCreditsLoading ? 'Loading...' : credits?.remaining_credits || 0}
                </span>
              </div>
              
              {profile?.subscription_tier !== 'free' && (
                <div className="flex justify-between items-center py-3 border-b border-border">
                  <span className="text-muted-foreground">Credits allowance</span>
                  <span className="text-foreground">
                    {profile?.subscription_tier === 'starter' ? '30' :
                     profile?.subscription_tier === 'professional' ? '120' :
                     profile?.subscription_tier === 'enterprise' ? '500' : 'N/A'} per month
                  </span>
                </div>
              )}
              
              <div className="flex justify-between items-center py-3 border-b border-border">
                <span className="text-muted-foreground">Last Update</span>
                <span className="text-foreground">
                  {credits?.last_reset_date 
                    ? new Date(credits.last_reset_date).toLocaleDateString()
                    : 'N/A'
                  }
                </span>
              </div>

              {profile?.subscription_tier !== 'free' && profile?.current_period_end && (
                <div className="flex justify-between items-center py-3 border-b border-border">
                  <span className="text-muted-foreground">Next Reset</span>
                  <span className="text-foreground">
                    {new Date(profile.current_period_end).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={handlePurchaseCredits}
              className="w-full mt-6 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              {profile?.subscription_tier === 'free' ? 'Get More Credits' : 'Upgrade Plan'}
            </button>

            {/* Subscription Section */}
            <div className="mt-8 pt-6 border-t border-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Subscription</h3>
                <button className="text-muted-foreground hover:text-foreground">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>

              {isProfileLoading ? (
                <div className="text-sm text-muted-foreground">Loading subscription details...</div>
              ) : (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Status</span>
                    <div className="flex items-center space-x-2">
                      <span className={`text-foreground capitalize ${
                        profile?.subscription_status === 'active' ? 'text-green-600' :
                        profile?.subscription_status === 'cancelled' ? 'text-red-600' :
                        profile?.subscription_status === 'past_due' ? 'text-yellow-600' :
                        'text-muted-foreground'
                      }`}>
                        {profile?.subscription_status || 'free'}
                      </span>
                      {profile?.subscription_cancel_at_period_end && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                          Cancelling
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Plan</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-foreground capitalize">
                        {profile?.subscription_tier || 'Free'}
                      </span>
                      {profile?.billing_cycle && (
                        <span className="text-xs bg-muted px-2 py-1 rounded">
                          {profile.billing_cycle}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {profile?.subscription_tier !== 'free' && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Credits per cycle</span>
                        <span className="text-foreground">
                          {profile?.subscription_tier === 'starter' ? '30' :
                           profile?.subscription_tier === 'professional' ? '120' :
                           profile?.subscription_tier === 'enterprise' ? '500' : 'N/A'} / month
                        </span>
                      </div>
                      
                      {profile?.current_period_end && (
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">
                            {profile?.subscription_cancel_at_period_end ? 'Expires on' : 'Next billing date'}
                          </span>
                          <span className="text-foreground">
                            {new Date(profile.current_period_end).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      
                      {profile?.subscription_created_at && (
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Subscribed since</span>
                          <span className="text-foreground">
                            {new Date(profile.subscription_created_at).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {profile?.subscription_tier !== 'free' && profile?.subscription_status === 'active' ? (
                <button
                  onClick={handleManageSubscription}
                  className="w-full mt-4 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
                >
                  Manage Subscription
                </button>
              ) : (
                <button
                  onClick={() => router.push('/pricing')}
                  className="w-full mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  Subscribe Now
                </button>
              )}
            </div>
          </div>

          {/* Help & Support Section */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold text-foreground mb-6">Help & Support</h2>

            <div className="space-y-6">
              {/* Billing Updates */}
              <div>
                <h3 className="font-semibold text-foreground mb-2">Billing Updates</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Billing updates may take a few minutes to reflect. Refresh the page to see the latest information.
                </p>
              </div>

              {/* Contact Support */}
              <div>
                <h3 className="font-semibold text-foreground mb-2">Contact Support</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">support@resume-tailor.com</span>
                  <button
                    onClick={() => copyToClipboard('support@resume-tailor.com')}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* FAQ */}
              <div className="pt-4 border-t border-border">
                <h3 className="font-semibold text-foreground mb-4">FAQ</h3>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-foreground mb-2">
                      How does the annual subscription work?
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Annual subscription runs for 12 consecutive months. Credits are renewed monthly at 00:00 UTC on your billing date.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-foreground mb-2">
                      When will my subscription renew?
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Your subscription automatically renews at the end of each billing cycle unless canceled.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 