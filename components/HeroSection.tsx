import HomeCompareForm from "@/components/HomeCompareForm";
import Link from "next/link";
import DynamicHeroChart from "@/components/DynamicHeroChart";

export default function HeroSection() {
  return (
    <section className="bg-gradient-to-b from-slate-50 to-white py-16 sm:py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
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
            Your trend intelligence dashboard. Compare what's hot across movies, music, games, and products.
            Multi-source data, AI insights, zero complexity.
          </p>


          {/* Form card */}
          <div className="max-w-4xl mx-auto mb-12 sm:mb-16 px-4">
            <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-xl border-2 border-slate-200">
              <HomeCompareForm />
            </div>
            <div className="mt-4 sm:mt-5 text-sm text-slate-600">
              <p className="font-medium mb-3 text-slate-700">Popular comparisons across all categories:</p>
              <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center max-w-3xl mx-auto">
                <Link
                  href="/compare/chatgpt-vs-gemini"
                  className="text-blue-600 hover:text-blue-700 underline underline-offset-2 font-medium transition-colors"
                >
                  🤖 ChatGPT vs Gemini
                </Link>
                <Link
                  href="/compare/iphone-vs-samsung"
                  className="text-blue-600 hover:text-blue-700 underline underline-offset-2 font-medium transition-colors"
                >
                  📱 iPhone vs Samsung
                </Link>
                <Link
                  href="/compare/spotify-vs-apple-music"
                  className="text-blue-600 hover:text-blue-700 underline underline-offset-2 font-medium transition-colors"
                >
                  🎵 Spotify vs Apple Music
                </Link>
                <Link
                  href="/compare/netflix-vs-disney-plus"
                  className="text-blue-600 hover:text-blue-700 underline underline-offset-2 font-medium transition-colors"
                >
                  🎬 Netflix vs Disney+
                </Link>
                <Link
                  href="/compare/fortnite-vs-minecraft"
                  className="text-blue-600 hover:text-blue-700 underline underline-offset-2 font-medium transition-colors"
                >
                  🎮 Fortnite vs Minecraft
                </Link>
                <Link
                  href="/compare/react-vs-vue"
                  className="text-blue-600 hover:text-blue-700 underline underline-offset-2 font-medium transition-colors"
                >
                  💻 React vs Vue
                </Link>
                <Link
                  href="/compare/taylor-swift-vs-beyonce"
                  className="text-blue-600 hover:text-blue-700 underline underline-offset-2 font-medium transition-colors"
                >
                  🎤 Taylor Swift vs Beyoncé
                </Link>
                <Link
                  href="/compare/tesla-vs-bmw"
                  className="text-blue-600 hover:text-blue-700 underline underline-offset-2 font-medium transition-colors"
                >
                  🚗 Tesla vs BMW
                </Link>
              </div>
            </div>
          </div>

          {/* Dynamic chart preview */}
          <DynamicHeroChart />

          {/* Small FAQ anchor if you ever want to scroll link to here */}
          <div id="faq" className="mt-10" />
        </div>
      </div>
    </section>
  );
}
