// Simple in-memory rate limiting (for production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export function createRateLimiter(config: RateLimitConfig) {
  return function rateLimit(identifier: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const key = identifier;
    const current = rateLimitStore.get(key);

    if (!current || now > current.resetTime) {
      // First request or window expired
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + config.windowMs
      });
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetTime: now + config.windowMs
      };
    }

    if (current.count >= config.maxRequests) {
      // Rate limit exceeded
      return {
        allowed: false,
        remaining: 0,
        resetTime: current.resetTime
      };
    }

    // Increment count
    current.count++;
    rateLimitStore.set(key, current);

    return {
      allowed: true,
      remaining: config.maxRequests - current.count,
      resetTime: current.resetTime
    };
  };
}

// Predefined rate limiters
export const userRateLimit = createRateLimiter({
  maxRequests: 10,
  windowMs: 60 * 1000 // 1 minute
});

export const ipRateLimit = createRateLimiter({
  maxRequests: 100,
  windowMs: 60 * 1000 // 1 minute
});

export const blogGenerationRateLimit = createRateLimiter({
  maxRequests: 5,
  windowMs: 5 * 60 * 1000 // 5 minutes
});

export const editRateLimit = createRateLimiter({
  maxRequests: 20,
  windowMs: 60 * 1000 // 1 minute
});
