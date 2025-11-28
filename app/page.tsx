import HeroSection from "@/components/HeroSection";
import FAQSection from "@/components/FAQSection";
import TopThisWeekWrapper from "@/components/TopThisWeekWrapper";
import FeaturesSection from "@/components/FeaturesSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import UseCasesSection from "@/components/UseCasesSection";
import CTASection from "@/components/CTASection";
import TopGoogleSearches from "@/components/TopGoogleSearches";
import ComparisonBuilder from "@/components/ComparisonBuilder";
import LiveTrendingDashboard from "@/components/LiveTrendingDashboard";

export default function Home() {
  return (
    <main>
      <HeroSection />

      {/* Interactive Comparison Builder */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <ComparisonBuilder />
      </div>

      {/* Trending This Week + Live Dashboard */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid lg:grid-cols-2 gap-8">
          <TopThisWeekWrapper />
          <LiveTrendingDashboard />
        </div>
      </div>

      <TopGoogleSearches />
      <FeaturesSection />
      <HowItWorksSection />
      <UseCasesSection />

      <div id="faq" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <FAQSection />
      </div>

      <CTASection />
    </main>
  );
}
