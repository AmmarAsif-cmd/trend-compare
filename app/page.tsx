import HeroSection from "@/components/HeroSection";
import FAQSection from "@/components/FAQSection";
import BrowseByCategoryServer from "@/components/BrowseByCategoryServer";
import FeaturesSection from "@/components/FeaturesSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import UseCasesSection from "@/components/UseCasesSection";
import CTASection from "@/components/CTASection";
import SimpleTrendingKeywords from "@/components/SimpleTrendingKeywords";
import DataSources from "@/components/DataSources";

export default function Home() {
  return (
    <main>
      <HeroSection />

      {/* Browse by Category */}
      <div className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <BrowseByCategoryServer />
        </div>
      </div>

      {/* Live Trending Keywords */}
      <div className="bg-gradient-to-b from-white to-slate-50 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SimpleTrendingKeywords />
        </div>
      </div>

      {/* Data Sources - Build Trust */}
      <div className="bg-slate-50 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <DataSources />
        </div>
      </div>

      <FeaturesSection />
      <HowItWorksSection />
      <UseCasesSection />

      <div id="faq" className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FAQSection />
        </div>
      </div>

      <CTASection />
    </main>
  );
}
