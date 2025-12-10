// next.config.ts
import type { NextConfig } from "next";

const cspReportOnly = [
  "default-src 'self'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  // Scripts: no inline or eval; allow GA/GTM if you use them.
  "script-src 'self' https://www.googletagmanager.com https://www.google-analytics.com",
  // Styles: allow inline for now; remove 'unsafe-inline' after cleanup.
  "style-src 'self' 'unsafe-inline'",
  // Images (include GA beacons), data and blobs
  "img-src 'self' data: blob: https://www.google-analytics.com",
  // Fonts and workers
  "font-src 'self' data:",
  "worker-src 'self' blob:",
  // Network calls your app makes (add any others you actually call)
  "connect-src 'self' https://suggestqueries.google.com https://www.google-analytics.com https://www.googletagmanager.com https://trendarc.net https://www.trendarc.net https://dev.trendarc.net",
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
      "ambient-light-sensor=()",
      "autoplay=()",
      "battery=()",
      "camera=()",
      "display-capture=()",
      "document-domain=()",
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
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
