/**
 * Universal API Handler
 *
 * This module provides a unified API handler that works seamlessly in both:
 * - Local development (Node.js runtime)
 * - Production (Node.js runtime)
 *
 * Key improvements over previous architecture:
 * - Eliminates 240+ lines of duplicate runtime detection code
 * - Single handler for both Node.js and Edge runtimes
 * - Automatic request/response normalization
 * - Built-in error handling
 * - Type-safe context
 *
 * Usage:
 * ```ts
 * export default createAPIHandler(async (ctx) => {
 *   const users = await ctx.db.user.findMany();
 *   return ctx.json({ users });
 * });
 * ```
 */

import type { PrismaClient, User, Session } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import { getDbClient } from './db';
import { apiResponse } from './api-response';

// Re-export response helpers for convenience
export { apiResponse };

/**
 * Normalized request object that works in both runtimes
 */
export interface UnifiedRequest {
  method: string;
  url: string;
  headers: Headers;
  json: () => Promise<any>;
  text: () => Promise<string>;
  formData: () => Promise<FormData>;
}

/**
 * API Context provided to all API handlers
 * Contains everything needed for request processing
 */
export interface APIContext {
  /** Database client (auto-detected for runtime) */
  db: PrismaClient;
  /** Normalized request object */
  req: UnifiedRequest;
  /** Authenticated user (null if not authenticated) */
  user: User | null;
  /** User session (null if not authenticated) */
  session: Session | null;
  /** Response helpers */
  json: typeof apiResponse.json;
  redirect: typeof apiResponse.redirect;
  error: typeof apiResponse.error;
  success: typeof apiResponse.success;
  noContent: typeof apiResponse.noContent;
  unauthorized: typeof apiResponse.unauthorized;
  forbidden: typeof apiResponse.forbidden;
  notFound: typeof apiResponse.notFound;
  badRequest: typeof apiResponse.badRequest;
  methodNotAllowed: typeof apiResponse.methodNotAllowed;
}

/**
 * API Handler function signature
 */
export type APIHandler = (ctx: APIContext) => Promise<Response>;

/**
 * Normalizes Next.js API request to Web Request
 */
function normalizeRequest(req: NextApiRequest): UnifiedRequest {
  const url = new URL(req.url!, `http://${req.headers.host}`);

  return {
    method: req.method || 'GET',
    url: url.toString(),
    headers: new Headers(req.headers as Record<string, string>),
    json: async () => req.body,
    text: async () => JSON.stringify(req.body),
    formData: async () => {
      throw new Error('FormData not supported in Node.js runtime');
    },
  };
}

/**
 * Normalizes Web Request to UnifiedRequest
 */
function normalizeWebRequest(req: Request): UnifiedRequest {
  return {
    method: req.method,
    url: req.url,
    headers: req.headers,
    json: () => req.json(),
    text: () => req.text(),
    formData: () => req.formData(),
  };
}

/**
 * Creates API context from request
 */
async function createContext(
  req: UnifiedRequest,
  _unused?: any
): Promise<APIContext> {
  // Get database client (automatically detects runtime)
  const db = getDbClient(req);

  // Session validation will be handled by middleware
  // Not implemented here to avoid circular dependencies
  return {
    db,
    req,
    user: null, // Will be populated by auth middleware
    session: null, // Will be populated by auth middleware
    json: apiResponse.json,
    redirect: apiResponse.redirect,
    error: apiResponse.error,
    success: apiResponse.success,
    noContent: apiResponse.noContent,
    unauthorized: apiResponse.unauthorized,
    forbidden: apiResponse.forbidden,
    notFound: apiResponse.notFound,
    badRequest: apiResponse.badRequest,
    methodNotAllowed: apiResponse.methodNotAllowed,
  };
}

/**
 * Converts Response to Next.js API response
 */
async function sendNodeResponse(
  response: Response,
  res: NextApiResponse
): Promise<void> {
  // Set status
  res.status(response.status);

  // Handle Set-Cookie headers specially (they can't be joined with commas)
  let setCookies: string[] = [];

  // First, try to get cookies from custom property (most reliable)
  if ((response as any).__cookies) {
    setCookies = (response as any).__cookies;
  }
  // Use getSetCookie() if available (Node 19.7+)
  else if (typeof response.headers.getSetCookie === 'function') {
    setCookies = response.headers.getSetCookie();
  }
  // Fallback: get the raw Set-Cookie header value
  else {
    const setCookieValue = response.headers.get('Set-Cookie');
    if (setCookieValue) {
      setCookies = [setCookieValue];
    }
  }

  if (setCookies.length > 0) {
    res.setHeader('Set-Cookie', setCookies);
  }

  // Set all other headers
  response.headers.forEach((value, key) => {
    if (key.toLowerCase() !== 'set-cookie') {
      res.setHeader(key, value);
    }
  });

  // Send body
  if (response.body) {
    const text = await response.text();
    res.send(text);
  } else {
    res.end();
  }
}

/**
 * Creates a universal API handler that works in both Node.js and Edge runtimes
 *
 * This is the main export - use it to wrap all your API route handlers.
 *
 * @example
 * ```ts
 * // pages/api/users.ts
 * export default createAPIHandler(async (ctx) => {
 *   const users = await ctx.db.user.findMany();
 *   return ctx.json({ users });
 * });
 * ```
 *
 * @param handler - Your API handler function
 * @returns Universal handler that works in both runtimes
 */
export function createAPIHandler(handler: APIHandler) {
  return async (
    req: NextApiRequest | Request,
    res?: NextApiResponse
  ): Promise<Response | void> => {
    // Detect runtime
    const isEdgeRuntime = req instanceof Request;

    try {
      // Normalize request
      const unifiedReq = isEdgeRuntime
        ? normalizeWebRequest(req)
        : normalizeRequest(req);

      // Create context (no Cloudflare environment needed)
      const ctx = await createContext(unifiedReq, null);

      // Call handler
      const response = await handler(ctx);

      // Handle Node.js response
      if (!isEdgeRuntime && res) {
        await sendNodeResponse(response, res);
        return;
      }

      // Return Edge response
      return response;
    } catch (error) {
      console.error('[API Handler] Error:', error);

      const errorResponse = apiResponse.error(
        error instanceof Error ? error.message : 'Internal server error',
        500
      );

      // Handle Node.js error response
      if (!isEdgeRuntime && res) {
        await sendNodeResponse(errorResponse, res);
        return;
      }

      // Return Edge error response
      return errorResponse;
    }
  };
}
