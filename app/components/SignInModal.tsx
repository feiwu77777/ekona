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
import { getOrCreateUserId } from '../lib/userIdUtils';

interface SignInModalProps {
  isModalOpen: boolean;
  setIsModalOpen: (isOpen: boolean) => void;
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
    } else {
      setMessage('Check your email (spam folder included) for the login link!');
      setEmail('');
    }
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sign In</DialogTitle>
          <DialogDescription>
            Sign in to access all features. No password required!
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col space-y-4">
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