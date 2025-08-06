"use client";

import { UserProfile } from "../lib/profilesUtils";
import { Badge } from "./ui/badge";

interface SubscriptionStatusProps {
  profile: UserProfile | null;
  isLoading?: boolean;
}

export default function SubscriptionStatus({ profile, isLoading }: SubscriptionStatusProps) {
  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
          <div className="h-3 bg-muted rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const isSubscribed = profile.subscription_tier !== 'free' && profile.subscription_status === 'active';
  const isCancelling = profile.subscription_cancel_at_period_end;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusBadge = () => {
    if (profile.subscription_tier === 'free') {
      return <Badge variant="secondary">Free</Badge>;
    }
    
    switch (profile.subscription_status) {
      case 'active':
        return <Badge variant="default">{isCancelling ? 'Cancelling' : 'Active'}</Badge>;
      case 'canceled':
        return <Badge variant="destructive">Cancelled</Badge>;
      case 'past_due':
        return <Badge variant="destructive">Past Due</Badge>;
      case 'unpaid':
        return <Badge variant="destructive">Unpaid</Badge>;
      default:
        return <Badge variant="secondary">{profile.subscription_status}</Badge>;
    }
  };

  const getTierDisplayName = (tier: string) => {
    switch (tier) {
      case 'starter':
        return 'Starter';
      case 'professional':
        return 'Professional';
      case 'enterprise':
        return 'Enterprise';
      default:
        return 'Free';
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">Current Plan</h3>
        {getStatusBadge()}
      </div>
      
      <div className="space-y-1 text-sm text-muted-foreground">
        <p>
          <span className="font-medium">{getTierDisplayName(profile.subscription_tier)}</span>
          {isSubscribed && (
            <>
              {' • '}
              <span>{profile.current_period_end && formatDate(profile.current_period_end)}</span>
            </>
          )}
        </p>
        
        {/* {isCancelling && (
          <p className="text-orange-600">
            Your subscription will end on {profile.current_period_end && formatDate(profile.current_period_end)}
          </p>
        )} */}
        
        {profile.subscription_status === 'past_due' && (
          <p className="text-red-600">
            Payment is past due. Please update your payment method.
          </p>
        )}
      </div>
    </div>
  );
} 