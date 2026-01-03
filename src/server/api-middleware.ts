/**
 * API Middleware
 *
 * Provides composable middleware for API routes.
 * Middleware can be chained together to add functionality like:
 * - Authentication
 * - Rate limiting
 * - Request validation
 * - Logging
 *
 * Usage:
 * ```ts
 * export default withAuth(async (ctx) => {
 *   // ctx.user is guaranteed to exist here
 *   return ctx.json({ user: ctx.user });
 * });
 * ```
 */

import type { APIContext, APIHandler } from './api-handler';
import { createAPIHandler } from './api-handler';
import { validateSession, getSessionTokenFromRequest } from '@/lib/auth';

/**
 * Middleware function signature
 * Returns modified context or throws to abort request
 */
export type Middleware = (ctx: APIContext) => Promise<APIContext>;

/**
 * Composes multiple middleware functions
 *
 * @param middlewares - Array of middleware functions
 * @param handler - Final handler function
 * @returns Composed handler with all middleware applied
 */
export function composeMiddleware(
  middlewares: Middleware[],
  handler: APIHandler
): APIHandler {
  return async (ctx: APIContext) => {
    // Apply each middleware in sequence
    let currentCtx = ctx;
    for (const middleware of middlewares) {
      currentCtx = await middleware(currentCtx);
    }

    // Call final handler with modified context
    return handler(currentCtx);
  };
}

/**
 * Authentication middleware
 * Validates session and adds user to context
 *
 * @throws 401 if not authenticated
 */
export async function authMiddleware(ctx: APIContext): Promise<APIContext> {
  const token = getSessionTokenFromRequest(ctx.req.headers);

  if (!token) {
    throw new UnauthorizedError('No session token provided');
  }

  const sessionData = await validateSession(ctx.db, token);

  if (!sessionData) {
    throw new UnauthorizedError('Invalid or expired session');
  }

  return {
    ...ctx,
    user: sessionData.user,
    session: sessionData.session,
  };
}

/**
 * Optional authentication middleware
 * Adds user to context if authenticated, but doesn't require it
 */
export async function optionalAuthMiddleware(
  ctx: APIContext
): Promise<APIContext> {
  const token = getSessionTokenFromRequest(ctx.req.headers);

  if (!token) {
    return ctx; // No token, but that's okay
  }

  try {
    const sessionData = await validateSession(ctx.db, token);

    if (sessionData) {
      return {
        ...ctx,
        user: sessionData.user,
        session: sessionData.session,
      };
    }
  } catch (error) {
    console.error('[Auth Middleware] Error validating session:', error);
  }

  return ctx;
}

/**
 * Method validation middleware
 * Ensures request method matches allowed methods
 *
 * @param allowed - Array of allowed HTTP methods
 */
export function methodMiddleware(...allowed: string[]): Middleware {
  return async (ctx: APIContext) => {
    if (!allowed.includes(ctx.req.method)) {
      throw new MethodNotAllowedError(allowed);
    }
    return ctx;
  };
}

/**
 * Rate limiting middleware
 * Prevents abuse by limiting requests per IP
 *
 * @param maxRequests - Maximum requests allowed
 * @param windowMs - Time window in milliseconds
 */
export function rateLimitMiddleware(
  maxRequests: number,
  windowMs: number
): Middleware {
  // Simple in-memory rate limiting (use Redis in production)
  const requests = new Map<string, number[]>();

  return async (ctx: APIContext) => {
    // Get client IP (check various headers)
    const ip =
      ctx.req.headers.get('cf-connecting-ip') || // Cloudflare
      ctx.req.headers.get('x-forwarded-for') || // Proxy
      ctx.req.headers.get('x-real-ip') || // Nginx
      'unknown';

    const now = Date.now();
    const timestamps = requests.get(ip) || [];

    // Filter out old requests outside the window
    const recentRequests = timestamps.filter((t) => now - t < windowMs);

    if (recentRequests.length >= maxRequests) {
      throw new RateLimitError(
        `Rate limit exceeded. Try again in ${Math.ceil(windowMs / 1000)} seconds.`
      );
    }

    // Add current request
    recentRequests.push(now);
    requests.set(ip, recentRequests);

    return ctx;
  };
}

/**
 * Logging middleware
 * Logs request details
 */
export async function loggingMiddleware(ctx: APIContext): Promise<APIContext> {
  console.log(`[API] ${ctx.req.method} ${ctx.req.url}`);
  return ctx;
}

/**
 * CORS middleware
 * Adds CORS headers to response
 */
export function corsMiddleware(_options: {
  origin?: string;
  methods?: string[];
  headers?: string[];
}): Middleware {
  return async (ctx: APIContext) => {
    // TODO: Implement CORS headers
    // This would need to be done in the handler itself
    // as middleware can't modify the response
    return ctx;
  };
}

// ===== Custom Errors =====

export class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  constructor(message = 'Forbidden') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class MethodNotAllowedError extends Error {
  allowed: string[];

  constructor(allowed: string[]) {
    super('Method not allowed');
    this.name = 'MethodNotAllowedError';
    this.allowed = allowed;
  }
}

export class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RateLimitError';
  }
}

// ===== Convenience Wrappers =====

/**
 * Wraps a handler with authentication middleware
 *
 * Usage:
 * ```ts
 * export default withAuth(async (ctx) => {
 *   // ctx.user and ctx.session are guaranteed to exist
 *   return ctx.json({ user: ctx.user });
 * });
 * ```
 */
export function withAuth(handler: APIHandler) {
  return createAPIHandler(composeMiddleware([authMiddleware], handler));
}

/**
 * Wraps a handler with optional authentication middleware
 *
 * Usage:
 * ```ts
 * export default withOptionalAuth(async (ctx) => {
 *   // ctx.user might be null
 *   if (ctx.user) {
 *     return ctx.json({ user: ctx.user });
 *   }
 *   return ctx.json({ user: null });
 * });
 * ```
 */
export function withOptionalAuth(handler: APIHandler) {
  return createAPIHandler(
    composeMiddleware([optionalAuthMiddleware], handler)
  );
}

/**
 * Wraps a handler with method validation
 *
 * Usage:
 * ```ts
 * export default withMethods(['POST', 'PUT'], async (ctx) => {
 *   // Only POST and PUT requests will reach here
 *   return ctx.json({ success: true });
 * });
 * ```
 */
export function withMethods(allowed: string[], handler: APIHandler) {
  return createAPIHandler(
    composeMiddleware([methodMiddleware(...allowed)], handler)
  );
}

/**
 * Wraps a handler with multiple middleware
 *
 * Usage:
 * ```ts
 * export default withMiddleware(
 *   [authMiddleware, methodMiddleware('POST')],
 *   async (ctx) => {
 *     return ctx.json({ success: true });
 *   }
 * );
 * ```
 */
export function withMiddleware(middlewares: Middleware[], handler: APIHandler) {
  return createAPIHandler(composeMiddleware(middlewares, handler));
}
