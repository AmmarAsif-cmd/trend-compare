import HeroSection from "@/components/HeroSection";
import FAQSection from "@/components/FAQSection";
import Link from "next/link";
import TopThisWeekWrapper from "@/components/TopThisWeekWrapper";

export default function Home() {
  return (
    <main className="space-y-12">
      <HeroSection />

      <div className="mx-auto max-w-5xl space-y-12 px-4 sm:px-6 lg:px-0">
        <TopThisWeekWrapper />

        {/* Features */}
        <section className="grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="font-semibold">Instant results</h3>
            <p className="mt-1 text-slate-600">
              Compare trending topics in seconds. No waiting, no clutter, just quick insights.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="font-semibold">Always up to date</h3>
            <p className="mt-1 text-slate-600">
              TrendArc stays fresh with the latest online buzz, so you never miss what is hot.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="font-semibold">Simple, visual insights</h3>
            <p className="mt-1 text-slate-600">
              Beautiful charts make it easy to spot which topic is leading and when the tide changes.
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
          <Link href="/compare/iphone-vs-android" className="underline">
            iphone vs android
          </Link>
        </section>

        <FAQSection />
      </div>
    </main>
  );
}
