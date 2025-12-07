"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { toCanonicalSlug } from "@/lib/slug";
import { cleanTerm, isTermAllowed } from "@/lib/validateTerms";

function cn(...xs: (string | false | null | undefined)[]) {
  return xs.filter(Boolean).join(" ");
}

type Field = "a" | "b";

type ValidResult =
  | { ok: true; term: string }
  | { ok: false; msg: string };

// Quick example suggestions
const QUICK_EXAMPLES = {
  a: ["ChatGPT", "iPhone", "Tesla", "Netflix", "Bitcoin", "React"],
  b: ["Gemini", "Android", "Toyota", "Disney+", "Ethereum", "Vue"],
};

export default function HomeCompareForm() {
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [active, setActive] = useState<Field | null>(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<string[]>([]);
  const [cursor, setCursor] = useState<number>(-1);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const boxRef = useRef<HTMLFormElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<number | null>(null);

  function validateTerm(v: string): ValidResult {
    const t = cleanTerm(v);
    if (!isTermAllowed(t)) {
      return {
        ok: false,
        msg:
          "Please enter real topics like brands, products, or people. Avoid random strings or generic phrases.",
      };
    }
    return { ok: true, term: t };
  }

  // Close suggestions when clicking outside
  useEffect(() => {
    const onDown = (event: MouseEvent) => {
      const el = boxRef.current;
      if (!el) return;
      if (!el.contains(event.target as Node)) {
        setOpen(false);
        setCursor(-1);
        setActive(null);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // Fetch suggestions with debounce
  useEffect(() => {
    const qRaw = active === "a" ? a : active === "b" ? b : "";
    const q = qRaw.trim().slice(0, 64);

    if (!active || q.length < 2) {
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
        if (!res.ok) throw new Error("suggest failed");
        const data = (await res.json()) as { suggestions: string[] };
        const list = Array.isArray(data.suggestions) ? data.suggestions : [];
        setItems(list);
        setOpen(list.length > 0);
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
    setError(null);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setCursor((c) => Math.min(c + 1, items.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (event.key === "Enter") {
      if (cursor >= 0 && items[cursor]) {
        event.preventDefault();
        apply(items[cursor]);
      }
    } else if (event.key === "Escape") {
      setOpen(false);
      setCursor(-1);
    }
  };

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const aV = validateTerm(a);
    const bV = validateTerm(b);

    if (!aV.ok || !bV.ok) {
      let msg = "Please check your inputs.";
      if (!aV.ok) msg = aV.msg;
      else if (!bV.ok) msg = bV.msg;
      setError(msg);
      setIsSubmitting(false);
      return;
    }

    const slug = toCanonicalSlug([aV.term, bV.term]);
    if (!slug) {
      setError("Could not build a valid comparison from those terms.");
      setIsSubmitting(false);
      return;
    }

    // Keep loading state while navigating
    router.push(`/compare/${slug}`);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="relative space-y-4"
      ref={boxRef}
      aria-labelledby="compare-form-heading"
    >
      <h2 id="compare-form-heading" className="sr-only">
        Compare two topics
      </h2>

      {/* Inputs row */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch">
        {/* Field A */}
        <div className="relative flex-1">
          <label className="sr-only" htmlFor="keyword-a">
            First keyword
          </label>
          <input
            id="keyword-a"
            value={a}
            onChange={(event) => setA(event.target.value)}
            onFocus={() => {
              setActive("a");
              if (items.length) setOpen(true);
            }}
            onKeyDown={onKeyDown}
            placeholder="e.g., ChatGPT"
            autoComplete="off"
            aria-autocomplete="list"
            aria-expanded={active === "a" && open}
            aria-controls="suggest-list-a"
            disabled={isSubmitting}
            className="w-full rounded-lg border-2 border-slate-300 bg-white px-4 py-3 text-base sm:text-lg text-slate-700 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          />

          {/* Quick examples for Field A - only show when not active and no suggestions */}
          {!a && active !== "a" && !open && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {QUICK_EXAMPLES.a.slice(0, 3).map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => setA(example)}
                  className="text-xs px-2.5 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md transition-colors font-medium"
                >
                  {example}
                </button>
              ))}
            </div>
          )}

          {active === "a" && open && (
            <ul
              id="suggest-list-a"
              role="listbox"
              className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
            >
              {items.map((s, i) => (
                <li
                  key={s + i}
                  role="option"
                  aria-selected={i === cursor}
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
                <li className="px-3 py-2 text-xs text-slate-500">
                  Loading…
                </li>
              )}
            </ul>
          )}
        </div>

        {/* VS */}
        <div className="flex items-center justify-center sm:pt-3">
          <span className="text-slate-400 font-bold text-xl" aria-hidden="true">
            VS
          </span>
        </div>

        {/* Field B */}
        <div className="relative flex-1">
          <label className="sr-only" htmlFor="keyword-b">
            Second keyword
          </label>
          <input
            id="keyword-b"
            value={b}
            onChange={(event) => setB(event.target.value)}
            onFocus={() => {
              setActive("b");
              if (items.length) setOpen(true);
            }}
            onKeyDown={onKeyDown}
            placeholder="e.g., Gemini"
            autoComplete="off"
            aria-autocomplete="list"
            aria-expanded={active === "b" && open}
            aria-controls="suggest-list-b"
            disabled={isSubmitting}
            className="w-full rounded-lg border-2 border-slate-300 bg-white px-4 py-3 text-base sm:text-lg text-slate-700 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          />

          {/* Quick examples for Field B - only show when not active and no suggestions */}
          {!b && active !== "b" && !open && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {QUICK_EXAMPLES.b.slice(0, 3).map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => setB(example)}
                  className="text-xs px-2.5 py-1 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-md transition-colors font-medium"
                >
                  {example}
                </button>
              ))}
            </div>
          )}

          {active === "b" && open && (
            <ul
              id="suggest-list-b"
              role="listbox"
              className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
            >
              {items.map((s, i) => (
                <li
                  key={s + i}
                  role="option"
                  aria-selected={i === cursor}
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
                <li className="px-3 py-2 text-xs text-slate-500">
                  Loading…
                </li>
              )}
            </ul>
          )}
        </div>

        {/* Button */}
        <button
          type="submit"
          disabled={!a.trim() || !b.trim() || isSubmitting}
          className="w-full sm:w-auto rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 text-base font-semibold text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 whitespace-nowrap"
          aria-label="Compare keywords"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
              Analyzing...
            </>
          ) : (
            <>
              Compare Now
              <ArrowRight className="w-5 h-5" aria-hidden="true" />
            </>
          )}
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
