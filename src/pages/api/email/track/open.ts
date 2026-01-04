/**
 * Email Open Tracking Endpoint
 * Serves a 1x1 transparent pixel and tracks email opens
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { updateEmailStatus } from '../../../../lib/email/mailer';

// 1x1 transparent PNG pixel (base64)
const PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64'
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { t: trackingId } = req.query;

  if (!trackingId || typeof trackingId !== 'string') {
    // Still return pixel even if tracking ID is missing
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    return res.status(200).send(PIXEL);
  }

  try {
    // Track the email open
    await updateEmailStatus(trackingId, 'OPENED', {
      openedAt: new Date(),
    });

    console.log(`📧 Email opened: ${trackingId}`);
  } catch (error) {
    console.error('❌ Error tracking email open:', error);
    // Don't fail the request even if tracking fails
  }

  // Return the transparent pixel
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  return res.status(200).send(PIXEL);
}
