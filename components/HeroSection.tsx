import HomeCompareForm from "@/components/HomeCompareForm";
import DynamicHeroChartServer from "@/components/DynamicHeroChartServer";
import HeroKeywordsServer from "@/components/HeroKeywordsServer";

export default function HeroSection() {
  return (
    <section className="relative bg-gradient-to-br from-slate-50 via-white to-blue-50/30 py-20 sm:py-24 lg:py-28 overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl" />
      </div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-block mb-6 sm:mb-8">
            <span className="bg-blue-50 text-blue-600 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold border border-blue-200">
              ✨ Free • No signup • Instant results
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-4 sm:mb-6 leading-tight px-4">
            <span className="block">See What's Trending.</span>
            <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Discover What's Next.
            </span>
          </h1>

          {/* Subhead */}
          <p className="text-lg sm:text-xl text-slate-600 mb-10 sm:mb-12 max-w-2xl mx-auto leading-relaxed px-4">
            Your multi-source trend intelligence dashboard. Compare what's hot across movies, music, games, 
            and products. We combine data from Google Trends, TMDB, Spotify, Steam, Best Buy, YouTube, and Wikipedia 
            with AI-powered insights, all in one place.
          </p>


          {/* Form card */}
          <div className="max-w-4xl mx-auto mb-12 sm:mb-16 px-4">
            <div className="relative bg-white/80 backdrop-blur-sm p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200/50 hover:shadow-3xl transition-shadow duration-300">
              {/* Subtle gradient border effect */}
              <div className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 opacity-0 hover:opacity-100 transition-opacity duration-300 -z-10 blur-xl" />
              <HomeCompareForm />
            </div>
            <HeroKeywordsServer />
          </div>

          {/* Dynamic chart preview - rotates daily */}
          <DynamicHeroChartServer />

          {/* Small FAQ anchor if you ever want to scroll link to here */}
          <div id="faq" className="mt-10" />
        </div>
      </div>
    </section>
  );
}
