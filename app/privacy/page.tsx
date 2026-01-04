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
                TrendArc uses several third-party services to provide our comparison features:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li><strong>Google Trends:</strong> We use Google Trends data to generate comparisons. When you use our service, you&rsquo;re also subject to Google&rsquo;s privacy policies for the data we fetch from their API.</li>
                <li><strong>Google AdSense:</strong> We use Google AdSense to display advertisements on our website. AdSense uses cookies to serve ads based on your prior visits to our website or other websites. You can opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 underline">Google&rsquo;s Ad Settings</a>.</li>
                <li><strong>Other APIs:</strong> We also use YouTube, TMDB, Spotify, Steam, Best Buy, Wikipedia, and other APIs to enrich our comparison data. Each service has its own privacy policy.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                5. Cookies and Tracking Technologies
              </h2>
              <p className="leading-relaxed mb-4">
                We use cookies and similar tracking technologies to improve your experience on our website:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li><strong>Essential Cookies:</strong> Required for the website to function properly (e.g., session management, security)</li>
                <li><strong>Analytics Cookies:</strong> Help us understand how visitors interact with our website (e.g., Google Analytics)</li>
                <li><strong>Advertising Cookies:</strong> Used by Google AdSense to serve relevant ads and measure ad performance. These cookies may track your browsing activity across websites.</li>
                <li><strong>Preference Cookies:</strong> Remember your settings and preferences (e.g., theme, language)</li>
              </ul>
              <p className="leading-relaxed mb-4">
                <strong>Managing Cookies:</strong> You can control cookies through your browser settings. However, disabling certain cookies may affect website functionality. For UK and EEA users, you can manage your cookie preferences using our cookie consent banner.
              </p>
              <p className="leading-relaxed">
                <strong>Opt-Out of Personalized Ads:</strong> You can opt out of personalized advertising from Google by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 underline">Google&rsquo;s Ad Settings</a> or the <a href="https://www.youronlinechoices.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 underline">Your Online Choices</a> website.
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
