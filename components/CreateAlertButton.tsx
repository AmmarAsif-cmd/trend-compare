'use client';

import { useState } from 'react';
import { Bell, Loader2, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

type Props = {
  slug: string;
  termA: string;
  termB: string;
};

type AlertType = 'score_change' | 'position_change' | 'threshold';

export default function CreateAlertButton({ slug, termA, termB }: Props) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [alertType, setAlertType] = useState<AlertType>('score_change');
  const [changePercent, setChangePercent] = useState(10);
  const [threshold, setThreshold] = useState(70);
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'instant'>('daily');

  const formatTerm = (term: string) => {
    return term.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const handleCreate = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          termA,
          termB,
          alertType,
          changePercent: alertType === 'score_change' ? changePercent : undefined,
          threshold: alertType === 'threshold' ? threshold : undefined,
          frequency,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create alert');
      }

      setSuccess(true);
      setTimeout(() => {
        setShowModal(false);
        setSuccess(false);
        router.refresh();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to create alert');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
      >
        <Bell className="w-4 h-4" />
        <span>Create Alert</span>
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">Create Trend Alert</h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setError(null);
                    setSuccess(false);
                  }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>
              <p className="text-sm text-slate-600 mt-1">
                Get notified when {formatTerm(termA)} vs {formatTerm(termB)} trends change
              </p>
            </div>

            <div className="p-6 space-y-6">
              {success ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Alert Created!</h3>
                  <p className="text-sm text-slate-600">
                    You'll receive notifications based on your settings.
                  </p>
                </div>
              ) : (
                <>
                  {/* Alert Type */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Alert Type
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                        <input
                          type="radio"
                          name="alertType"
                          value="score_change"
                          checked={alertType === 'score_change'}
                          onChange={(e) => setAlertType(e.target.value as AlertType)}
                          className="text-indigo-600"
                        />
                        <div>
                          <div className="font-medium text-slate-900">Score Change</div>
                          <div className="text-xs text-slate-600">Notify when scores change by a percentage</div>
                        </div>
                      </label>
                      <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                        <input
                          type="radio"
                          name="alertType"
                          value="position_change"
                          checked={alertType === 'position_change'}
                          onChange={(e) => setAlertType(e.target.value as AlertType)}
                          className="text-indigo-600"
                        />
                        <div>
                          <div className="font-medium text-slate-900">Position Change</div>
                          <div className="text-xs text-slate-600">Notify when the winner changes</div>
                        </div>
                      </label>
                      <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                        <input
                          type="radio"
                          name="alertType"
                          value="threshold"
                          checked={alertType === 'threshold'}
                          onChange={(e) => setAlertType(e.target.value as AlertType)}
                          className="text-indigo-600"
                        />
                        <div>
                          <div className="font-medium text-slate-900">Threshold</div>
                          <div className="text-xs text-slate-600">Notify when a score exceeds a threshold</div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Alert Settings */}
                  {alertType === 'score_change' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Change Percentage ({changePercent}%)
                      </label>
                      <input
                        type="range"
                        min="5"
                        max="50"
                        value={changePercent}
                        onChange={(e) => setChangePercent(Number(e.target.value))}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-slate-500 mt-1">
                        <span>5%</span>
                        <span>50%</span>
                      </div>
                    </div>
                  )}

                  {alertType === 'threshold' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Score Threshold ({threshold})
                      </label>
                      <input
                        type="range"
                        min="50"
                        max="100"
                        value={threshold}
                        onChange={(e) => setThreshold(Number(e.target.value))}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-slate-500 mt-1">
                        <span>50</span>
                        <span>100</span>
                      </div>
                    </div>
                  )}

                  {/* Frequency */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Check Frequency
                    </label>
                    <select
                      value={frequency}
                      onChange={(e) => setFrequency(e.target.value as any)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="instant">Instant (as changes occur)</option>
                    </select>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => {
                        setShowModal(false);
                        setError(null);
                      }}
                      className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreate}
                      disabled={loading}
                      className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create Alert'
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

