/**
 * Resend Webhook Endpoint
 * Receives email delivery, open, click, bounce events from Resend
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../server/prisma';
import type { EmailStatus } from '@prisma/client';

interface ResendWebhookEvent {
  type: 'email.sent' | 'email.delivered' | 'email.bounced' | 'email.complained' | 'email.opened' | 'email.clicked';
  created_at: string;
  data: {
    email_id: string;
    from: string;
    to: string[];
    subject: string;
    created_at: string;
    headers?: Record<string, string>;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const event = req.body as ResendWebhookEvent;

    console.log(`📧 Resend webhook received: ${event.type} for ${event.data.email_id}`);

    // Find email log by Resend ID
    const emailLog = await prisma.emailLog.findFirst({
      where: {
        resendId: event.data.email_id,
      },
      include: {
        campaign: true,
      },
    });

    if (!emailLog) {
      console.warn(`⚠️ Email log not found for Resend ID: ${event.data.email_id}`);
      // Return 200 anyway to acknowledge receipt
      return res.status(200).json({ received: true });
    }

    // Map Resend event type to our EmailStatus
    let status: EmailStatus | null = null;
    const updateData: any = {
      updatedAt: new Date(),
    };

    switch (event.type) {
      case 'email.sent':
        status = 'SENT';
        updateData.sentAt = new Date(event.created_at);
        break;

      case 'email.delivered':
        status = 'DELIVERED';
        updateData.deliveredAt = new Date(event.created_at);
        break;

      case 'email.opened':
        status = 'OPENED';
        if (!emailLog.openedAt) {
          updateData.openedAt = new Date(event.created_at);
        }
        updateData.openCount = { increment: 1 };
        break;

      case 'email.clicked':
        status = 'CLICKED';
        if (!emailLog.clickedAt) {
          updateData.clickedAt = new Date(event.created_at);
        }
        updateData.clickCount = { increment: 1 };
        break;

      case 'email.bounced':
        status = 'BOUNCED';
        updateData.bouncedAt = new Date(event.created_at);
        updateData.errorMessage = 'Email bounced';
        break;

      case 'email.complained':
        // Mark as failed for spam complaints
        status = 'FAILED';
        updateData.errorMessage = 'Spam complaint';
        break;

      default:
        console.warn(`⚠️ Unknown Resend event type: ${String(event.type)}`);
        return res.status(200).json({ received: true });
    }

    if (status) {
      updateData.status = status;
    }

    // Update email log
    await prisma.emailLog.update({
      where: { id: emailLog.id },
      data: updateData,
    });

    // Update campaign statistics
    const campaignUpdate: any = {};

    if (status === 'DELIVERED') {
      campaignUpdate.totalDelivered = { increment: 1 };
    } else if (status === 'OPENED') {
      // Only increment totalOpened on first open
      if (!emailLog.openedAt) {
        campaignUpdate.totalOpened = { increment: 1 };
      }
    } else if (status === 'CLICKED') {
      // Only increment totalClicked on first click
      if (!emailLog.clickedAt) {
        campaignUpdate.totalClicked = { increment: 1 };
      }
    } else if (status === 'BOUNCED') {
      campaignUpdate.totalBounced = { increment: 1 };
    } else if (status === 'FAILED') {
      campaignUpdate.totalFailed = { increment: 1 };
    }

    if (Object.keys(campaignUpdate).length > 0) {
      await prisma.emailCampaign.update({
        where: { id: emailLog.campaignId },
        data: campaignUpdate,
      });
    }

    console.log(`✅ Email status updated: ${emailLog.trackingId} → ${status}`);

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('❌ Error processing Resend webhook:', error);
    // Return 200 to prevent Resend from retrying
    return res.status(200).json({ received: true, error: 'Processing error' });
  }
}
