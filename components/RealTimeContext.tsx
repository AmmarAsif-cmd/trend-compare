"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, AlertTriangle, Clock } from "lucide-react";

type RealTimeContextProps = {
  termA: string;
  termB: string;
  series: Array<{ date: string; [key: string]: any }>;
  timeframe: string;
};

type SpikeData = {
  term: string;
  magnitude: number;
  date: string;
  confidence: "high" | "medium" | "low";
} | null;

type VolatilityLevel = "high" | "medium" | "low";

export default function RealTimeContext({
  termA,
  termB,
  series,
  timeframe,
}: RealTimeContextProps) {
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    // Update current time every minute
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Calculate last updated time
    if (series && series.length > 0) {
      const lastDataPoint = series[series.length - 1];
      const lastDate = new Date(lastDataPoint.date);
      const now = new Date();
      const diffMinutes = Math.floor(
        (now.getTime() - lastDate.getTime()) / (1000 * 60)
      );

      if (diffMinutes < 60) {
        setLastUpdated(`${diffMinutes} minutes ago`);
      } else if (diffMinutes < 1440) {
        const hours = Math.floor(diffMinutes / 60);
        setLastUpdated(`${hours} hour${hours > 1 ? "s" : ""} ago`);
      } else {
        const days = Math.floor(diffMinutes / 1440);
        setLastUpdated(`${days} day${days > 1 ? "s" : ""} ago`);
      }
    }
  }, [series, currentTime]);

  // Calculate current leader and advantage
  const getLeaderInfo = () => {
    if (!series || series.length === 0) return null;

    const recentPoints = series.slice(-7); // Last week
    const avgA =
      recentPoints.reduce((sum, p) => sum + (Number(p[termA]) || 0), 0) /
      recentPoints.length;
    const avgB =
      recentPoints.reduce((sum, p) => sum + (Number(p[termB]) || 0), 0) /
      recentPoints.length;

    const leader = avgA > avgB ? termA : termB;
    const trailer = leader === termA ? termB : termA;
    const leaderAvg = Math.max(avgA, avgB);
    const trailerAvg = Math.min(avgA, avgB);
    const advantage =
      trailerAvg > 0 ? ((leaderAvg - trailerAvg) / trailerAvg) * 100 : 0;

    // Calculate how long they've been leader
    let leaderSince = 0;
    for (let i = series.length - 1; i >= 0; i--) {
      const pointA = Number(series[i][termA]) || 0;
      const pointB = Number(series[i][termB]) || 0;
      const currentLeader = pointA > pointB ? termA : termB;

      if (currentLeader !== leader) {
        leaderSince = series.length - i;
        break;
      }
    }

    return {
      leader,
      trailer,
      advantage: Math.round(advantage),
      leaderSince: leaderSince || series.length,
    };
  };

  // Detect recent spikes
  const detectRecentSpike = (): SpikeData => {
    if (!series || series.length < 7) return null;

    const last7 = series.slice(-7);
    const prev7 = series.slice(-14, -7);

    // Calculate averages
    const avgA_recent =
      last7.reduce((sum, p) => sum + (Number(p[termA]) || 0), 0) / 7;
    const avgB_recent =
      last7.reduce((sum, p) => sum + (Number(p[termB]) || 0), 0) / 7;
    const avgA_prev =
      prev7.reduce((sum, p) => sum + (Number(p[termA]) || 0), 0) / 7;
    const avgB_prev =
      prev7.reduce((sum, p) => sum + (Number(p[termB]) || 0), 0) / 7;

    // Check for spikes (>100% increase)
    const spikeA = avgA_prev > 0 ? ((avgA_recent - avgA_prev) / avgA_prev) * 100 : 0;
    const spikeB = avgB_prev > 0 ? ((avgB_recent - avgB_prev) / avgB_prev) * 100 : 0;

    if (spikeA > 100) {
      return {
        term: termA,
        magnitude: Math.round(spikeA),
        date: last7[last7.length - 1].date,
        confidence: spikeA > 200 ? "high" : "medium",
      };
    }

    if (spikeB > 100) {
      return {
        term: termB,
        magnitude: Math.round(spikeB),
        date: last7[last7.length - 1].date,
        confidence: spikeB > 200 ? "high" : "medium",
      };
    }

    return null;
  };

  // Calculate volatility
  const getVolatility = (term: string): VolatilityLevel => {
    if (!series || series.length < 7) return "low";

    const values = series.map((p) => Number(p[term]) || 0);
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance =
      values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = mean > 0 ? (stdDev / mean) * 100 : 0;

    if (coefficientOfVariation > 50) return "high";
    if (coefficientOfVariation > 25) return "medium";
    return "low";
  };

  const leaderInfo = getLeaderInfo();
  const recentSpike = detectRecentSpike();
  const volatilityA = getVolatility(termA);
  const volatilityB = getVolatility(termB);

  if (!leaderInfo) return null;

  const prettyTerm = (t: string) => t.replace(/-/g, " ");

  return (
    <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 rounded-2xl border-2 border-blue-200 p-6 shadow-lg">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <h3 className="text-lg font-bold text-slate-900">Live Comparison Status</h3>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-white px-3 py-1 rounded-full">
          <Clock className="w-3 h-3" />
          Updated {lastUpdated}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Current Leader */}
        <div className="bg-white rounded-lg p-4 border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-slate-600">Current Leader</span>
          </div>
          <div className="space-y-1">
            <p className="text-xl font-bold text-slate-900">
              {prettyTerm(leaderInfo.leader)}
            </p>
            <p className="text-sm text-slate-600">
              Leading by <span className="font-bold text-blue-600">{leaderInfo.advantage}%</span>
            </p>
            <p className="text-xs text-slate-500">
              Leading for {leaderInfo.leaderSince} data points
            </p>
          </div>
        </div>

        {/* Recent Spike */}
        {recentSpike ? (
          <div className="bg-white rounded-lg p-4 border border-orange-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-medium text-slate-600">Recent Spike Detected</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                recentSpike.confidence === 'high'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-orange-100 text-orange-700'
              }`}>
                {recentSpike.confidence} confidence
              </span>
            </div>
            <div className="space-y-1">
              <p className="text-xl font-bold text-slate-900">
                {prettyTerm(recentSpike.term)}
              </p>
              <p className="text-sm text-slate-600">
                Surged <span className="font-bold text-orange-600">+{recentSpike.magnitude}%</span> in last 7 days
              </p>
              <p className="text-xs text-slate-500">
                Peak on {new Date(recentSpike.date).toLocaleDateString()}
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg p-4 border border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-600">Trend Status</span>
            </div>
            <p className="text-sm text-slate-600">
              No major spikes detected in the past week. Both terms showing stable search patterns.
            </p>
          </div>
        )}

        {/* Volatility Alert */}
        {(volatilityA === "high" || volatilityB === "high") && (
          <div className="bg-white rounded-lg p-4 border border-amber-200 md:col-span-2">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-medium text-slate-600">Volatility Alert</span>
            </div>
            <p className="text-sm text-slate-600">
              {volatilityA === "high" && volatilityB === "high" ? (
                <>Both terms showing <span className="font-bold text-amber-600">high volatility</span> - expect significant fluctuations</>
              ) : volatilityA === "high" ? (
                <><span className="font-bold">{prettyTerm(termA)}</span> showing <span className="font-bold text-amber-600">high volatility</span> ({volatilityB === "medium" ? prettyTerm(termB) + " is more stable" : ""})</>
              ) : (
                <><span className="font-bold">{prettyTerm(termB)}</span> showing <span className="font-bold text-amber-600">high volatility</span> ({volatilityA === "medium" ? prettyTerm(termA) + " is more stable" : ""})</>
              )}
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-200">
        <p className="text-xs text-slate-500 italic">
          💡 This live status updates automatically and shows unique patterns specific to this comparison at this moment in time.
        </p>
      </div>
    </div>
  );
}
