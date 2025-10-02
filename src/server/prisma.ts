/**
 * Instantiates a single instance PrismaClient and save it on the global object.
 * @see https://www.prisma.io/docs/support/help-articles/nextjs-prisma-client-dev-practices
 */
import { env } from './env';
import { PrismaClient } from '@prisma/client';
import { PrismaD1 } from '@prisma/adapter-d1';

const prismaGlobal = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

// Check if we're in Cloudflare Workers environment
const isCloudflareWorkers = typeof globalThis.process === 'undefined';

export const prisma: PrismaClient =
  prismaGlobal.prisma ??
  (() => {
    if (isCloudflareWorkers) {
      // In Cloudflare Workers, we'll get the D1 binding from the context
      // For now, create a basic client that will be extended in the context
      return new PrismaClient({
        log: ['error'],
      });
    } else {
      // Local development with SQLite
      return new PrismaClient({
        log:
          env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      });
    }
  })();

if (env.NODE_ENV !== 'production') {
  prismaGlobal.prisma = prisma;
}

// Function to create Prisma client with D1 adapter for Cloudflare
export function createPrismaWithD1(d1: D1Database) {
  const adapter = new PrismaD1(d1);
  return new PrismaClient({
    adapter,
    log: ['error'],
  });
}
