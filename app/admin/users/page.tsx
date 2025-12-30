'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ADMIN_ROUTES } from '@/lib/admin-config';
import AdminSidebar from '@/components/admin/AdminSidebar';
import {
  Users,
  Search,
  Mail,
  TrendingUp,
  TrendingDown,
  UserPlus,
  Shield,
  Activity,
  Star,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Download,
  Filter,
  Eye,
  MoreVertical,
  Calendar,
  Clock,
} from 'lucide-react';

type User = {
  id: string;
  email: string;
  name: string | null;
  emailVerified: Date | null;
  createdAt: Date;
  updatedAt: Date;
  lastSignInMethod: string | null;
  image: string | null;
  stats: {
    comparisonsViewed: number;
    savedComparisons: number;
    trendAlerts: number;
  };
};

type UserStats = {
  total: number;
  active: number;
  activeUsers: number;
  newUsers: {
    today: number;
    yesterday: number;
    last7Days: number;
    last30Days: number;
    thisMonth: number;
  };
  growth: {
    rate7Days: number;
    rate30Days: number;
  };
  authentication: {
    google: number;
    email: number;
  };
  engagement: {
    usersWithSavedComparisons: number;
    usersWithTrendAlerts: number;
    activeUsersPercentage: number;
  };
  topUsers: Array<{
    id: string;
    email: string;
    name: string | null;
    comparisonsViewed: number;
    savedComparisons: number;
    trendAlerts: number;
  }>;
};

export default function AdminUsersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'verified' | 'unverified'>('all');
  const [authFilter, setAuthFilter] = useState<'all' | 'google' | 'email'>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!loading) {
      fetchUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, sortBy, sortOrder, loading]);

  const checkAuth = async () => {
    try {
      setError(null);
      const res = await fetch(ADMIN_ROUTES.api.checkAuth);
      const data = await res.json();

      if (!data.authenticated) {
        router.push(ADMIN_ROUTES.login);
        return;
      }

      await Promise.all([fetchUsers(), fetchStats()]);
    } catch (err) {
      console.error('Auth check failed:', err);
      setError('Failed to authenticate. Please try again.');
      setLoading(false);
      router.push(ADMIN_ROUTES.login);
    }
  };

  const fetchUsers = async () => {
    try {
      setError(null);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        sortBy,
        sortOrder,
      });
      if (search) params.append('search', search);

      const res = await fetch(`/api/admin/users?${params}`);
      if (!res.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await res.json();

      if (data.success) {
        setUsers(data.users);
        setTotalPages(data.pagination.totalPages);
      } else {
        setError(data.error || 'Failed to load users');
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setError('Failed to load users. Please try again.');
    }
  };

  const fetchStats = async () => {
    try {
      setError(null);
      const res = await fetch('/api/admin/users/stats');
      if (!res.ok) {
        throw new Error('Failed to fetch user statistics');
      }
      const data = await res.json();

      if (data.success) {
        setStats(data.stats);
      } else {
        setError(data.error || 'Failed to load user statistics');
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      setError('Failed to load user statistics. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (!confirm('Are you sure you want to logout?')) return;

    try {
      await fetch(ADMIN_ROUTES.api.logout, { method: 'POST' });
      router.push(ADMIN_ROUTES.login);
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const handleExportCSV = () => {
    if (!users.length) return;

    const headers = ['Email', 'Name', 'Status', 'Auth Method', 'Comparisons Viewed', 'Saved', 'Alerts', 'Joined'];
    const rows = users.map(user => [
      user.email,
      user.name || 'N/A',
      user.emailVerified ? 'Verified' : 'Unverified',
      user.lastSignInMethod === 'google' ? 'Google' : 'Email',
      user.stats.comparisonsViewed.toString(),
      user.stats.savedComparisons.toString(),
      user.stats.trendAlerts.toString(),
      formatDate(user.createdAt),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `users-export-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredUsers = users.filter(user => {
    if (statusFilter === 'verified' && !user.emailVerified) return false;
    if (statusFilter === 'unverified' && user.emailVerified) return false;
    if (authFilter === 'google' && user.lastSignInMethod !== 'google') return false;
    if (authFilter === 'email' && user.lastSignInMethod === 'google') return false;
    return true;
  });

  const formatDate = (date: Date | string | null) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (date: Date | string | null) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <AdminSidebar onLogout={handleLogout} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header - with margin for mobile menu button */}
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 lg:ml-0 mt-14 lg:mt-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">User Management</h1>
              <p className="text-sm text-gray-600 mt-1">Manage and analyze users</p>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <div className="flex items-center justify-between">
                <span>{error}</span>
                <button
                  onClick={() => {
                    setError(null);
                    fetchUsers();
                    fetchStats();
                  }}
                  className="text-red-700 hover:text-red-900 underline text-sm"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-3xl font-bold text-indigo-600 mt-2">
                    {stats.total.toLocaleString()}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    {stats.growth.rate7Days >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-600" />
                    )}
                    <span
                      className={`text-sm ${
                        stats.growth.rate7Days >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {stats.growth.rate7Days >= 0 ? '+' : ''}
                      {stats.growth.rate7Days.toFixed(1)}% (7d)
                    </span>
                  </div>
                </div>
                <div className="h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-purple-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">New Users (30d)</p>
                  <p className="text-3xl font-bold text-purple-600 mt-2">
                    {stats.newUsers.last30Days.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    {stats.newUsers.today} today
                  </p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <UserPlus className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-blue-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Users</p>
                  <p className="text-3xl font-bold text-blue-600 mt-2">
                    {stats.activeUsers.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    {stats.engagement.activeUsersPercentage.toFixed(1)}% of total
                  </p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Activity className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-green-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Engagement</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">
                    {stats.engagement.usersWithSavedComparisons}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    {stats.engagement.usersWithTrendAlerts} with alerts
                  </p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Star className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by email or name..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [newSortBy, newSortOrder] = e.target.value.split('-');
                    setSortBy(newSortBy);
                    setSortOrder(newSortOrder as 'asc' | 'desc');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="createdAt-desc">Newest First</option>
                  <option value="createdAt-asc">Oldest First</option>
                  <option value="email-asc">Email A-Z</option>
                  <option value="email-desc">Email Z-A</option>
                </select>
                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  title="Export to CSV"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Export</span>
                </button>
              </div>
            </div>
            
            {/* Additional Filters */}
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filters:</span>
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as 'all' | 'verified' | 'unverified');
                  setPage(1);
                }}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Status</option>
                <option value="verified">Verified Only</option>
                <option value="unverified">Unverified Only</option>
              </select>

              <select
                value={authFilter}
                onChange={(e) => {
                  setAuthFilter(e.target.value as 'all' | 'google' | 'email');
                  setPage(1);
                }}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Auth Methods</option>
                <option value="google">Google OAuth</option>
                <option value="email">Email/Password</option>
              </select>

              <div className="text-sm text-gray-600 ml-auto">
                Showing {filteredUsers.length} of {users.length} users
              </div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Activity
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Auth
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      No users found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                          {user.image ? (
                            <img
                              src={user.image}
                              alt={user.name || user.email}
                              className="h-10 w-10 rounded-full"
                            />
                          ) : (
                            <span className="text-indigo-600 font-semibold">
                              {(user.name || user.email).charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.name || 'No name'}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4" />
                          <span>{user.stats.comparisonsViewed} viewed</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4" />
                          <span>{user.stats.savedComparisons} saved</span>
                        </div>
                        {user.stats.trendAlerts > 0 && (
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            <span>{user.stats.trendAlerts} alerts</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.lastSignInMethod === 'google' ? (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          <Shield className="w-3 h-3 mr-1" />
                          Google
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          <Mail className="w-3 h-3 mr-1" />
                          Email
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {user.emailVerified ? (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                            <XCircle className="w-3 h-3 mr-1" />
                            Unverified
                          </span>
                        )}
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Page {page} of {totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Details Modal */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">User Details</h2>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                {/* User Info */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-3">User Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                      <p className="text-sm text-gray-900">{selectedUser.email}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
                      <p className="text-sm text-gray-900">{selectedUser.name || 'Not set'}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Joined</label>
                      <p className="text-sm text-gray-900">{formatDateTime(selectedUser.createdAt)}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Last Updated</label>
                      <p className="text-sm text-gray-900">{formatDateTime(selectedUser.updatedAt)}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Email Verified</label>
                      <p className="text-sm text-gray-900">
                        {selectedUser.emailVerified ? formatDateTime(selectedUser.emailVerified) : 'Not verified'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Auth Method</label>
                      <p className="text-sm text-gray-900">
                        {selectedUser.lastSignInMethod === 'google' ? 'Google OAuth' : 'Email/Password'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Activity Stats */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Activity Statistics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Activity className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-medium text-blue-600">Comparisons Viewed</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-900">{selectedUser.stats.comparisonsViewed}</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Star className="w-4 h-4 text-purple-600" />
                        <span className="text-xs font-medium text-purple-600">Saved Comparisons</span>
                      </div>
                      <p className="text-2xl font-bold text-purple-900">{selectedUser.stats.savedComparisons}</p>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertCircle className="w-4 h-4 text-orange-600" />
                        <span className="text-xs font-medium text-orange-600">Trend Alerts</span>
                      </div>
                      <p className="text-2xl font-bold text-orange-900">{selectedUser.stats.trendAlerts}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        </main>
      </div>
    </div>
  );
}

