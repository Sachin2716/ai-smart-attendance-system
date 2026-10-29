'use client';

import React, { useEffect } from 'react';
import { useAttendance } from '@/context/AttendanceContext';
import { AttendanceSession } from '@/types';
import { CheckCircle2, Download, FileText, X, Award, Sparkles } from 'lucide-react';
import { exportSessionToExcel } from '@/utils/exportExcel';
import { exportSessionToPdf } from '@/utils/exportPdf';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';

export const SessionSummaryModal: React.FC = () => {
  const { summarySession, setSummarySession, students, setActiveTab } = useAttendance();

  useEffect(() => {
    if (summarySession) {
      // Fire celebration confetti if attendance rate > 75%
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#6366f1', '#10b981', '#a855f7', '#f59e0b'],
        });
      } catch (e) {
        console.log('Confetti error:', e);
      }
    }
  }, [summarySession]);

  if (!summarySession) return null;

  const attendancePercent = Math.round((summarySession.presentCount / (summarySession.totalStrength || 1)) * 100);

  const handleExportExcel = () => {
    exportSessionToExcel(summarySession, students);
  };

  const handleExportPdf = () => {
    exportSessionToPdf(summarySession, students);
  };

  const handleClose = () => {
    setSummarySession(null);
    setActiveTab('history');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-lg p-6 rounded-3xl glass-panel border border-slate-700/60 shadow-2xl overflow-hidden text-center"
        >
          {/* Top Decorative Glow */}
          <div className="absolute -top-12 -left-12 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />

          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Celebration Header */}
          <div className="inline-flex p-4 rounded-3xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30 mb-3">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <h2 className="text-xl font-extrabold text-white flex items-center justify-center gap-2">
            Class Attendance Completed!
            <Sparkles className="w-4 h-4 text-amber-400" />
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Session record finalized & saved to permanent history log
          </p>

          {/* Session Summary Card */}
          <div className="my-6 p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-left space-y-3 text-xs">
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Subject</span>
              <span className="font-bold text-white">{summarySession.subjectCode} - {summarySession.subjectName}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-400">Department & Class</span>
              <span className="font-semibold text-indigo-300">{summarySession.department} (Sem {summarySession.semester} - Sec {summarySession.section})</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-400">Faculty In-Charge</span>
              <span className="text-slate-200">{summarySession.facultyName}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-400">Session Time</span>
              <span className="font-mono text-slate-300">{summarySession.startTime} - {summarySession.endTime}</span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50">
              <p className="text-[10px] text-slate-400 font-bold uppercase">Total Class</p>
              <p className="text-lg font-mono font-extrabold text-white mt-0.5">{summarySession.totalStrength}</p>
            </div>

            <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30">
              <p className="text-[10px] text-emerald-400 font-bold uppercase">Present</p>
              <p className="text-lg font-mono font-extrabold text-emerald-300 mt-0.5">{summarySession.presentCount}</p>
            </div>

            <div className="p-3 rounded-xl bg-indigo-950/20 border border-indigo-500/30">
              <p className="text-[10px] text-indigo-400 font-bold uppercase">Rate</p>
              <p className="text-lg font-mono font-extrabold text-indigo-300 mt-0.5">{attendancePercent}%</p>
            </div>
          </div>

          {/* Export Action Buttons */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              onClick={handleExportExcel}
              className="py-2.5 px-4 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center justify-center space-x-2 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Export Excel</span>
            </button>

            <button
              onClick={handleExportPdf}
              className="py-2.5 px-4 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 font-bold text-xs flex items-center justify-center space-x-2 transition-all"
            >
              <FileText className="w-4 h-4" />
              <span>Export PDF Report</span>
            </button>
          </div>

          <button
            onClick={handleClose}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-all"
          >
            Done & Close Summary
          </button>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
