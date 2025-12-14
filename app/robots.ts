import { MetadataRoute } from 'next';
import { ADMIN_PATH } from '@/lib/admin-config';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Block both old and new admin paths
        disallow: ['/api/', '/admin/', `/${ADMIN_PATH}/`],
      },
    ],
    sitemap: 'https://trendarc.net/sitemap.xml',
  };
}
