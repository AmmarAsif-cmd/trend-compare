import type { Metadata } from "next";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import TopLoadingBar from "@/components/TopLoadingBar";
import { BRAND, TAGLINE } from "@/lib/brand";
import Script from "next/script";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "TrendArc — Compare search interest for any two topics",
  description: "See which topics are trending worldwide with clear charts and data-driven insights insights.",
  metadataBase: new URL("https://trendarc.net"),
  openGraph: {
    title: "TrendArc",
    description: "Compare trending topics side by side — fast, clean, and data-driven.",
    url: "https://trendarc.net",
    siteName: "TrendArc",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "TrendArc — Compare any two topics",
      },
    ],
    locale: "en_US",
    type: "website",
  },
};


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased flex flex-col">
        <Suspense fallback={null}>
          <TopLoadingBar />
        </Suspense>
        <SiteHeader />
        <div className="flex-1">{children}</div>
        <footer className="bg-white border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
                <p className="text-slate-600 mb-4 text-sm leading-relaxed max-w-md">{TAGLINE}</p>
                <div className="flex gap-2">
                  <a href="#" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-slate-100 hover:bg-blue-600 text-slate-600 hover:text-white flex items-center justify-center transition-all" aria-label="Twitter">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                    </svg>
                  </a>
                  <a href="#" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-slate-100 hover:bg-blue-700 text-slate-600 hover:text-white flex items-center justify-center transition-all" aria-label="LinkedIn">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                  </a>
                  <a href="#" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-800 text-slate-600 hover:text-white flex items-center justify-center transition-all" aria-label="GitHub">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                    </svg>
                  </a>
                  <a href="#" className="w-9 h-9 rounded-lg bg-slate-100 hover:bg-emerald-600 text-slate-600 hover:text-white flex items-center justify-center transition-all" aria-label="Email">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </a>
                </div>
              </div>

              {/* Product Links */}
              <div>
                <h4 className="font-semibold text-slate-900 mb-3 text-sm">Product</h4>
                <ul className="space-y-2 text-sm">
                  <li><a href="/#features" className="text-slate-600 hover:text-blue-600 transition">Features</a></li>
                  <li><a href="/#how-it-works" className="text-slate-600 hover:text-blue-600 transition">How It Works</a></li>
                  <li><a href="/#faq" className="text-slate-600 hover:text-blue-600 transition">FAQ</a></li>
                </ul>
              </div>

              {/* Company Links */}
              <div>
                <h4 className="font-semibold text-slate-900 mb-3 text-sm">Company</h4>
                <ul className="space-y-2 text-sm">
                  <li><a href="/about" className="text-slate-600 hover:text-blue-600 transition">About</a></li>
                  <li><a href="mailto:contact@trendarc.net" className="text-slate-600 hover:text-blue-600 transition">Contact</a></li>
                  <li><a href="/privacy" className="text-slate-600 hover:text-blue-600 transition">Privacy</a></li>
                </ul>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-slate-200 pt-6">
              <div className="flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-slate-500">
                <p>© {new Date().getFullYear()} {BRAND}. All rights reserved.</p>
                <div className="flex items-center gap-4">
                  <a href="/terms" className="hover:text-blue-600 transition">Terms</a>
                  <span>•</span>
                  <a href="/privacy" className="hover:text-blue-600 transition">Privacy</a>
                  <span>•</span>
                  <a href="mailto:contact@trendarc.net" className="hover:text-blue-600 transition">Contact</a>
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
      </body>
    </html>
  );
}
