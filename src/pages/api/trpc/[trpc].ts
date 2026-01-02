// Use edge runtime for Cloudflare deployment
export const runtime = 'edge';

/**
 * This file contains tRPC's HTTP response handler
 */
import { getRequestContext } from '@cloudflare/next-on-pages';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { createContext } from '~/server/context';
import { appRouter } from '~/server/routers/_app';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest | Request, res?: NextApiResponse) {
  console.log('[tRPC] Handler called');

  // Check if we're in Edge runtime by testing if req is a Web Request
  const isEdgeRuntime = req instanceof Request;

  // Get Cloudflare environment if available (Edge runtime)
  let cloudflareEnv: any = null;

  try {
    const { env } = getRequestContext();
    cloudflareEnv = env;
    console.log('[tRPC] Running in Edge runtime with Cloudflare context');
  } catch {
    console.log('[tRPC] Running in Node.js runtime (local development)');
  }

  // Handle Next.js API route (Node.js runtime)
  if (!isEdgeRuntime && res) {
    const nodeReq = req;

    // Convert NextApiRequest to Request for fetchRequestHandler
    const url = new URL(nodeReq.url!, `http://${nodeReq.headers.host}`);
    const fetchReq = new Request(url, {
      method: nodeReq.method,
      headers: new Headers(nodeReq.headers as Record<string, string>),
      body: nodeReq.method !== 'GET' && nodeReq.method !== 'HEAD'
        ? JSON.stringify(nodeReq.body)
        : undefined,
    });

    const response = await fetchRequestHandler({
      endpoint: '/api/trpc',
      req: fetchReq,
      router: appRouter,
      createContext: (opts) => createContext({ ...opts, cloudflareEnv }),
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

  // Handle Edge runtime (Cloudflare)
  const request = req as Request;

  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req: request,
    router: appRouter,
    createContext: (opts) => createContext({ ...opts, cloudflareEnv }),
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
}
