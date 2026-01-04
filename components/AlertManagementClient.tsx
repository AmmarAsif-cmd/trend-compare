'use client';

import { useState } from 'react';
import { Bell, BellOff, Trash2, Pause, Play, TrendingUp, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Alert = {
  id: string;
  slug: string;
  termA: string;
  termB: string;
  alertType: string;
  threshold?: number;
  changePercent: number;
  frequency: string;
  status: string;
  baselineScoreA?: number;
  baselineScoreB?: number;
  lastTriggered?: Date | string;
  notifyCount: number;
  createdAt: Date | string;
};

type Props = {
  alerts: Alert[];
};

export default function AlertManagementClient({ alerts: initialAlerts }: Props) {
  const router = useRouter();
  const [alerts, setAlerts] = useState(initialAlerts);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const handleStatusChange = async (alertId: string, newStatus: 'active' | 'paused' | 'deleted') => {
    setLoading(alertId);
    setError(null);

    try {
      const response = await fetch(`/api/alerts/${alertId}`, {
        method: newStatus === 'deleted' ? 'DELETE' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: newStatus === 'deleted' ? undefined : JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update alert');
      }

      if (newStatus === 'deleted') {
        setAlerts(alerts.filter(a => a.id !== alertId));
      } else {
        setAlerts(alerts.map(a => a.id === alertId ? { ...a, status: newStatus } : a));
      }

      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to update alert');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="divide-y divide-slate-200">
      {error && (
        <div className="p-4 bg-red-50 border-b border-red-200">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {alerts.map((alert) => (
        <div key={alert.id} className="p-6 hover:bg-slate-50 transition-colors">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <Link
                  href={`/compare/${alert.slug}`}
                  className="font-semibold text-slate-900 hover:text-indigo-600 transition-colors"
                >
                  {formatTerm(alert.termA)} vs {formatTerm(alert.termB)}
                </Link>
                {alert.status === 'active' && (
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Active
                  </span>
                )}
                {alert.status === 'paused' && (
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                    Paused
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 mb-3">
                <span className="flex items-center gap-1">
                  <Bell className="w-4 h-4" />
                  {getAlertTypeLabel(alert.alertType)}
                </span>
                {alert.alertType === 'score_change' && (
                  <span>Change: {alert.changePercent}%</span>
                )}
                {alert.alertType === 'threshold' && alert.threshold && (
                  <span>Threshold: {alert.threshold}</span>
                )}
                <span>Frequency: {getFrequencyLabel(alert.frequency)}</span>
                {alert.notifyCount > 0 && (
                  <span className="text-indigo-600 font-medium">
                    Triggered {alert.notifyCount} time{alert.notifyCount !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {alert.baselineScoreA !== undefined && alert.baselineScoreB !== undefined && (
                <div className="text-xs text-slate-500">
                  Baseline: {formatTerm(alert.termA)} {alert.baselineScoreA} vs {formatTerm(alert.termB)} {alert.baselineScoreB}
                </div>
              )}

              {alert.lastTriggered && (
                <div className="text-xs text-slate-500 mt-1">
                  Last triggered: {new Date(alert.lastTriggered).toLocaleDateString()}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {alert.status === 'active' ? (
                <button
                  onClick={() => handleStatusChange(alert.id, 'paused')}
                  disabled={loading === alert.id}
                  className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors disabled:opacity-50"
                  title="Pause alert"
                >
                  <Pause className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => handleStatusChange(alert.id, 'active')}
                  disabled={loading === alert.id}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                  title="Resume alert"
                >
                  <Play className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => handleStatusChange(alert.id, 'deleted')}
                disabled={loading === alert.id}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                title="Delete alert"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

