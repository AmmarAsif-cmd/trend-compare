import { BRAND } from "@/lib/brand";
import BackButton from "@/components/BackButton";
import React from "react";
export const metadata = {
  title: `About Us — ${BRAND}`,
  description:
    "Learn what TrendArc is all about, how we make online trend comparisons simple, fast, and meaningful for everyone.",
};

export default function AboutPage() {
  return (
    <main className="max-w-5xl mx-auto px-6 py-10 md:py-16">
      <div className="mb-6">
        <BackButton label="Go Back" />
      </div>
      {/* Hero Section */}
      <section className="text-center mb-16">
        <h1 className="text-4xl font-bold mb-4 ">About TrendArc</h1>
        <p className="text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto">
          Comparing Trends is a simple way to see what the world is curious about.
          We help you explore how interests rise, fall, and compete. All through
          clean visuals and meaningful insights.
        </p>
      </section>

      {/* What We Do */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-3 text-gray-900">What We Do</h2>
        <p className="text-gray-600 leading-relaxed max-w-3xl">
          We make global search trends easy to understand. By comparing topics side by side,
          TrendArc reveals how people’s attention shifts across time and ideas.
          Whether you’re a marketer, researcher, or just curious, you can quickly see which
          topics are gaining momentum and which are fading away.
        </p>
      </section>
<div className="border-t border-gray-200 my-8"></div>

      {/* How It Works */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-3 text-gray-900">How It Works</h2>
        <p className="text-gray-600 leading-relaxed max-w-3xl">
          You choose the topics, we handle the rest. TrendArc instantly gathers
          the latest insights and presents them in a clear, interactive view designed
          for everyone. No logins, no jargon and just trends that make sense at a glance.
        </p>
      </section>
<div className="border-t border-gray-200 my-8"></div>

      {/* Why It Matters */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-3 text-gray-900">Why It Matters</h2>
        <p className="text-gray-600 leading-relaxed max-w-3xl">
          Online trends shape conversations, opinions, and opportunities. We make it easier
          for anyone, from creators to curious minds to understand what’s gaining attention
          and why it matters. TrendArc brings clarity to the noise of the internet.
        </p>
      </section>
<div className="border-t border-gray-200 my-8"></div>

      {/* Our Vision */}
      <section>
        <h2 className="text-2xl font-semibold mb-3 text-gray-900">Our Vision</h2>
        <p className="text-gray-600 leading-relaxed max-w-3xl">
          To become the go-to platform for exploring public interest and cultural trends.
          Powered by simplicity, speed, and transparency.
        </p>
      </section>
    </main>
  );
}
