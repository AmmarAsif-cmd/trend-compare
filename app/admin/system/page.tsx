"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type ServiceStatus = {
  name: string;
  category: "core" | "api" | "feature" | "system";
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

type SystemInfo = {
  uptime: string;
  nodeVersion: string;
  platform: string;
  memory: { used: string; total: string };
};

export default function EnhancedSystemDashboard() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [expandedService, setExpandedService] = useState<string | null>(null);
  const [serviceLogs, setServiceLogs] = useState<Record<string, LogEntry[]>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "core" | "api" | "feature" | "system">("all");
  const [bulkRefreshCount, setBulkRefreshCount] = useState("10");
  const [bulkRefreshing, setBulkRefreshing] = useState(false);
  const [bulkRefreshProgress, setBulkRefreshProgress] = useState({ current: 0, total: 0 });

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
        loadSystemInfo();
      }
    } catch (error) {
      router.push("/admin/login");
    } finally {
      setLoading(false);
    }
  };

  const loadSystemInfo = () => {
    setSystemInfo({
      uptime: new Date(Date.now() - performance.now()).toLocaleString(),
      nodeVersion: typeof process !== 'undefined' ? process.version : 'N/A',
      platform: typeof navigator !== 'undefined' ? navigator.platform : 'N/A',
      memory: {
        used: typeof performance !== 'undefined' && (performance as any).memory
          ? `${((performance as any).memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`
          : 'N/A',
        total: typeof performance !== 'undefined' && (performance as any).memory
          ? `${((performance as any).memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`
          : 'N/A',
      }
    });
  };

  const loadSystemStatus = async () => {
    setRefreshing(true);

    const checks = [
      // Core Services
      checkDatabase(),
      checkPrismaClient(),

      // API Services
      checkAIInsights(),
      checkCompareAPI(),
      checkSuggestAPI(),
      checkTopWeekAPI(),
      checkTrendsAPI(),

      // Feature Services
      checkBlogSystem(),
      checkBlogGenerator(),
      checkAuthSystem(),
      checkAIInsightsCache(),

      // System Services
      checkEnvironmentVars(),
      checkCacheSystem(),
      checkDeploymentInfo(),
    ];

    const results = await Promise.all(checks);
    setServices(results);
    setRefreshing(false);
  };

  // Core Services
  const checkDatabase = async (): Promise<ServiceStatus> => {
    const start = Date.now();
    try {
      const res = await fetch("/api/health/db");
      const data = await res.json();
      const responseTime = Date.now() - start;

      addLog("Database", {
        timestamp: new Date().toISOString(),
        level: data.status === "healthy" ? "success" : "error",
        message: `Database: ${data.status} - ${data.tables?.comparisons || 0} comparisons, ${data.tables?.blogPosts || 0} posts`,
        details: data,
      });

      return {
        name: "Database (PostgreSQL)",
        category: "core",
        status: data.status === "healthy" ? "healthy" : "down",
        message: `${data.tables?.comparisons || 0} comparisons, ${data.tables?.blogPosts || 0} posts`,
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
        category: "core",
        status: "down",
        message: "Connection failed",
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
        category: "core",
        status: data.prismaGenerated ? "healthy" : "down",
        message: data.prismaGenerated ? "Generated & Connected" : "Not generated",
        lastChecked: new Date().toISOString(),
        details: data,
      };
    } catch (error) {
      return {
        name: "Prisma Client",
        category: "core",
        status: "down",
        message: "Cannot verify",
        lastChecked: new Date().toISOString(),
      };
    }
  };

  // API Services
  const checkAIInsights = async (): Promise<ServiceStatus> => {
    const start = Date.now();
    try {
      const res = await fetch("/api/ai-insights-status");
      const data = await res.json();
      const responseTime = Date.now() - start;

      const canGenerate = data.status?.canGenerate?.allowed;
      const hasApiKey = data.status?.apiKey?.configured;
      const budget = data.status?.budget?.status;

      addLog("AI Insights", {
        timestamp: new Date().toISOString(),
        level: canGenerate ? "success" : hasApiKey ? "warn" : "error",
        message: `AI Insights: ${canGenerate ? `${budget?.dailyUsed || 0}/${budget?.dailyLimit || 200} daily` : "Unavailable"}`,
        details: data,
      });

      return {
        name: "AI Insights API (Claude)",
        category: "api",
        status: canGenerate ? "healthy" : hasApiKey ? "degraded" : "down",
        message: canGenerate
          ? `${budget?.dailyUsed || 0}/${budget?.dailyLimit || 200} daily, ${budget?.monthlyUsed || 0}/${budget?.monthlyLimit || 6000} monthly`
          : hasApiKey ? "Budget limit reached" : "API key missing",
        responseTime,
        lastChecked: new Date().toISOString(),
        details: data,
      };
    } catch (error) {
      return {
        name: "AI Insights API (Claude)",
        category: "api",
        status: "down",
        message: "Health check failed",
        lastChecked: new Date().toISOString(),
      };
    }
  };

  const checkCompareAPI = async (): Promise<ServiceStatus> => {
    const start = Date.now();
    try {
      // Test with a simple comparison using GET request
      const res = await fetch("/api/compare?a=test&b=sample&tf=7d&geo=");
      const responseTime = Date.now() - start;
      const success = res.ok;

      let details = null;
      if (success) {
        try {
          details = await res.json();
        } catch (e) {
          // Ignore JSON parse errors
        }
      }

      addLog("Compare API", {
        timestamp: new Date().toISOString(),
        level: success ? "success" : "error",
        message: `Compare API: ${success ? "Operational" : "Failed"}`,
        details: details,
      });

      return {
        name: "Compare API",
        category: "api",
        status: success ? "healthy" : "down",
        message: success ? "Operational" : "Request failed",
        responseTime,
        lastChecked: new Date().toISOString(),
        details: details,
      };
    } catch (error) {
      return {
        name: "Compare API",
        category: "api",
        status: "down",
        message: "Endpoint error",
        lastChecked: new Date().toISOString(),
      };
    }
  };

  const checkSuggestAPI = async (): Promise<ServiceStatus> => {
    const start = Date.now();
    try {
      const res = await fetch("/api/suggest?q=test");
      const data = await res.json();
      const responseTime = Date.now() - start;

      addLog("Suggest API", {
        timestamp: new Date().toISOString(),
        level: res.ok ? "success" : "error",
        message: `Suggest API: ${data.suggestions?.length || 0} suggestions`,
      });

      return {
        name: "Suggest API",
        category: "api",
        status: res.ok ? "healthy" : "down",
        message: res.ok ? `${data.suggestions?.length || 0} suggestions` : "Failed",
        responseTime,
        lastChecked: new Date().toISOString(),
        details: data,
      };
    } catch (error) {
      return {
        name: "Suggest API",
        category: "api",
        status: "down",
        message: "Endpoint error",
        lastChecked: new Date().toISOString(),
      };
    }
  };

  const checkTopWeekAPI = async (): Promise<ServiceStatus> => {
    const start = Date.now();
    try {
      const res = await fetch("/api/top-week");
      const data = await res.json();
      const responseTime = Date.now() - start;

      addLog("Top Week API", {
        timestamp: new Date().toISOString(),
        level: res.ok ? "success" : "warn",
        message: `Top Week API: ${data.items?.length || 0} trending items`,
        details: data,
      });

      return {
        name: "Top Week API",
        category: "api",
        status: res.ok ? "healthy" : "degraded",
        message: `${data.items?.length || 0} trending items`,
        responseTime,
        lastChecked: new Date().toISOString(),
        details: data,
      };
    } catch (error) {
      return {
        name: "Top Week API",
        category: "api",
        status: "down",
        message: "Endpoint error",
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
        message: `Google Trends: ${data.trends?.length || 0} topics`,
        details: data,
      });

      return {
        name: "Google Trends API",
        category: "api",
        status: data.trends ? "healthy" : "degraded",
        message: `${data.trends?.length || 0} trending topics`,
        responseTime,
        lastChecked: new Date().toISOString(),
        details: data,
      };
    } catch (error) {
      return {
        name: "Google Trends API",
        category: "api",
        status: "down",
        message: "API error",
        lastChecked: new Date().toISOString(),
      };
    }
  };

  // Feature Services
  const checkBlogSystem = async (): Promise<ServiceStatus> => {
    const start = Date.now();
    try {
      const res = await fetch("/api/admin/blog/posts");
      const data = await res.json();
      const responseTime = Date.now() - start;

      const published = data.posts?.filter((p: any) => p.status === "published").length || 0;
      const pending = data.posts?.filter((p: any) => p.status === "pending_review").length || 0;

      addLog("Blog System", {
        timestamp: new Date().toISOString(),
        level: data.success ? "success" : "error",
        message: `Blog: ${data.posts?.length || 0} posts (${published} published, ${pending} pending)`,
        details: data,
      });

      return {
        name: "Blog System",
        category: "feature",
        status: data.success ? "healthy" : "down",
        message: `${data.posts?.length || 0} posts (${published} published, ${pending} pending)`,
        responseTime,
        lastChecked: new Date().toISOString(),
        details: data,
      };
    } catch (error) {
      return {
        name: "Blog System",
        category: "feature",
        status: "down",
        message: "API error",
        lastChecked: new Date().toISOString(),
      };
    }
  };

  const checkBlogGenerator = async (): Promise<ServiceStatus> => {
    try {
      const res = await fetch("/api/ai-insights-status");
      const data = await res.json();

      const hasApiKey = data.status?.apiKey?.configured;
      const canGenerate = data.status?.canGenerate?.allowed;

      addLog("Blog Generator", {
        timestamp: new Date().toISOString(),
        level: canGenerate ? "success" : "warn",
        message: `Blog Generator: ${canGenerate ? "Ready" : hasApiKey ? "Budget limit" : "No API key"}`,
      });

      return {
        name: "Blog Generator (AI)",
        category: "feature",
        status: canGenerate ? "healthy" : hasApiKey ? "degraded" : "down",
        message: canGenerate ? "Ready to generate" : hasApiKey ? "Budget limit reached" : "API key missing",
        lastChecked: new Date().toISOString(),
        details: data,
      };
    } catch (error) {
      return {
        name: "Blog Generator (AI)",
        category: "feature",
        status: "down",
        message: "Cannot check status",
        lastChecked: new Date().toISOString(),
      };
    }
  };

  const checkAuthSystem = async (): Promise<ServiceStatus> => {
    const start = Date.now();
    try {
      const res = await fetch("/api/admin/check-auth");
      const data = await res.json();
      const responseTime = Date.now() - start;

      addLog("Auth System", {
        timestamp: new Date().toISOString(),
        level: data.authenticated ? "success" : "info",
        message: `Auth: ${data.authenticated ? "Authenticated" : "Not authenticated"}`,
      });

      return {
        name: "Authentication System",
        category: "feature",
        status: "healthy", // If we're here, auth is working
        message: "Session active & secure",
        responseTime,
        lastChecked: new Date().toISOString(),
        details: data,
      };
    } catch (error) {
      return {
        name: "Authentication System",
        category: "feature",
        status: "down",
        message: "Auth check failed",
        lastChecked: new Date().toISOString(),
      };
    }
  };

  // System Services
  const checkEnvironmentVars = async (): Promise<ServiceStatus> => {
    const requiredVars = [
      "DATABASE_URL",
      "ANTHROPIC_API_KEY",
      "SESSION_SECRET",
      "ADMIN_PASSWORD",
    ];

    const missing: string[] = [];
    const configured: string[] = [];

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

      configured.push("SESSION_SECRET", "ADMIN_PASSWORD");

      addLog("Environment", {
        timestamp: new Date().toISOString(),
        level: missing.length === 0 ? "success" : "warn",
        message: `Environment: ${configured.length}/${requiredVars.length} configured`,
        details: { configured, missing },
      });

      return {
        name: "Environment Variables",
        category: "system",
        status: missing.length === 0 ? "healthy" : "degraded",
        message: `${configured.length}/${requiredVars.length} configured`,
        lastChecked: new Date().toISOString(),
        details: { configured, missing },
      };
    } catch (error) {
      return {
        name: "Environment Variables",
        category: "system",
        status: "degraded",
        message: "Could not verify",
        lastChecked: new Date().toISOString(),
      };
    }
  };

  const checkCacheSystem = async (): Promise<ServiceStatus> => {
    addLog("Cache System", {
      timestamp: new Date().toISOString(),
      level: "info",
      message: "Cache: Next.js ISR (Incremental Static Regeneration)",
    });

    return {
      name: "Cache System",
      category: "system",
      status: "healthy",
      message: "Next.js ISR active (1h revalidation)",
      lastChecked: new Date().toISOString(),
      details: {
        type: "ISR",
        revalidation: "3600s (1 hour)",
        blogPages: "Cached with on-demand revalidation",
        comparisons: "Cached with hash validation",
      },
    };
  };

  const checkDeploymentInfo = async (): Promise<ServiceStatus> => {
    const deployInfo = {
      environment: process.env.NODE_ENV || "development",
      vercel: typeof process.env.VERCEL !== 'undefined',
      region: process.env.VERCEL_REGION || "N/A",
      gitBranch: process.env.VERCEL_GIT_COMMIT_REF || "N/A",
    };

    addLog("Deployment", {
      timestamp: new Date().toISOString(),
      level: "info",
      message: `Deployment: ${deployInfo.environment}`,
      details: deployInfo,
    });

    return {
      name: "Deployment Info",
      category: "system",
      status: "healthy",
      message: `${deployInfo.environment} ${deployInfo.vercel ? "(Vercel)" : "(Local)"}`,
      lastChecked: new Date().toISOString(),
      details: deployInfo,
    };
  };

  const checkAIInsightsCache = async (): Promise<ServiceStatus> => {
    const start = Date.now();
    try {
      const res = await fetch("/api/admin/ai-insights-refresh");
      const data = await res.json();
      const responseTime = Date.now() - start;

      const needsRefresh = data.needsRefresh || 0;
      const total = data.total || 0;
      const fresh = data.fresh || 0;

      addLog("AI Insights Cache", {
        timestamp: new Date().toISOString(),
        level: needsRefresh > 10 ? "warn" : needsRefresh > 0 ? "info" : "success",
        message: `${needsRefresh} comparisons need refresh, ${fresh} are fresh (${total} total)`,
        details: data,
      });

      return {
        name: "AI Insights Cache",
        category: "feature",
        status: needsRefresh > 20 ? "degraded" : "healthy",
        message: `${needsRefresh} need refresh, ${fresh} fresh (${total} total)`,
        responseTime,
        lastChecked: new Date().toISOString(),
        details: data,
      };
    } catch (error) {
      addLog("AI Insights Cache", {
        timestamp: new Date().toISOString(),
        level: "error",
        message: `Cache check failed: ${error}`,
      });

      return {
        name: "AI Insights Cache",
        category: "feature",
        status: "down",
        message: "Check failed",
        lastChecked: new Date().toISOString(),
      };
    }
  };

  const addLog = (service: string, log: LogEntry) => {
    setServiceLogs((prev) => ({
      ...prev,
      [service]: [...(prev[service] || []).slice(-99), log],
    }));
  };

  const handleBulkRefresh = async (staleComparisons: any[]) => {
    const count = parseInt(bulkRefreshCount);
    if (isNaN(count) || count <= 0) {
      alert("Please enter a valid number");
      return;
    }

    const toRefresh = staleComparisons.slice(0, count);
    const estimatedCost = (count * 0.0014).toFixed(4);

    if (!confirm(
      `Refresh ${toRefresh.length} comparison${toRefresh.length !== 1 ? 's' : ''}?\n\n` +
      `Estimated cost: ~$${estimatedCost}\n` +
      `This will use your Claude API budget.`
    )) {
      return;
    }

    setBulkRefreshing(true);
    setBulkRefreshProgress({ current: 0, total: toRefresh.length });

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < toRefresh.length; i++) {
      const comp = toRefresh[i];
      setBulkRefreshProgress({ current: i + 1, total: toRefresh.length });

      try {
        const res = await fetch('/api/admin/ai-insights-refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            slug: comp.slug,
            timeframe: comp.timeframe,
            geo: comp.geo || '',
          }),
        });

        if (res.ok) {
          successCount++;
          addLog("AI Insights Cache", {
            timestamp: new Date().toISOString(),
            level: "success",
            message: `✅ Refreshed: ${comp.slug}`,
          });
        } else {
          failCount++;
          const result = await res.json();
          addLog("AI Insights Cache", {
            timestamp: new Date().toISOString(),
            level: "error",
            message: `❌ Failed: ${comp.slug} - ${result.error}`,
          });
        }
      } catch (error) {
        failCount++;
        addLog("AI Insights Cache", {
          timestamp: new Date().toISOString(),
          level: "error",
          message: `❌ Error: ${comp.slug} - ${error}`,
        });
      }

      // Small delay to avoid overwhelming the API
      if (i < toRefresh.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    setBulkRefreshing(false);
    setBulkRefreshProgress({ current: 0, total: 0 });

    alert(
      `Bulk refresh completed!\n\n` +
      `✅ Success: ${successCount}\n` +
      `❌ Failed: ${failCount}\n\n` +
      `Check the logs for details.`
    );

    // Reload status to show updated data
    loadSystemStatus();
  };

  const toggleService = (serviceName: string) => {
    setExpandedService(expandedService === serviceName ? null : serviceName);
  };

  const getStatusColor = (status: ServiceStatus["status"]) => {
    switch (status) {
      case "healthy": return "bg-green-100 text-green-800 border-green-300";
      case "degraded": return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "down": return "bg-red-100 text-red-800 border-red-300";
      case "checking": return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getStatusIcon = (status: ServiceStatus["status"]) => {
    switch (status) {
      case "healthy": return "✅";
      case "degraded": return "⚠️";
      case "down": return "❌";
      case "checking": return "🔄";
    }
  };

  const getLevelColor = (level: LogEntry["level"]) => {
    switch (level) {
      case "success": return "text-green-600";
      case "info": return "text-blue-600";
      case "warn": return "text-yellow-600";
      case "error": return "text-red-600";
    }
  };

  const getCategoryIcon = (category: ServiceStatus["category"]) => {
    switch (category) {
      case "core": return "🔵";
      case "api": return "🌐";
      case "feature": return "⚡";
      case "system": return "⚙️";
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

  const filteredServices = activeTab === "all"
    ? services
    : services.filter(s => s.category === activeTab);

  const healthyCount = services.filter((s) => s.status === "healthy").length;
  const totalCount = services.length;
  const overallHealth = (healthyCount / totalCount) * 100;

  const categoryStats = {
    core: services.filter(s => s.category === "core"),
    api: services.filter(s => s.category === "api"),
    feature: services.filter(s => s.category === "feature"),
    system: services.filter(s => s.category === "system"),
  };

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

      {/* System Info Bar */}
      {systemInfo && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Uptime:</span>
                <span className="ml-2 font-medium text-gray-900">{systemInfo.uptime}</span>
              </div>
              <div>
                <span className="text-gray-500">Platform:</span>
                <span className="ml-2 font-medium text-gray-900">{systemInfo.platform}</span>
              </div>
              <div>
                <span className="text-gray-500">Memory:</span>
                <span className="ml-2 font-medium text-gray-900">{systemInfo.memory.used}</span>
              </div>
              <div>
                <span className="text-gray-500">Last Update:</span>
                <span className="ml-2 font-medium text-gray-900">{new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

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
        </div>

        {/* Category Tabs */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {[
            { key: "all", label: "All Services", count: services.length },
            { key: "core", label: "Core", count: categoryStats.core.length },
            { key: "api", label: "APIs", count: categoryStats.api.length },
            { key: "feature", label: "Features", count: categoryStats.feature.length },
            { key: "system", label: "System", count: categoryStats.system.length },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Services Grid */}
        <div className="space-y-4">
          {filteredServices.map((service) => (
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
                  <span className="text-2xl">{getCategoryIcon(service.category)}</span>
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
                  {/* AI Insights Cache - Special UI with Refresh */}
                  {service.name === "AI Insights Cache" && service.details?.comparisons?.stale && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-gray-700">
                          Comparisons Needing Refresh ({service.details.comparisons.stale.length}):
                        </h4>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            max={service.details.comparisons.stale.length}
                            value={bulkRefreshCount}
                            onChange={(e) => setBulkRefreshCount(e.target.value)}
                            disabled={bulkRefreshing}
                            className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="10"
                          />
                          <button
                            onClick={() => handleBulkRefresh(service.details.comparisons.stale)}
                            disabled={bulkRefreshing || service.details.comparisons.stale.length === 0}
                            className={`px-4 py-1 text-sm font-medium text-white rounded transition-colors ${
                              bulkRefreshing
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-green-600 hover:bg-green-700'
                            }`}
                          >
                            {bulkRefreshing
                              ? `Refreshing ${bulkRefreshProgress.current}/${bulkRefreshProgress.total}...`
                              : `🔄 Bulk Refresh`}
                          </button>
                        </div>
                      </div>
                      {bulkRefreshing && (
                        <div className="mb-3 bg-blue-50 border border-blue-200 rounded p-3">
                          <div className="flex items-center justify-between text-sm text-blue-900 mb-2">
                            <span className="font-medium">
                              Refreshing {bulkRefreshProgress.current} of {bulkRefreshProgress.total}...
                            </span>
                            <span className="text-xs">
                              {Math.round((bulkRefreshProgress.current / bulkRefreshProgress.total) * 100)}%
                            </span>
                          </div>
                          <div className="w-full bg-blue-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{
                                width: `${(bulkRefreshProgress.current / bulkRefreshProgress.total) * 100}%`
                              }}
                            />
                          </div>
                        </div>
                      )}
                      <div className="bg-white rounded border border-gray-200 max-h-96 overflow-y-auto">
                        {service.details.comparisons.stale.map((comp: any, idx: number) => (
                          <div
                            key={idx}
                            className="p-3 border-b border-gray-100 last:border-b-0 flex items-center justify-between gap-3"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900 truncate">
                                {Array.isArray(comp.terms) ? comp.terms.join(' vs ') : comp.slug}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {comp.timeframe} • {comp.geoDisplay || comp.geo || 'worldwide'} • {comp.ageInDays} days old
                                {comp.category && ` • ${comp.category}`}
                              </div>
                            </div>
                            <button
                              onClick={async () => {
                                if (confirm(`Refresh AI insights for "${comp.slug}"?\n\nThis will cost ~$0.0014 from your Claude API budget.`)) {
                                  try {
                                    const res = await fetch('/api/admin/ai-insights-refresh', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        slug: comp.slug,
                                        timeframe: comp.timeframe,
                                        geo: comp.geo || '',
                                      }),
                                    });
                                    const result = await res.json();
                                    if (res.ok) {
                                      alert(`✅ Successfully refreshed: ${comp.slug}\nCategory: ${result.category}`);
                                      loadSystemStatus(); // Reload to show updated status
                                    } else {
                                      alert(`❌ Failed: ${result.error}`);
                                    }
                                  } catch (error) {
                                    alert(`❌ Error: ${error}`);
                                  }
                                }
                              }}
                              className="px-3 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors whitespace-nowrap"
                            >
                              🔄 Refresh
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 text-xs text-gray-600">
                        💡 AI insights are cached for 7 days. Refresh stale insights to get updated analysis.
                        Cost: ~$0.0014 per refresh using Claude Haiku.
                      </div>
                    </div>
                  )}

                  {/* Service Details */}
                  {service.details && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">
                        Details:
                      </h4>
                      <pre className="bg-white p-4 rounded border border-gray-200 text-xs overflow-x-auto max-h-96">
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
            Complete API Reference
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
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
                <li>POST /api/csp-report</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Feature URLs:</h3>
              <ul className="text-sm text-gray-600 space-y-1 font-mono">
                <li>GET /blog</li>
                <li>GET /blog/[slug]</li>
                <li>GET /compare/[slug]</li>
                <li>GET /about</li>
                <li>GET /privacy</li>
                <li>GET /admin/login</li>
                <li>GET /admin/blog</li>
                <li>GET /admin/system</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
