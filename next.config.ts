// next.config.ts
import type { NextConfig } from "next";

const cspReportOnly = [
  "default-src 'self'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  // Scripts: allow inline and eval for Next.js dev mode, Chart.js, and AdSense
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://pagead2.googlesyndication.com https://tpc.googlesyndication.com",
  // Styles: allow inline for now; remove 'unsafe-inline' after cleanup.
  "style-src 'self' 'unsafe-inline'",
  // Images (include GA beacons, AdSense), data and blobs
  "img-src 'self' data: blob: https://www.google-analytics.com https://www.googletagmanager.com https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://pagead2.googlesyndication.com",
  // Fonts and workers
  "font-src 'self' data:",
  "worker-src 'self' blob:",
  // Network calls your app makes (add AdSense domains)
  "connect-src 'self' https://suggestqueries.google.com https://www.google-analytics.com https://www.googletagmanager.com https://trendarc.net https://www.trendarc.net https://dev.trendarc.net https://googleads.g.doubleclick.net https://pagead2.googlesyndication.com https://tpc.googlesyndication.com",
  // Frame sources for AdSense ads
  "frame-src 'self' https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://pagead2.googlesyndication.com",
  // No plugins/objects
  "object-src 'none'",
  // Where browsers send CSP reports
  "report-uri /api/csp-report",
].join("; ");

const securityHeaders: { key: string; value: string }[] = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-site" },
  {
    key: "Permissions-Policy",
    value: [
      "accelerometer=()",
      "autoplay=()",
      "camera=()",
      "display-capture=()",
      "encrypted-media=()",
      "fullscreen=(self)",
      "geolocation=()",
      "gyroscope=()",
      "magnetometer=()",
      "microphone=()",
      "midi=()",
      "payment=()",
      "picture-in-picture=(self)",
      "publickey-credentials-get=(self)",
      "screen-wake-lock=()",
      "sync-xhr=()",
      "usb=()",
      "xr-spatial-tracking=()",
    ].join(", "),
  },
  // Start in report-only. After fixing violations, switch this key to "Content-Security-Policy".
  { key: "Content-Security-Policy-Report-Only", value: cspReportOnly },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  turbopack: { root: __dirname },
  // Disable production source maps (not needed, reduces build size)
  productionBrowserSourceMaps: false,
  // Remove console logs in production (keep error and warn)
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'], // Keep console.error and console.warn for production debugging
    } : false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'm.media-amazon.com',
      },
      {
        protocol: 'https',
        hostname: 'images-na.ssl-images-amazon.com',
      },
    ],
  },
  async rewrites() {
    // Map secure admin path to actual admin folder
    // This allows us to use a hard-to-guess URL while keeping the folder structure
    const adminPath = process.env.ADMIN_PATH || 'cp-9a4eef7';
    return [
      {
        source: `/${adminPath}/:path*`,
        destination: '/admin/:path*',
      },
      // Note: API routes are kept at /api/admin/ for reliability
      // The secure path is mainly for the UI pages
      // If you want API routes to also use secure path, uncomment below:
      // {
      //   source: `/api/${adminPath}/:path*`,
      //   destination: '/api/admin/:path*',
      // },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  async redirects() {
    return [
      // Redirect trailing slashes to non-trailing slash (except root)
      {
        source: "/:path+/",
        destination: "/:path+",
        permanent: true, // 301 redirect
      },
    ];
  },
};

export default nextConfig;
