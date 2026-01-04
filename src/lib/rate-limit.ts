import type { NextApiRequest, NextApiResponse } from 'next';

interface RateLimitOptions {
  /**
   * Maximum number of requests allowed within the window
   */
  max: number;
  /**
   * Time window in milliseconds
   */
  windowMs: number;
  /**
   * Custom identifier function (default: IP address)
   */
  keyGenerator?: (req: NextApiRequest) => string;
}

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

/**
 * In-memory store for rate limiting
 * Note: In production with multiple instances, use Redis or similar distributed cache
 */
const store = new Map<string, RateLimitRecord>();

/**
 * Clean up expired entries periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of store.entries()) {
    if (now > record.resetTime) {
      store.delete(key);
    }
  }
}, 60000); // Clean every minute

/**
 * Get client identifier from request
 */
function getClientIdentifier(req: NextApiRequest): string {
  // Try multiple headers for IP address (considering reverse proxies)
  const forwarded = req.headers['x-forwarded-for'];
  const realIp = req.headers['x-real-ip'];
  const cfConnectingIp = req.headers['cf-connecting-ip']; // Cloudflare

  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  if (typeof realIp === 'string') {
    return realIp;
  }
  if (typeof cfConnectingIp === 'string') {
    return cfConnectingIp;
  }

  // Fallback to socket address
  return req.socket.remoteAddress || 'unknown';
}

/**
 * Rate limiting middleware for API routes
 *
 * @example
 * ```ts
 * export default async function handler(req: NextApiRequest, res: NextApiResponse) {
 *   // Allow 10 requests per minute
 *   if (!rateLimit(req, res, { max: 10, windowMs: 60000 })) {
 *     return; // Response already sent
 *   }
 *
 *   // Your handler logic
 *   res.status(200).json({ message: 'OK' });
 * }
 * ```
 */
export function rateLimit(
  req: NextApiRequest,
  res: NextApiResponse,
  options: RateLimitOptions,
): boolean {
  const { max, windowMs, keyGenerator } = options;

  // Generate unique key for this client
  const key = keyGenerator ? keyGenerator(req) : getClientIdentifier(req);
  const now = Date.now();

  // Get or create record for this client
  let record = store.get(key);

  if (!record || now > record.resetTime) {
    // Create new record
    record = {
      count: 1,
      resetTime: now + windowMs,
    };
    store.set(key, record);

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', max.toString());
    res.setHeader('X-RateLimit-Remaining', (max - 1).toString());
    res.setHeader('X-RateLimit-Reset', new Date(record.resetTime).toISOString());

    return true;
  }

  // Increment count
  record.count++;

  // Set rate limit headers
  const remaining = Math.max(0, max - record.count);
  res.setHeader('X-RateLimit-Limit', max.toString());
  res.setHeader('X-RateLimit-Remaining', remaining.toString());
  res.setHeader('X-RateLimit-Reset', new Date(record.resetTime).toISOString());

  // Check if limit exceeded
  if (record.count > max) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    res.setHeader('Retry-After', retryAfter.toString());
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter,
    });
    return false;
  }

  return true;
}

/**
 * Preset rate limit configurations
 */
export const RateLimitPresets = {
  /** Strict: 5 requests per minute */
  STRICT: { max: 5, windowMs: 60000 },

  /** Standard: 30 requests per minute */
  STANDARD: { max: 30, windowMs: 60000 },

  /** Relaxed: 100 requests per minute */
  RELAXED: { max: 100, windowMs: 60000 },

  /** Webhooks: 1000 requests per minute (for high-volume webhooks) */
  WEBHOOK: { max: 1000, windowMs: 60000 },

  /** Auth: 5 attempts per 15 minutes (for login/signup) */
  AUTH: { max: 5, windowMs: 900000 },
};
