/**
 * Admin Configuration
 *
 * SECURITY: This file contains the admin panel path.
 * Change ADMIN_PATH in production to a random, hard-to-guess value.
 *
 * To generate a new secure path:
 * node -e "console.log(require('crypto').randomBytes(8).toString('hex'))"
 */

// SECURE ADMIN PATH - Using /admin for simplicity
// The secure path is mapped via next.config.ts rewrites
export const ADMIN_PATH = 'admin';

// Admin route helpers
export const ADMIN_ROUTES = {
  login: `/admin/login`,
  blog: `/admin/blog`,
  keywords: `/admin/keywords`,
  system: `/admin/system`,
  dashboard: `/admin`,
  api: {
    // API routes stay at /api/admin/
    login: '/api/admin/login',
    logout: '/api/admin/logout',
    checkAuth: '/api/admin/check-auth',
  },
} as const;

/**
 * Get the full admin URL for a given route
 */
export function getAdminUrl(route: 'login' | 'blog' | 'keywords' | 'system' | 'dashboard'): string {
  return ADMIN_ROUTES[route];
}

/**
 * Check if a path is an admin path
 */
export function isAdminPath(path: string): boolean {
  return path.startsWith(`/${ADMIN_PATH}`);
}

