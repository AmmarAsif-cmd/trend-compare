/**
 * Simple admin authentication utilities
 * Uses HTTP-only cookies for session management
 */

import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'; // Change this in production!
const SESSION_COOKIE = 'admin_session';
const SESSION_SECRET = process.env.SESSION_SECRET || 'change-this-secret-key';

/**
 * Check if password is correct
 */
export function verifyPassword(password: string): boolean {
  return password === ADMIN_PASSWORD;
}

/**
 * Create admin session
 */
export async function createSession() {
  const cookieStore = await cookies();
  const sessionToken = Buffer.from(
    `${SESSION_SECRET}:${Date.now()}`
  ).toString('base64');

  cookieStore.set(SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  });

  return sessionToken;
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get(SESSION_COOKIE);

    if (!session?.value) {
      return false;
    }

    // Verify session token
    const decoded = Buffer.from(session.value, 'base64').toString();
    const [secret, timestamp] = decoded.split(':');

    if (secret !== SESSION_SECRET) {
      return false;
    }

    // Check if session is expired (24 hours)
    const sessionAge = Date.now() - parseInt(timestamp);
    const maxAge = 60 * 60 * 24 * 1000; // 24 hours in ms

    return sessionAge < maxAge;
  } catch (error) {
    console.error('[Auth] Error checking authentication:', error);
    return false;
  }
}

/**
 * Logout - clear session
 */
export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

/**
 * Middleware helper to check auth
 */
export async function requireAuth(request: NextRequest) {
  const authenticated = await isAuthenticated();

  if (!authenticated) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  return null;
}
