/**
 * Dashboard Sidebar Navigation
 * Persistent left sidebar for dashboard navigation
 */

'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Bookmark,
  Bell,
  TrendingUp,
  FileText,
  History,
  Search,
  Settings,
  HelpCircle,
  MessageSquare,
  LogOut,
  Menu,
  X,
  Home,
} from 'lucide-react';
import { useState } from 'react';

const navigation = {
  primary: [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'My Comparisons', href: '/dashboard/comparisons', icon: Bookmark },
    { name: 'Alerts & Monitoring', href: '/dashboard/alerts', icon: Bell },
    { name: 'Trend Explorer', href: '/', icon: TrendingUp },
    { name: 'Reports', href: '/dashboard/reports', icon: FileText },
    { name: 'Home', href: '/', icon: Home },
  ],
  secondary: [
    { name: 'History', href: '/dashboard/history', icon: History },
    // { name: 'Saved Searches', href: '/dashboard/saved-searches', icon: Search }, // Hidden until implemented
    // { name: 'Settings', href: '/dashboard/settings', icon: Settings }, // Hidden until implemented
  ],
};

export default function DashboardSidebar() {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const NavLink = ({ item }: { item: typeof navigation.primary[0] }) => {
    const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
    const Icon = item.icon;

    return (
      <Link
        href={item.href}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
          isActive
            ? 'bg-indigo-50 text-indigo-700 font-medium'
            : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
        }`}
        onClick={() => setIsMobileOpen(false)}
      >
        <Icon className="w-5 h-5" />
        <span>{item.name}</span>
      </Link>
    );
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white border border-slate-200 shadow-lg hover:bg-slate-50 transition-colors"
        aria-label="Toggle menu"
      >
        {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-white border-r border-slate-200 z-40 transform transition-transform duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo/Brand */}
          <div className="px-6 py-6 border-b border-slate-200">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900">TrendArc</span>
            </Link>
          </div>

          {/* Primary Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            <div className="mb-6">
              <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Main
              </p>
              <div className="space-y-1">
                {navigation.primary.map((item) => (
                  <NavLink key={item.href} item={item} />
                ))}
              </div>
            </div>

            {/* Secondary Navigation */}
            <div>
              <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                More
              </p>
              <div className="space-y-1">
                {navigation.secondary.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-700 font-medium'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                      onClick={() => setIsMobileOpen(false)}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </nav>

          {/* Footer */}
          <div className="px-4 py-4 border-t border-slate-200 space-y-1">
            <Link
              href="/help"
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              onClick={() => setIsMobileOpen(false)}
            >
              <HelpCircle className="w-5 h-5" />
              <span>Help</span>
            </Link>
            <Link
              href="/feedback"
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              onClick={() => setIsMobileOpen(false)}
            >
              <MessageSquare className="w-5 h-5" />
              <span>Feedback</span>
            </Link>
            <Link
              href="/api/auth/signout"
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-700 hover:bg-red-50 hover:text-red-700 transition-colors"
              onClick={() => setIsMobileOpen(false)}
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
}

