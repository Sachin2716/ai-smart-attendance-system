'use client';

import React from 'react';
import { useAttendance } from '@/context/AttendanceContext';
import { Student, EventAttendanceRecord } from '@/types';
import { Calendar, Clock, X, CheckCircle2, Award, Sparkles, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface StudentEventHistoryModalProps {
  student: Student | null;
  onClose: () => void;
}

export const StudentEventHistoryModal: React.FC<StudentEventHistoryModalProps> = ({ student, onClose }) => {
  const { eventAttendanceRecords } = useAttendance();

  if (!student) return null;

  const studentEventRecords = eventAttendanceRecords.filter(r => r.studentId === student.id);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-2xl p-6 rounded-3xl glass-panel border border-indigo-500/40 shadow-2xl space-y-5 text-xs"
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
            <img
              src={student.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
              alt={student.name}
              className="w-12 h-12 rounded-2xl object-cover ring-2 ring-indigo-500/40"
            />
            <div>
              <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                {student.name} — Student Event History
                <Sparkles className="w-4 h-4 text-amber-400" />
              </h2>
              <p className="text-xs text-slate-400">
                USN: <strong className="text-indigo-300 font-mono">{student.uucmsNo || student.rollNo}</strong> • Class: <strong className="text-white">{student.course} Sem {student.semester} ({student.section})</strong>
              </p>
            </div>
          </div>

          {/* Records Table */}
          <div className="space-y-3">
            <h3 className="font-extrabold text-white text-xs uppercase tracking-wider text-slate-400">
              Participated Events ({studentEventRecords.length})
            </h3>

            {studentEventRecords.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-2xl">
                No event participation history recorded for {student.name}.
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {studentEventRecords.map((r) => (
                  <div
                    key={r.id}
                    className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-white text-sm">{r.eventName}</h4>
                      <div className="flex items-center space-x-3 text-[11px] text-slate-400">
                        <span>Check-In: <strong className="text-emerald-400 font-mono">{r.checkInTime}</strong></span>
                        {r.checkOutTime && (
                          <span>Check-Out: <strong className="text-indigo-300 font-mono">{r.checkOutTime}</strong> ({r.durationMinutes}m)</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Card + Face Match ✅</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
            >
              Close History
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
