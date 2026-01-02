// Use edge runtime for Cloudflare deployment
export const runtime = 'edge';

import { getRequestContext } from '@cloudflare/next-on-pages';
import { createPrismaWithD1, prisma as defaultPrisma } from '~/server/prisma';
import { FacebookService } from '~/server/services/facebook';
import { AIService } from '~/server/services/ai';
import type { NextApiRequest, NextApiResponse } from 'next';

interface FacebookWebhookFrom {
  id: string;
  name: string;
}

interface FacebookWebhookPost {
  status_type: string;
  is_published: boolean;
  updated_time: string;
  permalink_url: string;
  promotion_status: string;
  id: string;
}

interface FacebookWebhookChangeValue {
  from: FacebookWebhookFrom;
  post?: FacebookWebhookPost;
  message: string;
  post_id: string;
  comment_id: string;
  created_time: number;
  item: string;
  parent_id: string;
  verb: string;
}

interface FacebookWebhookChange {
  value: FacebookWebhookChangeValue;
  field: string;
}

interface FacebookWebhookEntry {
  id: string;
  time: number;
  changes: FacebookWebhookChange[];
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
    ['sign'],
  );

  const signatureBytes = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(payload),
  );

  const expectedSignature = Array.from(new Uint8Array(signatureBytes))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return `sha256=${expectedSignature}` === signature;
}

/**
 * Handle webhook verification challenge from Facebook
 */
function handleVerification(url: URL): { status: number; body: string } {
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  if (
    mode === 'subscribe' &&
    token === process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN
  ) {
    console.log('Webhook verified successfully');
    return { status: 200, body: challenge || '' };
  } else {
    console.error('Webhook verification failed');
    return { status: 403, body: 'Forbidden' };
  }
}

/**
 * Process a comment webhook notification
 */
async function processCommentNotification(
  entry: FacebookWebhookEntry,
  prisma: any,
) {
  for (const change of entry.changes) {
    if (change.field !== 'feed' || change.value.item !== 'comment') {
      continue;
    }

    const { comment_id, post_id, from, message, created_time, post } =
      change.value;

    // Extract page ID from entry
    const pageId = entry.id;

    // IMPORTANT: Skip comments FROM the page itself to avoid processing our own replies
    if (from.id === pageId) {
      console.log(
        `[Facebook Webhook] Skipping comment ${comment_id} from page ${pageId} (own comment)`,
      );
      continue;
    }

    // Build permalink URLs
    const postPermalinkUrl = post?.permalink_url || null;
    const commentPermalinkUrl = postPermalinkUrl
      ? `${postPermalinkUrl}?comment_id=${comment_id}`
      : null;

    try {
      // Get page and settings from database
      const page = await prisma.page.findUnique({
        where: { id: pageId },
        include: {
          settings: {
            include: {
              faqRules: true
            }
          }
        },
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
          faqRules: page.settings.faqRules || [],
        },
      });

      console.log('AI analysis:', analysis);

      // Get page access token
      const pageAccessToken = await FacebookService.getPageAccessToken(
        pageId,
        prisma,
      );

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
          permalinkUrl: postPermalinkUrl,
        },
        update: {
          permalinkUrl: postPermalinkUrl,
        },
      });

      // Log the action in database (upsert in case comment is edited)
      await prisma.comment.upsert({
        where: { id: comment_id },
        create: {
          id: comment_id,
          postId: post_id,
          pageId,
          message,
          fromId: from.id,
          fromName: from.name,
          createdTime: new Date(created_time * 1000),
          action: analysis.action,
          actionReason: analysis.reason,
          replyMessage: analysis.replyMessage || null,
          permalinkUrl: commentPermalinkUrl,
        },
        update: {
          message,
          action: analysis.action,
          actionReason: analysis.reason,
          replyMessage: analysis.replyMessage || null,
          permalinkUrl: commentPermalinkUrl,
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
  req: NextApiRequest | Request,
  res?: NextApiResponse,
): Promise<void | Response> {
  // Check if we're in Edge runtime by testing if req is a Web Request
  const isEdgeRuntime = req instanceof Request;

  // Handle Next.js API route (Node.js runtime - local dev)
  if (!isEdgeRuntime && res) {
    try {
      console.log('[Webhook] Node.js runtime');

      if (!defaultPrisma) {
        console.error('[Webhook] No Prisma client available');
        res.status(500).end('Database not configured');
        return;
      }

      const nodeReq = req;
      const url = new URL(nodeReq.url!, `http://${nodeReq.headers.host}`);

      console.log('[Webhook] Handler called, method:', nodeReq.method);

      // Handle GET request for webhook verification
      if (nodeReq.method === 'GET') {
        const result = handleVerification(url);
        res.status(result.status).end(result.body);
        return;
      }

      // Handle POST request for webhook notifications
      if (nodeReq.method === 'POST') {
        // Signature verification disabled for local dev
        // const rawBody = JSON.stringify(nodeReq.body);
        // const signature = nodeReq.headers['x-hub-signature-256'] as string | undefined;
        // if (!(await verifySignature(rawBody, signature))) {
        //   console.error('Invalid webhook signature');
        //   return res.status(403).end('Forbidden');
        // }

        let payload = nodeReq.body as FacebookWebhookPayload;
        if (Array.isArray(payload)) {
          payload = payload[0];
        }

        console.log('Payload webhook', payload);

        // Process each entry in the payload
        if (payload.object === 'page') {
          // Process asynchronously and respond immediately
          Promise.all(
            payload.entry.map((entry) =>
              processCommentNotification(entry, defaultPrisma),
            ),
          ).catch((error) => {
            console.error('Error processing webhook entries:', error);
          });

          // Respond quickly to Facebook
          res.status(200).end('EVENT_RECEIVED');
          return;
        } else {
          res.status(404).end('Not Found');
          return;
        }
      }

      // Method not allowed
      res.status(405).end('Method Not Allowed');
      return;
    } catch (error) {
      console.error('[Webhook] Error:', error);
      res.status(500).end('Internal Server Error');
      return;
    }
  }

  // Handle Edge runtime (Cloudflare - production)
  const request = req as Request;

  try {
    console.log('[Webhook] Edge runtime');

    const { env } = getRequestContext();
    const d1 = env.moderateur_bedones_db;

    if (!d1) {
      return new Response('Database not configured', { status: 500 });
    }

    const prisma = createPrismaWithD1(d1);
    const url = new URL(request.url);

    console.log('[Webhook] Handler called, method:', request.method);

    // Handle GET request for webhook verification
    if (request.method === 'GET') {
      const result = handleVerification(url);
      return new Response(result.body, { status: result.status });
    }

    // Handle POST request for webhook notifications
    if (request.method === 'POST') {
      // Verify the signature
      const signature = request.headers.get('x-hub-signature-256');
      const rawBody = await request.text();

      if (!(await verifySignature(rawBody, signature || undefined))) {
        console.error('Invalid webhook signature');
        return new Response('Forbidden', { status: 403 });
      }

      let payload = JSON.parse(rawBody) as FacebookWebhookPayload;

      if (Array.isArray(payload)) {
        payload = payload[0];
      }

      // Process each entry in the payload
      if (payload.object === 'page') {
        try {
          await Promise.all(
            payload.entry.map((entry) =>
              processCommentNotification(entry, prisma),
            ),
          );
          console.log('Webhook processed successfully');
        } catch (error) {
          console.error('Error processing webhook entries:', error);
        }
        // Respond quickly to Facebook
        return new Response('EVENT_RECEIVED', { status: 200 });
      } else {
        console.log('Webhook not found');
        return new Response('Not Found', { status: 404 });
      }
    }

    // Method not allowed
    return new Response('Method Not Allowed', { status: 405 });
  } catch (error) {
    console.error('[Webhook] Error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
