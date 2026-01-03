import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/server/prisma';
import { deleteSessionCookie } from '@/lib/auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'DELETE' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get session from cookies
    const cookies = req.cookies;
    const sessionToken = cookies.session;

    if (!sessionToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Validate session
    const sessionData = await prisma.session.findUnique({
      where: { token: sessionToken },
      include: { user: true },
    });

    if (!sessionData || sessionData.expiresAt < new Date()) {
      return res.status(401).json({ error: 'Session expired' });
    }

    const userId = sessionData.userId;

    console.log(`[Delete Account] User ${userId} (${sessionData.user.email}) requested account deletion`);

    // Start a transaction to delete all user data
    await prisma.$transaction(async (tx) => {
      // Delete usage tracking
      await tx.usageTracking.deleteMany({
        where: { userId },
      });

      // Delete payments (if subscription exists)
      const subscription = await tx.subscription.findUnique({
        where: { userId },
      });

      if (subscription) {
        await tx.payment.deleteMany({
          where: { subscriptionId: subscription.id },
        });

        await tx.subscription.delete({
          where: { userId },
        });
      }

      // Delete page settings and FAQ rules
      const pages = await tx.page.findMany({
        where: { userId },
        include: { settings: true },
      });

      for (const page of pages) {
        if (page.settings) {
          await tx.fAQRule.deleteMany({
            where: { pageSettingsId: page.settings.id },
          });

          await tx.pageSettings.delete({
            where: { pageId: page.id },
          });
        }
      }

      // Delete comments
      await tx.comment.deleteMany({
        where: {
          pageId: {
            in: pages.map((p) => p.id),
          },
        },
      });

      // Delete posts
      await tx.post.deleteMany({
        where: {
          pageId: {
            in: pages.map((p) => p.id),
          },
        },
      });

      // Delete pages
      await tx.page.deleteMany({
        where: { userId },
      });

      // Delete sessions
      await tx.session.deleteMany({
        where: { userId },
      });

      // Delete accounts
      await tx.account.deleteMany({
        where: { userId },
      });

      // Delete verification tokens
      await tx.verification.deleteMany({
        where: { identifier: sessionData.user.email || '' },
      });

      // Finally, delete the user
      await tx.user.delete({
        where: { id: userId },
      });
    });

    console.log(`[Delete Account] Successfully deleted user ${userId} and all associated data`);

    // Clear session cookie
    res.setHeader('Set-Cookie', deleteSessionCookie());

    return res.status(200).json({
      success: true,
      message: 'Account successfully deleted',
    });
  } catch (error) {
    console.error('[Delete Account] Error:', error);
    return res.status(500).json({
      error: 'Failed to delete account',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
