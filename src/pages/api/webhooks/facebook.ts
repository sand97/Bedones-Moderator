import { prisma } from '~/server/prisma';
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
async function _verifySignature(
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
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> {
  try {
    console.log('[Webhook] Handler called');

    const url = new URL(req.url!, `http://${req.headers.host}`);

    console.log('[Webhook] Method:', req.method);

    // Handle GET request for webhook verification
    if (req.method === 'GET') {
      const result = handleVerification(url);
      res.status(result.status).end(result.body);
      return;
    }

    // Handle POST request for webhook notifications
    if (req.method === 'POST') {
      // Signature verification disabled for local dev
      // const rawBody = JSON.stringify(req.body);
      // const signature = req.headers['x-hub-signature-256'] as string | undefined;
      // if (!(await verifySignature(rawBody, signature))) {
      //   console.error('Invalid webhook signature');
      //   return res.status(403).end('Forbidden');
      // }

      let payload = req.body as FacebookWebhookPayload;
      if (Array.isArray(payload)) {
        payload = payload[0];
      }

      console.log('Payload webhook', payload);

      // Process each entry in the payload
      if (payload.object === 'page') {
        // Process asynchronously and respond immediately
        Promise.all(
          payload.entry.map((entry) =>
            processCommentNotification(entry, prisma),
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
  } catch (error) {
    console.error('[Webhook] Error:', error);
    res.status(500).end('Internal Server Error');
  }
}
