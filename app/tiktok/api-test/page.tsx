"use client";

import { useState } from "react";
import { Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

export default function TikTokAPITestPage() {
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [testResult, setTestResult] = useState<any>(null);
  const [username, setUsername] = useState("tiktok");

  const testAPI = async () => {
    setTestStatus("testing");
    setTestResult(null);

    try {
      // Test 1: Check API configuration
      const configResponse = await fetch("/api/tiktok/test");
      const configData = await configResponse.json();
      
      if (!configData.configured) {
        setTestResult({
          step: "Configuration",
          success: false,
          error: configData.error || "API not configured",
          message: configData.message,
        });
        setTestStatus("error");
        return;
      }

      // Test 2: Try to fetch a user
      const userResponse = await fetch(`/api/tiktok/user/${username}`);
      const userData = await userResponse.json();

      if (userResponse.ok) {
        setTestResult({
          step: "User Fetch",
          success: true,
          config: configData,
          user: userData,
          message: "API is working correctly!",
        });
        setTestStatus("success");
      } else {
        setTestResult({
          step: "User Fetch",
          success: false,
          config: configData,
          error: userData.error || "User not found",
          status: userResponse.status,
          message: userResponse.status === 404 
            ? "User not found (this is expected if username doesn't exist)"
            : "API error occurred",
        });
        setTestStatus("error");
      }
    } catch (error: any) {
      setTestResult({
        step: "Test",
        success: false,
        error: error.message || "Unknown error",
        message: "Failed to test API",
      });
      setTestStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-6">
            TikTok API Diagnostic Tool
          </h1>

          <div className="space-y-6">
            {/* Test Username Input */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Test Username
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="tiktok"
                  className="flex-1 px-4 py-2 border-2 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={testAPI}
                  disabled={testStatus === "testing"}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {testStatus === "testing" ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    "Test API"
                  )}
                </button>
              </div>
            </div>

            {/* Test Results */}
            {testResult && (
              <div className="space-y-4">
                <div
                  className={`p-6 rounded-lg border-2 ${
                    testResult.success
                      ? "bg-green-50 border-green-200"
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    {testResult.success ? (
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-600" />
                    )}
                    <h2 className="text-xl font-bold text-slate-900">
                      {testResult.step}
                    </h2>
                  </div>

                  {testResult.config && (
                    <div className="mb-4 p-4 bg-white rounded-lg">
                      <h3 className="font-semibold text-slate-900 mb-2">
                        API Configuration:
                      </h3>
                      <div className="space-y-1 text-sm">
                        <div>
                          <span className="font-medium">Configured:</span>{" "}
                          <span
                            className={
                              testResult.config.configured
                                ? "text-green-600"
                                : "text-red-600"
                            }
                          >
                            {testResult.config.configured ? "Yes" : "No"}
                          </span>
                        </div>
                        {testResult.config.apiWorking !== undefined && (
                          <div>
                            <span className="font-medium">API Working:</span>{" "}
                            <span
                              className={
                                testResult.config.apiWorking
                                  ? "text-green-600"
                                  : "text-red-600"
                              }
                            >
                              {testResult.config.apiWorking ? "Yes" : "No"}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {testResult.user && (
                    <div className="mb-4 p-4 bg-white rounded-lg">
                      <h3 className="font-semibold text-slate-900 mb-2">
                        User Data:
                      </h3>
                      <pre className="text-xs bg-slate-100 p-3 rounded overflow-auto">
                        {JSON.stringify(testResult.user, null, 2)}
                      </pre>
                    </div>
                  )}

                  {testResult.error && (
                    <div className="mb-4 p-4 bg-white rounded-lg">
                      <h3 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        Error:
                      </h3>
                      <p className="text-red-700">{testResult.error}</p>
                      {testResult.status && (
                        <p className="text-sm text-red-600 mt-2">
                          Status Code: {testResult.status}
                        </p>
                      )}
                    </div>
                  )}

                  <p className="text-slate-700">{testResult.message}</p>
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-3">
                How to Fix API Issues:
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
                <li>
                  Make sure <code className="bg-blue-100 px-1 rounded">APIFY_API_KEY</code> is set in your{" "}
                  <code className="bg-blue-100 px-1 rounded">.env.local</code> file
                </li>
                <li>
                  Get your API key from{" "}
                  <a
                    href="https://console.apify.com/account/integrations"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    Apify Console
                  </a>
                </li>
                <li>
                  Verify the actor ID is correct:{" "}
                  <code className="bg-blue-100 px-1 rounded">scraptik~tiktok-profile-scraper</code>
                </li>
                <li>
                  Check your Apify account has sufficient credits/quota
                </li>
                <li>
                  Test with a known username like <code className="bg-blue-100 px-1 rounded">tiktok</code> or{" "}
                  <code className="bg-blue-100 px-1 rounded">charlidamelio</code>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

