/**
 * Admin Configuration
 * 
 * SECURITY: This file contains the admin panel path.
 * Change ADMIN_PATH in production to a random, hard-to-guess value.
 * 
 * To generate a new secure path:
 * node -e "console.log(require('crypto').randomBytes(8).toString('hex'))"
 */

// SECURE ADMIN PATH - Change this to a random value in production!
// Format: cp-{random-hex} makes it harder to guess
export const ADMIN_PATH = process.env.ADMIN_PATH || 'cp-9a4eef7';

// Admin route helpers
// Note: API routes use /api/admin/ directly (rewrites handle the secure path mapping)
// Page routes use the secure path
export const ADMIN_ROUTES = {
  login: `/${ADMIN_PATH}/login`,
  blog: `/${ADMIN_PATH}/blog`,
  system: `/${ADMIN_PATH}/system`,
  api: {
    // API routes stay at /api/admin/ - rewrites in next.config.ts handle the secure path
    // This ensures the actual route files work correctly
    login: '/api/admin/login',
    logout: '/api/admin/logout',
    checkAuth: '/api/admin/check-auth',
  },
} as const;

/**
 * Get the full admin URL for a given route
 */
export function getAdminUrl(route: keyof typeof ADMIN_ROUTES): string {
  return ADMIN_ROUTES[route];
}

/**
 * Check if a path is an admin path
 */
export function isAdminPath(path: string): boolean {
  return path.startsWith(`/${ADMIN_PATH}`);
}

