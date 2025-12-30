"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

const OPTIONS = [
  { v: "7d", label: "Past 7 days" },
  { v: "30d", label: "Past 30 days" },
  { v: "12m", label: "Past 12 months" },
  { v: "5y", label: "Past 5 years" },
  { v: "all", label: "Since 2004" },
];

export default function TimeframeSelect() {
  const router = useRouter();
  const sp = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const current = sp.get("tf") ?? "12m";

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    const params = new URLSearchParams(sp.toString());
    params.set("tf", next);
    startTransition(() => {
      router.replace(`?${params.toString()}`, { scroll: false });
    });
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
      <label className="text-xs sm:text-sm text-gray-500 font-medium whitespace-nowrap">Timeframe:</label>
      <div className="relative w-full sm:w-auto flex-1 sm:flex-initial">
        <select
          className="w-full sm:w-auto border-2 border-slate-300 rounded-lg px-3 py-2 sm:px-2 sm:py-1.5 text-sm sm:text-base bg-white text-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] sm:min-h-0"
          value={current}
          onChange={onChange}
          disabled={isPending}
          aria-label="Select timeframe"
        >
          {OPTIONS.map(o => (
            <option key={o.v} value={o.v}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
