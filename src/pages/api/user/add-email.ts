/**
 * API Endpoint: Add Email to Social Auth User
 * Allows users who signed up via Instagram/Facebook to add and verify their email
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../server/prisma';
import { sendEmail } from '../../../lib/email/mailer';
import { emailVerificationEmail } from '../../../lib/email/templates';
import crypto from 'crypto';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, email } = req.body;

    // Validate inputs
    if (!userId || !email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if email is already taken by another user
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser && existingUser.id !== userId) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours expiry

    // Store verification token
    await prisma.verification.create({
      data: {
        identifier: email,
        value: verificationToken,
        expiresAt,
      },
    });

    // Update user with unverified email
    await prisma.user.update({
      where: { id: userId },
      data: {
        email,
        emailVerified: false, // Not verified yet
      },
    });

    // Send verification email
    const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://moderator.bedones.local';
    const verificationUrl = `${APP_URL}/api/user/verify-email?token=${verificationToken}`;

    const emailTemplate = emailVerificationEmail({
      userName: user.name || email,
      verificationUrl,
    });

    const emailResult = await sendEmail({
      to: email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      previewText: emailTemplate.previewText,
      userId,
      campaignType: 'VERIFICATION',
      campaignName: 'email-verification',
    });

    if (!emailResult.success) {
      console.error(`❌ Failed to send verification email to ${email}:`, emailResult.error);
      return res.status(500).json({
        error: 'Failed to send verification email',
        details: emailResult.error,
      });
    }

    console.log(`📧 Verification email sent to ${email} (ID: ${emailResult.resendId})`);

    return res.status(200).json({
      success: true,
      message: 'Email added successfully. Please check your inbox for verification.',
    });
  } catch (error) {
    console.error('❌ Error adding email:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
