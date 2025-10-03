import { NextRequest, NextResponse } from 'next/server';
import { RATE_LIMIT_CONSTANTS } from './constants';

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

// In-memory store for rate limiting (in production, use Redis)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, RATE_LIMIT_CONSTANTS.CLEANUP_INTERVAL);

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

function getDefaultKey(req: NextRequest): string {
  // Use IP address as default key
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
  return `rate_limit:${ip}`;
}

// Helper function to create rate limiters
export const createApiRateLimit = () =>
  createRateLimit(RATE_LIMIT_CONSTANTS.CONFIGURATIONS.api);
export const createFileUploadRateLimit = () =>
  createRateLimit(RATE_LIMIT_CONSTANTS.CONFIGURATIONS.fileUpload);
export const createAuthRateLimit = () =>
  createRateLimit(RATE_LIMIT_CONSTANTS.CONFIGURATIONS.auth);
export const createProblemCreationRateLimit = () =>
  createRateLimit(RATE_LIMIT_CONSTANTS.CONFIGURATIONS.problemCreation);
