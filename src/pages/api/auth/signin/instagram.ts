// Use edge runtime for Cloudflare deployment
export const runtime = 'edge';

import type { NextApiRequest, NextApiResponse } from 'next';

function handleSignIn(
  url: URL,
  headers: Headers | NextApiRequest['headers'],
): { location: string; setCookie: string[] } {
  const appId = process.env.INSTAGRAM_APP_ID;

  // Get app URL from request headers (dynamic based on actual request)
  let protocol: string;
  let host: string;

  if (headers instanceof Headers) {
    protocol =
      headers.get('x-forwarded-proto') || url.protocol.replace(':', '');
    host = headers.get('x-forwarded-host') || headers.get('host') || url.host;
  } else {
    protocol =
      (headers['x-forwarded-proto'] as string) || url.protocol.replace(':', '');
    host = (headers['x-forwarded-host'] as string) || headers.host! || url.host;
  }

  const appUrl = `${protocol}://${host}`;

  if (!appId) {
    throw new Error('Instagram App ID not configured');
  }

  // Detect user's locale from referer header or query parameter
  let locale = 'fr'; // Default to French
  let referer: string | null = null;

  if (headers instanceof Headers) {
    referer = headers.get('referer');
  } else {
    referer = headers.referer || null;
  }

  // Check query parameter first
  const langParam = url.searchParams.get('lang');
  if (langParam === 'en' || langParam === 'fr') {
    locale = langParam;
  } else if (referer) {
    // Extract locale from referer path (e.g., https://example.com/en/... -> 'en')
    const refererUrl = new URL(referer);
    const pathMatch = /^\/(en|fr)\//.exec(refererUrl.pathname);
    if (pathMatch) {
      locale = pathMatch[1];
    }
  }

  // Generate CSRF token
  const csrfToken = Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  // Encode state with both CSRF token and locale
  const stateData = JSON.stringify({ csrf: csrfToken, locale });
  const state = btoa(stateData);

  // Build Instagram OAuth URL (Instagram Platform API with Instagram Login)
  const redirectUri = `${appUrl}/api/auth/callback/instagram`;

  const scopes = [
    // Instagram Platform API scopes
    'instagram_business_basic', // Required base scope
    'instagram_business_manage_comments', // For reading, hiding, deleting, and replying to comments
  ].join(',');

  const authUrl = new URL('https://www.instagram.com/oauth/authorize');
  authUrl.searchParams.set('client_id', appId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', scopes);
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('response_type', 'code');

  // Store CSRF token in cookie for verification in callback
  const isProduction = process.env.NODE_ENV === 'production';
  const stateCookie = [
    `oauth_state_instagram=${csrfToken}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=600', // 10 minutes
  ];

  if (isProduction) {
    stateCookie.push('Secure');
  }

  // Store locale in cookie to preserve language preference
  const localeCookie = [
    `oauth_locale_instagram=${locale}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=600', // 10 minutes
  ];

  if (isProduction) {
    localeCookie.push('Secure');
  }

  return {
    location: authUrl.toString(),
    setCookie: [stateCookie.join('; '), localeCookie.join('; ')],
  };
}

export default async function handler(
  req: NextApiRequest | Request,
  res?: NextApiResponse,
) {
  // Check if we're in Edge runtime by testing if req is a Web Request
  const isEdgeRuntime = req instanceof Request;

  // Handle Next.js API route (Node.js runtime)
  if (!isEdgeRuntime && res) {
    try {
      const nodeReq = req;
      const url = new URL(nodeReq.url!, `http://${nodeReq.headers.host}`);

      const result = handleSignIn(url, nodeReq.headers);

      res.setHeader('Set-Cookie', result.setCookie);
      res.setHeader('Location', result.location);
      res.status(302).end();
      return;
    } catch (error) {
      console.error('[Instagram SignIn] Error:', error);
      res.status(500).json({ error: 'Instagram sign in failed' });
      return;
    }
  }

  // Handle Edge runtime (Cloudflare)
  const request = req as Request;

  try {
    const url = new URL(request.url);
    const result = handleSignIn(url, request.headers);

    const headers = new Headers();
    headers.append('Location', result.location);
    result.setCookie.forEach(cookie => headers.append('Set-Cookie', cookie));

    return new Response(null, {
      status: 302,
      headers,
    });
  } catch (error) {
    console.error('[Instagram SignIn] Error:', error);
    return new Response(JSON.stringify({ error: 'Instagram sign in failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
