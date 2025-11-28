// components/TopThisWeekServer.tsx
import Link from "next/link";
import { getTopThisWeek, type TopItem } from "@/lib/topThisWeek";

type Props = {
  limit?: number;
};

export default async function TopThisWeekServer({ limit = 6 }: Props) {
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
      <h2 className="text-xl sm:text-2xl font-bold mb-4 text-slate-900 flex items-center gap-2">
        <span className="w-1.5 h-6 bg-gradient-to-b from-green-500 to-teal-600 rounded-full" />
        Trending Comparisons This Week
      </h2>
      <div className="grid gap-3 sm:gap-4">
        {items.map((it, idx) => (
          <Link
            key={it.slug}
            href={`/compare/${it.slug}`}
            className="group flex items-center justify-between rounded-xl border-2 border-slate-200 bg-white hover:border-green-500 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 p-4"
          >
            {/* Rank badge */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md flex-shrink-0">
                {idx + 1}
              </div>

              <div className="min-w-0 flex-1">
                <div className="font-bold text-slate-900 group-hover:text-green-600 transition-colors truncate">
                  {it.slug.replace(/-vs-/g, " vs ").replace(/-/g, " ")}
                </div>
                {(it.tf || it.geo) && (
                  <div className="flex gap-2 mt-1">
                    {it.tf && (
                      <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {it.tf}
                      </span>
                    )}
                    {it.geo && (
                      <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {it.geo}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 ml-3 flex-shrink-0">
              <span className="text-xs text-slate-500">{it.count} views</span>
              <svg className="w-4 h-4 text-green-600 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
