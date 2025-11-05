import type { Metadata } from "next";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import { BRAND, TAGLINE } from "@/lib/brand";
import Script from "next/script";

export const metadata: Metadata = {
  title: "TrendArc — Compare search interest for any two topics",
  description: "See which topics are trending worldwide with clear charts and AI-generated insights.",
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
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <SiteHeader />
        <div className="mx-auto max-w-6xl px-4 py-8">{children}</div>
        <footer className="mt-12 border-t border-slate-200 py-8 text-center text-sm text-slate-500">
          © {new Date().getFullYear()} {BRAND}. All rights reserved.
        </footer>
         {/* Google tag (gtag.js)  */}
     <Script
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
        />
      </body>
    </html>
  );
}
