// lib/rate-limit.ts - Rate limiting middleware
// Copy-paste ready - handles DOS/brute force protection

import { headers } from 'next/headers';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number; // in milliseconds
  keyGenerator?: (request: Request) => string;
}

// In-memory store (use Redis for production)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

// Configuration by endpoint type
const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  'signin-attempt': {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  'public-leads': {
    maxRequests: 10,
    windowMs: 60 * 60 * 1000, // 60 minutes
  },
  'aml-check': {
    maxRequests: 100,
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
  },
  'leads-create': {
    maxRequests: 50,
    windowMs: 30 * 60 * 1000, // 30 minutes
  },
  'api-general': {
    maxRequests: 1000,
    windowMs: 60 * 60 * 1000, // 60 minutes
  },
};

export interface RateLimitResult {
  isLimited: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

/**
 * Get client IP address from request
 */
function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || 'unknown';
}

/**
 * Get rate limit key (IP + endpoint + user combo)
 */
function generateRateLimitKey(
  request: Request,
  endpoint: string,
  userId?: string
): string {
  const ip = getClientIp(request);
  return userId ? `${endpoint}:${userId}` : `${endpoint}:${ip}`;
}

/**
 * Main rate limiting function
 */
export async function rateLimit(
  request: Request,
  endpointKey: string,
  userId?: string
): Promise<RateLimitResult> {
  const config = RATE_LIMIT_CONFIGS[endpointKey] || RATE_LIMIT_CONFIGS['api-general'];
  const key = generateRateLimitKey(request, endpointKey, userId);

  const now = Date.now();
  let record = requestCounts.get(key);

  // Clean up expired entries
  if (record && now > record.resetTime) {
    requestCounts.delete(key);
    record = undefined;
  }

  // Initialize new record
  if (!record) {
    record = {
      count: 0,
      resetTime: now + config.windowMs,
    };
  }

  record.count++;
  requestCounts.set(key, record);

  const isLimited = record.count > config.maxRequests;
  const remaining = Math.max(0, config.maxRequests - record.count);
  const retryAfter = isLimited
    ? Math.ceil((record.resetTime - now) / 1000)
    : undefined;

  return {
    isLimited,
    remaining,
    resetTime: record.resetTime,
    retryAfter,
  };
}

/**
 * Middleware wrapper - attach to API routes
 */
export function withRateLimit(
  handler: (request: Request) => Promise<Response>,
  endpointKey: string
) {
  return async (request: Request) => {
    // Only rate limit POST/PUT/DELETE
    if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
      return handler(request);
    }

    // Get user ID if authenticated
    const authHeader = request.headers.get('authorization');
    const userId = authHeader ? extractUserIdFromToken(authHeader) : undefined;

    const limitResult = await rateLimit(request, endpointKey, userId);

    if (limitResult.isLimited) {
      return new Response(
        JSON.stringify({
          error: 'Too many requests',
          retryAfter: limitResult.retryAfter,
        }),
        {
          status: 429,
          headers: {
            'Retry-After': limitResult.retryAfter!.toString(),
            'X-RateLimit-Limit': RATE_LIMIT_CONFIGS[endpointKey].maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(limitResult.resetTime).toISOString(),
          },
        }
      );
    }

    // Add rate limit headers to successful response
    const response = await handler(request);
    response.headers.set(
      'X-RateLimit-Limit',
      RATE_LIMIT_CONFIGS[endpointKey].maxRequests.toString()
    );
    response.headers.set('X-RateLimit-Remaining', limitResult.remaining.toString());
    response.headers.set(
      'X-RateLimit-Reset',
      new Date(limitResult.resetTime).toISOString()
    );

    return response;
  };
}

/**
 * Extract user ID from JWT token
 * (Replace with your actual JWT extraction logic)
 */
function extractUserIdFromToken(authHeader: string): string | undefined {
  try {
    const token = authHeader.replace('Bearer ', '');
    // Decode JWT manually (don't verify here, assume already verified by middleware)
    const payload = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64').toString()
    );
    return payload.sub || payload.userId;
  } catch {
    return undefined;
  }
}

/**
 * Cleanup function for expired records (call periodically)
 */
export function cleanupExpiredRecords() {
  const now = Date.now();
  for (const [key, record] of requestCounts.entries()) {
    if (now > record.resetTime) {
      requestCounts.delete(key);
    }
  }
}

// Run cleanup every hour
if (typeof window === 'undefined') {
  setInterval(cleanupExpiredRecords, 60 * 60 * 1000);
}
