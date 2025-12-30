import HeroSection from "@/components/HeroSection";
import FAQSection from "@/components/FAQSection";
import BrowseByCategoryServer from "@/components/BrowseByCategoryServer";
import FeaturesSection from "@/components/FeaturesSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import UseCasesSection from "@/components/UseCasesSection";
import CTASection from "@/components/CTASection";
import DataSources from "@/components/DataSources";

export default function Home() {
  return (
    <main>
      <HeroSection />

      {/* Browse by Category */}
      <div className="relative bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <BrowseByCategoryServer />
        </div>
      </div>

      {/* Data Sources - Build Trust */}
      <div className="relative bg-gradient-to-br from-slate-50 to-white py-20 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <DataSources />
        </div>
      </div>

      <FeaturesSection />
      <HowItWorksSection />
      <UseCasesSection />

      <div id="faq" className="relative bg-gradient-to-br from-white to-slate-50 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FAQSection />
        </div>
      </div>

      <CTASection />
    </main>
  );
}
