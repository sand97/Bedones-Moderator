import { PrismaClient } from '@prisma/client';
import { encrypt, decrypt } from './encryption';

export interface InstagramBusinessAccount {
  id: string;
  username: string;
  name?: string;
  profile_picture_url?: string;
  followers_count?: number;
  follows_count?: number;
  media_count?: number;
}

export interface FacebookPageWithInstagram {
  id: string;
  name: string;
  access_token: string;
  instagram_business_account?: {
    id: string;
  };
}

export class InstagramService {
  /**
   * Fetch user's Instagram Business accounts through Facebook Pages
   */
  static async fetchUserInstagramAccounts(
    userAccessToken: string,
  ): Promise<
    (InstagramBusinessAccount & { pageId: string; pageAccessToken: string })[]
  > {
    // First, get all Facebook pages
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=${userAccessToken}`,
    );

    if (!pagesResponse.ok) {
      throw new Error(`Failed to fetch pages: ${pagesResponse.statusText}`);
    }

    const pagesData: { data?: FacebookPageWithInstagram[] } =
      await pagesResponse.json();
    const pages = pagesData.data || [];

    // Filter pages that have Instagram Business accounts
    const pagesWithInstagram = pages.filter(
      (page) => page.instagram_business_account?.id,
    );

    // Fetch detailed info for each Instagram account
    const instagramAccounts = await Promise.all(
      pagesWithInstagram.map(async (page) => {
        const igAccountId = page.instagram_business_account!.id;

        try {
          const igResponse = await fetch(
            `https://graph.facebook.com/v21.0/${igAccountId}?fields=id,username,name,profile_picture_url,followers_count,follows_count,media_count&access_token=${page.access_token}`,
          );

          if (!igResponse.ok) {
            console.error(
              `Failed to fetch Instagram account ${igAccountId}:`,
              await igResponse.text(),
            );
            return null;
          }

          const igAccount: InstagramBusinessAccount = await igResponse.json();

          return {
            ...igAccount,
            pageId: page.id,
            pageAccessToken: page.access_token,
          };
        } catch (error) {
          console.error(
            `Error fetching Instagram account ${igAccountId}:`,
            error,
          );
          return null;
        }
      }),
    );

    // Filter out null values (failed requests)
    return instagramAccounts.filter(
      (account) => account !== null,
    ) as (InstagramBusinessAccount & {
      pageId: string;
      pageAccessToken: string;
    })[];
  }

  /**
   * Save user's Instagram accounts to database with encrypted access tokens
   */
  static async saveUserInstagramAccounts(
    userId: string,
    userAccessToken: string,
    accounts: (InstagramBusinessAccount & {
      pageId: string;
      pageAccessToken: string;
    })[],
    prismaClient: PrismaClient,
  ) {
    const db = prismaClient;

    // Encrypt user access token
    const encryptedUserToken = await encrypt(userAccessToken);

    // Get token expiry (default 60 days for long-lived tokens)
    const tokenExpiry = new Date();
    tokenExpiry.setDate(tokenExpiry.getDate() + 60);

    // Get the first Instagram account's username to update the user's name
    const primaryUsername = accounts[0]?.username;

    // Update user with encrypted access token and username
    await db.user.update({
      where: { id: userId },
      data: {
        accessToken: encryptedUserToken,
        accessTokenExpiry: tokenExpiry,
        ...(primaryUsername && { name: primaryUsername }),
      },
    });

    // Save or update each Instagram account as a Page with provider = INSTAGRAM
    for (const account of accounts) {
      const encryptedPageToken = await encrypt(account.pageAccessToken);

      await db.page.upsert({
        where: { id: account.id },
        create: {
          id: account.id,
          provider: 'INSTAGRAM',
          username: account.username,
          name: account.name || account.username,
          profilePictureUrl: account.profile_picture_url,
          followersCount: account.followers_count,
          accessToken: encryptedPageToken,
          userId,
        },
        update: {
          username: account.username,
          name: account.name || account.username,
          profilePictureUrl: account.profile_picture_url,
          followersCount: account.followers_count,
          accessToken: encryptedPageToken,
        },
      });

      // Create default page settings if they don't exist
      await db.pageSettings.upsert({
        where: { pageId: account.id },
        create: {
          pageId: account.id,
          undesiredCommentsEnabled: false,
          undesiredCommentsAction: 'hide',
          spamDetectionEnabled: false,
          spamAction: 'delete',
          intelligentFAQEnabled: false,
        },
        update: {},
      });

      // Subscribe Instagram account to webhook
      try {
        const response = await this.subscribeInstagramToWebhook(
          account.id,
          account.pageAccessToken,
        );
        console.log(
          `[Instagram Webhook] ✓ Subscribed account ${account.id} (@${account.username}) to webhook`,
          response,
        );
      } catch (error) {
        console.error(
          `[Instagram Webhook] ✗ Failed to subscribe account ${account.id} (@${account.username}):`,
          error,
        );
      }
    }
  }

  /**
   * Get decrypted Instagram account access token
   */
  static async getInstagramAccessToken(
    accountId: string,
    prismaClient: PrismaClient,
  ): Promise<string> {
    const db = prismaClient;
    const page = await db.page.findUnique({
      where: { id: accountId },
      select: { accessToken: true, provider: true },
    });

    if (!page || page.provider !== 'INSTAGRAM') {
      throw new Error('Instagram account not found');
    }

    return await decrypt(page.accessToken);
  }

  /**
   * Hide a comment on Instagram
   */
  static async hideComment(
    commentId: string,
    accessToken: string,
  ): Promise<void> {
    // IMPORTANT: Use graph.instagram.com for Instagram Platform API (Instagram Login)
    // The 'hide' parameter must be a query parameter, not in the JSON body
    const response = await fetch(
      `https://graph.instagram.com/v21.0/${commentId}?hide=true&access_token=${accessToken}`,
      {
        method: 'POST',
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Instagram] Hide comment failed:', errorText);
      throw new Error(
        `Failed to hide Instagram comment: ${response.statusText}`,
      );
    }
  }

  /**
   * Delete a comment on Instagram
   */
  static async deleteComment(
    commentId: string,
    accessToken: string,
  ): Promise<void> {
    const response = await fetch(
      `https://graph.instagram.com/v21.0/${commentId}?access_token=${accessToken}`,
      {
        method: 'DELETE',
      },
    );

    if (!response.ok) {
      console.error(response);
      throw new Error(
        `Failed to delete Instagram comment: ${response.statusText}`,
      );
    }
  }

  /**
   * Reply to a comment on Instagram
   */
  static async replyToComment(
    commentId: string,
    message: string,
    accessToken: string,
  ): Promise<void> {
    const response = await fetch(
      `https://graph.instagram.com/v21.0/${commentId}/replies?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      },
    );

    if (!response.ok) {
      console.error(response);
      throw new Error(
        `Failed to reply to Instagram comment: ${response.statusText}`,
      );
    }
  }

  /**
   * Subscribe Instagram account to webhook notifications
   */
  static async subscribeInstagramToWebhook(
    instagramAccountId: string,
    pageAccessToken: string,
  ): Promise<any> {
    // Note: For Instagram Platform API, use graph.instagram.com
    const response = await fetch(
      `https://graph.instagram.com/v21.0/${instagramAccountId}/subscribed_apps?subscribed_fields=comments,mentions&access_token=${pageAccessToken}`,
      {
        method: 'POST',
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to subscribe Instagram to webhook: ${errorText}`);
    }

    return await response.json();
  }
}
