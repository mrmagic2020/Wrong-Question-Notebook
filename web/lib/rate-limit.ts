import { NextRequest, NextResponse } from 'next/server';
import { RATE_LIMIT_CONSTANTS } from './constants';

/**
 * Rate limiting configuration interface
 */
interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (req: NextRequest) => string; // Custom key generator
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

/**
 * In-memory store for rate limiting
 *
 * PRODUCTION NOTE: This implementation uses an in-memory Map which has limitations:
 * - Not shared across multiple server instances/workers
 * - Lost on server restart
 * - Memory usage grows with unique request sources
 *
 * For production environments with multiple server instances, consider:
 * - Redis with node-rate-limiter-flexible
 * - Upstash Redis for serverless environments
 * - Vercel KV or similar edge-compatible solutions
 * - Rate limiting at the infrastructure level (Cloudflare, AWS WAF, etc.)
 */
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Periodically clean up expired rate limit entries to prevent memory leaks
 * Runs every 5 minutes in the background
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, RATE_LIMIT_CONSTANTS.CLEANUP_INTERVAL);

/**
 * Creates a rate limiter middleware with custom configuration
 *
 * @param config - Rate limiting configuration
 * @returns Middleware function that returns null to continue or NextResponse to block
 *
 * @example
 * ```ts
 * const limiter = createRateLimit({
 *   windowMs: 60000, // 1 minute
 *   maxRequests: 10, // 10 requests per minute
 *   keyGenerator: (req) => req.headers.get('x-user-id') || 'anonymous'
 * });
 * ```
 */
export function createRateLimit(config: RateLimitConfig) {
  return (req: NextRequest): NextResponse | null => {
    const key = config.keyGenerator
      ? config.keyGenerator(req)
      : getDefaultKey(req);
    const now = Date.now();
    // const windowStart = now - config.windowMs;

    // Get or create rate limit entry
    let entry = rateLimitStore.get(key);
    if (!entry || now > entry.resetTime) {
      entry = {
        count: 0,
        resetTime: now + config.windowMs,
      };
      rateLimitStore.set(key, entry);
    }

    // Increment counter
    entry.count++;

    // Check if limit exceeded
    if (entry.count > config.maxRequests) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);

      return new NextResponse(
        JSON.stringify({
          error: 'Too Many Requests',
          message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
          retryAfter,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': entry.resetTime.toString(),
          },
        }
      );
    }

    // Add rate limit headers
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
    response.headers.set(
      'X-RateLimit-Remaining',
      (config.maxRequests - entry.count).toString()
    );
    response.headers.set('X-RateLimit-Reset', entry.resetTime.toString());

    return null; // Allow request to proceed
  };
}

/**
 * Generates a default rate limit key based on client IP
 * Falls back to 'unknown' if IP cannot be determined
 *
 * @param req - The incoming request
 * @returns Rate limit key string
 */
function getDefaultKey(req: NextRequest): string {
  // Use IP address as default key
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
  return `rate_limit:${ip}`;
}

/**
 * Pre-configured rate limiters for common use cases
 * Each limiter has appropriate limits for its specific use case:
 * - API: General API endpoints (100 req/15min)
 * - File Upload: Upload operations (20 req/hour)
 * - Auth: Authentication attempts (5 req/15min)
 * - Problem Creation: Creating problems (50 req/hour)
 */
export const createApiRateLimit = () =>
  createRateLimit(RATE_LIMIT_CONSTANTS.CONFIGURATIONS.api);
export const createFileUploadRateLimit = () =>
  createRateLimit(RATE_LIMIT_CONSTANTS.CONFIGURATIONS.fileUpload);
export const createAuthRateLimit = () =>
  createRateLimit(RATE_LIMIT_CONSTANTS.CONFIGURATIONS.auth);
export const createProblemCreationRateLimit = () =>
  createRateLimit(RATE_LIMIT_CONSTANTS.CONFIGURATIONS.problemCreation);
