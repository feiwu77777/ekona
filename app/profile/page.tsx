'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { useUserSessionData } from '../hooks/useUserSessionData';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';

export default function ProfilePage() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  
  const { preferences, sessionStats, recentActivity, isLoading, error } = useUserSessionData(user);

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
      />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-foreground mb-8">Ekona Account</h1>

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

              {preferences && (
                <>
                  <div className="flex justify-between items-center py-3 border-b border-border">
                    <span className="text-muted-foreground">Default Tone</span>
                    <span className="text-foreground capitalize">{preferences.default_tone}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-3 border-b border-border">
                    <span className="text-muted-foreground">Default Word Count</span>
                    <span className="text-foreground">{preferences.default_word_count} words</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-3 border-b border-border">
                    <span className="text-muted-foreground">Include Images</span>
                    <span className="text-foreground">{preferences.include_images ? 'Yes' : 'No'}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-3 border-b border-border">
                    <span className="text-muted-foreground">Include References</span>
                    <span className="text-foreground">{preferences.include_references ? 'Yes' : 'No'}</span>
                  </div>
                </>
              )}
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
          </div>

          {/* Blog Generation Stats */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold text-foreground mb-6">Blog Generation Stats</h2>
            
            {isLoading ? (
              <div className="text-center py-8">
                <div className="text-muted-foreground">Loading stats...</div>
              </div>
            ) : sessionStats ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-border">
                  <span className="text-muted-foreground">Total Blog Posts Created</span>
                  <span className="text-foreground font-semibold text-lg">
                    {sessionStats.total_blog_posts_created || 0}
                  </span>
                </div>
                
                <div className="flex justify-between items-center py-3 border-b border-border">
                  <span className="text-muted-foreground">Total Blog Posts Edited</span>
                  <span className="text-foreground">
                    {sessionStats.total_blog_posts_edited || 0}
                  </span>
                </div>
                
                <div className="flex justify-between items-center py-3 border-b border-border">
                  <span className="text-muted-foreground">Images Searched</span>
                  <span className="text-foreground">
                    {sessionStats.total_images_searched || 0}
                  </span>
                </div>
                
                <div className="flex justify-between items-center py-3 border-b border-border">
                  <span className="text-muted-foreground">References Added</span>
                  <span className="text-foreground">
                    {sessionStats.total_references_added || 0}
                  </span>
                </div>
                
                <div className="flex justify-between items-center py-3 border-b border-border">
                  <span className="text-muted-foreground">Total Sessions</span>
                  <span className="text-foreground">
                    {sessionStats.total_sessions || 0}
                  </span>
                </div>
                
                <div className="flex justify-between items-center py-3 border-b border-border">
                  <span className="text-muted-foreground">Avg Session Duration</span>
                  <span className="text-foreground">
                    {sessionStats.avg_session_duration ? 
                      `${Math.round(sessionStats.avg_session_duration / 60)} min` : 
                      'N/A'
                    }
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-muted-foreground">No stats available</div>
              </div>
            )}

            <button
              onClick={() => router.push('/blog-posts')}
              className="w-full mt-6 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              View My Blog Posts
            </button>
          </div>

          {/* Recent Activity & Help */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold text-foreground mb-6">Recent Activity & Help</h2>

            <div className="space-y-6">
              {/* Recent Activity */}
              {recentActivity && Object.keys(recentActivity).length > 0 && (
                <div>
                  <h3 className="font-semibold text-foreground mb-3">Recent Activity (7 days)</h3>
                  <div className="space-y-2">
                    {Object.entries(recentActivity).map(([activityType, data]: [string, any]) => (
                      <div key={activityType} className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground capitalize">
                          {activityType.replace(/_/g, ' ')}
                        </span>
                        <span className="text-foreground">
                          {data.total} ({data.success} success)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact Support */}
              <div>
                <h3 className="font-semibold text-foreground mb-2">Contact Support</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">support@ekona.ai</span>
                  <button
                    onClick={() => copyToClipboard('support@ekona.ai')}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
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
                      What's included in each blog generation?
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Each generation includes research, content creation, image retrieval, and reference management.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-foreground mb-2">
                      How do I edit my generated blog posts?
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      You can edit your blog posts using natural language commands in the edit interface.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-foreground mb-2">
                      Can I customize the tone of my blog posts?
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Yes, you can choose between academic, casual, or professional tones when generating content.
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