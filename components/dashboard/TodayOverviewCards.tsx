/**
 * Today's Overview Cards
 * Signal-based cards that act as filters
 */

'use client';

import { Bookmark, Bell, TrendingUp, AlertTriangle, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface TodayOverviewCardsProps {
  trackedCount: number;
  changedThisWeek: number;
  activeAlerts: number;
  triggeredAlerts: number;
  highVolatility: number;
  confidenceDrops: number;
}

export default function TodayOverviewCards({
  trackedCount,
  changedThisWeek,
  activeAlerts,
  triggeredAlerts,
  highVolatility,
  confidenceDrops,
}: TodayOverviewCardsProps) {
  const router = useRouter();

  const cards = [
    {
      title: 'Tracked Comparisons',
      value: trackedCount,
      subtitle: `${changedThisWeek} changed this week`,
      icon: Bookmark,
      color: 'indigo',
      onClick: () => router.push('/dashboard/comparisons'),
    },
    {
      title: 'Alerts Status',
      value: activeAlerts,
      subtitle: `${triggeredAlerts} triggered`,
      icon: Bell,
      color: 'amber',
      onClick: () => router.push('/dashboard/alerts'),
    },
    {
      title: 'Volatility Watch',
      value: highVolatility,
      subtitle: 'High-volatility comparisons',
      icon: TrendingUp,
      color: 'red',
      onClick: () => router.push('/dashboard/comparisons?filter=volatility'),
    },
    {
      title: 'Confidence Drops',
      value: confidenceDrops,
      subtitle: 'Declining confidence',
      icon: AlertTriangle,
      color: 'orange',
      onClick: () => router.push('/dashboard/comparisons?filter=confidence'),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const colorClasses = {
          indigo: 'bg-indigo-500 text-white',
          amber: 'bg-amber-500 text-white',
          red: 'bg-red-500 text-white',
          orange: 'bg-orange-500 text-white',
        };

        return (
          <button
            key={card.title}
            onClick={card.onClick}
            className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all text-left group cursor-pointer"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 ${colorClasses[card.color as keyof typeof colorClasses]} rounded-lg flex items-center justify-center shadow-sm`}>
                <Icon className="w-6 h-6" />
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">{card.title}</p>
              <p className="text-3xl font-bold text-slate-900 mb-1">{card.value}</p>
              <p className="text-xs text-slate-500">{card.subtitle}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

