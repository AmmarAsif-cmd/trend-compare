/**
 * How to Interpret This Comparison
 * Plain-text section explaining what search interest means and doesn't mean
 * Appears before "Deep Dive" accordion
 */

export default function HowToInterpret() {
  return (
    <section className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 mb-6 sm:mb-8">
      <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4">How to interpret this comparison</h2>
      <div className="prose prose-slate max-w-none text-slate-700 space-y-4">
        <p className="text-base sm:text-lg leading-relaxed">
          Search interest data reflects the volume of searches people perform for these terms over time. It measures curiosity, awareness, and attention—not sales, market share, or product quality. A higher search interest score indicates more people are searching for that term, which can signal growing awareness, product launches, media coverage, or emerging trends. However, it does not directly correlate with purchase decisions, revenue, or customer satisfaction.
        </p>
        <p className="text-base sm:text-lg leading-relaxed">
          This comparison is useful for understanding which topic is gaining more attention in the public consciousness, tracking trend momentum, and identifying shifts in consumer interest. It should not be used as a substitute for sales data, market research, or quality assessments. Search interest can spike due to news events, controversies, or seasonal patterns that may not reflect long-term market position or product performance.
        </p>
      </div>
    </section>
  );
}

