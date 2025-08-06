import Stripe from 'stripe';

// Initialize Stripe with secret key
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
});

// Stripe price configuration
export const STRIPE_PRICES = {
  starter: {
    monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY!,
    yearly: process.env.STRIPE_PRICE_STARTER_YEARLY!,
  },
  professional: {
    monthly: process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY!,
    yearly: process.env.STRIPE_PRICE_PROFESSIONAL_YEARLY!,
  },
  enterprise: {
    monthly: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY!,
    yearly: process.env.STRIPE_PRICE_ENTERPRISE_YEARLY!,
  },
};

// Credit mapping for each tier
export const CREDIT_MAPPING = {
  starter: { monthly: 30, yearly: 30 },
  professional: { monthly: 120, yearly: 120 },
  enterprise: { monthly: 500, yearly: 500 },
};

// Plan information
export const PLAN_INFO = {
  starter: {
    name: 'Starter',
    description: '30 credits per month with essential features',
    features: [
      'AI-generated cover letters',
      'Generate answer for custom questions',
      'PDF export with fallback options',
    ],
  },
  professional: {
    name: 'Professional',
    description: '120 credits per month with priority support',
    features: [
      'AI-generated cover letters',
      'Generate answer for custom questions',
      'PDF export with fallback options',
      'Priority support',
    ],
  },
  enterprise: {
    name: 'Enterprise',
    description: '500 credits per month with premium features',
    features: [
      'AI-generated cover letters',
      'Generate answer for custom questions',
      'PDF export with fallback options',
      'Priority support',
      'Advanced analytics',
    ],
  },
};

// Helper function to get price ID from tier and billing cycle
export function getPriceId(tier: keyof typeof STRIPE_PRICES, billingCycle: 'monthly' | 'yearly'): string {
  return STRIPE_PRICES[tier][billingCycle];
}

// Helper function to get credits for a tier
export function getCreditsForTier(tier: keyof typeof CREDIT_MAPPING, billingCycle: 'monthly' | 'yearly'): number {
  return CREDIT_MAPPING[tier][billingCycle];
}

// Helper function to extract tier from Stripe price ID
export function getTierFromPriceId(priceId: string): keyof typeof STRIPE_PRICES | null {
  for (const [tier, prices] of Object.entries(STRIPE_PRICES)) {
    if (prices.monthly === priceId || prices.yearly === priceId) {
      return tier as keyof typeof STRIPE_PRICES;
    }
  }
  return null;
}

// Helper function to determine billing cycle from price ID
export function getBillingCycleFromPriceId(priceId: string): 'monthly' | 'yearly' | null {
  for (const tier of Object.values(STRIPE_PRICES)) {
    if (tier.monthly === priceId) return 'monthly';
    if (tier.yearly === priceId) return 'yearly';
  }
  return null;
} 