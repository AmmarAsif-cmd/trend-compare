"use client";

import { Download } from "lucide-react";

export default function ReportActions() {
  const handleDownloadPDF = () => {
    document.body.classList.add('generating-pdf');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('generating-pdf');
    }, 1000);
  };

  return (
    <button
      onClick={handleDownloadPDF}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:border-blue-500 hover:bg-blue-50 text-slate-700 hover:text-blue-600 rounded-lg text-sm font-medium transition-all hover:shadow-sm print:hidden"
      aria-label="Download as PDF"
    >
      <Download className="w-3.5 h-3.5" />
      <span>PDF</span>
    </button>
  );
}
