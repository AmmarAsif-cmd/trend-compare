/**
 * Reports Page
 * Lists generated PDF/CSV exports
 */

import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/user-auth-helpers';
import { getRecentExports } from '@/lib/dashboard-helpers';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import ReportsExports from '@/components/dashboard/ReportsExports';
import Link from 'next/link';
import { FileText, Download } from 'lucide-react';

export default async function ReportsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login?redirect=/dashboard/reports');
  }

  const userId = (user as any).id;
  const recentExports = await getRecentExports(100, userId);

  return (
    <div className="flex h-screen overflow-hidden">
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto lg:ml-64">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-2">
              Reports & Exports
            </h1>
            <p className="text-lg text-slate-600">
              View and download your generated PDF, CSV, and JSON reports
            </p>
            {recentExports.length > 0 && (
              <p className="text-sm text-slate-500 mt-2">
                {recentExports.length} {recentExports.length === 1 ? 'export' : 'exports'} in your history
              </p>
            )}
          </div>

          {/* Reports List */}
          {recentExports.length > 0 ? (
            <ReportsExports exports={recentExports} />
          ) : (
            <section className="bg-white rounded-2xl border border-slate-200 shadow-md p-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No exports yet</h3>
                <p className="text-sm text-slate-600 mb-6">
                  Export PDF or CSV reports from any comparison page
                </p>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                >
                  <Download className="w-4 h-4" />
                  Browse Comparisons
                </Link>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

