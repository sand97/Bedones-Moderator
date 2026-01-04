import type { NextApiRequest, NextApiResponse } from 'next';
import { rateLimit, RateLimitPresets } from '../../../../lib/rate-limit';

function handleSignIn(
  url: URL,
  headers: NextApiRequest['headers'],
): { location: string; setCookie: string } {
  const appId = process.env.FACEBOOK_APP_ID;

  // Get app URL from request headers (dynamic based on actual request)
  const protocol = (headers['x-forwarded-proto'] as string) || url.protocol.replace(':', '');
  const host = (headers['x-forwarded-host'] as string) || headers.host! || url.host;

  const appUrl = `${protocol}://${host}`;

  if (!appId) {
    throw new Error('Facebook App ID not configured');
  }

  // Detect user's locale from referer header or query parameter
  let locale = 'fr'; // Default to French
  const referer = headers.referer || null;

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

  // Build Facebook OAuth URL
  const redirectUri = `${appUrl}/api/auth/callback/facebook`;

  const scopes = [
    // Receive webhook for Page comments
    'pages_show_list',
    'pages_manage_metadata',
    'pages_read_user_content',
    // Delete comments
    'pages_read_engagement',
    'pages_manage_engagement',
  ].join(',');

  const authUrl = new URL('https://www.facebook.com/v21.0/dialog/oauth');
  authUrl.searchParams.set('client_id', appId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', scopes);
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('response_type', 'code');

  // Store CSRF token in cookie for verification in callback
  const isProduction = process.env.NODE_ENV === 'production';
  const stateCookie = [
    `oauth_state=${csrfToken}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=600', // 10 minutes
  ];

  if (isProduction) {
    stateCookie.push('Secure');
  }

  return {
    location: authUrl.toString(),
    setCookie: stateCookie.join('; '),
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Rate limiting: 5 attempts per 15 minutes for auth
  if (!rateLimit(req, res, RateLimitPresets.AUTH)) {
    return; // Response already sent
  }

  try {
    const url = new URL(req.url!, `http://${req.headers.host}`);
    const result = handleSignIn(url, req.headers);

    res.setHeader('Set-Cookie', result.setCookie);
    res.setHeader('Location', result.location);
    res.status(302).end();
  } catch (error) {
    console.error('[Facebook SignIn] Error:', error);
    res.status(500).json({ error: 'Facebook sign in failed' });
  }
}
