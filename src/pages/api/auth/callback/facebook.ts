// Use edge runtime for Cloudflare deployment
export const runtime = 'edge';

import { getRequestContext } from '@cloudflare/next-on-pages';
import { createPrismaWithD1, prisma as defaultPrisma } from '~/server/prisma';
import { createSession, createSessionCookie } from '~/lib/auth';
import { FacebookService } from '~/server/services/facebook';
import type { PrismaClient } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';

async function handleCallback(
  url: URL,
  headers: Headers | NextApiRequest['headers'],
  prisma: PrismaClient,
): Promise<{ location: string; cookies: string[] }> {
  // Get app URL from request headers (dynamic based on actual request)
  let protocol: string;
  let host: string;

  if (headers instanceof Headers) {
    protocol = headers.get('x-forwarded-proto') || url.protocol.replace(':', '');
    host = headers.get('x-forwarded-host') || headers.get('host') || url.host;
  } else {
    protocol = (headers['x-forwarded-proto'] as string) || url.protocol.replace(':', '');
    host = (headers['x-forwarded-host'] as string) || (headers.host as string) || url.host;
  }

  const appUrl = `${protocol}://${host}`;

  console.log('[Facebook Callback] Handler called');

  const code = url.searchParams.get('code');
  const stateParam = url.searchParams.get('state');

  if (!code) {
    console.error('[Facebook Callback] Missing code parameter');
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
    console.error('[Facebook Callback] Failed to decode state:', error);
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
  const stateCookie = cookies.find((c) => c.startsWith('oauth_state='));
  const storedCsrfToken = stateCookie?.split('=')[1];

  if (!storedCsrfToken || storedCsrfToken !== csrfToken) {
    console.error('[Facebook Callback] CSRF token mismatch:', { storedCsrfToken, csrfToken });
    throw new Error('/auth-error?error=invalid_state');
  }

  // Exchange code for access token
  const appId = process.env.FACEBOOK_APP_ID;
  const appSecret = process.env.FACEBOOK_APP_SECRET;
  const redirectUri = `${appUrl}/api/auth/callback/facebook`;

  if (!appId || !appSecret) {
    console.error('[Facebook Callback] Missing app credentials');
    throw new Error('/auth-error?error=missing_config');
  }

  const tokenUrl = new URL('https://graph.facebook.com/v21.0/oauth/access_token');
  tokenUrl.searchParams.set('client_id', appId);
  tokenUrl.searchParams.set('client_secret', appSecret);
  tokenUrl.searchParams.set('redirect_uri', redirectUri);
  tokenUrl.searchParams.set('code', code);

  const tokenResponse = await fetch(tokenUrl.toString());
  if (!tokenResponse.ok) {
    console.error('Token exchange failed:', await tokenResponse.text());
    throw new Error('/auth-error?error=token_exchange_failed');
  }

  const tokenData: { access_token: string } = await tokenResponse.json();
  const accessToken = tokenData.access_token;

  // Get user info from Facebook
  const userInfoUrl = new URL('https://graph.facebook.com/v21.0/me');
  userInfoUrl.searchParams.set('fields', 'id,name,email,picture');
  userInfoUrl.searchParams.set('access_token', accessToken);

  const userInfoResponse = await fetch(userInfoUrl.toString());
  if (!userInfoResponse.ok) {
    console.error('User info fetch failed:', await userInfoResponse.text());
    throw new Error('/auth-error?error=user_info_failed');
  }

  const userInfo: {
    id: string;
    name?: string;
    email?: string;
    picture?: { data?: { url?: string } };
  } = await userInfoResponse.json();

  // Find or create user
  let user = await prisma.user.findUnique({
    where: { facebookId: userInfo.id },
  });

  // Track if this is an existing user (for redirect logic)
  const isExistingUser = !!user;

  if (!user) {
    // Check if user exists with this email
    if (userInfo.email) {
      user = await prisma.user.findUnique({
        where: { email: userInfo.email },
      });
    }

    if (user) {
      // Link Facebook account to existing user
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          facebookId: userInfo.id,
          name: userInfo.name || user.name,
          image: userInfo.picture?.data?.url || user.image,
        },
      });
    } else {
      // Create new user
      user = await prisma.user.create({
        data: {
          facebookId: userInfo.id,
          email: userInfo.email || null,
          name: userInfo.name || null,
          image: userInfo.picture?.data?.url || null,
        },
      });
    }
  }

  // Create or update account record
  await prisma.account.upsert({
    where: {
      providerId_accountId: {
        providerId: 'facebook',
        accountId: userInfo.id,
      },
    },
    create: {
      userId: user.id,
      accountId: userInfo.id,
      providerId: 'facebook',
      accessToken,
    },
    update: {
      accessToken,
    },
  });

  // Sync Facebook pages
  try {
    console.log('[Facebook Sync] Starting sync for user:', user.id);
    const pages = await FacebookService.fetchUserPages(accessToken);
    await FacebookService.saveUserPages(user.id, accessToken, pages, prisma);
    console.log(`[Facebook Sync] ✓ Successfully synced ${pages.length} pages`);
  } catch (error) {
    console.error('[Facebook Sync] ✗ Error:', error);
    // Continue even if sync fails
  }

  // Create session
  const session = await createSession(prisma, user.id, '', '');

  // Set session cookie
  const isProduction = process.env.NODE_ENV === 'production';
  const sessionCookie = createSessionCookie(session.token, isProduction);

  // Clear state cookie
  const clearStateCookie = 'oauth_state=; Path=/; HttpOnly; Max-Age=0';

  // Add update=disabled parameter for existing users to skip settings update
  // Include locale in redirect URL to preserve language preference
  const dashboardUrl = new URL(`/${locale}/dashboard`, appUrl);
  if (isExistingUser) {
    dashboardUrl.searchParams.set('update', 'disabled');
  }

  return {
    location: dashboardUrl.toString(),
    cookies: [sessionCookie, clearStateCookie],
  };
}

export default async function handler(req: NextApiRequest | Request, res?: NextApiResponse) {
  // Check if we're in Edge runtime by testing if req is a Web Request
  const isEdgeRuntime = req instanceof Request;

  // Handle Next.js API route (Node.js runtime)
  if (!isEdgeRuntime && res) {
    try {
      console.log('[Facebook Callback] Node.js runtime');

      if (!defaultPrisma) {
        console.error('[Facebook Callback] No Prisma client available');
        res.setHeader('Location', '/auth-error?error=database_not_configured');
        res.status(302).end();
        return;
      }

      const nodeReq = req as NextApiRequest;
      const url = new URL(nodeReq.url!, `http://${nodeReq.headers.host}`);

      const result = await handleCallback(url, nodeReq.headers, defaultPrisma);

      console.log('[Facebook Callback] Setting cookies:', result.cookies);

      // Set multiple cookies at once (using array to avoid overwriting)
      res.setHeader('Set-Cookie', result.cookies);
      res.setHeader('Location', result.location);
      res.status(302).end();
      return;
    } catch (error) {
      console.error('[Facebook Callback] Error:', error);
      const errorPath = error instanceof Error && error.message.startsWith('/')
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
    console.log('[Facebook Callback] Edge runtime');

    const { env } = getRequestContext();
    const d1 = env.moderateur_bedones_db;

    if (!d1) {
      return Response.redirect(new URL('/auth-error?error=database_not_configured', request.url), 302);
    }

    const prisma = createPrismaWithD1(d1);
    const url = new URL(request.url);

    const result = await handleCallback(url, request.headers, prisma);

    const headers = new Headers();
    headers.append('Location', result.location);
    result.cookies.forEach(cookie => headers.append('Set-Cookie', cookie));

    return new Response(null, {
      status: 302,
      headers,
    });
  } catch (error) {
    console.error('[Facebook Callback] Error:', error);
    console.error('[Facebook Callback] Error stack:', error instanceof Error ? error.stack : 'No stack trace');

    const errorPath = error instanceof Error && error.message.startsWith('/')
      ? error.message
      : '/auth-error?error=unexpected_error';

    return Response.redirect(new URL(errorPath, request.url), 302);
  }
}
