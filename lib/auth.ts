/**
 * Secure admin authentication utilities
 * Features:
 * - HTTP-only cookies for session management
 * - Rate limiting (5 attempts per 15 minutes)
 * - IP-based tracking
 * - Secure session tokens
 */

import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'; // Change this in production!
const SESSION_COOKIE = 'admin_session';
const SESSION_SECRET = process.env.SESSION_SECRET || 'change-this-secret-key';

// Rate limiting store (in production, use Redis or database)
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

// Session store (in production, use Redis or database)
const sessionStore = new Map<string, { createdAt: number; expiresAt: number }>();

/**
 * Get client IP address for rate limiting
 */
export function getClientIP(request?: NextRequest): string {
  if (!request) return 'unknown';

  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  return 'unknown';
}

/**
 * Check if IP is rate limited
 */
export function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const attempt = loginAttempts.get(ip);

  if (!attempt) {
    return false;
  }

  // Reset if lockout period has passed
  if (now > attempt.resetAt) {
    loginAttempts.delete(ip);
    return false;
  }

  return attempt.count >= MAX_ATTEMPTS;
}

/**
 * Record failed login attempt
 */
export function recordFailedAttempt(ip: string): void {
  const now = Date.now();
  const attempt = loginAttempts.get(ip);

  if (!attempt || now > attempt.resetAt) {
    loginAttempts.set(ip, {
      count: 1,
      resetAt: now + LOCKOUT_DURATION,
    });
  } else {
    attempt.count += 1;
  }
}

/**
 * Clear login attempts on successful login
 */
export function clearLoginAttempts(ip: string): void {
  loginAttempts.delete(ip);
}

/**
 * Get remaining lockout time
 */
export function getRemainingLockoutTime(ip: string): number {
  const attempt = loginAttempts.get(ip);
  if (!attempt) return 0;

  const remaining = attempt.resetAt - Date.now();
  return Math.max(0, Math.ceil(remaining / 1000 / 60)); // minutes
}

/**
 * Check if password is correct
 */
export function verifyPassword(password: string): boolean {
  if (!password || password.trim() === '') {
    return false;
  }

  // Constant-time comparison to prevent timing attacks
  const expected = Buffer.from(ADMIN_PASSWORD);
  const actual = Buffer.from(password);

  if (expected.length !== actual.length) {
    return false;
  }

  return crypto.timingSafeEqual(expected, actual);
}

/**
 * Create admin session with secure token
 */
export async function createSession() {
  const cookieStore = await cookies();

  // Generate cryptographically secure random token
  const randomBytes = crypto.randomBytes(32).toString('hex');
  const timestamp = Date.now();
  const data = `${SESSION_SECRET}:${timestamp}:${randomBytes}`;

  // Hash the session token
  const sessionToken = crypto
    .createHash('sha256')
    .update(data)
    .digest('base64');

  cookieStore.set(SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict', // Changed from 'lax' for better security
    maxAge: 60 * 60 * 8, // 8 hours (reduced from 24)
    path: '/',
  });

  // Store session data (in production, use a database)
  sessionStore.set(sessionToken, {
    createdAt: timestamp,
    expiresAt: timestamp + (60 * 60 * 8 * 1000),
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

    // Check if session exists in store
    const sessionData = sessionStore.get(session.value);

    if (!sessionData) {
      return false;
    }

    // Check if session is expired
    if (Date.now() > sessionData.expiresAt) {
      sessionStore.delete(session.value);
      return false;
    }

    return true;
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
  const session = cookieStore.get(SESSION_COOKIE);

  if (session?.value) {
    // Remove from session store
    sessionStore.delete(session.value);
  }

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
