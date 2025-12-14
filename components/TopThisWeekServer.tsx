// components/TopThisWeekServer.tsx
import Link from "next/link";
import { getTopThisWeek, type TopItem } from "@/lib/topThisWeek";
import { unstable_cache } from "next/cache";

type Props = {
  limit?: number;
};

// Cache top comparisons for 30 minutes (1800 seconds) to keep data fresh and show updated results
const getCachedTopThisWeek = unstable_cache(
  async (limit: number) => getTopThisWeek(limit),
  ['top-this-week'],
  {
    revalidate: 1800, // Revalidate every 30 minutes (faster updates)
    tags: ['trending']
  }
);

export default async function TopThisWeekServer({ limit = 6 }: Props) {
  const items: TopItem[] = await getCachedTopThisWeek(limit);

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
            className="group flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-xl border-2 border-slate-200 bg-white hover:border-green-500 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 p-3 sm:p-4 gap-2 sm:gap-0"
          >
            {/* Rank badge */}
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 w-full sm:w-auto">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow-md flex-shrink-0">
                {idx + 1}
              </div>

              <div className="min-w-0 flex-1">
                <div className="font-bold text-sm sm:text-base text-slate-900 group-hover:text-green-600 transition-colors truncate">
                  {it.slug.replace(/-vs-/g, " vs ").replace(/-/g, " ")}
                </div>
                {(it.tf || it.geo) && (
                  <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-1">
                    {it.tf && (
                      <span className="text-xs text-slate-500 bg-slate-100 px-1.5 sm:px-2 py-0.5 rounded">
                        {it.tf}
                      </span>
                    )}
                    {it.geo && (
                      <span className="text-xs text-slate-500 bg-slate-100 px-1.5 sm:px-2 py-0.5 rounded">
                        {it.geo}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 ml-auto sm:ml-3 flex-shrink-0">
              <span className="text-xs text-slate-500 whitespace-nowrap">{it.count} views</span>
              <svg className="w-4 h-4 text-green-600 group-hover:translate-x-1 transition-transform flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
