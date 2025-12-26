'use client';

import { useState } from 'react';
import { Download, Image, FileText, Check } from 'lucide-react';

interface ExportButtonProps {
  comparisonSlug: string;
  termA: string;
  termB: string;
}

export function ExportButton({ comparisonSlug, termA, termB }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [exported, setExported] = useState(false);

  const exportAsImage = async () => {
    setIsExporting(true);
    setShowMenu(false);

    try {
      // Use html2canvas to capture the comparison chart
      const html2canvas = (await import('html2canvas')).default;

      // Find the chart container
      const chartElement = document.querySelector('[data-chart-container]') as HTMLElement;

      if (!chartElement) {
        alert('Chart not found. Please make sure the comparison is fully loaded.');
        return;
      }

      const canvas = await html2canvas(chartElement, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
      });

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${termA}-vs-${termB}-${new Date().toISOString().split('T')[0]}.png`;
          link.click();
          URL.revokeObjectURL(url);

          setExported(true);
          setTimeout(() => setExported(false), 3000);
        }
      });
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export image. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const exportAsCSV = async () => {
    setIsExporting(true);
    setShowMenu(false);

    try {
      // Fetch comparison data from API
      const response = await fetch(`/api/comparisons/export?slug=${comparisonSlug}`);

      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }

      const data = await response.json();

      // Convert to CSV format
      const csv = convertToCSV(data);

      // Download CSV file
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${termA}-vs-${termB}-data-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      setExported(true);
      setTimeout(() => setExported(false), 3000);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const convertToCSV = (data: any): string => {
    const { series } = data;

    if (!series || series.length === 0) {
      return '';
    }

    // Create CSV header
    const headers = ['Date', termA, termB];

    // Create CSV rows
    const rows = series.map((item: any) => {
      const date = item.date;
      const valueA = item[termA] || 0;
      const valueB = item[termB] || 0;
      return [date, valueA, valueB].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-all font-medium shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={isExporting}
      >
        {exported ? (
          <>
            <Check className="w-4 h-4 text-green-600" />
            <span className="text-green-600">Exported!</span>
          </>
        ) : isExporting ? (
          <>
            <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
            <span>Exporting...</span>
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            <span>Export</span>
          </>
        )}
      </button>

      {showMenu && !isExporting && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-slate-200 z-50 overflow-hidden">
          <button
            onClick={exportAsImage}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-indigo-50 transition-colors text-left"
          >
            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Image className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <p className="font-medium text-slate-900">Export as Image</p>
              <p className="text-xs text-slate-500">Download PNG file</p>
            </div>
          </button>

          <button
            onClick={exportAsCSV}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-emerald-50 transition-colors text-left border-t border-slate-100"
          >
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="font-medium text-slate-900">Export as CSV</p>
              <p className="text-xs text-slate-500">Download data file</p>
            </div>
          </button>
        </div>
      )}

      {/* Backdrop to close menu */}
      {showMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  );
}
