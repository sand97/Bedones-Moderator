import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Encryption/Decryption utilities
const ENCRYPTION_KEY = Buffer.from(
  process.env.BETTER_AUTH_SECRET?.slice(0, 32) || '',
  'utf8',
);
const IV_LENGTH = 16;

function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text: string): string {
  const parts = text.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encryptedText = parts[1];
  const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

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
  ) {
    // Encrypt user access token
    const encryptedUserToken = encrypt(userAccessToken);

    // Get token expiry (default 60 days for long-lived tokens)
    const tokenExpiry = new Date();
    tokenExpiry.setDate(tokenExpiry.getDate() + 60);

    // Update user with encrypted access token
    await prisma.user.update({
      where: { id: userId },
      data: {
        accessToken: encryptedUserToken,
        accessTokenExpiry: tokenExpiry,
      },
    });

    // Save or update each page
    for (const page of pages) {
      const encryptedPageToken = encrypt(page.access_token);

      await prisma.page.upsert({
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
      await prisma.pageSettings.upsert({
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
    }
  }

  /**
   * Get decrypted page access token
   */
  static async getPageAccessToken(pageId: string): Promise<string> {
    const page = await prisma.page.findUnique({
      where: { id: pageId },
      select: { accessToken: true },
    });

    if (!page) {
      throw new Error('Page not found');
    }

    return decrypt(page.accessToken);
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
      throw new Error(`Failed to delete comment: ${response.statusText}`);
    }
  }

  /**
   * Reply to a comment on Facebook
   */
  static async replyToComment(
    commentId: string,
    message: string,
    pageAccessToken: string,
  ): Promise<void> {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${commentId}/comments?access_token=${pageAccessToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to reply to comment: ${response.statusText}`);
    }
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
