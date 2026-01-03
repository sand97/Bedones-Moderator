/**
 * Centralized Database Client
 *
 * This module provides a unified database client that works seamlessly in both:
 * - Local development (Node.js runtime with SQLite)
 * - Production (Docker deployment with SQLite)
 *
 * Key improvement over previous architecture:
 * - NO manual runtime detection needed in API routes
 * - NO dual-handling code (if/else for Node vs Edge)
 * - Single source of truth for database access
 */

import { PrismaClient } from '@prisma/client';

// Global Prisma instance for local development (Node.js)
// This prevents creating multiple instances during development hot-reload
const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

// Initialize Prisma client - throws if not available
function initializePrisma(): PrismaClient {
  // Only create default prisma client in Node.js runtime
  if (typeof process === 'undefined' || !process.env.DATABASE_URL) {
    throw new Error(
      '[DB] No database configuration found. ' +
      'Ensure DATABASE_URL is set for local development.'
    );
  }

  const client = globalForPrisma.prisma ?? new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
  });

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = client;
  }

  return client;
}

// Initialize prisma - will throw if it fails
const defaultPrisma: PrismaClient = initializePrisma();

/**
 * Gets the appropriate database client based on the runtime environment
 *
 * Usage in API routes:
 * ```ts
 * const db = getDbClient(req);
 * const users = await db.user.findMany();
 * ```
 *
 * @param req - Optional Request object (for Edge runtime detection)
 * @returns PrismaClient instance
 */
export function getDbClient(_req?: Request): PrismaClient {
  // For moderateur-bedones, we're always using Node.js runtime with SQLite
  // No Edge runtime support needed for now
  console.log('[DB] Using SQLite database (Node.js runtime)');
  return defaultPrisma;
}

// Export default Prisma instance for server-side usage (non-API routes)
// This is guaranteed to be initialized (throws on startup if it fails)
export const prisma: PrismaClient = defaultPrisma;
