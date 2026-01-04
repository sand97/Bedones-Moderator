/**
 * Email Click Tracking Endpoint
 * Tracks clicks on links in emails and redirects to the target URL
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { trackEmailClick } from '../../../../lib/email/mailer';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { t: trackingId, url } = req.query;

  if (!trackingId || typeof trackingId !== 'string') {
    return res.status(400).json({ error: 'Missing tracking ID' });
  }

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Missing target URL' });
  }

  try {
    // Track the click
    await trackEmailClick(trackingId, url);

    console.log(`🖱️ Email click tracked: ${trackingId} → ${url}`);
  } catch (error) {
    console.error('❌ Error tracking email click:', error);
    // Don't fail the redirect even if tracking fails
  }

  // Redirect to the target URL
  return res.redirect(302, url);
}
