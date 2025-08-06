"use client";

import { Button } from "./ui/button";

interface SubscriptionButtonProps {
  tier: 'starter' | 'professional' | 'enterprise';
  billingCycle: 'monthly' | 'yearly';
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  isLoading?: boolean;
}

export default function SubscriptionButton({ 
  tier, 
  billingCycle, 
  disabled = false,
  children,
  onClick,
  isLoading = false
}: SubscriptionButtonProps) {
  return (
    <div className="w-full">
      <Button
        onClick={onClick}
        disabled={disabled || isLoading}
        className="w-full"
        size="lg"
      >
        {isLoading ? 'Processing...' : children}
      </Button>
    </div>
  );
} 