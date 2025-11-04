import HomeCompareForm from "@/components/HomeCompareForm";
import { BRAND, TAGLINE } from "@/lib/brand";
import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto max-w-5xl space-y-12">
      {/* Hero */}
      <section className="text-center space-y-3">
        <h1 className="text-4xl font-semibold tracking-tight">{BRAND}</h1>
        <p className="text-slate-600">{TAGLINE}</p>
      </section>

      {/* Form card */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="p-6 sm:p-8">
          <HomeCompareForm />
        </div>
      </section>

      {/* Features */}
      <section className="grid gap-6 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="font-semibold">Fast and lightweight</h3>
          <p className="mt-1 text-slate-600">
            Server side trends with database caching for instant repeat loads.
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="font-semibold">SEO friendly</h3>
          <p className="mt-1 text-slate-600">
            Canonical slugs and a sitemap help search engines discover comparisons.
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="font-semibold">Clear insights</h3>
          <p className="mt-1 text-slate-600">
            Simple charts and human friendly summaries highlight key moments.
          </p>
        </div>
      </section>

      {/* Examples */}
      <section className="text-center text-sm text-slate-500">
        Try{" "}
        <Link href="/compare/chatgpt-vs-gemini" className="underline">
          chatgpt vs gemini
        </Link>{" "}
        ·{" "}
        <Link href="/compare/iphone-16-vs-iphone-17" className="underline">
          iphone 16 vs iphone 17
        </Link>
      </section>

      {/* FAQ */}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="font-semibold">Which regions are supported</h3>
          <p className="mt-1 text-slate-600">Worldwide by default with region filters coming soon.</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="font-semibold">How fresh is the data</h3>
          <p className="mt-1 text-slate-600">Pages pull live data on first visit and use smart caching afterwards.</p>
        </div>
      </section>
    </main>
  );
}
