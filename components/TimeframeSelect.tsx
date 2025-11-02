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
    // preserve any other params (like geo later), update only tf
    startTransition(() => {
      router.replace(`?${params.toString()}`, { scroll: false });
    });
  }

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-gray-500">Timeframe</label>
      <select
        className="border rounded px-2 py-1"
        value={current}
        onChange={onChange}
        disabled={isPending}
      >
        {OPTIONS.map(o => (
          <option key={o.v} value={o.v}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
