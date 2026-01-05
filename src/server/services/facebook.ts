import { PrismaClient } from '@prisma/client';
import { encrypt, decrypt } from './encryption';

export interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
}

export class FacebookService {
  /**
   * Fetch user's Facebook pages using the user access token
   */
  static async fetchUserPages(
    userAccessToken: string,
  ): Promise<FacebookPage[]> {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?access_token=${userAccessToken}`,
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch pages: ${response.statusText}`);
    }

    const data: { data?: FacebookPage[] } = await response.json();
    return data.data || [];
  }

  /**
   * Save user's pages to database with encrypted access tokens
   */
  static async saveUserPages(
    userId: string,
    userAccessToken: string,
    pages: FacebookPage[],
    prismaClient: PrismaClient,
  ) {
    const db = prismaClient;

    // Encrypt user access token
    const encryptedUserToken = await encrypt(userAccessToken);

    // Get token expiry (default 60 days for long-lived tokens)
    const tokenExpiry = new Date();
    tokenExpiry.setDate(tokenExpiry.getDate() + 60);

    // Update user with encrypted access token
    await db.user.update({
      where: { id: userId },
      data: {
        accessToken: encryptedUserToken,
        accessTokenExpiry: tokenExpiry,
      },
    });

    // Save or update each page
    for (const page of pages) {
      const encryptedPageToken = await encrypt(page.access_token);

      await db.page.upsert({
        where: { id: page.id },
        create: {
          id: page.id,
          name: page.name,
          accessToken: encryptedPageToken,
          userId,
        },
        update: {
          name: page.name,
          accessToken: encryptedPageToken,
        },
      });

      // Create default page settings if they don't exist
      await db.pageSettings.upsert({
        where: { pageId: page.id },
        create: {
          pageId: page.id,
          undesiredCommentsEnabled: false,
          undesiredCommentsAction: 'hide',
          spamDetectionEnabled: false,
          spamAction: 'delete',
          intelligentFAQEnabled: false,
        },
        update: {},
      });

      // Subscribe page to webhook
      try {
        const response = await this.subscribePageToWebhook(
          page.id,
          page.access_token,
        );
        console.log(
          `[Facebook Webhook] ✓ Subscribed page ${page.id} (${page.name}) to webhook`,
          response,
        );
      } catch (error) {
        console.error(
          `[Facebook Webhook] ✗ Failed to subscribe page ${page.id} (${page.name}):`,
          error,
        );
      }
    }
  }

  /**
   * Get decrypted page access token
   */
  static async getPageAccessToken(
    pageId: string,
    prismaClient: PrismaClient,
  ): Promise<string> {
    const db = prismaClient;
    const page = await db.page.findUnique({
      where: { id: pageId },
      select: { accessToken: true },
    });

    if (!page) {
      throw new Error('Page not found');
    }

    return await decrypt(page.accessToken);
  }

  /**
   * Hide a comment on Facebook
   */
  static async hideComment(
    commentId: string,
    pageAccessToken: string,
  ): Promise<void> {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${commentId}?access_token=${pageAccessToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_hidden: true }),
      },
    );

    if (!response.ok) {
      console.error(response);
      throw new Error(`Failed to hide comment: ${response.statusText}`);
    }
  }

  /**
   * Delete a comment on Facebook
   */
  static async deleteComment(
    commentId: string,
    pageAccessToken: string,
  ): Promise<void> {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${commentId}?access_token=${pageAccessToken}`,
      {
        method: 'DELETE',
      },
    );

    if (!response.ok) {
      console.error(response);
      throw new Error(`Failed to delete comment: ${response.statusText}`);
    }
  }

  /**
   * Get random delay between min and max seconds (in milliseconds)
   */
  static getRandomDelay(minSeconds: number, maxSeconds: number): number {
    const min = minSeconds * 1000;
    const max = maxSeconds * 1000;
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  /**
   * Wait for a random delay before replying (to trigger notifications on Facebook)
   */
  static async waitBeforeReply(): Promise<void> {
    const delay = this.getRandomDelay(4, 10);
    console.log(`[Facebook] Waiting ${delay / 1000} seconds before replying...`);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  /**
   * Reply to a comment on Facebook
   * @param commentId - The ID of the comment to reply to
   * @param message - The message content
   * @param pageAccessToken - The page access token
   * @param mentionUserId - Optional PSID of the user to mention/tag in the reply
   */
  static async replyToComment(
    commentId: string,
    message: string,
    pageAccessToken: string,
    mentionUserId?: string,
  ): Promise<void> {
    // Add mention at the beginning of the message if mentionUserId is provided
    // Format: @[PSID] according to Facebook Pages API documentation
    const finalMessage = mentionUserId
      ? `@[${mentionUserId}] ${message}`
      : message;

    console.log(
      `[Facebook] Replying to comment ${commentId} with message: "${finalMessage.substring(0, 50)}${finalMessage.length > 50 ? '...' : ''}"`,
    );

    const response = await fetch(
      `https://graph.facebook.com/v21.0/${commentId}/comments?access_token=${pageAccessToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: finalMessage }),
      },
    );

    const responseData = await response.json();

    if (!response.ok) {
      console.error('[Facebook] Reply failed:', {
        status: response.status,
        statusText: response.statusText,
        error: responseData,
      });
      throw new Error(
        `Failed to reply to comment: ${response.statusText} - ${JSON.stringify(responseData)}`,
      );
    }

    console.log('[Facebook] Reply successful:', {
      commentId,
      response: responseData,
    });
  }

  /**
   * Subscribe a page to the app's webhook
   */
  static async subscribePageToWebhook(
    pageId: string,
    pageAccessToken: string,
  ): Promise<{ success: boolean }> {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${pageId}/subscribed_apps?subscribed_fields=feed&access_token=${pageAccessToken}`,
      {
        method: 'POST',
      },
    );

    if (!response.ok) {
      console.error(response);
      const error = await response.text();
      throw new Error(`Failed to subscribe page to webhook: ${error}`);
    }

    return await response.json();
  }

  /**
   * Fetch comments for a page
   */
  static async fetchPageComments(
    pageId: string,
    pageAccessToken: string,
  ): Promise<any[]> {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${pageId}/feed?fields=comments{id,message,created_time,from}&access_token=${pageAccessToken}`,
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch comments: ${response.statusText}`);
    }

    const data: { data?: any[] } = await response.json();
    const posts = data.data || [];

    // Flatten all comments from all posts
    const allComments = posts.flatMap((post: any) => post.comments?.data || []);

    return allComments;
  }
}
