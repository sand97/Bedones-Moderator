/**
 * This file contains tRPC's HTTP response handler
 */
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { createContext } from '~/server/context';
import { appRouter } from '~/server/routers/_app';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('[tRPC] Handler called');

  // Convert NextApiRequest to Request for fetchRequestHandler
  const url = new URL(req.url!, `http://${req.headers.host}`);
  const fetchReq = new Request(url, {
    method: req.method,
    headers: new Headers(req.headers as Record<string, string>),
    body: req.method !== 'GET' && req.method !== 'HEAD'
      ? JSON.stringify(req.body)
      : undefined,
  });

  const response = await fetchRequestHandler({
    endpoint: '/api/trpc',
    req: fetchReq,
    router: appRouter,
    createContext,
    onError({ error, path }) {
      console.error('[tRPC] Error on path:', path);
      console.error('[tRPC] Error code:', error.code);
      console.error('[tRPC] Error:', error);
      console.error('[tRPC] Error stack:', error.stack);

      if (error.code === 'INTERNAL_SERVER_ERROR') {
        console.error('[tRPC] Internal server error', error);
      }
    },
  });

  // Convert Response to NextApiResponse
  res.status(response.status);
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });
  const body = await response.text();
  return res.send(body);
}
