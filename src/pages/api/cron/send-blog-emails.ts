/**
 * Cron Job: Send Blog Article Emails
 * Should run daily (e.g., at 10:00 AM)
 *
 * Checks for blog articles marked with sendEmailAt: today's date
 * and sends them to all subscribed users
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '~/server/prisma.ts';
import { verifyCronToken } from '~/lib/cron-utils.ts';
import {
  getArticlesToSendToday,
  generateBlogEmail,
  markArticleAsEmailSent,
} from '~/lib/email/blog-to-email.ts';
import { sendBatchEmails } from '~/lib/email/mailer.ts';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify cron token
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!verifyCronToken(token)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('📧 Starting blog email cron job...');

    // Get articles to send today
    const articles = getArticlesToSendToday();

    if (articles.length === 0) {
      console.log('📭 No blog articles to send today');
      return res.status(200).json({
        success: true,
        message: 'No articles to send',
        articlesSent: 0,
        emailsSent: 0,
      });
    }

    console.log(`📬 Found ${articles.length} articles to send as emails`);

    let totalEmailsSent = 0;
    const errors: string[] = [];

    // Process each article
    for (const article of articles) {
      try {
        // Get all subscribed users with verified emails
        const subscribedUsers = await prisma.user.findMany({
          where: {
            email: {
              not: null,
            },
            emailVerified: true,
            emailSubscribed: true,
          },
          select: {
            id: true,
            email: true,
            name: true,
          },
        });

        console.log(
          `📤 Sending article "${article.title}" to ${subscribedUsers.length} subscribers`
        );

        // Generate email HTML
        const emailData = generateBlogEmail(article);

        // Prepare recipients for batch send
        const recipients = subscribedUsers
          .filter((user) => user.email !== null)
          .map((user) => ({
            to: user.email!,
            userId: user.id,
            userName: user.name || undefined,
          }));

        // Send to all subscribers in batch (efficient!)
        const batchResult = await sendBatchEmails({
          recipients,
          subject: emailData.subject,
          html: emailData.html,
          previewText: emailData.previewText,
          campaignType: 'BLOG_ARTICLE',
          campaignName: `blog-${article.slug}`,
        });

        totalEmailsSent += batchResult.totalSent;
        if (batchResult.errors.length > 0) {
          errors.push(...batchResult.errors);
        }

        // Mark article as sent
        markArticleAsEmailSent(article.slug);

        console.log(
          `✅ Sent article "${article.title}" to ${subscribedUsers.length} users`
        );
      } catch (articleError) {
        const errorMsg = `Failed to process article ${article.slug}: ${articleError instanceof Error ? articleError.message : 'Unknown error'}`;
        console.error(`❌ ${errorMsg}`);
        errors.push(errorMsg);
      }
    }

    console.log(
      `✅ Blog email cron job completed: ${articles.length} articles, ${totalEmailsSent} emails sent`
    );

    return res.status(200).json({
      success: errors.length === 0,
      articlesSent: articles.length,
      emailsSent: totalEmailsSent,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('❌ Critical error in blog email cron job:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
