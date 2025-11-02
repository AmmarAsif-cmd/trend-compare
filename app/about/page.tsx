import { BRAND } from "@/lib/brand";

export const metadata = {
  title: `About — ${BRAND}`,
};

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">About {BRAND}</h1>
        <p className="text-slate-600">
          {BRAND} helps anyone compare interest in two topics with simple charts and a clear summary.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
        <h2 className="text-lg font-semibold">What we do</h2>
        <p className="text-slate-700">
          We fetch interest data, normalize it, and present it as an easy snapshot with a short explanation.
          Our goal is to keep it fast, readable, and honest. No fluff.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
        <h2 className="text-lg font-semibold">How it works</h2>
        <ul className="list-disc pl-5 text-slate-700 space-y-1">
          <li>First visit gathers data and stores it in a secure database.</li>
          <li>Next visits load instantly from cache.</li>
          <li>Canonical slugs keep URLs clean and consistent.</li>
        </ul>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
        <h2 className="text-lg font-semibold">What is next</h2>
        <ul className="list-disc pl-5 text-slate-700 space-y-1">
          <li>Region selector.</li>
          <li>Better summaries using an affordable language model.</li>
          <li>Admin tools to feature popular comparisons.</li>
        </ul>
      </section>
    </main>
  );
}
