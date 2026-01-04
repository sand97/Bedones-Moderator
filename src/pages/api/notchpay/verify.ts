import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyNotchPayPayment } from '../../../lib/notchpay-utils';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { reference } = req.query;

  if (!reference || typeof reference !== 'string') {
    return res.status(400).json({ error: 'Reference is required' });
  }

  try {
    const verification = await verifyNotchPayPayment(reference);
    return res.status(200).json(verification);
  } catch (error) {
    console.error('NotchPay verify error:', error);
    return res.status(500).json({
      error: 'Failed to verify payment',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
