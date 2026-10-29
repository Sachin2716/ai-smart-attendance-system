'use client';

import React, { useState } from 'react';
import { useAttendance } from '@/context/AttendanceContext';
import { useAuth } from '@/context/AuthContext';
import { Calendar, UserCheck, ShieldCheck, Send, Check } from 'lucide-react';
import { motion } from 'framer-motion';

export const FacultyLeaveModal: React.FC = () => {
  const { facultyLeaves, applyFacultyLeave } = useAttendance();
  const { user } = useAuth();

  const [startDate, setStartDate] = useState('2026-08-15');
  const [endDate, setEndDate] = useState('2026-08-16');
  const [reason, setReason] = useState('National Research Conference Presentation');
  const [substituteName, setSubstituteName] = useState('Prof. Marie Curie');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    applyFacultyLeave({
      facultyId: user?.id || 'FAC-101',
      facultyName: user?.name || 'Dr. Alan Turing',
      startDate,
      endDate,
      reason,
      substituteFacultyId: 'FAC-100',
      substituteFacultyName: substituteName,
      status: 'APPROVED',
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="p-6 rounded-3xl glass-panel bg-gradient-to-r from-purple-950/60 via-slate-900 to-indigo-950/60 border border-purple-500/30">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-3 rounded-2xl bg-purple-500/20 text-purple-400">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white">
              Faculty Leave & Class Reassignment Portal
            </h2>
            <p className="text-xs text-slate-400">
              Apply for leave and reassign affected timetable sessions to peer substitute faculty
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Form */}
        <div className="p-6 rounded-3xl glass-panel">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Send className="w-4 h-4 text-indigo-400" />
            Apply for Faculty Leave
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Start Date</label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl glass-input text-slate-200"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">End Date</label>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl glass-input text-slate-200"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Reason for Leave</label>
              <textarea
                rows={2}
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl glass-input text-slate-200 resize-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Assign Substitute Faculty
              </label>
              <select
                value={substituteName}
                onChange={(e) => setSubstituteName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl glass-input text-slate-200 bg-slate-900"
              >
                <option value="Prof. Marie Curie">Prof. Marie Curie (Head of Dept)</option>
                <option value="Dr. Richard Feynman">Dr. Richard Feynman (ECE Dept)</option>
                <option value="Prof. Ada Lovelace">Prof. Ada Lovelace (AI-DS Dept)</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Submit Leave & Reassign Classes</span>
            </button>
          </form>
        </div>

        {/* Leave Logs (2 cols) */}
        <div className="lg:col-span-2 p-6 rounded-3xl glass-panel">
          <h3 className="text-sm font-bold text-white mb-4">
            Submitted Leaves & Substitute Reassignments
          </h3>

          <div className="space-y-3">
            {facultyLeaves.length > 0 ? (
              facultyLeaves.map((l) => (
                <div key={l.id} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-white">{l.facultyName}</span>
                    <p className="text-indigo-400 font-semibold text-[11px] mt-0.5">
                      Substitute: {l.substituteFacultyName}
                    </p>
                    <p className="text-slate-400 text-[10px]">
                      Dates: {l.startDate} to {l.endDate} • Reason: {l.reason}
                    </p>
                  </div>

                  <span className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold text-[10px]">
                    APPROVED & REASSIGNED
                  </span>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-slate-500 text-xs">
                No active faculty leave applications recorded.
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
