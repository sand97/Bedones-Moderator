import type { NextApiRequest, NextApiResponse } from 'next';
import { createPrismaWithD1, prisma as defaultPrisma } from '~/server/prisma';
import { FacebookService } from '~/server/services/facebook';
import { AIService } from '~/server/services/ai';

interface FacebookWebhookEntry {
  id: string;
  time: number;
  changes: {
    field: string;
    value: {
      from: {
        id: string;
        name: string;
      };
      post_id: string;
      comment_id: string;
      created_time: number;
      message: string;
      verb: string;
      item: string;
    };
  }[];
}

interface FacebookWebhookPayload {
  object: string;
  entry: FacebookWebhookEntry[];
}

/**
 * Verify the webhook signature from Facebook using Web Crypto API
 */
async function verifySignature(
  payload: string,
  signature: string | undefined,
): Promise<boolean> {
  if (!signature || !process.env.FACEBOOK_APP_SECRET) {
    return false;
  }

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(process.env.FACEBOOK_APP_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBytes = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(payload)
  );

  const expectedSignature = Array.from(new Uint8Array(signatureBytes))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return `sha256=${expectedSignature}` === signature;
}

/**
 * Handle webhook verification challenge from Facebook
 */
function handleVerification(req: NextApiRequest, res: NextApiResponse) {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (
    mode === 'subscribe' &&
    token === process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN
  ) {
    console.log('Webhook verified successfully');
    res.status(200).send(challenge);
  } else {
    console.error('Webhook verification failed');
    res.status(403).send('Forbidden');
  }
}

/**
 * Process a comment webhook notification
 */
async function processCommentNotification(entry: FacebookWebhookEntry, prisma: any) {
  for (const change of entry.changes) {
    if (change.field !== 'feed' || change.value.item !== 'comment') {
      continue;
    }

    const { comment_id, post_id, from, message, created_time } = change.value;

    // Extract page ID from entry
    const pageId = entry.id;

    try {
      // Get page and settings from database
      const page = await prisma.page.findUnique({
        where: { id: pageId },
        include: { settings: true },
      });

      if (!page?.settings) {
        console.error(`Page ${pageId} not found or has no settings`);
        continue;
      }

      // Skip if all features are disabled
      if (
        !page.settings.undesiredCommentsEnabled &&
        !page.settings.spamDetectionEnabled &&
        !page.settings.intelligentFAQEnabled
      ) {
        console.log('All moderation features disabled for this page');
        continue;
      }

      // Analyze comment with AI
      const analysis = await AIService.analyzeComment({
        comment: {
          id: comment_id,
          message,
          from,
          created_time: new Date(created_time * 1000).toISOString(),
        },
        pageSettings: {
          undesiredCommentsEnabled: page.settings.undesiredCommentsEnabled,
          undesiredCommentsAction: page.settings.undesiredCommentsAction as
            | 'hide'
            | 'delete',
          spamDetectionEnabled: page.settings.spamDetectionEnabled,
          spamAction: page.settings.spamAction as 'hide' | 'delete',
          intelligentFAQEnabled: page.settings.intelligentFAQEnabled,
        },
      });

      // Get page access token
      const pageAccessToken = await FacebookService.getPageAccessToken(pageId, prisma);

      // Execute action based on AI analysis
      switch (analysis.action) {
        case 'hide':
          await FacebookService.hideComment(comment_id, pageAccessToken);
          console.log(`Hidden comment ${comment_id}: ${analysis.reason}`);
          break;

        case 'delete':
          await FacebookService.deleteComment(comment_id, pageAccessToken);
          console.log(`Deleted comment ${comment_id}: ${analysis.reason}`);
          break;

        case 'reply':
          if (analysis.replyMessage) {
            await FacebookService.replyToComment(
              comment_id,
              analysis.replyMessage,
              pageAccessToken,
            );
            console.log(`Replied to comment ${comment_id}: ${analysis.reason}`);
          }
          break;

        case 'none':
          console.log(
            `No action for comment ${comment_id}: ${analysis.reason}`,
          );
          break;
      }

      // Ensure post exists in database
      await prisma.post.upsert({
        where: { id: post_id },
        create: {
          id: post_id,
          pageId,
        },
        update: {},
      });

      // Log the action in database
      await prisma.comment.create({
        data: {
          id: comment_id,
          postId: post_id,
          pageId,
          message,
          fromId: from.id,
          fromName: from.name,
          createdTime: new Date(created_time * 1000),
          action: analysis.action,
          actionReason: analysis.reason,
        },
      });
    } catch (error) {
      console.error(`Error processing comment ${comment_id}:`, error);
    }
  }
}

/**
 * Main webhook handler
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // Handle GET request for webhook verification
  if (req.method === 'GET') {
    handleVerification(req, res);
    return;
  }

  // Handle POST request for webhook notifications
  if (req.method === 'POST') {
    // Get D1 binding from request env (Cloudflare Workers)
    const d1 = (req as any)?.env?.moderateur_bedones_db;
    const prisma = d1 ? createPrismaWithD1(d1) : defaultPrisma;

    // Verify the signature
    const signature = req.headers['x-hub-signature-256'] as string | undefined;
    const rawBody = JSON.stringify(req.body);

    if (!(await verifySignature(rawBody, signature))) {
      console.error('Invalid webhook signature');
      res.status(403).send('Forbidden');
      return;
    }

    const payload = req.body as FacebookWebhookPayload;

    // Process each entry in the payload
    if (payload.object === 'page') {
      // Process asynchronously and respond immediately
      Promise.all(
        payload.entry.map((entry) => processCommentNotification(entry, prisma)),
      ).catch((error) => {
        console.error('Error processing webhook entries:', error);
      });

      // Respond quickly to Facebook
      res.status(200).send('EVENT_RECEIVED');
    } else {
      res.status(404).send('Not Found');
    }
    return;
  }

  // Method not allowed
  res.status(405).send('Method Not Allowed');
}

// Disable body parsing to handle raw body for signature verification
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};
