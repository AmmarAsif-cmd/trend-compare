// components/CTASection.tsx
import { Sparkles, TrendingUp, ArrowRight, Zap, BarChart3 } from "lucide-react";
import Link from "next/link";

export default function CTASection() {
  return (
    <section className="relative py-20 sm:py-32 overflow-hidden print:hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600"></div>

      {/* Animated overlay pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>

      {/* Floating elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-white/10 rounded-full blur-2xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-white/5 rounded-full blur-xl animate-pulse delay-500"></div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Main content card */}
        <div className="bg-white/10 backdrop-blur-lg border-2 border-white/20 rounded-3xl p-8 sm:p-12 lg:p-16 shadow-2xl">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 text-white px-5 py-2 rounded-full text-sm font-bold mb-8 shadow-lg">
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span>Trusted by 50,000+ professionals worldwide</span>
            </div>

            {/* Heading */}
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Ready to Make
              <span className="block bg-gradient-to-r from-yellow-300 via-orange-300 to-pink-300 bg-clip-text text-transparent drop-shadow-lg">
                Smarter Decisions?
              </span>
            </h2>

            <p className="text-lg sm:text-xl text-white mb-12 max-w-3xl mx-auto leading-relaxed">
              Join thousands of professionals using TrendArc to compare trends, discover insights, and stay ahead with real-time data analysis powered by AI.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link
                href="/#"
                className="w-full sm:w-auto group bg-white text-purple-600 px-8 py-4 rounded-xl font-bold text-lg hover:shadow-2xl hover:shadow-white/20 transition-all hover:scale-105 inline-flex items-center justify-center gap-3"
              >
                <span>Start Exploring Free</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/#features"
                className="w-full sm:w-auto group bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/20 transition-all inline-flex items-center justify-center gap-3"
              >
                <BarChart3 className="w-5 h-5" />
                <span>See How It Works</span>
              </Link>
            </div>

            {/* Features grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-white mb-2">Real-Time Data</h3>
                <p className="text-sm text-white/80">Live updates every hour with the latest trends</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-white mb-2">AI-Powered Insights</h3>
                <p className="text-sm text-white/80">Smart AI analysis for deeper understanding</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-red-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-white mb-2">Historical Analysis</h3>
                <p className="text-sm text-white/80">Track trends over time with detailed timelines</p>
              </div>
            </div>

            {/* Trust signals */}
            <div className="mt-12 pt-8 border-t border-white/20">
              <p className="text-sm text-white/70">
                ✓ No credit card required  •  ✓ 100% Free forever  •  ✓ Access all features instantly
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
