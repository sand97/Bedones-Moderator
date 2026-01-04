/**
 * API Endpoint: Resend Email Verification
 * Allows users to request a new verification email
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../server/prisma';
import { sendEmail } from '../../../lib/email/mailer';
import { emailVerificationEmail } from '../../../lib/email/templates';
import { rateLimit, RateLimitPresets } from '../../../lib/rate-limit';
import crypto from 'crypto';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting: Strict limit for verification emails (3 per hour)
  if (!rateLimit(req, res, RateLimitPresets.STRICT)) {
    return;
  }

  try {
    // Get session from cookies
    const cookies = req.cookies;
    const sessionToken = cookies.session;

    if (!sessionToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Validate session
    const sessionData = await prisma.session.findUnique({
      where: { token: sessionToken },
      include: { user: true },
    });

    if (!sessionData || sessionData.expiresAt < new Date()) {
      return res.status(401).json({ error: 'Session expired' });
    }

    const user = sessionData.user;

    // Check if user has an email
    if (!user.email) {
      return res.status(400).json({ error: 'No email address associated with this account' });
    }

    // Check if already verified
    if (user.emailVerified) {
      return res.status(400).json({ error: 'Email already verified' });
    }

    // Delete any existing verification tokens for this email
    await prisma.verification.deleteMany({
      where: { identifier: user.email },
    });

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours expiry

    // Store verification token
    await prisma.verification.create({
      data: {
        identifier: user.email,
        value: verificationToken,
        expiresAt,
      },
    });

    // Send verification email
    const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://moderator.bedones.local';
    const verificationUrl = `${APP_URL}/api/user/verify-email?token=${verificationToken}`;

    const emailTemplate = emailVerificationEmail({
      userName: user.name || user.email,
      verificationUrl,
    });

    await sendEmail({
      to: user.email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      previewText: emailTemplate.previewText,
      userId: user.id,
      campaignType: 'VERIFICATION',
      campaignName: 'email-verification-resend',
    });

    console.log(`📧 Verification email resent to ${user.email}`);

    return res.status(200).json({
      success: true,
      message: 'Verification email sent. Please check your inbox.',
    });
  } catch (error) {
    console.error('❌ Error resending verification email:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
