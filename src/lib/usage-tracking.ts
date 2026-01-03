/**
 * Usage Tracking Utilities
 *
 * Track AI usage, tokens consumed, and enforce subscription limits
 */

import type { PrismaClient } from '@prisma/client';
import { shouldResetUsage, getNextResetDate } from './subscription-utils';

/**
 * Estimate tokens used in a prompt
 * Rough estimation: 1 token ≈ 4 characters
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Estimate cost per token (in USD)
 * Grok 4: ~$0.0001 per 1K tokens
 * Gemini 2.5 Flash: ~$0.00005 per 1K tokens
 */
function estimateCost(tokens: number, model: 'grok' | 'gemini'): number {
  const costPer1kTokens = model === 'grok' ? 0.0001 : 0.00005;
  return (tokens / 1000) * costPer1kTokens;
}

/**
 * Track usage for a user
 */
export async function trackUsage(
  prisma: PrismaClient,
  userId: string,
  options: {
    commentsAnalyzed: number;
    promptTokens: number;
    completionTokens: number;
    model: 'grok' | 'gemini';
    provider: 'facebook' | 'instagram';
  }
): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Start of day

  const totalTokens = options.promptTokens + options.completionTokens;
  const estimatedCost = estimateCost(totalTokens, options.model);

  // Update or create usage tracking for today
  await prisma.usageTracking.upsert({
    where: {
      userId_date: {
        userId,
        date: today,
      },
    },
    update: {
      commentsAnalyzed: { increment: options.commentsAnalyzed },
      tokensUsed: { increment: totalTokens },
      facebookComments: options.provider === 'facebook' ? { increment: options.commentsAnalyzed } : undefined,
      instagramComments: options.provider === 'instagram' ? { increment: options.commentsAnalyzed } : undefined,
      estimatedCost: { increment: estimatedCost },
      updatedAt: new Date(),
    },
    create: {
      userId,
      date: today,
      commentsAnalyzed: options.commentsAnalyzed,
      tokensUsed: totalTokens,
      facebookComments: options.provider === 'facebook' ? options.commentsAnalyzed : 0,
      instagramComments: options.provider === 'instagram' ? options.commentsAnalyzed : 0,
      estimatedCost,
    },
  });

  // Update subscription monthly usage
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (subscription) {
    // Check if we need to reset monthly usage
    if (shouldResetUsage(subscription)) {
      await prisma.subscription.update({
        where: { userId },
        data: {
          currentMonthUsage: options.commentsAnalyzed,
          usageResetDate: getNextResetDate(),
          updatedAt: new Date(),
        },
      });
    } else {
      // Just increment
      await prisma.subscription.update({
        where: { userId },
        data: {
          currentMonthUsage: { increment: options.commentsAnalyzed },
          updatedAt: new Date(),
        },
      });
    }
  }
}

/**
 * Get usage statistics for a user
 */
export async function getUserUsageStats(
  prisma: PrismaClient,
  userId: string,
  options?: {
    startDate?: Date;
    endDate?: Date;
  }
): Promise<{
  totalCommentsAnalyzed: number;
  totalTokensUsed: number;
  totalCost: number;
  dailyBreakdown: {
    date: Date;
    commentsAnalyzed: number;
    tokensUsed: number;
    facebookComments: number;
    instagramComments: number;
    estimatedCost: number;
  }[];
  platformBreakdown: {
    facebook: number;
    instagram: number;
  };
}> {
  const where: any = { userId };

  if (options?.startDate || options?.endDate) {
    where.date = {};
    if (options.startDate) {
      where.date.gte = options.startDate;
    }
    if (options.endDate) {
      where.date.lte = options.endDate;
    }
  }

  const usageRecords = await prisma.usageTracking.findMany({
    where,
    orderBy: { date: 'desc' },
  });

  const totalCommentsAnalyzed = usageRecords.reduce(
    (sum, record) => sum + record.commentsAnalyzed,
    0
  );
  const totalTokensUsed = usageRecords.reduce(
    (sum, record) => sum + record.tokensUsed,
    0
  );
  const totalCost = usageRecords.reduce(
    (sum, record) => sum + record.estimatedCost,
    0
  );

  const platformBreakdown = {
    facebook: usageRecords.reduce((sum, record) => sum + record.facebookComments, 0),
    instagram: usageRecords.reduce((sum, record) => sum + record.instagramComments, 0),
  };

  return {
    totalCommentsAnalyzed,
    totalTokensUsed,
    totalCost,
    dailyBreakdown: usageRecords.map((record) => ({
      date: record.date,
      commentsAnalyzed: record.commentsAnalyzed,
      tokensUsed: record.tokensUsed,
      facebookComments: record.facebookComments,
      instagramComments: record.instagramComments,
      estimatedCost: record.estimatedCost,
    })),
    platformBreakdown,
  };
}

/**
 * Simple token estimation from text
 */
export function estimatePromptTokens(systemPrompt: string, userMessage: string): number {
  return estimateTokens(systemPrompt + userMessage);
}

/**
 * Estimate completion tokens (response)
 * Typically 100-300 tokens for moderation decisions
 */
export function estimateCompletionTokens(): number {
  return 200; // Average response size
}
