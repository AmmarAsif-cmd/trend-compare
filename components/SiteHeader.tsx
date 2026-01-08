"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { TrendingUp, ArrowRight, User, LayoutDashboard } from "lucide-react";
import { BRAND, TAGLINE } from "@/lib/brand";
import { ADMIN_PATH } from "@/lib/admin-config";

function isActive(pathname: string, href: string) {
  return pathname === href;
}

export default function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Mark as mounted to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Check if user is logged in
  useEffect(() => {
    if (!mounted) return; // Don't check until mounted
    
    async function checkAuth() {
      try {
        const response = await fetch('/api/user/me');
        // 401 is expected when not logged in, don't log as error
        setIsLoggedIn(response.ok);
      } catch (error) {
        // Only log unexpected errors (network errors, etc.)
        if (error instanceof TypeError && error.message.includes('fetch')) {
          // Network error - silently fail
          setIsLoggedIn(false);
        } else {
          // Other errors - log but don't show to user
          console.debug('[SiteHeader] Auth check error:', error);
          setIsLoggedIn(false);
        }
      }
    }
    checkAuth();

    // Listen for auth state changes (triggered after login/logout)
    const handleAuthChange = () => {
      checkAuth();
    };

    // Check auth on route changes (e.g., after login redirect)
    window.addEventListener('auth-state-change', handleAuthChange);

    return () => {
      window.removeEventListener('auth-state-change', handleAuthChange);
    };
  }, [pathname, mounted]); // Re-check when pathname changes (e.g., after login redirect)

  // Hide header on dashboard and admin pages (secure admin path)
  // This check must be AFTER all hooks are called
  if (pathname?.startsWith('/dashboard') || pathname?.startsWith(`/${ADMIN_PATH}`)) {
    return null;
  }

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/trending", label: "Trending" },
    { href: "/blog", label: "Blog" },
    { href: "/about", label: "About" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50 shadow-sm">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 sm:gap-3 group">
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105">
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {BRAND}
            </span>
            <span className="text-xs sm:text-sm text-slate-500 hidden sm:block">
              {TAGLINE}
            </span>
          </div>
        </Link>

        {/* Desktop links */}
        <ul className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`text-sm font-medium transition-colors relative ${
                  isActive(pathname, item.href)
                    ? "text-slate-900"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {item.label}
              </Link>
            </li>
          ))}

          {/* Tools Dropdown */}
          <li className="relative group">
            <button className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1">
              Tools
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-slate-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div className="py-2">
                <Link
                  href="/tools/trend-comparison"
                  className="block px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <div className="font-semibold text-slate-900">Trend Comparison</div>
                  <div className="text-xs text-slate-500 mt-0.5">Multi-source trend analysis</div>
                </Link>
                <div className="border-t border-slate-100 my-1"></div>
                <Link
                  href="/"
                  className="block px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <div className="font-semibold text-slate-900">Product Research</div>
                  <div className="text-xs text-slate-500 mt-0.5">Amazon product analysis</div>
                </Link>
              </div>
            </div>
          </li>

          {isLoggedIn && (
            <li>
              <Link
                href="/dashboard"
                className={`text-sm font-medium transition-colors relative flex items-center gap-1.5 ${
                  isActive(pathname, "/dashboard")
                    ? "text-indigo-600"
                    : "text-slate-600 hover:text-indigo-600"
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
            </li>
          )}
          <li>
            {isLoggedIn ? (
              <Link
                href="/account"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1.5"
              >
                <User className="w-4 h-4" />
                Account
              </Link>
            ) : (
              <Link
                href="/login"
                className="text-sm font-medium bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Sign In
              </Link>
            )}
          </li>
        </ul>

        {/* Mobile menu button */}
        <button
          className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 hover:bg-slate-50"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" />
          </svg>
        </button>
      </nav>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden border-t border-slate-200 bg-white">
          <ul className="mx-auto max-w-5xl px-4 py-3 space-y-2">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`block rounded-lg px-3 py-2 text-sm ${
                    isActive(pathname, item.href)
                      ? "bg-slate-100 text-slate-900 font-medium"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}

            {/* Tools Section for Mobile */}
            <li>
              <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Tools
              </div>
              <div className="space-y-1 mt-1">
                <Link
                  href="/tools/trend-comparison"
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 ml-2"
                >
                  <div className="font-medium">Trend Comparison</div>
                  <div className="text-xs text-slate-500">Multi-source trend analysis</div>
                </Link>
                <Link
                  href="/"
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 ml-2"
                >
                  <div className="font-medium">Product Research</div>
                  <div className="text-xs text-slate-500">Amazon product analysis</div>
                </Link>
              </div>
            </li>

            {isLoggedIn && (
              <li>
                <Link
                  href="/dashboard"
                  onClick={() => setOpen(false)}
                  className={`block rounded-lg px-3 py-2 text-sm flex items-center gap-2 ${
                    isActive(pathname, "/dashboard")
                      ? "bg-indigo-50 text-indigo-600 font-medium"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
              </li>
            )}
            <li>
              {isLoggedIn ? (
                <Link
                  href="/account"
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <User className="w-4 h-4" />
                  Account
                </Link>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm bg-indigo-600 text-white font-medium text-center hover:bg-indigo-700 transition-colors"
                >
                  Sign In
                </Link>
              )}
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
