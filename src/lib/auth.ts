import { betterAuth, BetterAuthPlugin } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { PrismaClient } from '@prisma/client';
import { FacebookService } from '~/server/services/facebook';
import { createAuthMiddleware } from 'better-auth/api';

const prisma = new PrismaClient();

// Plugin to auto-sync Facebook pages after OAuth
const facebookPageSyncPlugin = (): BetterAuthPlugin => {
  return {
    id: 'facebook-page-sync',
    hooks: {
      after: [
        {
          matcher: (context: any) => {
            // Match the OAuth callback endpoint
            return context.path === '/callback/:id' && context.method === 'GET';
          },
          handler: createAuthMiddleware(async (ctx) => {
            // Only run for OAuth callbacks with new session
            if (!ctx.context.newSession) return;

            const userId = ctx.context.newSession.user?.id;

            if (!userId) {
              console.error('[Facebook Sync] No user ID found in newSession');
              // TODO: Add Sentry.captureException here for error tracking
              return ctx.redirect('/auth-error?error=no_user_id');
            }

            try {
              console.log('[Facebook Sync] Starting sync for user:', userId);

              // Wait a bit to ensure account is fully saved
              await new Promise((resolve) => setTimeout(resolve, 1000));

              // Fetch the Facebook account to get the access token
              const account = await prisma.account.findFirst({
                where: {
                  userId,
                  providerId: 'facebook',
                },
              });

              if (!account?.accessToken) {
                console.error(
                  '[Facebook Sync] No Facebook account or access token found',
                );
                // TODO: Add Sentry.captureException here for error tracking
                return ctx.redirect('/auth-error?error=no_facebook_account');
              }

              console.log(
                '[Facebook Sync] Found Facebook account, fetching pages...',
              );

              // Fetch and save Facebook pages
              const pages = await FacebookService.fetchUserPages(
                account.accessToken,
              );
              await FacebookService.saveUserPages(
                userId,
                account.accessToken,
                pages,
              );
              console.log(
                `[Facebook Sync] ✓ Successfully synced ${pages.length} pages`,
              );
            } catch (error) {
              console.error('[Facebook Sync] ✗ Error:', error);
              // TODO: Add Sentry.captureException(error) here for error tracking
              return ctx.redirect('/auth-error?error=sync_failed');
            }
          }),
        },
      ],
    },
  };
};

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'sqlite',
  }),
  emailAndPassword: {
    enabled: false, // We only use Facebook OAuth
  },
  socialProviders: {
    facebook: {
      clientId: process.env.FACEBOOK_APP_ID || '',
      clientSecret: process.env.FACEBOOK_APP_SECRET || '',
      scope: [
        'pages_show_list', // List pages user manages
        'pages_read_user_content', // Read page content
        'pages_manage_engagement', // Manage comments, reactions
        'pages_read_engagement', // Read comments, reactions
        'pages_manage_posts', // Create, edit, delete posts and comments
        'pages_messaging', // Send and receive messages (for webhooks)
      ],
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  secret: process.env.BETTER_AUTH_SECRET || '',
  baseURL: process.env.BETTER_AUTH_URL || 'https://moderator.bedones.local',
  trustedOrigins: ['https://moderator.bedones.local', 'http://localhost:3000'],
  advanced: {
    useSecureCookies: process.env.NODE_ENV === 'production',
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ['facebook'],
    },
  },
  plugins: [facebookPageSyncPlugin()],
});

export type Session = typeof auth.$Infer.Session.session;
export type User = typeof auth.$Infer.Session.user;
