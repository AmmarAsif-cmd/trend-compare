/**
 * What to Do Next Section
 * Context-aware actions based on comparison signals and user state
 */

'use client';

import { Bell, Bookmark, Plus, LogIn, TrendingUp, Download, Settings } from 'lucide-react';
import Link from 'next/link';
import { getNextActions, type NextActionsContext } from '@/lib/next-actions';

interface WhatToDoNextProps {
  slug: string;
  termA: string;
  termB: string;
  isLoggedIn: boolean;
  isTracking?: boolean;
  volatility: 'low' | 'medium' | 'high';
  confidence: number;
  gapChangePoints: number;
  disagreementFlag: boolean;
  agreementIndex: number;
}

const iconMap: Record<string, typeof Bell> = {
  Bell,
  Bookmark,
  Plus,
  LogIn,
  TrendingUp,
  Download,
  Settings,
};

export default function WhatToDoNext({
  slug,
  termA,
  termB,
  isLoggedIn,
  isTracking = false,
  volatility,
  confidence,
  gapChangePoints,
  disagreementFlag,
  agreementIndex,
}: WhatToDoNextProps) {
  const context: NextActionsContext = {
    isLoggedIn,
    isTracking,
    volatility,
    confidence,
    gapChangePoints,
    disagreementFlag,
    agreementIndex,
    slug,
    termA,
    termB,
  };

  const actions = getNextActions(context);

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-200 shadow-lg p-5 sm:p-6">
      <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
        <span className="w-1.5 h-6 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full" />
        What to do next
      </h3>

      <div className="space-y-3">
        {actions.map((action) => {
          const Icon = iconMap[action.icon] || Bell;
          
          if (isLoggedIn || !action.requiresAuth) {
            return (
              <Link
                key={action.id}
                href={action.href}
                className="flex items-start gap-3 p-3 bg-white rounded-lg border border-indigo-200 hover:border-indigo-300 hover:shadow-md transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-200 transition-colors">
                  <Icon className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">{action.title}</p>
                  <p className="text-xs text-slate-600 mt-0.5">{action.subtitle}</p>
                </div>
              </Link>
            );
          }
          
          return (
            <div
              key={action.id}
              className="flex items-start gap-3 p-3 bg-white rounded-lg border border-slate-200 opacity-60"
            >
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-slate-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-600">{action.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{action.subtitle}</p>
              </div>
            </div>
          );
        })}

        {!isLoggedIn && actions.length < 3 && (
          <Link
            href="/signup"
            className="flex items-center gap-2 p-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-medium text-sm"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign in to save and track comparisons</span>
          </Link>
        )}
      </div>
    </div>
  );
}

