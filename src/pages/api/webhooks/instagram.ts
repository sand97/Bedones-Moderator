import { prisma } from '~/server/prisma';
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
async function _verifySignature(
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
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> {
  try {
    console.log('[Instagram Webhook] Handler called');

    const url = new URL(req.url!, `http://${req.headers.host}`);

    console.log('[Instagram Webhook] Method:', req.method);

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

      let payload = req.body as InstagramWebhookPayload;
      if (Array.isArray(payload)) {
        payload = payload[0];
      }

      console.log('Instagram webhook payload:', payload);

      // Process each entry in the payload
      if (payload.object === 'instagram') {
        // Process asynchronously and respond immediately
        Promise.all(
          payload.entry.map((entry) =>
            processCommentNotification(entry, prisma),
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
  } catch (error) {
    console.error('[Instagram Webhook] Error:', error);
    res.status(500).end('Internal Server Error');
  }
}
