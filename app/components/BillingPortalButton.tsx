"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { supabase } from "../lib/supabaseClient";

interface BillingPortalButtonProps {
  disabled?: boolean;
  children: React.ReactNode;
}

export default function BillingPortalButton({ 
  disabled = false,
  children 
}: BillingPortalButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpenPortal = async () => {
    if (disabled) return;
    
    setIsLoading(true);
    setError(null);

    try {
      // Get current session for auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError('Please sign in to manage billing');
        return;
      }

      // Create portal session
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create portal session');
      }

      // Redirect to Stripe Customer Portal
      window.location.href = data.url;

    } catch (err) {
      console.error('Portal error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <Button
        onClick={handleOpenPortal}
        disabled={disabled || isLoading}
        variant="outline"
        className="w-full"
        size="lg"
      >
        {isLoading ? 'Opening portal...' : children}
      </Button>
      {error && (
        <p className="text-sm text-red-600 mt-2 text-center">
          {error}
        </p>
      )}
    </div>
  );
} 