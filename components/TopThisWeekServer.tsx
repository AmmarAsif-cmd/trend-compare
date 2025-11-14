// components/TopThisWeekServer.tsx
import Link from "next/link";
import { getTopThisWeek, type TopItem } from "@/lib/topThisWeek";

type Props = {
  limit?: number;
  compact?: boolean; // optional smaller padding
};

export default async function TopThisWeekServer({ limit = 6, compact = false }: Props) {
  const items: TopItem[] = await getTopThisWeek(limit);

  if (!items.length) {
    return (
      <div className="text-sm text-slate-600">
        No trending comparisons yet. Try a search to get things moving.
      </div>
    );
  }

  return (
    <section>
      <h2 className="text-md font-semibold mb-3">Trending comparisons this week</h2>
      <ul className="space-y-2">
        {items.map((it) => (
          <li
            key={it.slug}
            className={`flex items-center justify-between rounded-lg border border-slate-200 bg-white ${compact ? "px-2 py-1.5" : "px-3 py-2"}`}
          >
            <div className="min-w-0">
              <Link href={`/compare/${it.slug}`} className="hover:underline truncate block">
                {it.slug}
              </Link>
              {(it.tf || it.geo) && (
                <div className="text-xs text-slate-500">
                  {it.tf ? `tf: ${it.tf}` : ""} {it.tf && it.geo ? "• " : ""}
                  {it.geo ? `region: ${it.geo || "WW"}` : ""}
                </div>
              )}
            </div>

            <span
              title="Times built this week"
              className="ml-3 shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700"
            >
              {it.count}
            </span>
          </li>
        ))}
      </ul>
    </section>

  );
}
