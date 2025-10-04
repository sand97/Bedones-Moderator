import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Encryption/Decryption utilities using Web Crypto API (edge-compatible)
const IV_LENGTH = 12; // GCM uses 12 bytes

async function getEncryptionKey(): Promise<CryptoKey> {
  const secret = process.env.SESSION_SECRET || '';
  const encoder = new TextEncoder();
  const keyMaterial = encoder.encode(secret.padEnd(32, '0').slice(0, 32));

  return await crypto.subtle.importKey(
    'raw',
    keyMaterial,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encrypt(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const key = await getEncryptionKey();

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );

  // Combine IV and encrypted data
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);

  // Convert to hex
  return Array.from(combined)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function decrypt(text: string): Promise<string> {
  // Convert hex to bytes
  const bytes = new Uint8Array(text.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));

  // Split IV and encrypted data
  const iv = bytes.slice(0, IV_LENGTH);
  const data = bytes.slice(IV_LENGTH);
  const key = await getEncryptionKey();

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
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
    prismaClient?: PrismaClient,
  ) {
    const db = prismaClient || prisma;

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
    }
  }

  /**
   * Get decrypted page access token
   */
  static async getPageAccessToken(pageId: string, prismaClient?: PrismaClient): Promise<string> {
    const db = prismaClient || prisma;
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
