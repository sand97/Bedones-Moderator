import type { NextApiRequest, NextApiResponse } from 'next';
import { createPrismaWithD1, prisma as defaultPrisma } from '~/server/prisma';
import { createSession, createSessionCookie } from '~/lib/auth';
import { FacebookService } from '~/server/services/facebook';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const url = new URL(req.url!, `http://${req.headers.host}`);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');

    if (!code) {
      return res.redirect(302, '/auth-error?error=missing_code');
    }

    // Verify state parameter for CSRF protection
    const cookieHeader = req.headers.cookie || '';
    const cookies = cookieHeader.split(';').map((c) => c.trim());
    const stateCookie = cookies.find((c) => c.startsWith('oauth_state='));
    const storedState = stateCookie?.split('=')[1];

    if (!storedState || storedState !== state) {
      return res.redirect(302, '/auth-error?error=invalid_state');
    }

    // Exchange code for access token
    const appId = process.env.FACEBOOK_APP_ID;
    const appSecret = process.env.FACEBOOK_APP_SECRET;
    const appUrl = process.env.APP_URL || 'https://moderator.bedones.local';
    const redirectUri = `${appUrl}/api/auth/callback/facebook`;

    if (!appId || !appSecret) {
      return res.redirect(302, '/auth-error?error=missing_config');
    }

    const tokenUrl = new URL('https://graph.facebook.com/v21.0/oauth/access_token');
    tokenUrl.searchParams.set('client_id', appId);
    tokenUrl.searchParams.set('client_secret', appSecret);
    tokenUrl.searchParams.set('redirect_uri', redirectUri);
    tokenUrl.searchParams.set('code', code);

    const tokenResponse = await fetch(tokenUrl.toString());
    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', await tokenResponse.text());
      return res.redirect(302, '/auth-error?error=token_exchange_failed');
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
      return res.redirect(302, '/auth-error?error=user_info_failed');
    }

    const userInfo: {
      id: string;
      name?: string;
      email?: string;
      picture?: { data?: { url?: string } };
    } = await userInfoResponse.json();

    // Get D1 binding from request env (Cloudflare Workers)
    const d1 = (req as any)?.env?.moderateur_bedones_db;
    const prisma = d1 ? createPrismaWithD1(d1) : defaultPrisma;

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { facebookId: userInfo.id },
    });

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
    const ipAddress = (req.headers['x-forwarded-for'] as string) ||
                      (req.headers['cf-connecting-ip'] as string) ||
                      req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const session = await createSession(prisma, user.id, ipAddress, userAgent);

    // Set session cookie
    const isProduction = process.env.NODE_ENV === 'production';
    const sessionCookie = createSessionCookie(session.token, isProduction);

    // Clear state cookie
    const clearStateCookie = 'oauth_state=; Path=/; HttpOnly; Max-Age=0';

    res.setHeader('Set-Cookie', [sessionCookie, clearStateCookie]);
    return res.redirect(302, '/dashboard');
  } catch (error) {
    console.error('OAuth callback error:', error);
    return res.redirect(302, '/auth-error?error=unexpected_error');
  }
}
