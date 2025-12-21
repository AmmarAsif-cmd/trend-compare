"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type KeywordPair = {
  id: string;
  termA: string;
  termB: string;
  category: string;
  qualityScore: number;
  status: string;
  source: string;
  notes?: string;
  tags: string[];
  timesUsed: number;
  createdAt: string;
  approvedBy?: string;
};

type QualityResult = {
  overall: number;
  breakdown: {
    validity: number;
    searchability: number;
    competitiveness: number;
    clarity: number;
  };
  issues: string[];
  recommendations: string[];
  isApproved: boolean;
};

const CATEGORIES = [
  "music",
  "movies",
  "games",
  "tech",
  "products",
  "people",
  "brands",
  "places",
  "general",
];

const STATUS_OPTIONS = ["pending", "approved", "rejected", "archived"];

export default function AdminKeywordsPage() {
  const router = useRouter();
  const [keywords, setKeywords] = useState<KeywordPair[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  // Add/Edit modal state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    termA: "",
    termB: "",
    category: "tech",
    notes: "",
    tags: "",
  });

  // Quality check state
  const [qualityResult, setQualityResult] = useState<QualityResult | null>(null);
  const [checkingQuality, setCheckingQuality] = useState(false);

  // Import state
  const [importing, setImporting] = useState(false);

  // Seeding state
  const [seeding, setSeeding] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
  });

  // Fetch keywords
  const fetchKeywords = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory) params.set("category", selectedCategory);
      if (selectedStatus) params.set("status", selectedStatus);

      const response = await fetch(`/api/admin/keywords?${params}`);
      if (!response.ok) {
        if (response.status === 401) {
          router.push("/admin/login");
          return;
        }
        throw new Error("Failed to fetch keywords");
      }

      const data = await response.json();
      setKeywords(data.keywords);
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load keywords");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeywords();
  }, [selectedCategory, selectedStatus]);

  // Check quality
  const checkQuality = async () => {
    if (!formData.termA || !formData.termB) {
      setError("Please enter both terms");
      return;
    }

    try {
      setCheckingQuality(true);
      const response = await fetch("/api/admin/keywords/check-quality", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          termA: formData.termA,
          termB: formData.termB,
        }),
      });

      const data = await response.json();
      setQualityResult(data.quality);
    } catch (err) {
      setError("Failed to check quality");
    } finally {
      setCheckingQuality(false);
    }
  };

  // Add/Update keyword
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const method = editingId ? "PUT" : "POST";
      const body = editingId
        ? { id: editingId, ...formData, tags: formData.tags.split(",").map((t) => t.trim()) }
        : { ...formData, tags: formData.tags.split(",").map((t) => t.trim()) };

      const response = await fetch("/api/admin/keywords", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save keyword");
      }

      setSuccess(data.message || "Keyword saved successfully!");
      setShowModal(false);
      setFormData({ termA: "", termB: "", category: "tech", notes: "", tags: "" });
      setQualityResult(null);
      setEditingId(null);
      fetchKeywords();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save keyword");
    }
  };

  // Delete keyword
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this keyword pair?")) return;

    try {
      const response = await fetch(`/api/admin/keywords?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete");

      setSuccess("Keyword deleted successfully");
      fetchKeywords();
    } catch (err) {
      setError("Failed to delete keyword");
    }
  };

  // Update status
  const updateStatus = async (id: string, status: string) => {
    try {
      const response = await fetch("/api/admin/keywords", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });

      if (!response.ok) throw new Error("Failed to update status");

      setSuccess(`Status updated to ${status}`);
      fetchKeywords();
    } catch (err) {
      setError("Failed to update status");
    }
  };

  // Edit keyword
  const handleEdit = (keyword: KeywordPair) => {
    setEditingId(keyword.id);
    setFormData({
      termA: keyword.termA,
      termB: keyword.termB,
      category: keyword.category,
      notes: keyword.notes || "",
      tags: keyword.tags.join(", "),
    });
    setShowModal(true);
  };

  // Get quality color
  const getQualityColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 70) return "text-lime-600";
    if (score >= 60) return "text-yellow-600";
    if (score >= 40) return "text-orange-600";
    return "text-red-600";
  };

  // Get quality label
  const getQualityLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 70) return "Good";
    if (score >= 60) return "Fair";
    if (score >= 40) return "Poor";
    return "Very Poor";
  };

  // Import seed keywords
  const handleImportSeed = async () => {
    if (!confirm("Import keywords from seed-keywords.json? This will add 340+ curated keyword pairs.")) {
      return;
    }

    try {
      setImporting(true);
      setError("");
      setSuccess("");

      const response = await fetch("/api/admin/keywords/import-seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ minQuality: 50 }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to import keywords");
      }

      setSuccess(
        `✅ Import complete! ${data.stats.imported} keywords imported, ${data.stats.skipped} duplicates skipped, ${data.stats.lowQuality} low quality filtered.`
      );
      fetchKeywords();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import keywords");
    } finally {
      setImporting(false);
    }
  };

  // Seed comparisons from keywords
  const handleSeedComparisons = async () => {
    const limit = prompt("How many keywords to process? (default: 10)", "10");
    if (!limit) return;

    const count = parseInt(limit);
    if (isNaN(count) || count <= 0) {
      setError("Please enter a valid number");
      return;
    }

    if (!confirm(
      `Process ${count} approved keywords into comparisons?\n\n` +
      `This will create actual comparison pages in your database.\n` +
      `Takes ~0.5s per keyword (${Math.round(count * 0.5 / 60)}min for ${count} keywords)`
    )) {
      return;
    }

    try {
      setSeeding(true);
      setError("");
      setSuccess("");

      const response = await fetch("/api/admin/keywords/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          limit: count,
          status: "approved",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to seed comparisons");
      }

      let message = `✅ Seeding complete!\n\n`;
      message += `• Created: ${data.stats.created} new comparisons\n`;
      message += `• Already exists: ${data.stats.exists}\n`;
      if (data.stats.errors > 0) {
        message += `• Errors: ${data.stats.errors}\n`;
      }

      setSuccess(message);
      fetchKeywords(); // Refresh to show updated timesUsed
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to seed comparisons");
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Keyword Management</h1>
            <p className="text-gray-600 mt-1">Manage comparison keyword pairs for seeding</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleImportSeed}
              disabled={importing}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {importing ? "Importing..." : "📥 Import Keywords"}
            </button>
            <button
              onClick={handleSeedComparisons}
              disabled={seeding || stats.approved === 0}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              title={stats.approved === 0 ? "No approved keywords to seed" : "Create comparisons from approved keywords"}
            >
              {seeding ? "Seeding..." : "🌱 Seed Comparisons"}
            </button>
            <button
              onClick={() => {
                setShowModal(true);
                setEditingId(null);
                setFormData({ termA: "", termB: "", category: "tech", notes: "", tags: "" });
                setQualityResult(null);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              + Add Keyword Pair
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-gray-600 text-sm">Total</div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg shadow">
            <div className="text-green-700 text-sm">Approved</div>
            <div className="text-2xl font-bold text-green-700">{stats.approved}</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg shadow">
            <div className="text-yellow-700 text-sm">Pending</div>
            <div className="text-2xl font-bold text-yellow-700">{stats.pending}</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg shadow">
            <div className="text-red-700 text-sm">Rejected</div>
            <div className="text-2xl font-bold text-red-700">{stats.rejected}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">All Categories</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">All Status</option>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
            {success}
          </div>
        )}

        {/* Keywords Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : keywords.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No keywords found. Add some to get started!
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Comparison
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Quality
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Used
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {keywords.map((keyword) => (
                  <tr key={keyword.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">
                        {keyword.termA} <span className="text-gray-400">vs</span> {keyword.termB}
                      </div>
                      {keyword.notes && (
                        <div className="text-xs text-gray-500 mt-1">{keyword.notes}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                        {keyword.category}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className={`font-semibold ${getQualityColor(keyword.qualityScore)}`}>
                        {keyword.qualityScore}/100
                      </div>
                      <div className="text-xs text-gray-500">
                        {getQualityLabel(keyword.qualityScore)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={keyword.status}
                        onChange={(e) => updateStatus(keyword.id, e.target.value)}
                        className="text-xs border border-gray-300 rounded px-2 py-1"
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{keyword.timesUsed}×</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(keyword)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(keyword.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4">
                {editingId ? "Edit Keyword Pair" : "Add Keyword Pair"}
              </h2>

              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Term A *
                    </label>
                    <input
                      type="text"
                      value={formData.termA}
                      onChange={(e) => setFormData({ ...formData, termA: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Term B *
                    </label>
                    <input
                      type="text"
                      value={formData.termB}
                      onChange={(e) => setFormData({ ...formData, termB: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      required
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    rows={3}
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="popular, trending, high-volume"
                  />
                </div>

                {/* Quality Check Button */}
                <div className="mb-4">
                  <button
                    type="button"
                    onClick={checkQuality}
                    disabled={checkingQuality}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
                  >
                    {checkingQuality ? "Checking..." : "Check Quality"}
                  </button>
                </div>

                {/* Quality Results */}
                {qualityResult && (
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">Quality Score</h3>
                      <span className={`text-2xl font-bold ${getQualityColor(qualityResult.overall)}`}>
                        {qualityResult.overall}/100
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div>
                        <div className="text-xs text-gray-600">Validity</div>
                        <div className="font-medium">{qualityResult.breakdown.validity}/25</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-600">Searchability</div>
                        <div className="font-medium">{qualityResult.breakdown.searchability}/25</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-600">Competitiveness</div>
                        <div className="font-medium">{qualityResult.breakdown.competitiveness}/25</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-600">Clarity</div>
                        <div className="font-medium">{qualityResult.breakdown.clarity}/25</div>
                      </div>
                    </div>

                    {qualityResult.issues.length > 0 && (
                      <div className="mb-2">
                        <div className="text-sm font-medium text-red-700 mb-1">Issues:</div>
                        <ul className="list-disc list-inside text-xs text-red-600">
                          {qualityResult.issues.map((issue, i) => (
                            <li key={i}>{issue}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {qualityResult.recommendations.length > 0 && (
                      <div>
                        <div className="text-sm font-medium text-blue-700 mb-1">Recommendations:</div>
                        <ul className="list-disc list-inside text-xs text-blue-600">
                          {qualityResult.recommendations.map((rec, i) => (
                            <li key={i}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Form Actions */}
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    {editingId ? "Update" : "Add"} Keyword
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setFormData({ termA: "", termB: "", category: "tech", notes: "", tags: "" });
                      setQualityResult(null);
                      setEditingId(null);
                    }}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
