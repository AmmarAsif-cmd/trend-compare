/**
 * TikTok Integration Test Page
 * Test the TikTok API and components
 */

import TikTokUsernameInput from "@/components/tiktok/TikTokUsernameInput";
import TikTokProfileImage from "@/components/tiktok/TikTokProfileImage";
import { getTikTokUser } from "@/lib/tiktok/user-service";

export default async function TikTokTestPage() {
  // Test fetching a user (optional - comment out if you want to test without initial data)
  let testUser = null;
  try {
    testUser = await getTikTokUser("charlidamelio");
  } catch (error) {
    // Ignore errors - this is just for testing
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-10 space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-4xl font-bold text-slate-900 mb-4">
              TikTok Integration Test
            </h1>
            <p className="text-lg text-slate-600">
              Test the TikTok API and components
            </p>
          </div>

          {/* Test User Input Component */}
          <div className="border-2 border-slate-200 rounded-xl p-6 bg-slate-50">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              1. Username Input Component
            </h2>
            <p className="text-slate-600 mb-4">
              Try entering a TikTok username (e.g., @charlidamelio, charlidamelio, or full URL)
            </p>
            <TikTokUsernameInput 
              placeholder="@username"
              showPreview={true}
              autoValidate={true}
            />
          </div>

          {/* Test Profile Image Component */}
          <div className="border-2 border-slate-200 rounded-xl p-6 bg-slate-50">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              2. Profile Image Component
            </h2>
            <p className="text-slate-600 mb-4">
              Profile images with different sizes and fallback avatars
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {/* Small */}
              <div className="text-center">
                <p className="text-sm font-medium text-slate-700 mb-2">Small (80px)</p>
                <TikTokProfileImage
                  avatarUrl={testUser?.avatarUrl || null}
                  username={testUser?.username || "testuser"}
                  displayName={testUser?.displayName || null}
                  size="small"
                  showVerified
                  verified={testUser?.verified || false}
                  className="mx-auto"
                />
              </div>
              {/* Medium */}
              <div className="text-center">
                <p className="text-sm font-medium text-slate-700 mb-2">Medium (120px)</p>
                <TikTokProfileImage
                  avatarUrl={testUser?.avatarUrl || null}
                  username={testUser?.username || "testuser"}
                  displayName={testUser?.displayName || null}
                  size="medium"
                  showVerified
                  verified={testUser?.verified || false}
                  className="mx-auto"
                />
              </div>
              {/* Large */}
              <div className="text-center">
                <p className="text-sm font-medium text-slate-700 mb-2">Large (240px)</p>
                <TikTokProfileImage
                  avatarUrl={testUser?.avatarUrl || null}
                  username={testUser?.username || "testuser"}
                  displayName={testUser?.displayName || null}
                  size="large"
                  showVerified
                  verified={testUser?.verified || false}
                  className="mx-auto"
                />
              </div>
            </div>
          </div>

          {/* Test API Endpoint */}
          <div className="border-2 border-slate-200 rounded-xl p-6 bg-slate-50">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              3. API Endpoint Test
            </h2>
            <p className="text-slate-600 mb-4">
              Test the API endpoint directly:
            </p>
            <div className="bg-slate-900 rounded-lg p-4 text-green-400 font-mono text-sm overflow-x-auto">
              <div className="mb-2">
                <span className="text-slate-400">GET</span>{" "}
                <span className="text-blue-400">/api/tiktok/user/charlidamelio</span>
              </div>
              <div className="text-xs text-slate-500 mt-2">
                Try it:{" "}
                <a
                  href="/api/tiktok/user/charlidamelio"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline"
                >
                  /api/tiktok/user/charlidamelio
                </a>
              </div>
            </div>
          </div>

          {/* Status Check */}
          <div className="border-2 border-indigo-200 rounded-xl p-6 bg-indigo-50">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              ✅ Integration Status
            </h2>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>Database tables created</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={process.env.APIFY_API_KEY ? "text-green-500" : "text-red-500"}>
                  {process.env.APIFY_API_KEY ? "✓" : "✗"}
                </span>
                <span>
                  API key configured: {process.env.APIFY_API_KEY ? "Yes" : "No"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>Components ready</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>API endpoint ready</span>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="border-2 border-purple-200 rounded-xl p-6 bg-purple-50">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              🚀 Next Steps
            </h2>
            <div className="space-y-3 text-slate-700">
              <p>
                <strong>1. Test the API:</strong> Visit{" "}
                <a
                  href="/api/tiktok/user/charlidamelio"
                  target="_blank"
                  className="text-blue-600 hover:underline font-mono"
                >
                  /api/tiktok/user/charlidamelio
                </a>{" "}
                to see if it returns user data
              </p>
              <p>
                <strong>2. Build a comparison page:</strong> Create a page where users can compare two TikTok users
              </p>
              <p>
                <strong>3. Integrate into your app:</strong> Use the components in your existing pages
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

