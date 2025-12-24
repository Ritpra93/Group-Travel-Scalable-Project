import rateLimit from 'express-rate-limit';
import { getRedisClient } from '../config/redis';
import { TooManyRequestsError } from '../common/utils/errors';

/**
 * Create a rate limiter using Redis store
 *
 * @param windowMs - Time window in milliseconds
 * @param max - Maximum number of requests per window
 * @param message - Error message when limit is exceeded
 * @returns Rate limit middleware
 */
function createRateLimiter(
  windowMs: number,
  max: number,
  message: string = 'Too many requests'
) {
  return rateLimit({
    windowMs,
    max,
    message,
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
    // Use Redis for distributed rate limiting (optional but recommended for production)
    // For now, using in-memory store (simple for MVP)
    handler: (req, res) => {
      throw new TooManyRequestsError(message);
    },
  });
}

/**
 * Rate limiter for authentication endpoints
 * 5 requests per 15 minutes
 */
export const authRateLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  5,
  'Too many authentication attempts. Please try again later.'
);

/**
 * Rate limiter for general API endpoints
 * 100 requests per 15 minutes per IP
 */
export const apiRateLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  100,
  'Too many requests. Please try again later.'
);

/**
 * Rate limiter for password reset endpoints
 * 3 requests per hour
 */
export const passwordResetRateLimiter = createRateLimiter(
  60 * 60 * 1000, // 1 hour
  3,
  'Too many password reset attempts. Please try again later.'
);

/**
 * Rate limiter for invitation endpoints
 * 10 invitations per hour per user
 */
export const invitationRateLimiter = createRateLimiter(
  60 * 60 * 1000, // 1 hour
  10,
  'Too many invitation requests. Please try again later.'
);

/**
 * Advanced Redis-based rate limiter (for production)
 *
 * Uses sliding window algorithm for more accurate rate limiting
 * This is more complex but provides better UX
 */
export class RedisRateLimiter {
  constructor(
    private readonly windowMs: number,
    private readonly maxRequests: number
  ) {}

  /**
   * Check if request should be rate limited
   *
   * @param key - Unique identifier for the client (e.g., user ID or IP)
   * @returns true if request is allowed, false if rate limited
   */
  async checkLimit(key: string): Promise<boolean> {
    const redis = await getRedisClient();
    const now = Date.now();
    const windowStart = now - this.windowMs;

    const rateLimitKey = `ratelimit:${key}`;

    // Use Redis sorted set for sliding window
    const multi = redis.multi();

    // Remove old entries outside the window
    multi.zRemRangeByScore(rateLimitKey, 0, windowStart);

    // Count requests in current window
    multi.zCard(rateLimitKey);

    // Add current request
    multi.zAdd(rateLimitKey, { score: now, value: `${now}` });

    // Set expiry on the key
    multi.expire(rateLimitKey, Math.ceil(this.windowMs / 1000));

    const results = await multi.exec();

    // Get count from the results (index 1)
    const count = results?.[1] as number;

    return count < this.maxRequests;
  }

  /**
   * Get remaining requests for a key
   *
   * @param key - Unique identifier for the client
   * @returns Number of remaining requests
   */
  async getRemaining(key: string): Promise<number> {
    const redis = await getRedisClient();
    const now = Date.now();
    const windowStart = now - this.windowMs;

    const rateLimitKey = `ratelimit:${key}`;

    // Clean up and count
    await redis.zRemRangeByScore(rateLimitKey, 0, windowStart);
    const count = await redis.zCard(rateLimitKey);

    return Math.max(0, this.maxRequests - count);
  }
}
