import type { Metadata } from "next";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import TopLoadingBar from "@/components/TopLoadingBar";
import CookieConsent from "@/components/CookieConsent";
import ConsentManagementPlatform from "@/components/ConsentManagementPlatform";
import AnonymousUsageTracker from "@/components/AnonymousUsageTracker";
import AnonymousComparisonGuard from "@/components/AnonymousComparisonGuard";
import OAuthCallbackHandler from "@/components/OAuthCallbackHandler";
import { Providers } from "@/components/providers";
import { BRAND, TAGLINE } from "@/lib/brand";
import Script from "next/script";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "TrendArc | Compare search interest for any two topics",
  description: "See which topics are trending worldwide with clear charts and data-driven insights. Compare movies, music, games, products, and more with AI-powered analysis.",
  metadataBase: new URL("https://trendarc.net"),
  keywords: ["trend comparison", "google trends", "trending topics", "search interest", "trend analysis", "compare trends", "trending keywords"],
  authors: [{ name: "TrendArc" }],
  creator: "TrendArc",
  publisher: "TrendArc",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: "TrendArc | Compare Trending Topics",
    description: "Compare trending topics side by side, fast, clean, and data-driven. See which topics are winning with AI-powered insights.",
    url: "https://trendarc.net",
    siteName: "TrendArc",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "TrendArc | Compare any two topics",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TrendArc | Compare Trending Topics",
    description: "Compare trending topics side by side with AI-powered insights",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "https://trendarc.net",
  },
};


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 text-slate-900 antialiased flex flex-col">
        <Providers>
          <Suspense fallback={null}>
            <TopLoadingBar />
          </Suspense>
          <ConsentManagementPlatform />
          <SiteHeader />
          <AnonymousUsageTracker />
          <OAuthCallbackHandler />
          <AnonymousComparisonGuard>
            <div className="flex-1">{children}</div>
          </AnonymousComparisonGuard>
          <CookieConsent />
          <footer className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-t border-slate-700/50">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAzNGMwIDIuMjA5LTEuNzkxIDQtNCA0cy00LTEuNzkxLTQtNCAxLjc5MS00IDQtNCA0IDEuNzkxIDQgNHptMTAtMTBjMCAyLjIwOS0xLjc5MSA0LTQgNHMtNC0xLjc5MS00LTQgMS43OTEtNCA0LTQgNCAxLjc5MSA0IDR6IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDMiLz48L2c+PC9zdmc+')] opacity-20" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="grid md:grid-cols-4 gap-8 mb-8">
              {/* Brand Section */}
              <div className="md:col-span-2">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <span className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">{BRAND}</span>
                </div>
                <p className="text-slate-300 mb-4 text-sm leading-relaxed max-w-md">{TAGLINE}</p>
              </div>

              {/* Product Links */}
              <div>
                <h4 className="font-semibold text-white mb-4 text-sm">Product</h4>
                <ul className="space-y-3 text-sm">
                  <li><a href="/#features" className="text-slate-300 hover:text-white transition-colors duration-200">Features</a></li>
                  <li><a href="/#how-it-works" className="text-slate-300 hover:text-white transition-colors duration-200">How It Works</a></li>
                  <li><a href="/#faq" className="text-slate-300 hover:text-white transition-colors duration-200">FAQ</a></li>
                </ul>
              </div>

              {/* Company Links */}
              <div>
                <h4 className="font-semibold text-white mb-4 text-sm">Company</h4>
                <ul className="space-y-3 text-sm">
                  <li><a href="/about" className="text-slate-300 hover:text-white transition-colors duration-200">About</a></li>
                  <li><a href="/contact" className="text-slate-300 hover:text-white transition-colors duration-200">Contact</a></li>
                  <li><a href="/privacy" className="text-slate-300 hover:text-white transition-colors duration-200">Privacy</a></li>
                </ul>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-slate-700/50 pt-8 mt-8">
              <div className="flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-slate-400">
                <p>© {new Date().getFullYear()} {BRAND}. All rights reserved.</p>
                <div className="flex items-center gap-4">
                  <a href="/terms" className="hover:text-white transition-colors duration-200">Terms</a>
                  <span className="text-slate-600">•</span>
                  <a href="/privacy" className="hover:text-white transition-colors duration-200">Privacy</a>
                  <span className="text-slate-600">•</span>
                  <a href="/contact" className="hover:text-white transition-colors duration-200">Contact</a>
                </div>
              </div>
            </div>
          </div>
        </footer>
        {/* Google tag (gtag.js)  */}
        {/*<Script
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=G-GZ6TBCKK5Q"
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-GZ6TBCKK5Q');
            `,
          }}
        />*/}
          {/* Set GA id in a small bootstrap before ga-init uses it */}
          <Script id="ga-id" strategy="afterInteractive">
            {`window.GA_MEASUREMENT_ID='${process.env.NEXT_PUBLIC_GA_ID || ""}';`}
          </Script>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID || ""}`} strategy="afterInteractive" />
          <Script src="/ga-init.js" strategy="afterInteractive" />
        </Providers>
      </body>
    </html>
  );
}
