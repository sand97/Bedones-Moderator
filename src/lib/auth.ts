import { PrismaClient } from '@prisma/client';
import type { User, Session } from '@prisma/client';

// Use Web Crypto API (available in edge runtime)
export const SESSION_COOKIE_NAME = 'session';
const SESSION_EXPIRY_DAYS = 7;

export interface SessionWithUser {
  session: Session;
  user: User;
}

/**
 * Generate a random session token using Web Crypto API
 */
export async function generateSessionToken(): Promise<string> {
  const buffer = new Uint8Array(32);
  crypto.getRandomValues(buffer);
  return Array.from(buffer)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Create a new session for a user
 */
export async function createSession(
  prisma: PrismaClient,
  userId: string,
  ipAddress?: string,
  userAgent?: string,
): Promise<Session> {
  const token = await generateSessionToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_EXPIRY_DAYS);

  return await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt,
      ipAddress,
      userAgent,
    },
  });
}

/**
 * Validate a session token and return session with user
 */
export async function validateSession(
  prisma: PrismaClient,
  token: string,
): Promise<SessionWithUser | null> {
  try {
    console.log('[Auth] Validating session token:', token.substring(0, 10) + '...');

    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!session) {
      console.log('[Auth] Session not found in database');
      return null;
    }

    console.log('[Auth] Session found, checking expiry');
    console.log('[Auth] Session expires at:', session.expiresAt);
    console.log('[Auth] Current time:', new Date());

    // Check if session is expired
    if (session.expiresAt < new Date()) {
      console.log('[Auth] Session expired, deleting');
      // Delete expired session
      await prisma.session.delete({ where: { id: session.id } });
      return null;
    }

    console.log('[Auth] Session valid for user:', session.user.id);
    return { session, user: session.user };
  } catch (error) {
    console.error('[Auth] Error validating session:', error);
    console.error('[Auth] Error details:', error instanceof Error ? error.message : String(error));
    return null;
  }
}

/**
 * Delete a session
 */
export async function deleteSession(
  prisma: PrismaClient,
  token: string,
): Promise<void> {
  await prisma.session.deleteMany({ where: { token } });
}

/**
 * Parse session token from request headers/cookies
 */
export function getSessionTokenFromRequest(
  headers: Headers,
): string | null {
  const cookieHeader = headers.get('cookie');
  console.log('[Auth] Cookie header:', cookieHeader ? 'present' : 'missing');

  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';').map((c) => c.trim());
  const sessionCookie = cookies.find((c) =>
    c.startsWith(`${SESSION_COOKIE_NAME}=`),
  );

  if (!sessionCookie) {
    console.log('[Auth] Session cookie not found. Available cookies:', cookies.map(c => c.split('=')[0]));
    return null;
  }

  console.log('[Auth] Session cookie found');

  return sessionCookie.split('=')[1];
}

/**
 * Create Set-Cookie header for session
 */
export function createSessionCookie(
  token: string,
  isProduction: boolean,
): string {
  const maxAge = SESSION_EXPIRY_DAYS * 24 * 60 * 60; // in seconds

  const attributes = [
    `${SESSION_COOKIE_NAME}=${token}`,
    `Max-Age=${maxAge}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
  ];

  if (isProduction) {
    attributes.push('Secure');
  }

  return attributes.join('; ');
}

/**
 * Create Set-Cookie header to delete session
 */
export function deleteSessionCookie(): string {
  return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; Max-Age=0`;
}

export type { User, Session };
