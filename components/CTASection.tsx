// components/CTASection.tsx
import { Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function CTASection() {
  return (
    <section className="relative py-20 sm:py-28 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-72 h-72 sm:w-96 sm:h-96 bg-white rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-72 h-72 sm:w-96 sm:h-96 bg-white rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>
      <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
        <div className="inline-block mb-8">
          <div className="bg-white/20 backdrop-blur-sm border border-white/30 text-white px-6 py-3 rounded-full font-semibold flex items-center gap-2 hover:bg-white/30 transition-colors">
            <Sparkles className="w-5 h-5" />
            Join 50,000+ Professionals
          </div>
        </div>
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
          Ready to Make Smarter, Data-Driven Decisions?
        </h2>
        <p className="text-xl sm:text-2xl text-white/95 mb-12 max-w-3xl mx-auto">
          Join thousands making better decisions every day
        </p>
        <Link
          href="/#"
          className="bg-white text-blue-600 px-10 sm:px-12 py-4 sm:py-5 rounded-xl font-bold text-base sm:text-lg hover:shadow-2xl transition-all hover:scale-105 inline-flex items-center gap-2"
        >
          Start Comparing Free <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </section>
  );
}
