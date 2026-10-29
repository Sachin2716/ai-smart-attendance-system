'use client';

import React, { useState } from 'react';
import { useAttendance } from '@/context/AttendanceContext';
import { useAuth } from '@/context/AuthContext';
import { RefreshCw, CheckCircle2, XCircle, Clock, Send, ShieldCheck, UserCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export const ClassSwapModal: React.FC = () => {
  const { swapRequests, requestClassSwap, approveClassSwap, timetable } = useAttendance();
  const { user } = useAuth();

  const [selectedSlotId, setSelectedSlotId] = useState(timetable[0]?.id || '');
  const [requestedDate, setRequestedDate] = useState('2026-08-07');
  const [reason, setReason] = useState('University Academic Committee Duty');
  const [targetFacultyName, setTargetFacultyName] = useState('Prof. Marie Curie');

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlotId) return;

    requestClassSwap({
      requesterFacultyId: user?.id || 'FAC-101',
      requesterFacultyName: user?.name || 'Dr. Alan Turing',
      targetFacultyId: 'FAC-100',
      targetFacultyName,
      slotId: selectedSlotId,
      requestedDate,
      reason,
      status: 'PENDING',
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="p-6 rounded-3xl glass-panel bg-gradient-to-r from-purple-950/60 via-slate-900 to-indigo-950/60 border border-purple-500/30">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-3 rounded-2xl bg-purple-500/20 text-purple-400">
            <RefreshCw className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white">
              Faculty Class Swap & Reassignment System
            </h2>
            <p className="text-xs text-slate-400">
              Two-factor approval workflow for peer class swaps & timetable adjustments
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Request Swap Form */}
        <div className="p-6 rounded-3xl glass-panel">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Send className="w-4 h-4 text-indigo-400" />
            Request New Class Swap
          </h3>

          <form onSubmit={handleRequestSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Select Timetable Class Slot</label>
              <select
                value={selectedSlotId}
                onChange={(e) => setSelectedSlotId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl glass-input text-slate-200 bg-slate-900"
              >
                {timetable.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.subjectCode} ({s.day} {s.startTime} - {s.classroom})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Peer Faculty Member</label>
              <select
                value={targetFacultyName}
                onChange={(e) => setTargetFacultyName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl glass-input text-slate-200 bg-slate-900"
              >
                <option value="Prof. Marie Curie">Prof. Marie Curie (Head of Dept)</option>
                <option value="Dr. Richard Feynman">Dr. Richard Feynman (ECE Dept)</option>
                <option value="Prof. Ada Lovelace">Prof. Ada Lovelace (AI-DS Dept)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Swap Date</label>
              <input
                type="date"
                required
                value={requestedDate}
                onChange={(e) => setRequestedDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl glass-input text-slate-200"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Reason for Swap</label>
              <textarea
                rows={2}
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl glass-input text-slate-200 resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all"
            >
              <Send className="w-4 h-4" />
              <span>Submit Swap Request</span>
            </button>
          </form>
        </div>

        {/* Swap Approvals Queue (2 cols) */}
        <div className="lg:col-span-2 p-6 rounded-3xl glass-panel">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Pending Swap Approvals & Audit Log
            </span>
            <span className="text-xs font-mono text-indigo-400 font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">
              {swapRequests.length} Active Requests
            </span>
          </h3>

          <div className="space-y-3">
            {swapRequests.length > 0 ? (
              swapRequests.map((req) => (
                <div key={req.id} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white">{req.requesterFacultyName}</span>
                      <span className="text-slate-500">↔</span>
                      <span className="font-bold text-indigo-300">{req.targetFacultyName}</span>
                    </div>
                    <p className="text-slate-400 mt-1 font-mono">Date: {req.requestedDate} • Reason: {req.reason}</p>
                  </div>

                  <div className="flex items-center space-x-2">
                    {req.status === 'PENDING' ? (
                      <button
                        onClick={() => approveClassSwap(req.id)}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-1 transition-all"
                      >
                        <UserCheck className="w-4 h-4" />
                        <span>Approve Swap</span>
                      </button>
                    ) : (
                      <span className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold text-[10px]">
                        APPROVED & SYNCED
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-slate-500 text-xs">
                No active class swap requests pending.
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
