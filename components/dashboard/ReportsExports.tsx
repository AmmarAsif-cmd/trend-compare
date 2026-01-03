/**
 * Reports & Exports Section
 * Recent PDF/CSV exports
 */

'use client';

import { FileText, Download, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import type { ExportItem } from '@/lib/dashboard-helpers';

interface ReportsExportsProps {
  exports: ExportItem[];
}

export default function ReportsExports({ exports }: ReportsExportsProps) {
  const formatTerm = (term: string) => {
    if (!term) return '';
    return term.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return '📄';
      case 'csv':
        return '📊';
      case 'json':
        return '📋';
      default:
        return '📁';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'pdf':
        return 'bg-red-100 text-red-700';
      case 'csv':
        return 'bg-green-100 text-green-700';
      case 'json':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  if (exports.length === 0) {
    return null;
  }

  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
      <div className="bg-gradient-to-r from-purple-50/80 via-pink-50/80 to-rose-50/80 px-6 py-5 border-b border-slate-200/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Reports & Exports</h2>
        </div>
      </div>

      <div className="p-6">
        <div className="space-y-3">
          {exports.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {formatTerm(item.termA)} vs {formatTerm(item.termB)}
                    </p>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getTypeColor(item.type)}`}>
                      {item.type.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>{new Date(item.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}</span>
                    {item.timeframe && item.timeframe !== '12m' && (
                      <span>• {item.timeframe}</span>
                    )}
                    {item.fileSize && (
                      <span>• {formatFileSize(item.fileSize)}</span>
                    )}
                  </div>
                </div>
              </div>
              <Link
                href={`/compare/${item.slug}${item.timeframe !== '12m' ? `?tf=${item.timeframe}` : ''}${item.geo ? `${item.timeframe !== '12m' ? '&' : '?'}geo=${item.geo}` : ''}`}
                className="p-2 hover:bg-indigo-50 rounded transition-colors"
                title="View Comparison"
              >
                <ExternalLink className="w-4 h-4 text-indigo-600" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

