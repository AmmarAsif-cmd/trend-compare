import HomeCompareForm from "@/components/HomeCompareForm";
import FAQSection from "@/components/FAQSection";
import Image from "next/image";
import { BRAND, TAGLINE } from "@/lib/brand";

export default function Home() {
  return (
    <main className="mx-auto max-w-5xl space-y-12">
      {/* Hero */}
      <section className="text-center space-y-3">
        <div className="flex justify-center">
          <Image
            src="/hero.png" // use your own image path here
            alt="Keyword comparison illustration"
            width={350}
            height={250}
            className="opacity-90"
            priority
          />
        </div>
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
          <h3 className="font-semibold">Instant Results</h3>
          <p className="mt-1 text-slate-600">
            Compare trending topics in seconds. No waiting, no clutter, just quick insights.
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="font-semibold">Always Up to Date</h3>
          <p className="mt-1 text-slate-600">
            TrendCompare stays fresh with the latest online buzz, so you never miss what’s hot.
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="font-semibold">Simple, Visual Insights</h3>
          <p className="mt-1 text-slate-600">
            Beautiful charts make it easy to spot which topic is leading and when the tide changes.
          </p>
        </div>
      </section>

      {/* Examples */}
      <section className="text-center text-sm text-slate-500">
        Try{" "}
        <a href="/compare/chatgpt-vs-gemini" className="underline">chatgpt vs gemini</a>{" "}
        ·{" "}
        <a href="/compare/iphone-16-vs-iphone-17" className="underline">iphone 16 vs iphone 17</a>
      </section>
      <FAQSection />
      {/* FAQ */}
      {/* <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="font-semibold">Which regions are supported</h3>
          <p className="mt-1 text-slate-600">Worldwide by default with region filters coming soon.</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="font-semibold">How fresh is the data</h3>
          <p className="mt-1 text-slate-600">The data is updated in real time whenever you open a new comparison.</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="font-semibold">What can I compare?</h3>
          <p className="mt-1 text-slate-600">You can compare search interest for any two topics, brands, or keywords — from “AI vs Crypto” to “Tea vs Coffee.”</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="font-semibold">Where does the data come from?</h3>
          <p className="mt-1 text-slate-600">TrendCompare uses official Google Trends data to visualize how people’s interests change over time.</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="font-semibold">Is it free to use?</h3>
          <p className="mt-1 text-slate-600">Yes! All comparisons and charts are completely free to explore.</p>
        </div>
      </section> */}
    </main>
  );
}
