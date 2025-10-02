import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
      scopes: [
        'pages_show_list',              // List pages user manages
        'pages_read_user_content',       // Read page content
        'pages_manage_engagement',       // Manage comments, reactions
        'pages_read_engagement',         // Read comments, reactions
        'pages_manage_posts',            // Create, edit, delete posts and comments
        'pages_messaging',               // Send and receive messages (for webhooks)
      ],
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  secret: process.env.BETTER_AUTH_SECRET || '',
  baseURL: process.env.BETTER_AUTH_URL || 'https://moderator.bedones.local',
  trustedOrigins: [
    'https://moderator.bedones.local',
    'http://localhost:3000',
  ],
  advanced: {
    useSecureCookies: process.env.NODE_ENV === 'production',
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ['facebook'],
    },
  },
});

export type Session = typeof auth.$Infer.Session.session;
export type User = typeof auth.$Infer.Session.user;
