import { BRAND } from "@/lib/brand";
import BackButton from "@/components/BackButton";

export const metadata = {
  title: `Privacy Policy | ${BRAND}`,
  description:
    "Learn how TrendArc handles your data and protects your privacy.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        <div className="mb-8">
          <BackButton />
        </div>

        <div className="bg-white rounded-2xl border-2 border-slate-200 p-8 sm:p-12 shadow-xl">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-slate-900">
            Privacy Policy
          </h1>
          <p className="text-slate-500 mb-8">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>

          <div className="space-y-8 text-slate-600">
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                1. Information We Collect
              </h2>
              <p className="leading-relaxed mb-4">
                TrendArc is designed with privacy in mind. We collect minimal information to provide our service:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Search Queries:</strong> The comparison terms you enter to generate trend visualizations</li>
                <li><strong>Usage Data:</strong> Basic analytics about how our service is used (page views, popular comparisons)</li>
                <li><strong>Technical Data:</strong> IP address, browser type, and device information for security and performance</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                2. How We Use Your Information
              </h2>
              <p className="leading-relaxed mb-4">
                We use collected information to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Generate and display trend comparison charts</li>
                <li>Improve our service and user experience</li>
                <li>Identify and display trending comparisons</li>
                <li>Ensure security and prevent abuse</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                3. Data Storage and Security
              </h2>
              <p className="leading-relaxed mb-4">
                Your data is stored securely and we implement industry-standard security measures to protect it.
                Comparison data may be cached temporarily to improve performance.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                4. Third-Party Services
              </h2>
              <p className="leading-relaxed mb-4">
                TrendArc uses Google Trends data to generate comparisons. When you use our service, you&rsquo;re also
                subject to Google&rsquo;s privacy policies for the data we fetch from their API.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                5. Cookies
              </h2>
              <p className="leading-relaxed">
                We use minimal cookies for basic analytics and to remember your preferences. You can disable
                cookies in your browser settings, though this may affect some functionality.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                6. Your Rights
              </h2>
              <p className="leading-relaxed mb-4">
                You have the right to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Access the data we have about you</li>
                <li>Request deletion of your data</li>
                <li>Opt out of analytics tracking</li>
                <li>Ask questions about our privacy practices</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                7. Children&rsquo;s Privacy
              </h2>
              <p className="leading-relaxed">
                TrendArc does not knowingly collect information from children under 13. If we discover we have
                collected data from a child under 13, we will delete it promptly.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                8. Changes to This Policy
              </h2>
              <p className="leading-relaxed">
                We may update this privacy policy from time to time. Changes will be posted on this page with
                an updated revision date. Continued use of TrendArc after changes constitutes acceptance of the
                updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                9. Contact Us
              </h2>
              <p className="leading-relaxed">
                If you have questions about this privacy policy or how we handle your data, please contact us at{' '}
                <a href="mailto:contact@trendarc.net" className="text-blue-600 hover:text-blue-700 underline">
                  contact@trendarc.net
                </a>
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-200">
            <p className="text-sm text-slate-500 text-center">
              By using TrendArc, you agree to this privacy policy and our terms of service.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
