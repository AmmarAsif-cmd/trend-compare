import HeroSection from "@/components/HeroSection";
import FAQSection from "@/components/FAQSection";
import TopThisWeekWrapper from "@/components/TopThisWeekWrapper";
import FeaturesSection from "@/components/FeaturesSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import UseCasesSection from "@/components/UseCasesSection";
import CTASection from "@/components/CTASection";

export default function Home() {
  return (
    <main>
      <HeroSection />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <TopThisWeekWrapper />
      </div>

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
