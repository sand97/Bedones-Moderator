import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware for security headers and request protection
 */
export function middleware(_request: NextRequest) {
  const response = NextResponse.next();

  // Security Headers
  // Prevent clickjacking attacks
  response.headers.set('X-Frame-Options', 'DENY');

  // XSS Protection (legacy but still useful for older browsers)
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Referrer Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Content Security Policy
  // Note: Adjust based on your actual needs (e.g., Google Analytics, Sentry, Stripe)
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://www.googletagmanager.com https://www.google-analytics.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://api.stripe.com https://*.sentry.io https://www.google-analytics.com https://analytics.google.com",
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ];
  response.headers.set('Content-Security-Policy', cspDirectives.join('; '));

  // Permissions Policy (formerly Feature Policy)
  const permissionsPolicy = [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'interest-cohort=()', // Disable FLoC
  ];
  response.headers.set('Permissions-Policy', permissionsPolicy.join(', '));

  // Strict Transport Security (HSTS)
  // Only enable in production with HTTPS
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload',
    );
  }

  return response;
}

/**
 * Middleware configuration
 * Apply to all routes except static files and images
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
