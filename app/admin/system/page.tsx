"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type ServiceStatus = {
  name: string;
  status: "healthy" | "degraded" | "down" | "checking";
  message?: string;
  responseTime?: number;
  lastChecked?: string;
  details?: any;
};

type LogEntry = {
  timestamp: string;
  level: "info" | "warn" | "error" | "success";
  message: string;
  details?: any;
};

export default function SystemDashboard() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [expandedService, setExpandedService] = useState<string | null>(null);
  const [serviceLogs, setServiceLogs] = useState<Record<string, LogEntry[]>>({});
  const [refreshing, setRefreshing] = useState(false);

  // Check authentication
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/admin/check-auth");
      const data = await res.json();
      if (!data.authenticated) {
        router.push("/admin/login");
      } else {
        setAuthenticated(true);
        loadSystemStatus();
      }
    } catch (error) {
      router.push("/admin/login");
    } finally {
      setLoading(false);
    }
  };

  const loadSystemStatus = async () => {
    setRefreshing(true);
    const checks = [
      checkDatabase(),
      checkAIInsights(),
      checkBlogSystem(),
      checkTrendsAPI(),
      checkEnvironmentVars(),
      checkPrismaClient(),
    ];

    const results = await Promise.all(checks);
    setServices(results);
    setRefreshing(false);
  };

  // Health check functions
  const checkDatabase = async (): Promise<ServiceStatus> => {
    const start = Date.now();
    try {
      const res = await fetch("/api/health/db");
      const data = await res.json();
      const responseTime = Date.now() - start;

      addLog("Database", {
        timestamp: new Date().toISOString(),
        level: data.status === "healthy" ? "success" : "error",
        message: `Database check: ${data.status}`,
        details: data,
      });

      return {
        name: "Database (PostgreSQL)",
        status: data.status === "healthy" ? "healthy" : "down",
        message: data.message,
        responseTime,
        lastChecked: new Date().toISOString(),
        details: data,
      };
    } catch (error) {
      addLog("Database", {
        timestamp: new Date().toISOString(),
        level: "error",
        message: `Database check failed: ${error}`,
      });

      return {
        name: "Database (PostgreSQL)",
        status: "down",
        message: "Failed to connect",
        lastChecked: new Date().toISOString(),
      };
    }
  };

  const checkAIInsights = async (): Promise<ServiceStatus> => {
    const start = Date.now();
    try {
      const res = await fetch("/api/ai-insights-status");
      const data = await res.json();
      const responseTime = Date.now() - start;

      const canGenerate = data.status?.canGenerate?.allowed;
      const hasApiKey = data.status?.apiKey?.configured;

      addLog("AI Insights", {
        timestamp: new Date().toISOString(),
        level: canGenerate ? "success" : hasApiKey ? "warn" : "error",
        message: `AI Insights: ${canGenerate ? "Operational" : hasApiKey ? "Budget limit reached" : "API key missing"}`,
        details: data,
      });

      return {
        name: "AI Insights (Claude Haiku)",
        status: canGenerate ? "healthy" : hasApiKey ? "degraded" : "down",
        message: canGenerate
          ? "Operational"
          : hasApiKey
          ? "Budget limit reached"
          : "API key not configured",
        responseTime,
        lastChecked: new Date().toISOString(),
        details: data,
      };
    } catch (error) {
      addLog("AI Insights", {
        timestamp: new Date().toISOString(),
        level: "error",
        message: `AI Insights check failed: ${error}`,
      });

      return {
        name: "AI Insights (Claude Haiku)",
        status: "down",
        message: "Health check failed",
        lastChecked: new Date().toISOString(),
      };
    }
  };

  const checkBlogSystem = async (): Promise<ServiceStatus> => {
    const start = Date.now();
    try {
      const res = await fetch("/api/admin/blog/posts");
      const data = await res.json();
      const responseTime = Date.now() - start;

      addLog("Blog System", {
        timestamp: new Date().toISOString(),
        level: data.success ? "success" : "error",
        message: `Blog system: ${data.posts?.length || 0} posts found`,
        details: data,
      });

      return {
        name: "Blog System",
        status: data.success ? "healthy" : "down",
        message: data.success ? `${data.posts?.length || 0} posts` : "Failed to load",
        responseTime,
        lastChecked: new Date().toISOString(),
        details: data,
      };
    } catch (error) {
      addLog("Blog System", {
        timestamp: new Date().toISOString(),
        level: "error",
        message: `Blog system check failed: ${error}`,
      });

      return {
        name: "Blog System",
        status: "down",
        message: "API error",
        lastChecked: new Date().toISOString(),
      };
    }
  };

  const checkTrendsAPI = async (): Promise<ServiceStatus> => {
    const start = Date.now();
    try {
      const res = await fetch("/api/google-trending");
      const data = await res.json();
      const responseTime = Date.now() - start;

      addLog("Trends API", {
        timestamp: new Date().toISOString(),
        level: data.trends ? "success" : "warn",
        message: `Google Trends: ${data.trends?.length || 0} trending topics`,
        details: data,
      });

      return {
        name: "Google Trends API",
        status: data.trends ? "healthy" : "degraded",
        message: data.trends ? `${data.trends.length} topics` : "No data",
        responseTime,
        lastChecked: new Date().toISOString(),
        details: data,
      };
    } catch (error) {
      addLog("Trends API", {
        timestamp: new Date().toISOString(),
        level: "error",
        message: `Trends API check failed: ${error}`,
      });

      return {
        name: "Google Trends API",
        status: "down",
        message: "API error",
        lastChecked: new Date().toISOString(),
      };
    }
  };

  const checkEnvironmentVars = async (): Promise<ServiceStatus> => {
    const requiredVars = [
      "DATABASE_URL",
      "ANTHROPIC_API_KEY",
      "SESSION_SECRET",
      "ADMIN_PASSWORD",
    ];

    const missing: string[] = [];
    const configured: string[] = [];

    // We can't directly check env vars from client, so we check via APIs
    try {
      const aiRes = await fetch("/api/ai-insights-status");
      const aiData = await aiRes.json();

      if (aiData.status?.apiKey?.configured) {
        configured.push("ANTHROPIC_API_KEY");
      } else {
        missing.push("ANTHROPIC_API_KEY");
      }

      const dbRes = await fetch("/api/health/db");
      const dbData = await dbRes.json();

      if (dbData.status === "healthy") {
        configured.push("DATABASE_URL");
      } else {
        missing.push("DATABASE_URL");
      }

      // Session and admin password are assumed configured if auth works
      configured.push("SESSION_SECRET", "ADMIN_PASSWORD");

      addLog("Environment", {
        timestamp: new Date().toISOString(),
        level: missing.length === 0 ? "success" : "warn",
        message: `Environment: ${configured.length} configured, ${missing.length} missing`,
        details: { configured, missing },
      });

      return {
        name: "Environment Variables",
        status: missing.length === 0 ? "healthy" : "degraded",
        message: `${configured.length}/${requiredVars.length} configured`,
        lastChecked: new Date().toISOString(),
        details: { configured, missing },
      };
    } catch (error) {
      return {
        name: "Environment Variables",
        status: "degraded",
        message: "Could not verify",
        lastChecked: new Date().toISOString(),
      };
    }
  };

  const checkPrismaClient = async (): Promise<ServiceStatus> => {
    try {
      const res = await fetch("/api/health/db");
      const data = await res.json();

      addLog("Prisma", {
        timestamp: new Date().toISOString(),
        level: data.prismaGenerated ? "success" : "error",
        message: `Prisma Client: ${data.prismaGenerated ? "Generated" : "Not generated"}`,
        details: data,
      });

      return {
        name: "Prisma Client",
        status: data.prismaGenerated ? "healthy" : "down",
        message: data.prismaGenerated ? "Generated" : "Not generated",
        lastChecked: new Date().toISOString(),
        details: data,
      };
    } catch (error) {
      return {
        name: "Prisma Client",
        status: "down",
        message: "Cannot verify",
        lastChecked: new Date().toISOString(),
      };
    }
  };

  const addLog = (service: string, log: LogEntry) => {
    setServiceLogs((prev) => ({
      ...prev,
      [service]: [...(prev[service] || []).slice(-99), log], // Keep last 100 logs
    }));
  };

  const toggleService = (serviceName: string) => {
    setExpandedService(expandedService === serviceName ? null : serviceName);
  };

  const getStatusColor = (status: ServiceStatus["status"]) => {
    switch (status) {
      case "healthy":
        return "bg-green-100 text-green-800 border-green-300";
      case "degraded":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "down":
        return "bg-red-100 text-red-800 border-red-300";
      case "checking":
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getStatusIcon = (status: ServiceStatus["status"]) => {
    switch (status) {
      case "healthy":
        return "✅";
      case "degraded":
        return "⚠️";
      case "down":
        return "❌";
      case "checking":
        return "🔄";
    }
  };

  const getLevelColor = (level: LogEntry["level"]) => {
    switch (level) {
      case "success":
        return "text-green-600";
      case "info":
        return "text-blue-600";
      case "warn":
        return "text-yellow-600";
      case "error":
        return "text-red-600";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 text-lg">Loading system dashboard...</div>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return null;
  }

  const healthyCount = services.filter((s) => s.status === "healthy").length;
  const totalCount = services.length;
  const overallHealth = (healthyCount / totalCount) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-8 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">System Dashboard</h1>
              <p className="mt-2 text-indigo-100">
                Real-time monitoring and debugging for TrendArc
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-indigo-100">Overall Health</div>
              <div className="text-4xl font-bold">{overallHealth.toFixed(0)}%</div>
              <div className="text-sm text-indigo-100">
                {healthyCount}/{totalCount} services
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Action Bar */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex gap-3">
            <button
              onClick={loadSystemStatus}
              disabled={refreshing}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
            >
              {refreshing ? "🔄" : "↻"} Refresh All
            </button>
            <button
              onClick={() => router.push("/admin/blog")}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              ← Back to Blog Admin
            </button>
          </div>
          <div className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>

        {/* Services Grid */}
        <div className="space-y-4">
          {services.map((service) => (
            <div
              key={service.name}
              className="bg-white rounded-lg shadow border-2 overflow-hidden"
            >
              {/* Service Header */}
              <button
                onClick={() => toggleService(service.name)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <span className="text-3xl">{getStatusIcon(service.status)}</span>
                  <div className="text-left">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {service.name}
                    </h3>
                    <p className="text-sm text-gray-600">{service.message}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {service.responseTime && (
                    <span className="text-sm text-gray-500">
                      {service.responseTime}ms
                    </span>
                  )}
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                      service.status
                    )}`}
                  >
                    {service.status}
                  </span>
                  <span className="text-gray-400">
                    {expandedService === service.name ? "▼" : "▶"}
                  </span>
                </div>
              </button>

              {/* Expanded Details and Logs */}
              {expandedService === service.name && (
                <div className="border-t border-gray-200 bg-gray-50 p-6">
                  {/* Service Details */}
                  {service.details && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">
                        Details:
                      </h4>
                      <pre className="bg-white p-4 rounded border border-gray-200 text-xs overflow-x-auto">
                        {JSON.stringify(service.details, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* Logs */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">
                      Recent Logs:
                    </h4>
                    <div className="bg-white rounded border border-gray-200 max-h-64 overflow-y-auto">
                      {serviceLogs[service.name]?.length > 0 ? (
                        <div className="divide-y divide-gray-100">
                          {serviceLogs[service.name]
                            .slice()
                            .reverse()
                            .map((log, idx) => (
                              <div key={idx} className="p-3 text-xs font-mono">
                                <div className="flex items-start gap-3">
                                  <span className="text-gray-400">
                                    {new Date(log.timestamp).toLocaleTimeString()}
                                  </span>
                                  <span className={`font-semibold ${getLevelColor(log.level)}`}>
                                    {log.level.toUpperCase()}
                                  </span>
                                  <span className="flex-1 text-gray-700">
                                    {log.message}
                                  </span>
                                </div>
                                {log.details && (
                                  <pre className="mt-2 ml-20 text-gray-600 overflow-x-auto">
                                    {JSON.stringify(log.details, null, 2)}
                                  </pre>
                                )}
                              </div>
                            ))}
                        </div>
                      ) : (
                        <div className="p-4 text-center text-gray-500">
                          No logs yet
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* API Endpoints Reference */}
        <div className="mt-8 bg-white rounded-lg shadow border p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Available API Endpoints
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Admin APIs:</h3>
              <ul className="text-sm text-gray-600 space-y-1 font-mono">
                <li>POST /api/admin/login</li>
                <li>GET /api/admin/check-auth</li>
                <li>POST /api/admin/logout</li>
                <li>GET /api/admin/blog/posts</li>
                <li>GET /api/admin/blog/posts/[id]</li>
                <li>PATCH /api/admin/blog/posts/[id]</li>
                <li>DELETE /api/admin/blog/posts/[id]</li>
                <li>POST /api/admin/blog/posts/create</li>
                <li>POST /api/admin/blog/generate</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Public APIs:</h3>
              <ul className="text-sm text-gray-600 space-y-1 font-mono">
                <li>POST /api/compare</li>
                <li>GET /api/suggest</li>
                <li>GET /api/top-week</li>
                <li>GET /api/google-trending</li>
                <li>GET /api/ai-insights-status</li>
                <li>GET /api/health/db</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
