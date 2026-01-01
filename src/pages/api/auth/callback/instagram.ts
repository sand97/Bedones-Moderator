// Use edge runtime for Cloudflare deployment
export const runtime = 'edge';

import { getRequestContext } from '@cloudflare/next-on-pages';
import type { PrismaClient } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createSession, createSessionCookie } from '~/lib/auth';
import { createPrismaWithD1, prisma as defaultPrisma } from '~/server/prisma';

async function handleCallback(
  url: URL,
  headers: Headers | NextApiRequest['headers'],
  prisma: PrismaClient,
): Promise<{ location: string; cookies: string[] }> {
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

  console.log('[Instagram Callback] Handler called');

  const code = url.searchParams.get('code');
  const stateParam = url.searchParams.get('state');

  if (!code) {
    console.error('[Instagram Callback] Missing code parameter');
    throw new Error('/auth-error?error=missing_code');
  }

  // Decode state parameter to extract CSRF token and locale
  let csrfToken: string;
  let locale = 'fr'; // Default to French

  try {
    if (!stateParam) {
      throw new Error('Missing state parameter');
    }
    const stateData = JSON.parse(atob(stateParam));
    csrfToken = stateData.csrf;
    locale = stateData.locale || 'fr';
  } catch (error) {
    console.error('[Instagram Callback] Failed to decode state:', error);
    throw new Error('/auth-error?error=invalid_state');
  }

  // Verify CSRF token from cookie
  let cookieHeader: string | undefined;
  if (headers instanceof Headers) {
    cookieHeader = headers.get('cookie') || '';
  } else {
    cookieHeader = headers.cookie || '';
  }

  const cookies = cookieHeader.split(';').map((c) => c.trim());
  const stateCookie = cookies.find((c) =>
    c.startsWith('oauth_state_instagram='),
  );
  const storedCsrfToken = stateCookie?.split('=')[1];

  if (!storedCsrfToken || storedCsrfToken !== csrfToken) {
    console.error('[Instagram Callback] CSRF token mismatch:', {
      storedCsrfToken,
      csrfToken,
    });
    throw new Error('/auth-error?error=invalid_state');
  }

  // Retrieve locale from cookie to preserve language preference
  const localeCookie = cookies.find((c) => c.startsWith('oauth_locale_instagram='));
  const locale = localeCookie?.split('=')[1] || 'fr';

  // Exchange code for access token (Instagram Platform API)
  const appId = process.env.INSTAGRAM_APP_ID;
  const appSecret = process.env.INSTAGRAM_APP_SECRET;
  const redirectUri = `${appUrl}/api/auth/callback/instagram`;

  if (!appId || !appSecret) {
    console.error('[Instagram Callback] Missing app credentials');
    throw new Error('/auth-error?error=missing_config');
  }

  // Instagram token exchange uses POST with form data
  const tokenResponse = await fetch(
    'https://api.instagram.com/oauth/access_token',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: appId,
        client_secret: appSecret,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        code: code,
      }),
    },
  );

  if (!tokenResponse.ok) {
    console.error('Token exchange failed:', await tokenResponse.text());
    throw new Error('/auth-error?error=token_exchange_failed');
  }

  const tokenData: { access_token: string; user_id: number } =
    await tokenResponse.json();
  let accessToken = tokenData.access_token;
  const instagramUserId = tokenData.user_id.toString();

  // Exchange for long-lived token (60 days)
  const longLivedTokenUrl = new URL('https://graph.instagram.com/access_token');
  longLivedTokenUrl.searchParams.set('grant_type', 'ig_exchange_token');
  longLivedTokenUrl.searchParams.set('client_secret', appSecret);
  longLivedTokenUrl.searchParams.set('access_token', accessToken);

  const longLivedTokenResponse = await fetch(longLivedTokenUrl.toString());
  if (!longLivedTokenResponse.ok) {
    console.error(
      '[Instagram Callback] Long-lived token exchange failed:',
      await longLivedTokenResponse.text(),
    );
    // Continue with short-lived token if exchange fails
  } else {
    const longLivedTokenData: { access_token: string; expires_in: number } =
      await longLivedTokenResponse.json();
    // Use the long-lived token going forward
    accessToken = longLivedTokenData.access_token;
  }

  // Fetch Instagram user profile information using /me endpoint
  const meUrl = new URL('https://graph.instagram.com/me');
  meUrl.searchParams.set('fields', 'id,user_id,username,account_type,profile_picture_url');
  meUrl.searchParams.set('access_token', accessToken);

  let username: string;
  let instagramBusinessAccountId: string;
  let profilePictureUrl: string | null = null;

  const meResponse = await fetch(meUrl.toString());
  if (!meResponse.ok) {
    console.error(
      '[Instagram Callback] Failed to fetch user profile:',
      await meResponse.text(),
    );
    // Fallback to basic user info
    username = `instagram_user_${instagramUserId}`;
    instagramBusinessAccountId = instagramUserId; // Fallback to user_id if we can't get the business ID
  } else {
    const profileData: {
      id: string; // App-scoped Facebook user ID
      user_id: number; // Instagram Professional Account ID (used in webhooks!)
      username: string;
      account_type?: string;
      profile_picture_url?: string;
    } = await meResponse.json();
    username = profileData.username;
    instagramBusinessAccountId = profileData.user_id.toString();
    profilePictureUrl = profileData.profile_picture_url || null;
  }

  // Find or create user (link to Instagram ID from token exchange)
  let user = await prisma.user.findUnique({
    where: { instagramId: instagramUserId },
  });

  // Track if this is an existing user (for redirect logic)
  const isExistingUser = !!user;

  if (!user) {
    // Create new user with Instagram ID and username
    user = await prisma.user.create({
      data: {
        instagramId: instagramUserId,
        name: username,
        email: null, // Instagram API doesn't provide email
      },
    });
    console.log(
      '[Instagram Callback] Created new user:',
      user.id,
      `(@${username})`,
    );
  } else {
    // Update existing user's name if changed
    if (user.name !== username) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { name: username },
      });
      console.log(
        '[Instagram Callback] Updated user name:',
        user.id,
        `(@${username})`,
      );
    }
  }

  // Create or update Instagram account record
  // Store the user_id from OAuth as the accountId
  await prisma.account.upsert({
    where: {
      providerId_accountId: {
        providerId: 'instagram',
        accountId: instagramUserId,
      },
    },
    create: {
      userId: user.id,
      accountId: instagramUserId,
      providerId: 'instagram',
      accessToken,
    },
    update: {
      accessToken,
    },
  });

  // Create Page for the Instagram Business Account
  // IMPORTANT: Use instagramBusinessAccountId (the 'id' from /me), NOT instagramUserId
  // This is the ID that webhooks will use in entry.id
  console.log(
    '[Instagram Callback] Creating Page for Instagram Business Account:',
    instagramBusinessAccountId,
  );

  // Encrypt access token for Page
  const { encrypt } = await import('~/server/services/encryption');
  const encryptedToken = await encrypt(accessToken);

  await prisma.page.upsert({
    where: { id: instagramBusinessAccountId },
    create: {
      id: instagramBusinessAccountId,
      provider: 'INSTAGRAM',
      username: username,
      name: username,
      profilePictureUrl: profilePictureUrl,
      followersCount: null,
      accessToken: encryptedToken,
      userId: user.id,
    },
    update: {
      username: username,
      name: username,
      profilePictureUrl: profilePictureUrl,
      accessToken: encryptedToken,
      userId: user.id, // Update userId in case user is adding to existing account
    },
  });

  // Create default page settings if they don't exist
  await prisma.pageSettings.upsert({
    where: { pageId: instagramBusinessAccountId },
    create: {
      pageId: instagramBusinessAccountId,
      undesiredCommentsEnabled: false,
      undesiredCommentsAction: 'hide',
      spamDetectionEnabled: false,
      spamAction: 'delete',
      intelligentFAQEnabled: false,
    },
    update: {},
  });

  console.log(
    '[Instagram Callback] ✓ Page created for Instagram Business Account:',
    instagramBusinessAccountId,
    `(@${username})`,
  );

  // Create session
  const session = await createSession(prisma, user.id, '', '');

  // Set session cookie
  const isProduction = process.env.NODE_ENV === 'production';
  const sessionCookie = createSessionCookie(session.token, isProduction);

  // Clear state and locale cookies
  const clearStateCookie =
    'oauth_state_instagram=; Path=/; HttpOnly; Max-Age=0';
  const clearLocaleCookie =
    'oauth_locale_instagram=; Path=/; HttpOnly; Max-Age=0';

  // Redirect to Instagram dashboard
  // Include locale in path to preserve language preference
  const dashboardUrl = new URL(`/${locale}/dashboard/instagram`, appUrl);
  if (isExistingUser) {
    dashboardUrl.searchParams.set('update', 'disabled');
  }

  return {
    location: dashboardUrl.toString(),
    cookies: [sessionCookie, clearStateCookie, clearLocaleCookie],
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
      console.log('[Instagram Callback] Node.js runtime');

      if (!defaultPrisma) {
        console.error('[Instagram Callback] No Prisma client available');
        res.setHeader('Location', '/auth-error?error=database_not_configured');
        res.status(302).end();
        return;
      }

      const nodeReq = req;
      const url = new URL(nodeReq.url!, `http://${nodeReq.headers.host}`);

      const result = await handleCallback(url, nodeReq.headers, defaultPrisma);

      console.log('[Instagram Callback] Setting cookies:', result.cookies);

      // Set multiple cookies at once (using array to avoid overwriting)
      res.setHeader('Set-Cookie', result.cookies);
      res.setHeader('Location', result.location);
      res.status(302).end();
      return;
    } catch (error) {
      console.error('[Instagram Callback] Error:', error);
      const errorPath =
        error instanceof Error && error.message.startsWith('/')
          ? error.message
          : '/auth-error?error=unexpected_error';
      res.setHeader('Location', errorPath);
      res.status(302).end();
      return;
    }
  }

  // Handle Edge runtime (Cloudflare)
  const request = req as Request;

  try {
    console.log('[Instagram Callback] Edge runtime');

    const { env } = getRequestContext();
    const d1 = env.moderateur_bedones_db;

    if (!d1) {
      return Response.redirect(
        new URL('/auth-error?error=database_not_configured', request.url),
        302,
      );
    }

    const prisma = createPrismaWithD1(d1);
    const url = new URL(request.url);

    const result = await handleCallback(url, request.headers, prisma);

    const headers = new Headers();
    headers.append('Location', result.location);
    result.cookies.forEach((cookie) => headers.append('Set-Cookie', cookie));

    return new Response(null, {
      status: 302,
      headers,
    });
  } catch (error) {
    console.error('[Instagram Callback] Error:', error);
    console.error(
      '[Instagram Callback] Error stack:',
      error instanceof Error ? error.stack : 'No stack trace',
    );

    const errorPath =
      error instanceof Error && error.message.startsWith('/')
        ? error.message
        : '/auth-error?error=unexpected_error';

    return Response.redirect(new URL(errorPath, request.url), 302);
  }
}
