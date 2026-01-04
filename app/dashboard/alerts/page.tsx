/**
 * Alerts Management Page
 * Free feature - Manage trend alerts (requires account)
 */

import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/user-auth-helpers';
import { getUserAlerts } from '@/lib/trend-alerts';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import Link from 'next/link';
import { Bell, TrendingUp } from 'lucide-react';
import AlertManagementClient from '@/components/AlertManagementClient';

export default async function AlertsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login?redirect=/dashboard/alerts');
  }

  const userId = (user as any).id;
  const alerts = await getUserAlerts(userId);

  const formatTerm = (term: string) => {
    return term.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const getAlertTypeLabel = (type: string) => {
    switch (type) {
      case 'score_change':
        return 'Score Change';
      case 'position_change':
        return 'Position Change';
      case 'threshold':
        return 'Threshold';
      default:
        return type;
    }
  };

  const getFrequencyLabel = (freq: string) => {
    switch (freq) {
      case 'daily':
        return 'Daily';
      case 'weekly':
        return 'Weekly';
      case 'instant':
        return 'Instant';
      default:
        return freq;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden" data-dashboard-layout>
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto lg:ml-64 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-2">
              Trend Alerts
            </h1>
            <p className="text-lg text-slate-600">
              Get notified when your tracked comparisons change
            </p>
          </div>

      {/* Alerts List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        {alerts.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No alerts yet</h3>
            <p className="text-sm text-slate-600 mb-6">
              Create alerts to get notified when trends change
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              <TrendingUp className="w-4 h-4" />
              Browse Comparisons
            </Link>
          </div>
        ) : (
          <AlertManagementClient alerts={alerts} />
        )}
      </div>

      {/* Info Section */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">About Trend Alerts</h3>
        <ul className="space-y-2 text-sm text-slate-700">
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-1">•</span>
            <span><strong>Score Change:</strong> Get notified when search interest changes by your specified percentage</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-1">•</span>
            <span><strong>Position Change:</strong> Get notified when one term overtakes another</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-1">•</span>
            <span><strong>Threshold:</strong> Get notified when a score exceeds your threshold</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-1">•</span>
            <span>Alerts are checked based on your selected frequency (weekly or instant)</span>
          </li>
        </ul>
      </div>
        </div>
      </main>
    </div>
  );
}

