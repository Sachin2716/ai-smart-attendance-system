'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Clock, CheckCircle2, CalendarCheck, X, RefreshCw, Users, FileSpreadsheet } from 'lucide-react';

export default function FacultyHistoryPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/faculty/sessions');
      const data = await res.json();
      if (res.ok && data.success) setSessions(data.sessions);
    } catch (e) {
      toast.error('Failed to load session history');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/80 border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-400" />
            Attendance Session Logs & History
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Browse completed roll-call sessions, inspect records, and verify historical data.
          </p>
        </div>

        <button
          onClick={fetchHistory}
          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Sessions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {sessions.map((sess) => {
          const presentCount = sess.records.filter((r: any) =>
            ['PRESENT', 'LATE', 'EXCUSED'].includes(r.status)
          ).length;
          const totalCount = sess.records.length;
          const percent = totalCount > 0 ? ((presentCount / totalCount) * 100).toFixed(0) : 0;

          return (
            <div
              key={sess.id}
              onClick={() => setSelectedSession(sess)}
              className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 transition-all cursor-pointer space-y-3 group"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-emerald-400">{sess.course?.code}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                    sess.status === 'COMPLETED'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                  }`}
                >
                  {sess.status}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                  {sess.course?.name}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Class: <strong className="text-slate-300">{sess.classSection?.fullLabel}</strong>
                </p>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
                <span className="font-mono text-[11px] text-slate-400">
                  {sess.sessionDate} • {sess.startTime}
                </span>
                <span className="font-mono font-bold text-white">
                  {presentCount}/{totalCount} ({percent}%)
                </span>
              </div>
            </div>
          );
        })}
        {sessions.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500">
            No attendance sessions recorded yet.
          </div>
        )}
      </div>

      {/* Details Modal */}
      <AnimatePresence>
        {selectedSession && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-2xl max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-white">
                    {selectedSession.course?.name} ({selectedSession.course?.code})
                  </h3>
                  <p className="text-xs text-slate-400">
                    {selectedSession.classSection?.fullLabel} • {selectedSession.sessionDate} • {selectedSession.startTime}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedSession(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                      <th className="pb-2">Roll No</th>
                      <th className="pb-2">Student Name</th>
                      <th className="pb-2">Status</th>
                      <th className="pb-2">Method</th>
                      <th className="pb-2 text-right">Confidence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {selectedSession.records.map((r: any) => (
                      <tr key={r.id}>
                        <td className="py-2.5 font-mono text-emerald-400 font-semibold">{r.student.rollNumber}</td>
                        <td className="py-2.5 font-medium text-white">{r.student.name}</td>
                        <td className="py-2.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                              r.status === 'PRESENT'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                : r.status === 'LATE'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                : r.status === 'EXCUSED'
                                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                                : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="py-2.5 font-mono text-[11px] text-slate-400">{r.verificationMethod}</td>
                        <td className="py-2.5 text-right font-mono text-slate-400">
                          {r.confidenceScore ? `${(r.confidenceScore * 100).toFixed(0)}%` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => setSelectedSession(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs cursor-pointer hover:bg-slate-700"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
