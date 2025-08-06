'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { logEvent } from '../lib/eventUtils';
import { getOrCreateUserId } from '../lib/userIdUtils';

interface SignInModalProps {
  isModalOpen: boolean;
  setIsModalOpen: (isOpen: boolean) => void;
}

// Helper to send Web3Forms notification
async function sendWeb3FormsNotification({ email, method }: { email: string; method: string }) {
  const WEB3FORMS_ACCESS_KEY = process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY || ''; // TODO: Replace with your actual access key
  const formData = new FormData();
  formData.append('access_key', WEB3FORMS_ACCESS_KEY);
  formData.append('subject', 'New User Sign In Notification');
  formData.append('from_name', 'Resume Tailor');
  formData.append('email', 'no-reply@resumetailor.com'); // Sender email (can be anything for Web3Forms)
  formData.append('message', `A user signed in via ${method}.\nEmail: ${email}`);

  console.log('Sending Web3Forms notification:', formData);

  try {
    await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      body: formData,
    });
  } catch (err) {
    // Silently fail, do not block user
    // Optionally log error
    console.error('Web3Forms notification error:', err);
  }
}

export default function SignInModal({ isModalOpen, setIsModalOpen }: SignInModalProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    // Log the email sign-in attempt
    const userId = getOrCreateUserId();
    await logEvent({
      name: 'email_sign_in_clicked',
      category: 'auth',
      user_id: userId
    });

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}`,
      },
    });

    setIsLoading(false);

    if (error) {
      setError(error.message);
      // Log the error
      await logEvent({
        name: 'email_sign_in_error',
        category: 'auth',
        user_id: userId,
        is_error: true,
        error_message: error.message
      });
    } else {
      setMessage('Check your email (spam folder included) for the login link!');
      setEmail('');
      // Log the success
      await logEvent({
        name: 'email_sign_in_link_sent',
        category: 'auth',
        user_id: userId
      });
      // Send Web3Forms notification
      await sendWeb3FormsNotification({ email, method: 'Email Link' });
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');

    // Log the Google sign-in attempt
    const userId = getOrCreateUserId();
    await logEvent({
      name: 'google_sign_in_clicked',
      category: 'auth',
      user_id: userId
    });

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}`,
      },
    });
    if (error) {
      setError(error.message);
      // Log the error
      await logEvent({
        name: 'google_sign_in_error',
        category: 'auth',
        user_id: userId,
        is_error: true,
        error_message: error.message
      });
    } else {
      // Send Web3Forms notification (Google sign-in doesn't provide email directly, so use the input email if available)
      await sendWeb3FormsNotification({ email: email || 'Google User', method: 'Google OAuth' });
    }
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sign In</DialogTitle>
          <DialogDescription>
            Sign in to tailor your resume and access all features. No password required!
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col space-y-4">
          <Button id='google-sign-in-button' onClick={handleGoogleSignIn} variant="outline" className="w-full">
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              className="mr-2"
            >
              <path 
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" 
                fill="#4285F4" 
              />
              <path 
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" 
                fill="#34A853" 
              />
              <path 
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" 
                fill="#FBBC05" 
              />
              <path 
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" 
                fill="#EA4335" 
              />
            </svg>
            Sign In with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                required
              />
            </div>

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            {message && <p className="text-green-500 text-sm text-center">{message}</p>}

            <DialogFooter className="pt-2">
              <Button id='login-link-button' type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Sending...' : 'Send Login Link'}
              </Button>
            </DialogFooter>
          </form>

          <p className="text-xs text-muted-foreground text-center">
            We'll send you a secure login link - no password needed!
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
} 