/**
 * Instantiates a single instance PrismaClient and save it on the global object.
 * @see https://www.prisma.io/docs/support/help-articles/nextjs-prisma-client-dev-practices
 */
import { PrismaClient } from '@prisma/client';
import { PrismaD1 } from '@prisma/adapter-d1';

const prismaGlobal = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

// Only create default prisma client for local development (not edge runtime)
// In edge runtime (Cloudflare Workers), always use createPrismaWithD1
let defaultPrisma: PrismaClient | null = null;

try {
  // This will only work in local development with Node.js runtime
  if (typeof process !== 'undefined' && process.env.DATABASE_URL) {
    defaultPrisma = prismaGlobal.prisma ?? new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

    if (process.env.NODE_ENV !== 'production') {
      prismaGlobal.prisma = defaultPrisma;
    }
  }
} catch (error) {
  // In edge runtime, this will fail - that's expected
  console.log('Running in edge runtime - D1 adapter required');
}

export const prisma = defaultPrisma;

// Function to create Prisma client with D1 adapter for Cloudflare
export function createPrismaWithD1(d1: D1Database) {
  const adapter = new PrismaD1(d1);
  return new PrismaClient({
    adapter,
    log: ['error'],
  });
}
