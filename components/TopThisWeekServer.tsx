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

  const prettySlug = (slug: string) => {
    return slug
      .replace(/-vs-/g, " vs ")
      .split(/[- ]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <section>
      <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-5 text-slate-900 flex items-center gap-2">
        <span className="w-1.5 h-5 sm:h-6 bg-gradient-to-b from-green-500 to-teal-600 rounded-full" />
        <span>Trending This Week</span>
      </h2>
      <div className="space-y-2.5 sm:space-y-3">
        {items.map((it, idx) => (
          <Link
            key={it.slug}
            href={`/compare/${it.slug}`}
            className="group flex items-center gap-3 rounded-lg border border-slate-200 bg-white hover:border-green-400 hover:shadow-md transition-all duration-200 p-3 sm:p-3.5"
          >
            {/* Rank badge */}
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow-sm flex-shrink-0">
              {idx + 1}
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-sm sm:text-base text-slate-900 group-hover:text-green-600 transition-colors line-clamp-1">
                {prettySlug(it.slug)}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-slate-500 font-medium">{it.count} views</span>
                {(it.tf || it.geo) && (
                  <>
                    <span className="text-slate-300">•</span>
                    <div className="flex items-center gap-1.5">
                      {it.tf && (
                        <span className="text-xs text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded">
                          {it.tf}
                        </span>
                      )}
                      {it.geo && (
                        <span className="text-xs text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded">
                          {it.geo}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Arrow */}
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-hover:text-green-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ))}
      </div>
    </section>
  );
}
