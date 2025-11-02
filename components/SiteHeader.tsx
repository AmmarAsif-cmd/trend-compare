"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BRAND, NAV } from "@/lib/brand";
import { cn } from "@/lib/ui";

export default function SiteHeader() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-30 w-full bg-white/90 backdrop-blur border-b border-slate-200">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-white text-sm font-bold">TA</span>
        
          <span className="font-semibold tracking-tight">{BRAND}</span>
        </Link>
        <nav className="hidden sm:flex items-center gap-4">
          {NAV.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-sm px-2 py-1 rounded-md transition hover:bg-slate-100",
                pathname === item.href ? "text-slate-900" : "text-slate-600"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
