"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Item = {
  slug: string;
  title: string;   // "a vs b"
  count: number;   // times built this week
  tf?: string;
  geo?: string;
};

export default function TopThisWeekClient() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        const res = await fetch("/api/top-week", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const list: Item[] = Array.isArray(data.items) ? data.items : [];

        // de-dupe by slug, keep first occurrence
        const seen = new Set<string>();
        const unique: Item[] = [];
        for (const it of list) {
          if (!it || typeof it.slug !== "string" || typeof it.title !== "string") continue;
          if (seen.has(it.slug)) continue;
          seen.add(it.slug);
          unique.push(it);
        }

        if (alive) setItems(unique);
      } catch {
        if (alive) setItems([]);
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, []);

  if (loading) return null;
  if (!items.length) return null;

  return (
    <section>
      <div className="text-center mb-12 sm:mb-16">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
          Trending Comparisons
          <span className="block bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
            This Week
          </span>
        </h2>
        <p className="text-lg sm:text-xl text-slate-600">
          See what topics people are comparing right now
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {items.slice(0, 6).map((it, idx) => (
          <Link
            key={`${it.slug}|${it.tf ?? "12m"}|${it.geo ?? ""}`}
            href={`/compare/${it.slug}`}
            className="group relative bg-white border-2 border-slate-200 hover:border-blue-500 rounded-2xl p-5 sm:p-6 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
          >
            {idx < 3 && (
              <div className="absolute top-4 right-4 bg-gradient-to-r from-orange-500 to-red-500 text-white px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-md">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z"/>
                </svg>
                HOT
              </div>
            )}

            <h3 className={`text-base sm:text-lg font-bold mb-3 text-slate-900 group-hover:text-blue-600 transition-colors ${idx < 3 ? 'pr-16' : ''}`}>
              {it.title}
            </h3>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <span>{it.count} views</span>
              </div>

              <div className="flex items-center gap-2 text-blue-600 font-semibold text-sm group-hover:gap-3 transition-all">
                View
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>

            {(it.tf || it.geo) && (
              <div className="mt-3 pt-3 border-t border-slate-100 flex gap-2 text-xs text-slate-500">
                {it.tf && (
                  <span className="bg-slate-100 px-2 py-1 rounded">
                    {it.tf}
                  </span>
                )}
                {it.geo && (
                  <span className="bg-slate-100 px-2 py-1 rounded">
                    {it.geo}
                  </span>
                )}
              </div>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}