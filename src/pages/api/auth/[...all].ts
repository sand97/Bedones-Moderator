import type { NextApiRequest, NextApiResponse } from 'next';
import { auth } from '~/lib/auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    // Get the protocol and host from the request
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const baseURL = `${protocol}://${host}`;

    // Create a new request with the full URL
    const url = new URL(req.url || '', baseURL);

    // Convert NextJS headers to Web API Headers
    const headers = new Headers();
    Object.entries(req.headers).forEach(([key, value]) => {
      if (value) {
        headers.set(key, Array.isArray(value) ? value[0] : value);
      }
    });

    // Prepare request options
    const requestOptions: RequestInit = {
      method: req.method,
      headers,
    };

    // Add body for non-GET/HEAD requests
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      requestOptions.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }

    // Call the auth handler
    const authResponse = await auth.handler(new Request(url.toString(), requestOptions));

    // Convert Response to NextApiResponse
    authResponse.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    res.status(authResponse.status);

    const responseBody = await authResponse.text();
    return res.send(responseBody);
  } catch (error) {
    console.error('Auth handler error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
