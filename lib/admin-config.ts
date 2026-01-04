/**
 * Admin Configuration
 *
 * SECURITY: This file contains the admin panel path.
 * Change ADMIN_PATH in production to a random, hard-to-guess value.
 *
 * To generate a new secure path:
 * node -e "console.log(require('crypto').randomBytes(8).toString('hex'))"
 */

// SECURE ADMIN PATH - Must match next.config.ts and middleware.ts
// The secure path is mapped via next.config.ts rewrites to /admin/*
// Direct access to /admin/* is blocked by middleware
export const ADMIN_PATH = process.env.ADMIN_PATH || 'cp-9a4eef7';

// Admin route helpers - these use the secure path
export const ADMIN_ROUTES = {
  login: `/${ADMIN_PATH}/login`,
  blog: `/${ADMIN_PATH}/blog`,
  keywords: `/${ADMIN_PATH}/keywords`,
  system: `/${ADMIN_PATH}/system`,
  users: `/${ADMIN_PATH}/users`,
  dashboard: `/${ADMIN_PATH}`,
  api: {
    // API routes stay at /api/admin/ (not rewritten)
    login: '/api/admin/login',
    logout: '/api/admin/logout',
    checkAuth: '/api/admin/check-auth',
  },
} as const;

/**
 * Get the full admin URL for a given route
 */
export function getAdminUrl(route: 'login' | 'blog' | 'keywords' | 'system' | 'users' | 'dashboard'): string {
  return ADMIN_ROUTES[route];
}

/**
 * Check if a path is an admin path (secure path)
 */
export function isAdminPath(path: string): boolean {
  return path.startsWith(`/${ADMIN_PATH}`);
}

/**
 * Check if a path is the internal /admin/* path (blocked from direct access)
 */
export function isInternalAdminPath(path: string): boolean {
  return path.startsWith('/admin/') || path === '/admin';
}

