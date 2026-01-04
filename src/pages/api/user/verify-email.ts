/**
 * API Endpoint: Verify Email
 * Verifies user's email address via token sent in verification email
 * Redirects to success/error pages
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '~/server/prisma.ts';
import { sendEmail } from '~/lib/email/mailer.ts';
import { welcomeEmail } from '~/lib/email/templates.ts';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { token } = req.query;

  if (!token || typeof token !== 'string') {
    return res.redirect('/email/verify-error?reason=invalid');
  }

  try {
    // Find verification token
    const verification = await prisma.verification.findFirst({
      where: {
        value: token,
        expiresAt: {
          gte: new Date(), // Token not expired
        },
      },
    });

    if (!verification) {
      return res.redirect('/email/verify-error?reason=expired');
    }

    // Find user with this email
    const user = await prisma.user.findUnique({
      where: { email: verification.identifier },
    });

    if (!user) {
      return res.redirect('/email/verify-error?reason=not-found');
    }

    // Mark email as verified
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
      },
    });

    // Delete verification token
    await prisma.verification.delete({
      where: { id: verification.id },
    });

    console.log(`✅ Email verified for user ${user.id}: ${user.email}`);

    // Send welcome email
    if (user.email) {
      const emailTemplate = welcomeEmail({
        userName: user.name || user.email,
        userEmail: user.email,
      });

      await sendEmail({
        to: user.email,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        previewText: emailTemplate.previewText,
        userId: user.id,
        campaignType: 'WELCOME',
        campaignName: 'welcome',
      });

      console.log(`📧 Welcome email sent to ${user.email}`);
    }

    // Redirect to success page
    return res.redirect('/email/verify-success');
  } catch (error) {
    console.error('❌ Error verifying email:', error);
    return res.redirect('/email/verify-error?reason=error');
  }
}
