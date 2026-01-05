import { MetadataRoute } from 'next';
import { ADMIN_PATH } from '@/lib/admin-config';

/**
 * robots.txt Configuration
 * 
 * Rules:
 * - Allow all public pages (homepage, /compare/*, /blog/*, static pages)
 * - Block internal/system routes (/api/*, /admin/*, secure admin path)
 * 
 * Public content that should be crawlable:
 * - / (homepage)
 * - /compare/* (comparison pages)
 * - /blog/* (blog posts)
 * - /about, /privacy, /terms, /contact (static pages)
 * 
 * Internal/system routes that should remain blocked:
 * - /api/* (all API endpoints - internal/system use)
 * - /admin/* (internal admin panel - blocked from direct access)
 * - /${ADMIN_PATH}/* (secure admin path - system route)
 */
export default function robots(): MetadataRoute.Robots {
  const adminPath = ADMIN_PATH || 'cp-9a4eef7';
  
  return {
    rules: [
      {
        userAgent: '*',
        // Allow all public pages (default behavior, but explicit for clarity)
        allow: '/',
        // Block internal/system routes only
        disallow: [
          '/api/',           // All API endpoints (internal/system)
          '/admin/',         // Internal admin panel (blocked from direct access)
          `/${adminPath}/`,  // Secure admin path (system route)
        ],
      },
    ],
    sitemap: 'https://trendarc.net/sitemap.xml',
  };
}
