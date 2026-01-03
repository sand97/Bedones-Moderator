/**
 * API Response Helpers
 *
 * Provides a clean, consistent interface for creating API responses.
 * Works seamlessly in both Node.js and Edge runtimes.
 *
 * Usage:
 * ```ts
 * return apiResponse.json({ data });
 * return apiResponse.redirect('/dashboard');
 * return apiResponse.error('Not found', 404);
 * ```
 */

/**
 * Creates a JSON response
 *
 * @param data - Data to serialize as JSON
 * @param status - HTTP status code (default: 200)
 * @param headers - Additional headers
 * @returns Response with JSON content
 */
function json(
  data: any,
  status = 200,
  headers?: Record<string, string>
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}

/**
 * Creates a redirect response
 *
 * @param location - URL to redirect to
 * @param cookies - Array of Set-Cookie header values
 * @param status - HTTP status code (default: 302)
 * @returns Response with redirect
 */
function redirect(
  location: string,
  cookies?: string[],
  status = 302
): Response {
  const headers = new Headers();
  headers.set('Location', location);

  if (cookies) {
    cookies.forEach((cookie) => headers.append('Set-Cookie', cookie));
  }

  const response = new Response(null, {
    status,
    headers,
  });

  // Attach cookies array for Node.js compatibility
  // (Headers.forEach doesn't properly handle multiple Set-Cookie headers)
  if (cookies && cookies.length > 0) {
    (response as any).__cookies = cookies;
  }

  return response;
}

/**
 * Creates an error response
 *
 * @param message - Error message
 * @param status - HTTP status code (default: 500)
 * @returns Response with error JSON
 */
function error(message: string, status = 500): Response {
  return json({ error: message }, status);
}

/**
 * Creates a success response with a message
 *
 * @param message - Success message
 * @param data - Optional additional data
 * @param status - HTTP status code (default: 200)
 * @returns Response with success JSON
 */
function success(
  message: string,
  data?: any,
  status = 200
): Response {
  return json({ success: true, message, ...data }, status);
}

/**
 * Creates a response with custom headers
 *
 * @param data - Response data
 * @param status - HTTP status code
 * @param headers - Custom headers
 * @returns Response with custom headers
 */
function custom(
  data: any,
  status: number,
  headers: Record<string, string>
): Response {
  return new Response(
    typeof data === 'string' ? data : JSON.stringify(data),
    {
      status,
      headers,
    }
  );
}

/**
 * Creates a no content response (204)
 *
 * @returns Empty response with 204 status
 */
function noContent(): Response {
  return new Response(null, {
    status: 204,
  });
}

/**
 * Creates an unauthorized response (401)
 *
 * @param message - Error message (default: "Unauthorized")
 * @returns Response with 401 status
 */
function unauthorized(message = 'Unauthorized'): Response {
  return error(message, 401);
}

/**
 * Creates a forbidden response (403)
 *
 * @param message - Error message (default: "Forbidden")
 * @returns Response with 403 status
 */
function forbidden(message = 'Forbidden'): Response {
  return error(message, 403);
}

/**
 * Creates a not found response (404)
 *
 * @param message - Error message (default: "Not found")
 * @returns Response with 404 status
 */
function notFound(message = 'Not found'): Response {
  return error(message, 404);
}

/**
 * Creates a bad request response (400)
 *
 * @param message - Error message
 * @returns Response with 400 status
 */
function badRequest(message: string): Response {
  return error(message, 400);
}

/**
 * Creates a method not allowed response (405)
 *
 * @param allowed - Array of allowed methods
 * @returns Response with 405 status
 */
function methodNotAllowed(allowed: string[]): Response {
  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: {
      'Content-Type': 'application/json',
      'Allow': allowed.join(', '),
    },
  });
}

/**
 * Exported API response helpers
 */
export const apiResponse = {
  json,
  redirect,
  error,
  success,
  custom,
  noContent,
  unauthorized,
  forbidden,
  notFound,
  badRequest,
  methodNotAllowed,
};
