'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  CheckCircle2,
  CalendarCheck,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  FileCheck2,
  Clock,
  X,
} from 'lucide-react';

export default function StudentAttendancePage() {
  const router = useRouter();
  const [records, setRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Correction Request Modal
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/student/attendance');
      const data = await res.json();
      if (res.ok && data.success) {
        setRecords(data.records);
      }
    } catch (e) {
      toast.error('Failed to load attendance history');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const openCorrectionModal = (record: any) => {
    setSelectedRecord(record);
    setReason('');
  };

  const handleSubmitCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/student/correction-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: selectedRecord.sessionId,
          reason,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Attendance correction request submitted to faculty');
        setSelectedRecord(null);
      } else {
        toast.error(data.error || 'Failed to submit correction request');
      }
    } catch (e) {
      toast.error('Network error submitting request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-[#18181B] border border-[#27272A] shadow-xl shadow-black/40 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#22D3EE] to-transparent opacity-80" />

        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950/70 text-[#22D3EE] border border-cyan-500/30 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              ATTENDANCE HISTORY
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#F9FAFB] flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-[#22D3EE]" />
            Personal Attendance Audit Log
          </h1>
          <p className="text-xs text-[#9CA3AF] mt-1">
            Official immutable record of lecture attendances, biometric matches, and verified sessions.
          </p>
        </div>

        <button
          onClick={fetchRecords}
          className="p-2.5 rounded-xl bg-[#111318] hover:bg-[#27272A] text-[#9CA3AF] hover:text-[#F9FAFB] border border-[#27272A] transition-all cursor-pointer self-start sm:self-auto"
          title="Refresh Log"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Table */}
      <div className="p-6 rounded-2xl bg-[#18181B] border border-[#27272A] overflow-hidden shadow-xl shadow-black/40">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#27272A] text-[#9CA3AF] font-mono text-[11px]">
                <th className="pb-3">Date</th>
                <th className="pb-3">Course Code & Title</th>
                <th className="pb-3">Time & Faculty</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Verification Method</th>
                <th className="pb-3 text-right">Dispute / Correction</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272A] text-slate-300">
              {records.map((r) => (
                <tr key={r.id} className="hover:bg-[#111318]/50 transition-colors">
                  <td className="py-3 font-mono font-bold text-white">{r.session.sessionDate}</td>
                  <td className="py-3">
                    <p className="font-semibold text-white">{r.session.course.name}</p>
                    <span className="font-mono text-[11px] text-cyan-400">{r.session.course.code}</span>
                  </td>
                  <td className="py-3 text-[#9CA3AF]">
                    <p className="font-mono text-[11px] text-slate-200">{r.session.startTime}</p>
                    <p className="text-[11px] text-[#9CA3AF]">{r.session.faculty.name}</p>
                  </td>
                  <td className="py-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                        r.status === 'PRESENT'
                          ? 'bg-emerald-950/60 text-[#22C55E] border-emerald-500/30'
                          : r.status === 'LATE'
                          ? 'bg-amber-950/60 text-[#F59E0B] border-amber-500/30'
                          : r.status === 'EXCUSED'
                          ? 'bg-blue-950/60 text-[#3B82F6] border-blue-500/30'
                          : 'bg-rose-950/60 text-[#EF4444] border-rose-500/30'
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="py-3 font-mono text-[11px] text-[#9CA3AF]">
                    <span className="text-white">{r.verificationMethod}</span>
                    {r.confidenceScore && (
                      <span className="text-cyan-400 text-[10px] block">
                        {(r.confidenceScore * 100).toFixed(0)}% match
                      </span>
                    )}
                  </td>
                  <td className="py-3 text-right">
                    {r.status === 'ABSENT' ? (
                      <button
                        onClick={() => openCorrectionModal(r)}
                        className="px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-cyan-300 border border-blue-500/30 text-[11px] font-semibold transition-all cursor-pointer"
                      >
                        File Dispute
                      </button>
                    ) : (
                      <span className="text-[11px] text-[#9CA3AF] italic">Confirmed</span>
                    )}
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#9CA3AF]">
                    No attendance records logged yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dispute Modal */}
      <AnimatePresence>
        {selectedRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-2xl bg-[#18181B] border border-[#27272A] p-6 space-y-4 shadow-2xl text-white"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#27272A]">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-[#22D3EE]" />
                  Submit Attendance Dispute / Rectification
                </h3>
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="p-1 rounded-lg text-[#9CA3AF] hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 rounded-xl bg-[#111318] border border-[#27272A] text-xs space-y-1">
                <p className="font-semibold text-white">{selectedRecord.session.course.name}</p>
                <p className="text-[11px] text-[#9CA3AF] font-mono">
                  {selectedRecord.session.sessionDate} • {selectedRecord.session.startTime}
                </p>
              </div>

              <form onSubmit={handleSubmitCorrection} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-[#F9FAFB] mb-1.5">
                    Reason / Official Justification <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Provide details (e.g. Medical emergency certificate, camera mismatch, official college event duty)..."
                    className="w-full p-3 rounded-xl bg-[#111318] border border-[#27272A] text-white placeholder:text-[#9CA3AF]/60 focus:outline-none focus:border-[#3B82F6]"
                  />
                </div>

                <div className="pt-2 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setSelectedRecord(null)}
                    className="px-4 py-2 rounded-xl bg-[#111318] hover:bg-[#27272A] border border-[#27272A] text-[#9CA3AF] text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl bg-[#3B82F6] hover:bg-blue-600 text-white text-xs font-semibold shadow-md shadow-blue-500/20 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Submitting...' : 'Send to Faculty'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
