import { BRAND } from "@/lib/brand";
import BackButton from "@/components/BackButton";

export const metadata = {
  title: `Terms of Service | ${BRAND}`,
  description:
    "Terms of Service for TrendArc. Please read our terms before using our service.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        <div className="mb-8">
          <BackButton />
        </div>

        <div className="bg-white rounded-2xl border-2 border-slate-200 p-8 sm:p-12 shadow-xl">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-slate-900">
            Terms of Service
          </h1>
          <p className="text-slate-500 mb-8">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>

          <div className="space-y-8 text-slate-600">
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                1. Acceptance of Terms
              </h2>
              <p className="leading-relaxed">
                By accessing and using TrendArc, you accept and agree to be bound by the terms and provision of this agreement. 
                If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                2. Use License
              </h2>
              <p className="leading-relaxed mb-4">
                Permission is granted to temporarily use TrendArc for personal, non-commercial use. This is the grant of a license, 
                not a transfer of title, and under this license you may not:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Modify or copy the materials</li>
                <li>Use the materials for any commercial purpose or for any public display</li>
                <li>Attempt to reverse engineer any software contained on TrendArc</li>
                <li>Remove any copyright or other proprietary notations from the materials</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                3. Service Description
              </h2>
              <p className="leading-relaxed">
                TrendArc provides trend comparison services using data from multiple sources including Google Trends, 
                YouTube, Spotify, TMDB, Steam, Best Buy, and Wikipedia. We aggregate and present this data for informational purposes only.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                4. User Responsibilities
              </h2>
              <p className="leading-relaxed mb-4">
                You agree to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Use TrendArc only for lawful purposes</li>
                <li>Not abuse, harass, or harm other users</li>
                <li>Not attempt to gain unauthorized access to our systems</li>
                <li>Not use automated systems to access our service excessively</li>
                <li>Respect rate limits and usage restrictions</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                5. Data Accuracy
              </h2>
              <p className="leading-relaxed">
                While we strive to provide accurate and up-to-date information, TrendArc makes no warranties or representations 
                about the accuracy, completeness, or reliability of any data provided. Data is provided "as is" and may contain 
                inaccuracies or errors.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                6. Limitation of Liability
              </h2>
              <p className="leading-relaxed">
                In no event shall TrendArc or its suppliers be liable for any damages (including, without limitation, damages for 
                loss of data or profit, or due to business interruption) arising out of the use or inability to use TrendArc, 
                even if TrendArc or a TrendArc authorized representative has been notified orally or in writing of the possibility 
                of such damage.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                7. Intellectual Property
              </h2>
              <p className="leading-relaxed">
                All content, features, and functionality of TrendArc, including but not limited to text, graphics, logos, and 
                software, are the property of TrendArc and are protected by international copyright, trademark, and other 
                intellectual property laws.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                8. Third-Party Services
              </h2>
              <p className="leading-relaxed">
                TrendArc uses third-party services and APIs (Google Trends, YouTube, Spotify, etc.). Your use of TrendArc 
                may also be subject to the terms and conditions of these third-party services. We are not responsible for 
                the availability or accuracy of third-party data.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                9. Service Availability
              </h2>
              <p className="leading-relaxed">
                We strive to keep TrendArc available 24/7, but we do not guarantee uninterrupted access. The service may 
                be temporarily unavailable due to maintenance, updates, or unforeseen circumstances. We reserve the right to 
                modify or discontinue the service at any time.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                10. Changes to Terms
              </h2>
              <p className="leading-relaxed">
                TrendArc reserves the right to revise these terms of service at any time without notice. By using this service, 
                you are agreeing to be bound by the then current version of these terms of service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                11. Contact Information
              </h2>
              <p className="leading-relaxed">
                If you have any questions about these Terms of Service, please contact us at{' '}
                <a href="mailto:contact@trendarc.net" className="text-blue-600 hover:text-blue-700 underline">
                  contact@trendarc.net
                </a>
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-200">
            <p className="text-sm text-slate-500 text-center">
              By using TrendArc, you agree to these terms of service and our privacy policy.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

