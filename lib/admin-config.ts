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
// Use a function to read from env dynamically (not cached at module load)
// Supports both server-side (ADMIN_PATH) and client-side (NEXT_PUBLIC_ADMIN_PATH) env vars
function getAdminPath(): string {
  // On server: use ADMIN_PATH
  // On client: use NEXT_PUBLIC_ADMIN_PATH (must be set in .env for client access)
  if (typeof window === 'undefined') {
    // Server-side
    return process.env.ADMIN_PATH || process.env.NEXT_PUBLIC_ADMIN_PATH || 'cp-9a4eef7';
  } else {
    // Client-side - can only access NEXT_PUBLIC_ variables
    return process.env.NEXT_PUBLIC_ADMIN_PATH || 'cp-9a4eef7';
  }
}

export const ADMIN_PATH = getAdminPath();

// Admin route helpers - these use the secure path
// Use getters to ensure we always read the latest env value
export const ADMIN_ROUTES = {
  get login() {
    return `/${getAdminPath()}/login`;
  },
  get blog() {
    return `/${getAdminPath()}/blog`;
  },
  get keywords() {
    return `/${getAdminPath()}/keywords`;
  },
  get system() {
    return `/${getAdminPath()}/system`;
  },
  get users() {
    return `/${getAdminPath()}/users`;
  },
  get dashboard() {
    return `/${getAdminPath()}`;
  },
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
  const adminPath = getAdminPath();
  const routes: Record<string, string> = {
    login: `/${adminPath}/login`,
    blog: `/${adminPath}/blog`,
    keywords: `/${adminPath}/keywords`,
    system: `/${adminPath}/system`,
    users: `/${adminPath}/users`,
    dashboard: `/${adminPath}`,
  };
  return routes[route] || `/${adminPath}`;
}

/**
 * Check if a path is an admin path (secure path)
 */
export function isAdminPath(path: string): boolean {
  return path.startsWith(`/${getAdminPath()}`);
}

/**
 * Check if a path is the internal /admin/* path (blocked from direct access)
 */
export function isInternalAdminPath(path: string): boolean {
  return path.startsWith('/admin/') || path === '/admin';
}

