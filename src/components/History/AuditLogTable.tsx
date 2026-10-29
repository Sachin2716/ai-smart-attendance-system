'use client';

import React, { useState } from 'react';
import { useAttendance } from '@/context/AttendanceContext';
import { AuditLogEntry } from '@/types';
import { ShieldCheck, Search, Filter, AlertTriangle, CheckCircle2, XCircle, RefreshCw, Cpu } from 'lucide-react';
import { motion } from 'framer-motion';

export const AuditLogTable: React.FC = () => {
  const { auditLogs } = useAttendance();

  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.studentName.toLowerCase().includes(search.toLowerCase()) ||
      log.uucmsNo.toLowerCase().includes(search.toLowerCase()) ||
      log.cardUid.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = selectedStatus === 'ALL' || log.verificationResult === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="p-6 rounded-3xl glass-panel bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 border border-indigo-500/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-2xl bg-indigo-600/10 text-indigo-400 border border-indigo-500/30">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white">
              Attendance Verification Audit Log
            </h2>
            <p className="text-xs text-slate-400">
              Detailed security logs for Card UID + Fingerprint verification & proxy attempts
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <span className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-mono">
            Total Audit Entries: <strong>{auditLogs.length}</strong>
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl glass-panel flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="w-full sm:w-80 relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Student Name, UUCMS, or Card UID..."
            className="w-full pl-9 pr-4 py-2 rounded-xl glass-input text-xs text-slate-200"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-indigo-400" />
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 rounded-xl glass-input text-slate-200 bg-slate-900 font-bold"
          >
            <option value="ALL">All Verification Results</option>
            <option value="SUCCESS">Identity Verified ✓</option>
            <option value="FINGERPRINT_FAILED">Fingerprint Mismatch (Proxy)</option>
            <option value="CARD_UNKNOWN">Unrecognized Card UID</option>
            <option value="ALREADY_RECORDED">Duplicate Scan Blocked</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-3xl glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/60 uppercase font-bold text-[10px] tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-4">UUCMS Register No</th>
                <th className="py-3.5 px-4">Card UID</th>
                <th className="py-3.5 px-4">Fingerprint Slot</th>
                <th className="py-3.5 px-4">Class & Sec</th>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Verification Result</th>
                <th className="py-3.5 px-4 text-right">Device ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-white">
                    {log.studentName}
                  </td>

                  <td className="py-3.5 px-4 font-mono text-slate-300">
                    {log.uucmsNo}
                  </td>

                  <td className="py-3.5 px-4 font-mono text-indigo-400">
                    <span className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 font-bold">
                      {log.cardUid}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 font-mono text-emerald-400">
                    {log.fingerprintSlotId ? `Slot #${log.fingerprintSlotId}` : 'None'}
                  </td>

                  <td className="py-3.5 px-4">
                    {log.course} ({log.section})
                  </td>

                  <td className="py-3.5 px-4 font-mono text-slate-400">
                    {log.time}
                  </td>

                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                      log.verificationResult === 'SUCCESS'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}>
                      {log.verificationResult === 'SUCCESS' ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <XCircle className="w-3 h-3 text-rose-400" />
                      )}
                      <span>{log.resultMessage}</span>
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right font-mono text-[10px] text-slate-400">
                    {log.deviceId}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
