'use client';

import React, { useState } from 'react';
import { useAttendance } from '@/context/AttendanceContext';
import { useAuth } from '@/context/AuthContext';
import { CheckCircle2, XCircle, Clock, ShieldCheck, Calendar, Sparkles, User, AlertCircle, FileText, Check, X } from 'lucide-react';
import { EventApprovalNotification } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

export const ClassTeacherEventApprovals: React.FC = () => {
  const { eventApprovalNotifications, approveEventAttendance, rejectEventAttendance } = useAttendance();
  const { user } = useAuth();

  const [rejectionModalId, setRejectionModalId] = useState<string | null>(null);
  const [rejectionRemark, setRejectionRemark] = useState('');

  // Filter notifications for this Class Teacher
  const myPendingNotifications = eventApprovalNotifications.filter(
    n => (n.classTeacherEmail || '').toLowerCase() === (user?.email || '').toLowerCase() ||
         n.status === 'PENDING'
  );

  const handleApprove = (id: string) => {
    approveEventAttendance(id);
  };

  const handleRejectSubmit = (id: string) => {
    rejectEventAttendance(id, rejectionRemark || 'Event attendance rejected by class teacher');
    setRejectionModalId(null);
    setRejectionRemark('');
  };

  return (
    <div className="p-6 rounded-3xl glass-panel space-y-4 border border-indigo-500/20 shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              Event Attendance Approvals (Class Teacher)
            </h3>
            <p className="text-[11px] text-slate-400">
              Verify event attendance for your class section students
            </p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
          {myPendingNotifications.filter(n => n.status === 'PENDING').length} Pending
        </span>
      </div>

      {myPendingNotifications.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-slate-900/40 border border-slate-800 space-y-1">
          <p className="text-xs font-bold text-slate-300">NO PENDING EVENT APPROVALS</p>
          <p className="text-xs text-slate-500">All student event attendance requests are up to date.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {myPendingNotifications.map(n => (
            <div
              key={n.id}
              className={`p-4 rounded-2xl border transition-all space-y-3 ${
                n.status === 'APPROVED' ? 'bg-emerald-500/10 border-emerald-500/30' :
                n.status === 'REJECTED' ? 'bg-rose-500/10 border-rose-500/30' :
                'bg-slate-900/80 border-slate-800 hover:border-purple-500/40'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-white text-sm">{n.studentName}</span>
                  <span className="px-2 py-0.5 rounded-md font-mono text-[10px] bg-slate-800 text-indigo-300 font-bold">
                    {n.studentRegisterNo}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] bg-purple-500/20 text-purple-300 font-bold">
                    {n.classSection}
                  </span>
                </div>

                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  n.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                  n.status === 'REJECTED' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                  'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                }`}>
                  {n.status === 'APPROVED' ? '✓ APPROVED (NORMAL ATTENDANCE = PRESENT)' :
                   n.status === 'REJECTED' ? '✕ REJECTED' : '⏳ AWAITING CLASS TEACHER APPROVAL'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-300">
                <div>
                  <p className="text-[10px] text-slate-500">Event</p>
                  <p className="font-bold text-white truncate">{n.eventName}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500">Event Schedule</p>
                  <p className="font-bold text-purple-300">{n.eventDate}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500">Student Scan Time</p>
                  <p className="font-bold text-emerald-300">{n.attendanceTime}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500">Event Faculty</p>
                  <p className="font-bold text-indigo-300 truncate">{n.eventFacultyName}</p>
                </div>
              </div>

              {n.status === 'PENDING' && (
                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800/80">
                  <button
                    onClick={() => setRejectionModalId(n.id)}
                    className="px-4 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 font-bold text-xs flex items-center space-x-1 transition-all"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Reject Attendance</span>
                  </button>

                  <button
                    onClick={() => handleApprove(n.id)}
                    className="px-5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/20 flex items-center space-x-1 transition-all"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve Attendance (Mark Present)</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* REJECTION REASON MODAL */}
      {rejectionModalId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-2xl p-5 space-y-4 text-slate-100 relative">
            <h4 className="text-sm font-bold text-white">Reject Event Attendance</h4>
            <p className="text-xs text-slate-400">
              Please enter the reason for rejecting this event attendance request.
            </p>
            <textarea
              value={rejectionRemark}
              onChange={e => setRejectionRemark(e.target.value)}
              placeholder="e.g., Student was scheduled for mandatory lab examination."
              rows={3}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRejectionModalId(null)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRejectSubmit(rejectionModalId)}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shadow"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
