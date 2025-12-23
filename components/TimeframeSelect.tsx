"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition, useEffect, useState } from "react";
import { Lock } from "lucide-react";
import Link from "next/link";

const OPTIONS = [
  { v: "7d", label: "Past 7 days", premium: true },
  { v: "30d", label: "Past 30 days", premium: true },
  { v: "12m", label: "Past 12 months", premium: false },
  { v: "5y", label: "Past 5 years", premium: true },
  { v: "all", label: "Since 2004", premium: true },
];

export default function TimeframeSelect() {
  const router = useRouter();
  const sp = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  const current = sp.get("tf") ?? "12m";

  // Check premium status
  useEffect(() => {
    async function checkPremium() {
      try {
        const response = await fetch('/api/user/me');
        if (response.ok) {
          const data = await response.json();
          setIsPremium(data.user?.subscriptionTier === 'premium' || false);
        }
      } catch (error) {
        console.error('Error checking premium status:', error);
      } finally {
        setLoading(false);
      }
    }
    checkPremium();
  }, []);

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    
    // Check if selected timeframe requires premium
    const selectedOption = OPTIONS.find(o => o.v === next);
    if (selectedOption?.premium && !isPremium) {
      // Redirect to pricing if free user tries to select premium timeframe
      router.push('/pricing?feature=timeframes');
      return;
    }

    const params = new URLSearchParams(sp.toString());
    params.set("tf", next);
    startTransition(() => {
      router.replace(`?${params.toString()}`, { scroll: false });
    });
  }

  // Free users can only use 12m
  const availableOptions = isPremium 
    ? OPTIONS 
    : OPTIONS.filter(o => !o.premium || o.v === current);

  // If free user tries to access premium timeframe, force to 12m
  const currentOption = OPTIONS.find(o => o.v === current);
  const effectiveCurrent = (!isPremium && currentOption?.premium) ? "12m" : current;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
      <label className="text-xs sm:text-sm text-gray-500 font-medium whitespace-nowrap">Timeframe:</label>
      <div className="relative w-full sm:w-auto flex-1 sm:flex-initial">
        <select
          className="w-full sm:w-auto border-2 border-slate-300 rounded-lg px-3 py-2 sm:px-2 sm:py-1.5 text-sm sm:text-base bg-white text-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] sm:min-h-0 pr-8"
          value={effectiveCurrent}
          onChange={onChange}
          disabled={isPending || loading || (!isPremium && currentOption?.premium)}
          aria-label="Select timeframe"
        >
          {availableOptions.map(o => (
            <option key={o.v} value={o.v} disabled={o.premium && !isPremium}>
              {o.label} {o.premium && !isPremium ? '🔒' : ''}
            </option>
          ))}
        </select>
        {!isPremium && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
            <Lock className="w-4 h-4 text-slate-400" />
          </div>
        )}
      </div>
      {!isPremium && currentOption?.premium && (
        <div className="w-full sm:w-auto">
          <Link
            href="/pricing?feature=timeframes"
            className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
          >
            <Lock className="w-3 h-3" />
            Upgrade for all timeframes
          </Link>
        </div>
      )}
      {!isPremium && effectiveCurrent === "12m" && (
        <Link
          href="/pricing?feature=timeframes"
          className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-medium whitespace-nowrap"
        >
          <Lock className="w-3 h-3" />
          Unlock all timeframes
        </Link>
      )}
    </div>
  );
}
