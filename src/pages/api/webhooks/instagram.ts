// Use edge runtime for Cloudflare deployment
export const runtime = 'edge';

import { getRequestContext } from '@cloudflare/next-on-pages';
import { createPrismaWithD1, prisma as defaultPrisma } from '~/server/prisma';
import { InstagramService } from '~/server/services/instagram';
import { AIService } from '~/server/services/ai';
import type { NextApiRequest, NextApiResponse } from 'next';

interface InstagramWebhookFrom {
  id: string;
  username: string;
}

interface InstagramWebhookMedia {
  id: string;
  media_product_type?: string;
  permalink?: string;
}

interface InstagramWebhookChangeValue {
  from: InstagramWebhookFrom;
  media?: InstagramWebhookMedia;
  id: string; // comment ID
  text: string;
  timestamp?: string;
}

interface InstagramWebhookChange {
  value: InstagramWebhookChangeValue;
  field: string; // 'comments' or 'mentions'
}

interface InstagramWebhookEntry {
  id: string; // Instagram account ID
  time: number;
  changes: InstagramWebhookChange[];
}

interface InstagramWebhookPayload {
  object: string; // 'instagram'
  entry: InstagramWebhookEntry[];
}

/**
 * Verify the webhook signature from Instagram using Web Crypto API
 */
async function verifySignature(
  payload: string,
  signature: string | undefined,
): Promise<boolean> {
  if (!signature || !process.env.INSTAGRAM_APP_SECRET) {
    return false;
  }

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(process.env.INSTAGRAM_APP_SECRET),
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
 * Handle webhook verification challenge from Instagram
 */
function handleVerification(url: URL): { status: number; body: string } {
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  if (
    mode === 'subscribe' &&
    token === process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN
  ) {
    console.log('Instagram webhook verified successfully');
    return { status: 200, body: challenge || '' };
  } else {
    console.error('Instagram webhook verification failed');
    return { status: 403, body: 'Forbidden' };
  }
}

/**
 * Process a comment webhook notification from Instagram
 */
async function processCommentNotification(
  entry: InstagramWebhookEntry,
  prisma: any,
) {
  for (const change of entry.changes) {
    if (change.field !== 'comments') {
      continue;
    }

    const { id: commentId, text, from, media, timestamp } = change.value;

    // Extract Instagram account ID from entry
    const instagramAccountId = entry.id;

    // IMPORTANT: Skip comments FROM the account itself to avoid processing our own replies
    if (from.id === instagramAccountId) {
      console.log(
        `[Instagram Webhook] Skipping comment ${commentId} from account ${instagramAccountId} (own comment)`,
      );
      continue;
    }

    // Build permalink URLs
    const mediaPermalinkUrl = media?.permalink || null;
    const mediaId = media?.id || null;
    const commentPermalinkUrl = mediaPermalinkUrl
      ? `${mediaPermalinkUrl}`
      : null;

    try {
      // Get Instagram account (stored as Page with provider INSTAGRAM) and settings from database
      const page = await prisma.page.findUnique({
        where: { id: instagramAccountId, provider: 'INSTAGRAM' },
        include: {
          settings: {
            include: {
              faqRules: true,
            },
          },
        },
      });

      if (!page?.settings) {
        console.error(
          `Instagram account ${instagramAccountId} not found or has no settings`,
        );
        continue;
      }

      // Skip if all features are disabled
      if (
        !page.settings.undesiredCommentsEnabled &&
        !page.settings.spamDetectionEnabled &&
        !page.settings.intelligentFAQEnabled
      ) {
        console.log(
          'All moderation features disabled for this Instagram account',
        );
        continue;
      }

      // Analyze comment with AI
      const analysis = await AIService.analyzeComment({
        comment: {
          id: commentId,
          message: text,
          from: {
            id: from.id,
            name: from.username,
          },
          created_time: timestamp || new Date().toISOString(),
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

      console.log('AI analysis for Instagram comment:', analysis);

      // Get Instagram account access token
      const accessToken = await InstagramService.getInstagramAccessToken(
        instagramAccountId,
        prisma,
      );

      console.log('[Instagram Webhook] Access token length:', accessToken.length);
      console.log('[Instagram Webhook] Access token (first 30 chars):', accessToken.substring(0, 30));
      console.log('[Instagram Webhook] Access token (last 30 chars):', accessToken.substring(accessToken.length - 30));

      // Execute action based on AI analysis
      switch (analysis.action) {
        case 'hide':
          await InstagramService.hideComment(commentId, accessToken);
          console.log(
            `Hidden Instagram comment ${commentId}: ${analysis.reason}`,
          );
          break;

        case 'delete':
          await InstagramService.deleteComment(commentId, accessToken);
          console.log(
            `Deleted Instagram comment ${commentId}: ${analysis.reason}`,
          );
          break;

        case 'reply':
          if (analysis.replyMessage) {
            await InstagramService.replyToComment(
              commentId,
              analysis.replyMessage,
              accessToken,
            );
            console.log(
              `Replied to Instagram comment ${commentId}: ${analysis.reason}`,
            );
          }
          break;

        case 'none':
          console.log(
            `No action for Instagram comment ${commentId}: ${analysis.reason}`,
          );
          break;
      }

      // Ensure media/post exists in database
      if (mediaId) {
        await prisma.post.upsert({
          where: { id: mediaId },
          create: {
            id: mediaId,
            pageId: instagramAccountId,
            permalinkUrl: mediaPermalinkUrl,
          },
          update: {
            permalinkUrl: mediaPermalinkUrl,
          },
        });
      }

      // Log the action in database (upsert in case comment is edited)
      await prisma.comment.upsert({
        where: { id: commentId },
        create: {
          id: commentId,
          postId: mediaId || 'unknown',
          pageId: instagramAccountId,
          message: text,
          fromId: from.id,
          fromName: from.username,
          createdTime: timestamp ? new Date(timestamp) : new Date(),
          action: analysis.action,
          actionReason: analysis.reason,
          replyMessage: analysis.replyMessage || null,
          permalinkUrl: commentPermalinkUrl,
        },
        update: {
          message: text,
          action: analysis.action,
          actionReason: analysis.reason,
          replyMessage: analysis.replyMessage || null,
          permalinkUrl: commentPermalinkUrl,
        },
      });
    } catch (error) {
      console.error(`Error processing Instagram comment ${commentId}:`, error);
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
      console.log('[Instagram Webhook] Node.js runtime');

      if (!defaultPrisma) {
        console.error('[Instagram Webhook] No Prisma client available');
        res.status(500).end('Database not configured');
        return;
      }

      const nodeReq = req;
      const url = new URL(nodeReq.url!, `http://${nodeReq.headers.host}`);

      console.log(
        '[Instagram Webhook] Handler called, method:',
        nodeReq.method,
      );

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

        let payload = nodeReq.body as InstagramWebhookPayload;
        if (Array.isArray(payload)) {
          payload = payload[0];
        }

        console.log('Instagram webhook payload:', payload);

        // Process each entry in the payload
        if (payload.object === 'instagram') {
          // Process asynchronously and respond immediately
          Promise.all(
            payload.entry.map((entry) =>
              processCommentNotification(entry, defaultPrisma),
            ),
          ).catch((error) => {
            console.error('Error processing Instagram webhook entries:', error);
          });

          // Respond quickly to Instagram/Facebook
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
      console.error('[Instagram Webhook] Error:', error);
      res.status(500).end('Internal Server Error');
      return;
    }
  }

  // Handle Edge runtime (Cloudflare - production)
  const request = req as Request;

  try {
    console.log('[Instagram Webhook] Edge runtime');

    const { env } = getRequestContext();
    const d1 = env.moderateur_bedones_db;

    if (!d1) {
      return new Response('Database not configured', { status: 500 });
    }

    const prisma = createPrismaWithD1(d1);
    const url = new URL(request.url);

    console.log('[Instagram Webhook] Handler called, method:', request.method);

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
        console.error('Invalid Instagram webhook signature');
        return new Response('Forbidden', { status: 403 });
      }

      let payload = JSON.parse(rawBody) as InstagramWebhookPayload;

      console.log('Instagram webhook payload:', payload);

      if (Array.isArray(payload)) {
        payload = payload[0];
      }

      // Process each entry in the payload
      if (payload.object === 'instagram') {
        try {
          await Promise.all(
            payload.entry.map((entry) =>
              processCommentNotification(entry, prisma),
            ),
          );
          console.log('Instagram webhook processed successfully');
        } catch (error) {
          console.error('Error processing Instagram webhook entries:', error);
        }
        // Respond quickly to Instagram/Facebook
        return new Response('EVENT_RECEIVED', { status: 200 });
      } else {
        console.log('Instagram webhook not found');
        return new Response('Not Found', { status: 404 });
      }
    }

    // Method not allowed
    return new Response('Method Not Allowed', { status: 405 });
  } catch (error) {
    console.error('[Instagram Webhook] Error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
