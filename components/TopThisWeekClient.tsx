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
    <section className="mt-10">
      <h2 className="text-xl font-semibold mb-3">Trending comparisons this week</h2>
      <ul className="grid gap-2 sm:grid-cols-2">
        {items.map((it) => (
          <li
            key={`${it.slug}|${it.tf ?? "12m"}|${it.geo ?? ""}`}
            className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2"
          >
            <div className="min-w-0">
              <Link href={`/compare/${it.slug}`} className="font-medium hover:underline truncate block">
                {it.title}
              </Link>
              {(it.tf || it.geo) && (
                <div className="text-xs text-slate-500">
                  {it.tf ? `tf: ${it.tf}` : ""}
                  {it.tf && it.geo ? " • " : ""}
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