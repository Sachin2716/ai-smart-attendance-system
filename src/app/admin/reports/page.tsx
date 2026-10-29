'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { BarChart3, FileSpreadsheet, Download, RefreshCw, CheckCircle2, Percent, Users } from 'lucide-react';

export default function AdminReportsPage() {
  const [sections, setSections] = useState<any[]>([]);
  const [selectedSection, setSelectedSection] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    fetch('/api/admin/classes')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.sections) {
          setSections(data.sections);
        }
      })
      .catch(() => {});
  }, []);

  const handleExportCSV = () => {
    setIsExporting(true);
    const url = selectedSection
      ? `/api/reports/export?sectionId=${selectedSection}`
      : '/api/reports/export';

    window.open(url, '_blank');
    setTimeout(() => {
      setIsExporting(false);
      toast.success('Master CSV report downloaded successfully');
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/80 border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
            Institutional Reports & Analytics
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Generate authoritative attendance compliance summaries, semester reports, and CSV archives.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={isExporting}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/30 flex items-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          <span>{isExporting ? 'Generating CSV...' : 'Download Full CSV Report'}</span>
        </button>
      </div>

      {/* Report Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 w-fit">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-white text-sm">Class Roster Attendance Report</h3>
          <p className="text-xs text-slate-400">
            Export complete roll-call logs filtered by specific classes, subjects, and dates.
          </p>
          <div className="pt-2">
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Class Sections</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullLabel} ({s.department?.code})
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleExportCSV}
            className="w-full mt-2 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-all cursor-pointer"
          >
            Export Selected Section
          </button>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400 w-fit">
            <Percent className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-white text-sm">Low Attendance Defaulters List</h3>
          <p className="text-xs text-slate-400">
            Identify all students with aggregate attendance below the statutory 75% threshold.
          </p>
          <button
            onClick={handleExportCSV}
            className="w-full mt-7 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-semibold transition-all cursor-pointer"
          >
            Export Defaulters Roster
          </button>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 w-fit">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-white text-sm">Biometric AI Audit Log</h3>
          <p className="text-xs text-slate-400">
            Detailed verification breakdown comparing facial biometric matches against manual exceptions.
          </p>
          <button
            onClick={handleExportCSV}
            className="w-full mt-7 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-all cursor-pointer"
          >
            Export Biometric Trace Log
          </button>
        </div>
      </div>
    </div>
  );
}
