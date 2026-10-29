'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { BarChart3, Download, FileSpreadsheet } from 'lucide-react';

export default function FacultyReportsPage() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = () => {
    setIsExporting(true);
    window.open('/api/reports/export', '_blank');
    setTimeout(() => {
      setIsExporting(false);
      toast.success('Class attendance export downloaded successfully');
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/80 border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            Faculty Class Attendance Analytics & Export
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Download institutional grade CSV spreadsheets for your assigned teaching courses.
          </p>
        </div>

        <button
          onClick={handleExport}
          disabled={isExporting}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/30 flex items-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          <span>{isExporting ? 'Preparing CSV...' : 'Download Attendance CSV'}</span>
        </button>
      </div>

      <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 text-center space-y-4 max-w-xl mx-auto">
        <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 w-fit mx-auto">
          <FileSpreadsheet className="w-8 h-8" />
        </div>
        <div>
          <h3 className="font-bold text-white text-base">Course-Wise Attendance Records</h3>
          <p className="text-xs text-slate-400 mt-1">
            Exports student-by-student roll calls, dates, verification methods (Face AI vs. Manual), and confidence metrics for institutional compliance.
          </p>
        </div>
        <button
          onClick={handleExport}
          className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs cursor-pointer shadow-lg shadow-emerald-600/20"
        >
          Download Master Spreadsheet
        </button>
      </div>
    </div>
  );
}
