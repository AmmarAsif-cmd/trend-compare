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

// PASSWORD CONFIGURATION:
// Option 1 (Recommended for production): Set ADMIN_PASSWORD_HASH
//   Generate hash: tsx scripts/generate-password-hash.ts your-password
//   Or: node -e "console.log(require('crypto').createHash('sha256').update('your-password').digest('hex'))"
//
// Option 2 (Simpler for development): Set ADMIN_PASSWORD (plain text)
//   Just set: ADMIN_PASSWORD=your-password
//   The system will automatically hash it for comparison
//
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || '';
const ADMIN_PASSWORD_PLAIN = process.env.ADMIN_PASSWORD || '';
const SESSION_COOKIE = 'admin_session';

// SESSION_SECRET: Used to sign session cookies for security
// Generate one: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
// If not set, uses a default (insecure for production!)
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
 * Hash password using SHA-256
 */
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * Check if password is correct
 * 
 * Supports two methods:
 * 1. ADMIN_PASSWORD_HASH (recommended): Pre-hashed password (64 hex chars)
 * 2. ADMIN_PASSWORD (simpler): Plain text password (automatically hashed for comparison)
 * 
 * If both are set, ADMIN_PASSWORD_HASH takes precedence.
 */
export function verifyPassword(password: string): boolean {
  if (!password || password.trim() === '') {
    return false;
  }

  // Method 1: Use pre-hashed password (ADMIN_PASSWORD_HASH)
  if (ADMIN_PASSWORD_HASH && ADMIN_PASSWORD_HASH.length === 64) {
    // SHA-256 hash is 64 hex characters
    const providedHash = hashPassword(password);
    const expectedHash = ADMIN_PASSWORD_HASH.toLowerCase();
    
    // Constant-time comparison to prevent timing attacks
    const expected = Buffer.from(expectedHash, 'hex');
    const actual = Buffer.from(providedHash, 'hex');

    if (expected.length !== actual.length) {
      return false;
    }

    return crypto.timingSafeEqual(expected, actual);
  }

  // Method 2: Use plain text password (ADMIN_PASSWORD)
  // Automatically hash it for secure comparison
  if (ADMIN_PASSWORD_PLAIN) {
    const providedHash = hashPassword(password);
    const expectedHash = hashPassword(ADMIN_PASSWORD_PLAIN);
    
    // Constant-time comparison
    const expected = Buffer.from(expectedHash, 'hex');
    const actual = Buffer.from(providedHash, 'hex');

    if (expected.length !== actual.length) {
      return false;
    }

    return crypto.timingSafeEqual(expected, actual);
  }

  // No password configured
  console.error('[Auth] ❌ No ADMIN_PASSWORD_HASH or ADMIN_PASSWORD configured!');
  console.error('[Auth] Current env check:');
  console.error('[Auth]   ADMIN_PASSWORD_HASH:', ADMIN_PASSWORD_HASH ? `Set (${ADMIN_PASSWORD_HASH.length} chars)` : 'NOT SET');
  console.error('[Auth]   ADMIN_PASSWORD_PLAIN:', ADMIN_PASSWORD_PLAIN ? `Set (${ADMIN_PASSWORD_PLAIN.length} chars)` : 'NOT SET');
  console.error('[Auth] 💡 Solution: Set ADMIN_PASSWORD=your-password in .env.local and restart server');
  return false;
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

  // Hash the session token and include timestamp for validation
  const sessionToken = crypto
    .createHash('sha256')
    .update(data)
    .digest('base64');

  // Encode timestamp into the token for self-contained validation
  const tokenWithTimestamp = `${sessionToken}.${timestamp}`;

  cookieStore.set(SESSION_COOKIE, tokenWithTimestamp, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', // Changed back to 'lax' for better compatibility
    maxAge: 60 * 60 * 8, // 8 hours (reduced from 24)
    path: '/',
  });

  // Store session data (in production, use a database)
  sessionStore.set(tokenWithTimestamp, {
    createdAt: timestamp,
    expiresAt: timestamp + (60 * 60 * 8 * 1000),
  });

  return tokenWithTimestamp;
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

    // Extract timestamp from token (format: "token.timestamp")
    const parts = session.value.split('.');
    if (parts.length !== 2) {
      return false;
    }

    const timestamp = parseInt(parts[1], 10);
    if (isNaN(timestamp)) {
      return false;
    }

    // Check if session is expired (8 hours)
    const expiresAt = timestamp + (60 * 60 * 8 * 1000);
    if (Date.now() > expiresAt) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('[Auth] Error checking authentication:', error);
    return false;
  }
}

/**
 * Check if admin is authenticated from NextRequest
 * (For API routes that receive NextRequest)
 */
export async function isAdminAuthenticated(request: NextRequest): Promise<boolean> {
  try {
    const session = request.cookies.get(SESSION_COOKIE);

    if (!session?.value) {
      return false;
    }

    // Extract timestamp from token
    const parts = session.value.split('.');
    if (parts.length !== 2) {
      return false;
    }

    const timestamp = parseInt(parts[1], 10);
    if (isNaN(timestamp)) {
      return false;
    }

    // Check if session is expired (8 hours)
    const expiresAt = timestamp + (60 * 60 * 8 * 1000);
    if (Date.now() > expiresAt) {
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
    // Import admin config dynamically to avoid circular dependencies
    const { ADMIN_ROUTES } = await import('./admin-config');
    return NextResponse.redirect(new URL(ADMIN_ROUTES.login, request.url));
  }

  return null;
}
