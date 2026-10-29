'use client';

import React, { useState } from 'react';
import { useAttendance } from '@/context/AttendanceContext';
import { AttendanceSession } from '@/types';
import { Search, Calendar, FileText, Download, ChevronDown, ChevronUp, CheckCircle2, XCircle } from 'lucide-react';
import { exportSessionToExcel } from '@/utils/exportExcel';
import { exportSessionToPdf } from '@/utils/exportPdf';
import { RefreshButton } from '@/components/Common/RefreshButton';
import { motion, AnimatePresence } from 'framer-motion';

export const SessionHistoryTable: React.FC = () => {
  const { sessions, students } = useAttendance();
  const [search, setSearch] = useState('');
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

  const filteredSessions = sessions.filter(
    s => s.subjectCode.toLowerCase().includes(search.toLowerCase()) ||
         s.subjectName.toLowerCase().includes(search.toLowerCase()) ||
         s.department.toLowerCase().includes(search.toLowerCase())
  );

  const toggleExpand = (id: string) => {
    setExpandedSessionId(expandedSessionId === id ? null : id);
  };

  return (
    <div className="space-y-6">
      
      {/* Search Header */}
      <div className="p-6 rounded-3xl glass-panel flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-500" />
            Attendance History & Archives
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Historical logs of all verified class attendance sessions
          </p>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <RefreshButton />
          <div className="w-full sm:w-64 relative">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Subject or Dept..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl glass-input text-xs text-slate-200 placeholder:text-slate-500"
            />
          </div>
        </div>
      </div>

      {/* History List */}
      <div className="space-y-4">
        {filteredSessions.length > 0 ? (
          filteredSessions.map((session) => {
            const isExpanded = expandedSessionId === session.id;
            const percent = Math.round((session.presentCount / (session.totalStrength || 1)) * 100);

            return (
              <motion.div
                key={session.id}
                layout
                className="rounded-3xl glass-panel overflow-hidden border border-slate-800/60"
              >
                {/* Main Session Bar */}
                <div
                  onClick={() => toggleExpand(session.id)}
                  className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-800/30 transition-all"
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-3 rounded-2xl bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 font-bold text-xs font-mono">
                      {session.subjectCode}
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {session.subjectName}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {session.department} • Sem {session.semester} ({session.section}) • {session.date}
                      </p>
                    </div>
                  </div>

                  {/* Right Stats & Toggle */}
                  <div className="flex items-center space-x-4 w-full sm:w-auto justify-between sm:justify-end">
                    
                    <div className="text-right font-mono">
                      <span className="text-xs font-bold text-emerald-400">
                        {session.presentCount}/{session.totalStrength} Present
                      </span>
                      <p className="text-[10px] text-slate-500">{percent}% Rate</p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          exportSessionToExcel(session, students);
                        }}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-emerald-600/20 text-slate-400 hover:text-emerald-400 transition-all"
                        title="Export Session Excel"
                      >
                        <Download className="w-4 h-4" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          exportSessionToPdf(session, students);
                        }}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-indigo-600/20 text-slate-400 hover:text-indigo-400 transition-all"
                        title="Export Session PDF"
                      >
                        <FileText className="w-4 h-4" />
                      </button>

                      <div className="p-1.5 rounded-lg text-slate-400">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </div>

                  </div>
                </div>

                {/* Expanded Session Detail View */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-slate-800 p-5 bg-slate-900/40 space-y-4"
                    >
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Class Roll Call Breakdown ({session.records.length} Taps)
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {session.records.map((rec) => (
                          <div
                            key={rec.id}
                            className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs"
                          >
                            <div>
                              <p className="font-bold text-slate-200">{rec.studentName}</p>
                              <p className="text-[10px] font-mono text-slate-400">Roll: {rec.studentRollNo}</p>
                              <p className="text-[9px] text-emerald-400 font-mono">Time: {rec.timestamp}</p>
                            </div>
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        ) : (
          <div className="p-8 text-center glass-panel text-slate-400 text-xs">
            No past attendance sessions found matching search criteria.
          </div>
        )}
      </div>

    </div>
  );
};
