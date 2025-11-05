"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toCanonicalSlug } from "@/lib/slug";

function cn(...xs: (string | false | null | undefined)[]) {
  return xs.filter(Boolean).join(" ");
}

type Field = "a" | "b";

export default function HomeCompareForm() {
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [active, setActive] = useState<Field | null>(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<string[]>([]);
  const [cursor, setCursor] = useState<number>(-1);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  // FIX: ref should match the element it is attached to (<form>)
  const boxRef = useRef<HTMLFormElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<number | null>(null);

  // click outside to close
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const el = boxRef.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) {
        setOpen(false);
        setCursor(-1);
        setActive(null);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // fetch suggestions with debounce
  useEffect(() => {
    const q = active === "a" ? a : active === "b" ? b : "";
    if (!active || q.trim().length < 2) {
      setItems([]);
      setOpen(false);
      setCursor(-1);
      return;
    }

    if (debounceRef.current) window.clearTimeout(debounceRef.current);

    debounceRef.current = window.setTimeout(async () => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      try {
        setLoading(true);
        const res = await fetch(`/api/suggest?q=${encodeURIComponent(q)}`, {
          signal: ctrl.signal,
          cache: "no-store",
        });
        const data = (await res.json()) as { suggestions: string[] };
        setItems(data.suggestions ?? []);
        setOpen((data.suggestions ?? []).length > 0);
        setCursor(-1);
      } catch {
        setItems([]);
        setOpen(false);
      } finally {
        setLoading(false);
      }
    }, 150);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      abortRef.current?.abort();
    };
  }, [a, b, active]);

  const apply = (val: string) => {
    if (active === "a") setA(val);
    if (active === "b") setB(val);
    setOpen(false);
    setCursor(-1);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === "Enter") {
      if (cursor >= 0 && items[cursor]) {
        e.preventDefault();
        apply(items[cursor]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setCursor(-1);
    }
  };

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const terms = [a.trim(), b.trim()].filter(Boolean);
    if (terms.length !== 2) return;
    const slug = toCanonicalSlug(terms);
    router.push(`/compare/${slug}`);
  }

  return (
    <form onSubmit={onSubmit} className="relative space-y-4" ref={boxRef}>
      <div className="grid gap-3 sm:grid-cols-2">
        {/* Field A */}
        <div className="relative">
          <label className="mb-1 block text-sm font-medium text-slate-700">Keyword 1</label>
          <input
            value={a}
            onChange={(e) => setA(e.target.value)}
            onFocus={() => { setActive("a"); if (items.length) setOpen(true); }}
            onKeyDown={onKeyDown}
            placeholder="e.g. chatgpt"
            autoComplete="off"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 outline-none focus:ring-2 focus:ring-slate-200"
          />

          {active === "a" && open && (
            <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow">
              {items.map((s, i) => (
                <li
                  key={s + i}
                  onMouseDown={() => apply(s)}
                  className={cn(
                    "cursor-pointer px-3 py-2 text-sm hover:bg-slate-100",
                    i === cursor && "bg-slate-100"
                  )}
                >
                  {s}
                </li>
              ))}
              {loading && (
                <li className="px-3 py-2 text-xs text-slate-500">Loading…</li>
              )}
            </ul>
          )}
        </div>

        {/* Field B */}
        <div className="relative">
          <label className="mb-1 block text-sm font-medium text-slate-700">Keyword 2</label>
          <input
            value={b}
            onChange={(e) => setB(e.target.value)}
            onFocus={() => { setActive("b"); if (items.length) setOpen(true); }}
            onKeyDown={onKeyDown}
            placeholder="e.g. gemini"
            autoComplete="off"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 outline-none focus:ring-2 focus:ring-slate-200"
          />

          {active === "b" && open && (
            <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow">
              {items.map((s, i) => (
                <li
                  key={s + i}
                  onMouseDown={() => apply(s)}
                  className={cn(
                    "cursor-pointer px-3 py-2 text-sm hover:bg-slate-100",
                    i === cursor && "bg-slate-100"
                  )}
                >
                  {s}
                </li>
              ))}
              {loading && (
                <li className="px-3 py-2 text-xs text-slate-500">Loading…</li>
              )}
            </ul>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={!a.trim() || !b.trim()}
        className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-50"
      >
        Compare
      </button>
    </form>
  );
}
