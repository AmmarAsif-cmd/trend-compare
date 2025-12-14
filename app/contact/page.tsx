import { BRAND } from "@/lib/brand";
import BackButton from "@/components/BackButton";
import ContactForm from "@/components/ContactForm";
import { Mail, MessageSquare, Clock, HelpCircle } from "lucide-react";

export const metadata = {
  title: `Contact Us | ${BRAND}`,
  description:
    "Get in touch with the TrendArc team. We'd love to hear from you!",
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        <div className="mb-8">
          <BackButton />
        </div>

        {/* Hero Section */}
        <section className="text-center mb-12">
          <div className="inline-block mb-4">
            <span className="bg-blue-50 text-blue-600 px-4 py-2 rounded-full text-sm font-semibold border border-blue-200">
              💬 Get in Touch
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            <span className="block text-slate-900">We'd Love to</span>
            <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Hear from You
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Have a question, suggestion, or feedback? We're here to help and always appreciate hearing from our users.
          </p>
        </section>

        {/* Contact Form */}
        <div className="mb-12">
          <ContactForm />
        </div>

        {/* Contact Methods */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Email */}
          <div className="bg-white rounded-2xl p-8 border-2 border-slate-200 hover:shadow-xl transition-all duration-300">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-4 text-slate-900">Direct Email</h2>
            <p className="text-slate-600 mb-4 leading-relaxed">
              Prefer to email directly? You can reach us at:
            </p>
            <a
              href="mailto:contact@trendarc.net"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold transition-colors"
            >
              contact@trendarc.net
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>

          {/* Response Time */}
          <div className="bg-white rounded-2xl p-8 border-2 border-slate-200 hover:shadow-xl transition-all duration-300">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6">
              <Clock className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-4 text-slate-900">Response Time</h2>
            <p className="text-slate-600 mb-4 leading-relaxed">
              We typically respond within 24-48 hours. For urgent matters, please mention it in your message.
            </p>
            <div className="text-sm text-slate-500">
              <p>⏰ Usually within 24 hours</p>
            </div>
          </div>
        </div>

        {/* What We Can Help With */}
        <section className="bg-white rounded-2xl p-8 sm:p-10 border-2 border-slate-200 mb-12">
          <div className="flex items-center gap-3 mb-6">
            <HelpCircle className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-slate-900">What We Can Help With</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">Feature Requests</h3>
                <p className="text-sm text-slate-600">Have an idea? We'd love to hear it!</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">Bug Reports</h3>
                <p className="text-sm text-slate-600">Found an issue? Let us know so we can fix it.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">Partnerships</h3>
                <p className="text-sm text-slate-600">Interested in collaborating? Reach out!</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">General Questions</h3>
                <p className="text-sm text-slate-600">Anything else? We're here to help.</p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Link */}
        <section className="text-center bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 border-2 border-blue-100">
          <MessageSquare className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-3 text-slate-900">Before You Contact Us</h2>
          <p className="text-slate-600 mb-6 max-w-2xl mx-auto">
            Check out our FAQ section - you might find the answer you're looking for!
          </p>
          <a
            href="/#faq"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
          >
            View FAQ
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </section>
      </div>
    </main>
  );
}

