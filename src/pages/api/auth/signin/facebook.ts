export const runtime = 'edge';

export default async function handler(req: Request) {
  const appId = process.env.FACEBOOK_APP_ID;
  const appUrl = process.env.APP_URL || 'https://moderator.bedones.local';

  if (!appId) {
    return new Response(JSON.stringify({ error: 'Facebook App ID not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Generate state for CSRF protection
  const state = Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  // Build Facebook OAuth URL
  const redirectUri = `${appUrl}/api/auth/callback/facebook`;
  const scopes = [
    'pages_show_list',
    'pages_read_user_content',
    'pages_manage_engagement',
    'pages_read_engagement',
    'pages_manage_posts',
    'pages_messaging',
  ].join(',');

  const authUrl = new URL('https://www.facebook.com/v21.0/dialog/oauth');
  authUrl.searchParams.set('client_id', appId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', scopes);
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('response_type', 'code');

  // Store state in cookie for verification in callback
  const isProduction = process.env.NODE_ENV === 'production';
  const stateCookie = [
    `oauth_state=${state}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=600', // 10 minutes
  ];

  if (isProduction) {
    stateCookie.push('Secure');
  }

  return new Response(null, {
    status: 302,
    headers: {
      'Location': authUrl.toString(),
      'Set-Cookie': stateCookie.join('; '),
    },
  });
}
