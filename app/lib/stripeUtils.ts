import { stripe } from './stripe';
import { getUserProfile, updateUserProfile } from './profilesUtils';
import { resetUserCredits } from './creditsUtils';
import { getCreditsForTier, getTierFromPriceId, getBillingCycleFromPriceId } from './stripe';

/**
 * Create or retrieve Stripe customer
 */
export async function createOrGetStripeCustomer(userId: string, email: string, name?: string): Promise<string> {
  try {
    // First check if user already has a Stripe customer ID
    const profile = await getUserProfile(userId);
    if (profile?.stripe_customer_id) {
      return profile.stripe_customer_id;
    }

    // Create new Stripe customer
    const customer = await stripe.customers.create({
      email,
      name: name || undefined,
      metadata: {
        user_id: userId,
      },
    });

    // Update user profile with Stripe customer ID
    await updateUserProfile(userId, {
      stripe_customer_id: customer.id,
    });

    return customer.id;
  } catch (error) {
    console.error('Error creating/getting Stripe customer:', error);
    throw error;
  }
}

/**
 * Check if user has active subscription
 */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  try {
    const profile = await getUserProfile(userId);
    
    // Check database first
    if (profile?.stripe_subscription_id && 
        profile?.subscription_status && 
        ['active', 'trialing', 'past_due'].includes(profile.subscription_status)) {
      return true;
    }

    // Double-check with Stripe if we have a customer ID
    if (profile?.stripe_customer_id) {
      const subscriptions = await stripe.subscriptions.list({
        customer: profile.stripe_customer_id,
        status: 'all',
        limit: 10,
      });

      const activeSubscriptions = subscriptions.data.filter(sub => 
        ['active', 'trialing', 'past_due'].includes(sub.status)
      );

      return activeSubscriptions.length > 0;
    }

    return false;
  } catch (error) {
    console.error('Error checking active subscription:', error);
    return false;
  }
}

/**
 * Update existing subscription to new plan
 */
export async function updateSubscriptionPlan(
  userId: string,
  newPriceId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const profile = await getUserProfile(userId);
    if (!profile?.stripe_subscription_id) {
      return { success: false, error: 'No active subscription found' };
    }

    // Get current subscription
    const subscription = await stripe.subscriptions.retrieve(profile.stripe_subscription_id);
    if (!subscription || !['active', 'trialing', 'past_due'].includes(subscription.status)) {
      return { success: false, error: 'No active subscription found' };
    }

    // Get the subscription item to update
    const subscriptionItem = subscription.items.data[0];
    if (!subscriptionItem) {
      return { success: false, error: 'No subscription items found' };
    }

    // Update the subscription with new price
    const updatedSubscription = await stripe.subscriptions.update(subscription.id, {
      items: [{
        id: subscriptionItem.id,
        price: newPriceId,
      }],
      proration_behavior: 'always_invoice', // Immediate prorated billing
    });

    // Process the subscription update through our webhook handler
    await handleSubscriptionUpdate(updatedSubscription);

    return { success: true };
  } catch (error) {
    console.error('Error updating subscription plan:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update subscription' 
    };
  }
}

/**
 * Create Stripe Checkout session for subscription
 */
export async function createCheckoutSession(
  userId: string,
  email: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string,
  customerName?: string
): Promise<string> {
  try {
    // Check if user already has an active subscription
    const hasActive = await hasActiveSubscription(userId);
    if (hasActive) {
      // Instead of blocking, try to update the existing subscription
      console.log(`User ${userId} has active subscription, attempting plan change to ${priceId}`);
      
      const updateResult = await updateSubscriptionPlan(userId, priceId);
      if (updateResult.success) {
        // Return a special session ID that indicates immediate success
        return 'immediate_update_success';
      } else {
        throw new Error(updateResult.error || 'Failed to update existing subscription. Please manage your subscription through the billing portal.');
      }
    }

    // Get or create Stripe customer
    const customerId = await createOrGetStripeCustomer(userId, email, customerName);

    // Create checkout session with duplicate prevention
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        user_id: userId,
      },
      subscription_data: {
        metadata: {
          user_id: userId,
        },
        // Prevent multiple subscriptions for the same customer
        trial_settings: {
          end_behavior: {
            missing_payment_method: 'cancel',
          },
        },
      },
      allow_promotion_codes: true,
      // Add client reference ID to help identify duplicate attempts
      client_reference_id: `${userId}_${Date.now()}`,
      // Expire the session after 24 hours to prevent stale sessions
      expires_at: Math.floor(Date.now() / 1000) + (24 * 60 * 60),
    });

    return session.id;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

/**
 * Create Stripe Customer Portal session
 */
export async function createPortalSession(userId: string, returnUrl: string): Promise<string> {
  try {
    const profile = await getUserProfile(userId);
    if (!profile?.stripe_customer_id) {
      throw new Error('No Stripe customer found for user');
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: returnUrl,
    });

    return session.url;
  } catch (error) {
    console.error('Error creating portal session:', error);
    throw error;
  }
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(userId: string, cancelAtPeriodEnd: boolean = true): Promise<boolean> {
  try {
    const profile = await getUserProfile(userId);
    if (!profile?.stripe_subscription_id) {
      throw new Error('No active subscription found for user');
    }

    await stripe.subscriptions.update(profile.stripe_subscription_id, {
      cancel_at_period_end: cancelAtPeriodEnd,
    });

    // Update user profile
    await updateUserProfile(userId, {
      subscription_cancel_at_period_end: cancelAtPeriodEnd,
    });

    return true;
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }
}

/**
 * Handle successful subscription creation/update
 */
export async function handleSubscriptionUpdate(subscription: any): Promise<boolean> {
  console.log('========== handleSubscriptionUpdate');
  console.log('Subscription ID:', subscription.id, 'Status:', subscription.status);
  
  try {
    const userId = subscription.metadata?.user_id;
    if (!userId) {
      console.error('No user_id in subscription metadata');
      return false;
    }

    // Check if this subscription is already processed to avoid double processing
    const existingProfile = await getUserProfile(userId);
    
    // Get price ID to check for plan changes
    const priceId = subscription.items?.data?.[0]?.price?.id || subscription.plan?.id;
    
    if (existingProfile?.stripe_subscription_id === subscription.id && 
        existingProfile?.subscription_status === subscription.status &&
        existingProfile?.stripe_price_id === priceId) {
      console.log('Subscription already processed with same status and price, skipping');
      return true;
    }

    // Get price ID - handle both new and legacy subscription structures (already declared above)
    if (!priceId) {
      console.error('No price ID found in subscription items or plan');
      console.error('Subscription structure:', {
        hasItems: !!subscription.items,
        itemsData: subscription.items?.data?.length || 0,
        hasPlan: !!subscription.plan,
        planId: subscription.plan?.id
      });
      return false;
    }

    console.log('Processing subscription with price ID:', priceId);

    // Get tier and billing cycle from price ID
    const tier = getTierFromPriceId(priceId);
    const billingCycle = getBillingCycleFromPriceId(priceId);

    console.log('Mapped tier:', tier, 'billing cycle:', billingCycle);

    if (!tier || !billingCycle) {
      console.error('Could not determine tier or billing cycle from price ID:', priceId);
      console.error('Available price mappings:', process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY);
      return false;
    }

    // Get credits for this tier
    const credits = getCreditsForTier(tier, billingCycle);

    // Update user profile with comprehensive subscription data
    const profileUpdates: any = {
      stripe_subscription_id: subscription.id,
      stripe_price_id: priceId,
      subscription_tier: tier,
      subscription_status: subscription.status,
      billing_cycle: billingCycle,
      subscription_cancel_at_period_end: subscription.cancel_at_period_end || false,
      payment_status: subscription.status === 'active' ? 'current' : subscription.status,
    };

    // Set subscription creation date (only for new subscriptions)
    if (!existingProfile?.subscription_created_at && subscription.created) {
      profileUpdates.subscription_created_at = new Date(subscription.created * 1000).toISOString();
    }

    // Set current period end if available
    if (subscription.current_period_end) {
      try {
        profileUpdates.current_period_end = new Date(subscription.current_period_end * 1000).toISOString();
      } catch (error) {
        console.error('Invalid current_period_end value:', subscription.current_period_end);
        profileUpdates.current_period_end = null;
      }
    } else {
      console.log('No current_period_end found in subscription, setting to null');
      profileUpdates.current_period_end = null;
    }

    // Set last payment date to now for successful subscriptions
    if (subscription.status === 'active' || subscription.status === 'trialing') {
      profileUpdates.last_payment_date = new Date().toISOString();
    }

    await updateUserProfile(userId, profileUpdates);

    // Reset credits in these scenarios:
    // 1. New subscription (no existing subscription_created_at)
    // 2. New billing period (current_period_end moved forward)  
    // 3. Plan change (different tier or price_id)
    const isNewSubscription = !existingProfile?.subscription_created_at;
    const isNewPeriod = existingProfile?.current_period_end && subscription.current_period_end && 
                       new Date(subscription.current_period_end * 1000) > new Date(existingProfile.current_period_end);
    const isPlanChange = existingProfile?.stripe_price_id && 
                        existingProfile.stripe_price_id !== priceId;
    
    const shouldResetCredits = isNewSubscription || isNewPeriod || isPlanChange;
    
    if (shouldResetCredits) {
      const reason = isNewSubscription ? 'new subscription' : 
                    isNewPeriod ? 'new billing period' : 
                    isPlanChange ? 'plan change' : 'unknown';
      console.log(`Resetting credits for user ${userId} - Reason: ${reason}`);
      await resetUserCredits(userId, credits, tier);
    } else {
      console.log(`Skipping credit reset for user ${userId} - Same period and plan`);
    }

    return true;
  } catch (error) {
    console.error('Error handling subscription update:', error);
    return false;
  }
}

/**
 * Handle subscription deletion
 */
export async function handleSubscriptionDeleted(subscription: any): Promise<boolean> {
  try {
    const userId = subscription.metadata?.user_id;
    if (!userId) {
      console.error('No user_id in subscription metadata');
      return false;
    }

    // Update user profile to free tier and clear subscription data
    await updateUserProfile(userId, {
      stripe_subscription_id: null,
      stripe_price_id: null,
      subscription_tier: 'free',
      subscription_status: 'cancelled',
      billing_cycle: null,
      current_period_end: null,
      subscription_cancel_at_period_end: false,
      payment_status: 'cancelled',
    });

    // Reset credits to 0 (they'll need to manually add credits or resubscribe)
    await resetUserCredits(userId, 0, 'free');

    return true;
  } catch (error) {
    console.error('Error handling subscription deletion:', error);
    return false;
  }
}

/**
 * Handle successful payment
 */
export async function handlePaymentSucceeded(invoice: any): Promise<boolean> {
  try {
    const subscriptionId = invoice.subscription;
    if (!subscriptionId) {
      return true; // Not a subscription payment
    }

    // Get subscription details and update profile
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const result = await handleSubscriptionUpdate(subscription);

    // Update last payment date for successful payments
    if (result && subscription.metadata?.user_id) {
      // Check if this is a renewal (not initial subscription)
      const existingProfile = await getUserProfile(subscription.metadata.user_id);
      const isRenewal = existingProfile?.subscription_created_at && 
                       existingProfile?.last_payment_date;
      
      console.log(`${isRenewal ? 'Renewal' : 'Initial'} payment succeeded for user ${subscription.metadata.user_id}`);
      
      await updateUserProfile(subscription.metadata.user_id, {
        last_payment_date: new Date().toISOString(),
        payment_status: 'current',
      });
      
      if (isRenewal) {
        console.log(`Credits replenished for renewal - User: ${subscription.metadata.user_id}`);
      }
    }

    return result;
  } catch (error) {
    console.error('Error handling payment succeeded:', error);
    return false;
  }
}

/**
 * Handle failed payment
 */
export async function handlePaymentFailed(invoice: any): Promise<boolean> {
  try {
    const subscriptionId = invoice.subscription;
    if (!subscriptionId) {
      return true; // Not a subscription payment
    }

    // Get subscription details
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const userId = subscription.metadata?.user_id;
    
    if (!userId) {
      console.error('No user_id in subscription metadata for failed payment');
      return false;
    }

    // Update payment status to reflect failure
    await updateUserProfile(userId, {
      payment_status: 'past_due',
      subscription_status: subscription.status, // Could be 'past_due' or 'unpaid'
    });

    console.log(`Payment failed for user ${userId}, status updated to past_due`);
    return true;
  } catch (error) {
    console.error('Error handling payment failed:', error);
    return false;
  }
}

/**
 * Get subscription details for a user
 */
export async function getUserSubscription(userId: string): Promise<any> {
  try {
    const profile = await getUserProfile(userId);
    if (!profile?.stripe_subscription_id) {
      return null;
    }

    const subscription = await stripe.subscriptions.retrieve(profile.stripe_subscription_id);
    return subscription;
  } catch (error) {
    console.error('Error getting user subscription:', error);
    return null;
  }
} 