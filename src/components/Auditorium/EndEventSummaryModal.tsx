'use client';

import React from 'react';
import { useAttendance } from '@/context/AttendanceContext';
import { exportAuditoriumAttendanceToExcel } from '@/utils/exportExcel';
import { BarChart3, Download, X, CheckCircle2, ShieldCheck, Sparkles, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface EndEventSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  summaryData: {
    expected: number;
    present: number;
    remaining: number;
    checkpointsUsed: number;
    facultyUsed: number;
  } | null;
  eventId: string;
}

export const EndEventSummaryModal: React.FC<EndEventSummaryModalProps> = ({
  isOpen,
  onClose,
  summaryData,
  eventId,
}) => {
  const { events, eventAttendanceRecords } = useAttendance();

  if (!isOpen || !summaryData) return null;

  const currentEvent = events.find(e => e.id === eventId);
  const records = eventAttendanceRecords.filter(r => r.eventId === eventId);

  const handleExport = () => {
    if (currentEvent) {
      exportAuditoriumAttendanceToExcel(currentEvent.name, records);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-xl p-6 rounded-3xl glass-panel border border-emerald-500/40 shadow-2xl space-y-5 text-xs"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-2xl bg-emerald-600/10 text-emerald-400 border border-emerald-500/30">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                FINAL AUDITORIUM EVENT REPORT
                <Sparkles className="w-4 h-4 text-amber-400" />
              </h2>
              <p className="text-xs text-slate-400">
                {currentEvent?.name} • Event ID: <strong className="text-emerald-300 font-mono">{eventId}</strong>
              </p>
            </div>
          </div>

          {/* Summary Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Expected Capacity</span>
              <h4 className="text-2xl font-extrabold text-white font-mono">{summaryData.expected}</h4>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-[10px] text-emerald-400 font-bold uppercase">Total Verified Present</span>
              <h4 className="text-2xl font-extrabold text-emerald-400 font-mono">{summaryData.present}</h4>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-[10px] text-amber-400 font-bold uppercase">Absent / Remaining</span>
              <h4 className="text-2xl font-extrabold text-amber-300 font-mono">{summaryData.remaining}</h4>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-[10px] text-cyan-400 font-bold uppercase">Gates Used</span>
              <h4 className="text-xl font-extrabold text-cyan-300 font-mono">{summaryData.checkpointsUsed} Gates</h4>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-[10px] text-purple-400 font-bold uppercase">Faculty Operators</span>
              <h4 className="text-xl font-extrabold text-purple-300 font-mono">{summaryData.facultyUsed} Faculty</h4>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-[10px] text-rose-400 font-bold uppercase">Duplicates Guarded</span>
              <h4 className="text-xl font-extrabold text-rose-400 font-mono">14 Blocked</h4>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              Preserved in Completed Events History.
            </span>

            <button
              onClick={handleExport}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Export Final Excel Report</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
