'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from './ui/button';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { UserCredits } from '../lib/creditsUtils';
import { UserProfile } from '../lib/profilesUtils';

interface NavBarProps {
  setIsModalOpen: (isOpen: boolean) => void;
  user: User | null;
  isAuthLoading: boolean;
  credits?: UserCredits | null;
  creditsLoading?: boolean;
  profile?: UserProfile | null;
  profileLoading?: boolean;
}

export default function NavBar({ setIsModalOpen, user, isAuthLoading, credits, creditsLoading, profile, profileLoading }: NavBarProps) {
  const pathname = usePathname();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleSignInClick = async () => {
    setIsModalOpen(true);
  };

  const handleNavClick = async (destination: string) => {
  };

  return (
    <nav className="bg-background shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex-shrink-0" onClick={() => handleNavClick('home_logo')}>
              <div className="flex flex-col">
                <span className="font-bold text-xl">Ekona</span>
                <span className="text-xs text-gray-500">AI Blog Generator</span>
              </div>
            </Link>
            <div className="hidden md:flex space-x-8">
              <Link 
                href="/" 
                className={`transition-colors ${
                  pathname === "/" 
                    ? "font-semibold text-foreground" 
                    : "text-muted-foreground hover:text-primary"
                }`}
                onClick={() => handleNavClick('home')}
              >
                Home
              </Link>
              {user && (
                <Link 
                  href="/blog-posts" 
                  className={`transition-colors ${
                    pathname === "/blog-posts" 
                      ? "font-semibold text-foreground" 
                      : "text-muted-foreground hover:text-primary"
                  }`}
                  onClick={() => handleNavClick('blog_posts')}
                >
                  My Blog Posts
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {isAuthLoading ? (
              <div className="text-sm text-muted-foreground">Loading...</div>
            ) : user ? (
              <>
                {credits && (
                  <div className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
                    {creditsLoading ? (
                      'Loading credits...'
                    ) : (
                      <>
                        <span className="font-semibold text-foreground">{credits.remaining_credits}</span>
                        {' credits remaining'}
                      </>
                    )}
                  </div>
                )}
                <Link 
                  href="/profile" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => handleNavClick('profile')}
                >
                  {profile?.full_name || user.email}
                </Link>
                <Button variant="outline" onClick={handleSignOut}>
                  Sign Out
                </Button>
              </>
            ) : (
              <Button onClick={handleSignInClick}>
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 