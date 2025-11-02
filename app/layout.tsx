import type { Metadata } from "next";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import { BRAND, TAGLINE } from "@/lib/brand";

export const metadata: Metadata = {
  title: `${BRAND} — ${TAGLINE}`,
  description: TAGLINE,
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
      </body>
    </html>
  );
}
