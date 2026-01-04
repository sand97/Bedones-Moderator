import type { NextApiRequest, NextApiResponse } from 'next';
import { rateLimit, RateLimitPresets } from '../../../../lib/rate-limit';

function handleSignIn(
  url: URL,
  headers: NextApiRequest['headers'],
): { location: string; setCookie: string[] } {
  const appId = process.env.INSTAGRAM_APP_ID;

  // Get app URL from request headers (dynamic based on actual request)
  const protocol =
    (headers['x-forwarded-proto'] as string) || url.protocol.replace(':', '');
  const host = (headers['x-forwarded-host'] as string) || headers.host! || url.host;

  const appUrl = `${protocol}://${host}`;

  if (!appId) {
    throw new Error('Instagram App ID not configured');
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
  req: NextApiRequest,
  res: NextApiResponse,
) {
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
    console.error('[Instagram SignIn] Error:', error);
    res.status(500).json({ error: 'Instagram sign in failed' });
  }
}
