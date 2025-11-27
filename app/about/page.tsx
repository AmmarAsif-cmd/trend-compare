import { BRAND } from "@/lib/brand";
import BackButton from "@/components/BackButton";
import { Target, Zap, Users, TrendingUp } from "lucide-react";

export const metadata = {
  title: `About Us — ${BRAND}`,
  description:
    "Learn what TrendArc is all about, how we make online trend comparisons simple, fast, and meaningful for everyone.",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        <div className="mb-8">
          <BackButton />
        </div>

        {/* Hero Section */}
        <section className="text-center mb-20">
          <div className="inline-block mb-4">
            <span className="bg-blue-50 text-blue-600 px-4 py-2 rounded-full text-sm font-semibold border border-blue-200">
              🚀 About TrendArc
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            <span className="block text-slate-900">Making Trends</span>
            <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Crystal Clear
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 leading-relaxed max-w-3xl mx-auto">
            We help you understand what the world is searching for. Compare topics, spot trends,
            and make smarter decisions with beautiful, real-time data visualization.
          </p>
        </section>

        {/* Features Grid */}
        <section className="grid md:grid-cols-2 gap-8 mb-20">
          <div className="bg-white rounded-2xl p-8 border-2 border-slate-200 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-4 text-slate-900">What We Do</h2>
            <p className="text-slate-600 leading-relaxed">
              We transform complex Google Trends data into easy-to-understand comparisons.
              See which topics are winning the popularity contest, track momentum shifts,
              and discover patterns that matter to you.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 border-2 border-slate-200 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-4 text-slate-900">How It Works</h2>
            <p className="text-slate-600 leading-relaxed">
              Type in any two topics you&rsquo;re curious about. We instantly fetch real-time search data,
              create beautiful charts, and show you exactly which one is more popular.
              No signup required. No complicated dashboards. Just insights.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 border-2 border-slate-200 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
            <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-6">
              <Target className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-4 text-slate-900">Why It Matters</h2>
            <p className="text-slate-600 leading-relaxed">
              Understanding trends helps you make better decisions. Whether you&rsquo;re choosing
              between products, planning content, or just satisfying curiosity, knowing what
              people care about gives you an edge.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 border-2 border-slate-200 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
            <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl flex items-center justify-center mb-6">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-4 text-slate-900">Our Vision</h2>
            <p className="text-slate-600 leading-relaxed">
              To become the #1 platform for understanding public interest and cultural trends.
              We believe data should be accessible, beautiful, and useful for everyone—not
              just data scientists.
            </p>
          </div>
        </section>

        {/* Mission Statement */}
        <section className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl p-12 text-center text-white shadow-2xl">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Our Mission</h2>
          <p className="text-lg sm:text-xl max-w-3xl mx-auto leading-relaxed opacity-95">
            Democratize access to trend data. Make it fast, free, and beautiful.
            Help people make informed decisions based on what the world is actually searching for.
          </p>
        </section>
      </div>
    </main>
  );
}
