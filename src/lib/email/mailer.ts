/**
 * Email Mailer - Resend Integration
 * Handles sending emails and tracking
 */

import { Resend } from 'resend';
import { prisma } from '../../server/prisma';
import type { CampaignType, EmailStatus } from '@prisma/client';

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Email sender configuration
const FROM_EMAIL_TRANSACTIONAL = process.env.FROM_EMAIL_TRANSACTIONAL || 'Bedones Moderator <contact@moderator.bedones.com>';
const FROM_EMAIL_MARKETING = process.env.FROM_EMAIL_MARKETING || 'Bedones Moderator <team@moderator.bedones.com>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://moderator.bedones.local';

// Determine which FROM email to use based on campaign type
function getFromEmail(campaignType: CampaignType): string {
  const transactionalTypes: CampaignType[] = [
    'VERIFICATION',
    'PAYMENT_SUCCESS',
    'PAYMENT_FAILED',
    'SUBSCRIPTION_EXPIRED',
    'SUBSCRIPTION_EXPIRING',
    'LOW_CREDITS',
  ];

  return transactionalTypes.includes(campaignType)
    ? FROM_EMAIL_TRANSACTIONAL
    : FROM_EMAIL_MARKETING;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  previewText?: string;
  userId?: string;
  campaignType: CampaignType;
  campaignName?: string;
}

export interface SendEmailResult {
  success: boolean;
  resendId?: string;
  trackingId?: string;
  error?: string;
}

/**
 * Send a transactional or marketing email via Resend
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  try {
    // Validate required fields
    if (!process.env.RESEND_API_KEY) {
      console.error('❌ RESEND_API_KEY is not configured');
      return {
        success: false,
        error: 'Email service not configured',
      };
    }

    if (!options.to || !options.subject || !options.html) {
      console.error('❌ Missing required email fields');
      return {
        success: false,
        error: 'Missing required fields',
      };
    }

    // Create or get email campaign
    const campaign = await prisma.emailCampaign.upsert({
      where: {
        // Use a unique constraint based on type and name
        id: `${options.campaignType}-${options.campaignName || 'default'}`,
      },
      create: {
        id: `${options.campaignType}-${options.campaignName || 'default'}`,
        name: options.campaignName || options.campaignType,
        type: options.campaignType,
        status: 'SENT',
        subject: options.subject,
        previewText: options.previewText,
      },
      update: {
        subject: options.subject,
        previewText: options.previewText,
        status: 'SENT',
        updatedAt: new Date(),
      },
    });

    // Create email log entry (PENDING status)
    const emailLog = await prisma.emailLog.create({
      data: {
        campaignId: campaign.id,
        userId: options.userId || 'system',
        recipientEmail: options.to,
        status: 'PENDING',
      },
    });

    // Replace template variables
    const trackingPixelUrl = `${APP_URL}/api/email/track/open?t=${emailLog.trackingId}`;
    const unsubscribeUrl = `${APP_URL}/api/email/unsubscribe?t=${emailLog.trackingId}`;
    const dashboardUrl = `${APP_URL}/dashboard`;
    const renewUrl = `${APP_URL}/pricing`;
    const retryPaymentUrl = `${APP_URL}/pricing`;
    const pricingUrl = `${APP_URL}/pricing`;

    const finalHtml = options.html
      .replace(/{{trackingPixel}}/g, `<img src="${trackingPixelUrl}" width="1" height="1" alt="" style="display:block;" />`)
      .replace(/{{unsubscribeUrl}}/g, unsubscribeUrl)
      .replace(/{{dashboardUrl}}/g, dashboardUrl)
      .replace(/{{renewUrl}}/g, renewUrl)
      .replace(/{{retryPaymentUrl}}/g, retryPaymentUrl)
      .replace(/{{pricingUrl}}/g, pricingUrl);

    // Send email via Resend
    const fromEmail = getFromEmail(options.campaignType);
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: options.to,
      subject: options.subject,
      html: finalHtml,
      headers: {
        'X-Tracking-ID': emailLog.trackingId,
        'X-Campaign-Type': options.campaignType,
      },
    });

    if (error) {
      console.error('❌ Resend error:', error);

      // Update email log with error
      await prisma.emailLog.update({
        where: { id: emailLog.id },
        data: {
          status: 'FAILED',
          errorMessage: error.message || JSON.stringify(error),
          updatedAt: new Date(),
        },
      });

      // Update campaign stats
      await prisma.emailCampaign.update({
        where: { id: campaign.id },
        data: {
          totalFailed: { increment: 1 },
        },
      });

      return {
        success: false,
        error: error.message || 'Failed to send email',
      };
    }

    // Update email log with Resend ID and SENT status
    await prisma.emailLog.update({
      where: { id: emailLog.id },
      data: {
        resendId: data?.id,
        status: 'SENT',
        sentAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Update campaign stats
    await prisma.emailCampaign.update({
      where: { id: campaign.id },
      data: {
        totalSent: { increment: 1 },
        sentAt: new Date(),
      },
    });

    console.log(`✅ Email sent successfully: ${data?.id} (${options.campaignType})`);

    return {
      success: true,
      resendId: data?.id,
      trackingId: emailLog.trackingId,
    };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Update email status from Resend webhook
 */
export async function updateEmailStatus(
  trackingId: string,
  status: EmailStatus,
  data?: {
    openedAt?: Date;
    clickedAt?: Date;
    bouncedAt?: Date;
    deliveredAt?: Date;
    errorMessage?: string;
  }
): Promise<void> {
  try {
    const emailLog = await prisma.emailLog.findUnique({
      where: { trackingId },
      include: { campaign: true },
    });

    if (!emailLog) {
      console.error(`❌ Email log not found for tracking ID: ${trackingId}`);
      return;
    }

    // Build update data
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    if (data?.openedAt && !emailLog.openedAt) {
      updateData.openedAt = data.openedAt;
    }
    if (data?.openedAt) {
      updateData.openCount = { increment: 1 };
    }

    if (data?.clickedAt && !emailLog.clickedAt) {
      updateData.clickedAt = data.clickedAt;
    }
    if (data?.clickedAt) {
      updateData.clickCount = { increment: 1 };
    }

    if (data?.bouncedAt) {
      updateData.bouncedAt = data.bouncedAt;
    }

    if (data?.deliveredAt) {
      updateData.deliveredAt = data.deliveredAt;
    }

    if (data?.errorMessage) {
      updateData.errorMessage = data.errorMessage;
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
      campaignUpdate.totalOpened = { increment: 1 };
    } else if (status === 'CLICKED') {
      campaignUpdate.totalClicked = { increment: 1 };
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

    console.log(`📧 Email status updated: ${trackingId} → ${status}`);
  } catch (error) {
    console.error('❌ Error updating email status:', error);
  }
}

/**
 * Track email click
 */
export async function trackEmailClick(trackingId: string, url: string): Promise<void> {
  try {
    const emailLog = await prisma.emailLog.findUnique({
      where: { trackingId },
    });

    if (!emailLog) {
      console.error(`❌ Email log not found for tracking ID: ${trackingId}`);
      return;
    }

    // Create click record
    await prisma.emailClick.create({
      data: {
        emailLogId: emailLog.id,
        url,
      },
    });

    // Update email log status if not already clicked
    await updateEmailStatus(trackingId, 'CLICKED', {
      clickedAt: new Date(),
    });

    console.log(`🖱️ Email click tracked: ${trackingId} → ${url}`);
  } catch (error) {
    console.error('❌ Error tracking email click:', error);
  }
}

/**
 * Unsubscribe user from emails
 */
export async function unsubscribeUser(trackingId: string): Promise<boolean> {
  try {
    const emailLog = await prisma.emailLog.findUnique({
      where: { trackingId },
      include: { user: true },
    });

    if (!emailLog) {
      console.error(`❌ Email log not found for tracking ID: ${trackingId}`);
      return false;
    }

    // Update user's email subscription preference
    await prisma.user.update({
      where: { id: emailLog.userId },
      data: {
        emailSubscribed: false,
        updatedAt: new Date(),
      },
    });

    console.log(`📭 User unsubscribed: ${emailLog.userId}`);
    return true;
  } catch (error) {
    console.error('❌ Error unsubscribing user:', error);
    return false;
  }
}

/**
 * Send emails in batch (mass campaign to multiple recipients)
 * Uses Resend batch API for efficiency - much better than looping!
 */
export async function sendBatchEmails(options: {
  recipients: {
    to: string;
    userId: string;
    userName?: string;
  }[];
  subject: string;
  html: string;
  previewText?: string;
  campaignType: CampaignType;
  campaignName?: string;
}): Promise<{
  success: boolean;
  totalSent: number;
  errors: string[];
}> {
  const result = {
    success: true,
    totalSent: 0,
    errors: [] as string[],
  };

  try {
    // Validate required fields
    if (!process.env.RESEND_API_KEY) {
      console.error('❌ RESEND_API_KEY is not configured');
      return {
        success: false,
        totalSent: 0,
        errors: ['Email service not configured'],
      };
    }

    if (options.recipients.length === 0) {
      return result;
    }

    // Create or get email campaign
    const campaign = await prisma.emailCampaign.upsert({
      where: {
        id: `${options.campaignType}-${options.campaignName || 'default'}`,
      },
      create: {
        id: `${options.campaignType}-${options.campaignName || 'default'}`,
        name: options.campaignName || options.campaignType,
        type: options.campaignType,
        status: 'SENT',
        subject: options.subject,
        previewText: options.previewText,
      },
      update: {
        subject: options.subject,
        previewText: options.previewText,
        status: 'SENT',
        updatedAt: new Date(),
      },
    });

    // Create email logs for all recipients first
    const emailLogs = await Promise.all(
      options.recipients.map((recipient) =>
        prisma.emailLog.create({
          data: {
            campaignId: campaign.id,
            userId: recipient.userId,
            recipientEmail: recipient.to,
            status: 'PENDING',
          },
        })
      )
    );

    // Prepare batch emails with individual tracking
    const batchEmails = options.recipients.map((recipient, index) => {
      const emailLog = emailLogs[index];
      const trackingPixelUrl = `${APP_URL}/api/email/track/open?t=${emailLog.trackingId}`;
      const unsubscribeUrl = `${APP_URL}/api/email/unsubscribe?t=${emailLog.trackingId}`;
      const dashboardUrl = `${APP_URL}/dashboard`;
      const renewUrl = `${APP_URL}/pricing`;
      const retryPaymentUrl = `${APP_URL}/pricing`;
      const pricingUrl = `${APP_URL}/pricing`;

      const finalHtml = options.html
        .replace(/{{trackingPixel}}/g, `<img src="${trackingPixelUrl}" width="1" height="1" alt="" style="display:block;" />`)
        .replace(/{{unsubscribeUrl}}/g, unsubscribeUrl)
        .replace(/{{dashboardUrl}}/g, dashboardUrl)
        .replace(/{{renewUrl}}/g, renewUrl)
        .replace(/{{retryPaymentUrl}}/g, retryPaymentUrl)
        .replace(/{{pricingUrl}}/g, pricingUrl);

      const fromEmail = getFromEmail(options.campaignType);
      return {
        from: fromEmail,
        to: recipient.to,
        subject: options.subject,
        html: finalHtml,
        headers: {
          'X-Tracking-ID': emailLog.trackingId,
          'X-Campaign-Type': options.campaignType,
        },
      };
    });

    // Send in batches of 100 (Resend limit)
    const BATCH_SIZE = 100;
    for (let i = 0; i < batchEmails.length; i += BATCH_SIZE) {
      const batch = batchEmails.slice(i, i + BATCH_SIZE);
      const batchLogs = emailLogs.slice(i, i + BATCH_SIZE);

      try {
        const { data, error } = await resend.batch.send(batch);

        if (error) {
          console.error('❌ Resend batch error:', error);

          // Mark all emails in this batch as failed
          await Promise.all(
            batchLogs.map((log) =>
              prisma.emailLog.update({
                where: { id: log.id },
                data: {
                  status: 'FAILED',
                  errorMessage: error.message || JSON.stringify(error),
                  updatedAt: new Date(),
                },
              })
            )
          );

          result.errors.push(`Batch ${i / BATCH_SIZE + 1}: ${error.message || 'Unknown error'}`);
          continue;
        }

        // Update email logs with Resend IDs
        if (data) {
          await Promise.all(
            data.map((emailData, idx) =>
              prisma.emailLog.update({
                where: { id: batchLogs[idx].id },
                data: {
                  resendId: emailData.id,
                  status: 'SENT',
                  sentAt: new Date(),
                  updatedAt: new Date(),
                },
              })
            )
          );

          result.totalSent += data.length;
        }

        console.log(`✅ Batch ${i / BATCH_SIZE + 1} sent: ${batch.length} emails`);
      } catch (batchError) {
        const errorMsg = batchError instanceof Error ? batchError.message : 'Unknown error';
        console.error(`❌ Error sending batch ${i / BATCH_SIZE + 1}:`, errorMsg);
        result.errors.push(`Batch ${i / BATCH_SIZE + 1}: ${errorMsg}`);
        result.success = false;
      }
    }

    // Update campaign stats
    await prisma.emailCampaign.update({
      where: { id: campaign.id },
      data: {
        totalSent: { increment: result.totalSent },
        totalFailed: { increment: options.recipients.length - result.totalSent },
        sentAt: new Date(),
      },
    });

    console.log(`✅ Batch campaign completed: ${result.totalSent}/${options.recipients.length} emails sent`);

    return result;
  } catch (error) {
    console.error('❌ Error sending batch emails:', error);
    return {
      success: false,
      totalSent: result.totalSent,
      errors: [...result.errors, error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}
