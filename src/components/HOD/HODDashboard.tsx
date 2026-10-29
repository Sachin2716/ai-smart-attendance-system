'use client';

import React from 'react';
import { useAttendance } from '@/context/AttendanceContext';
import { ShieldCheck, Users, Clock, AlertTriangle, RefreshCw, XCircle, BarChart2, Award } from 'lucide-react';
import { motion } from 'framer-motion';

export const HODDashboard: React.FC = () => {
  const { students, sessions, timetable, swapRequests, cancellations, facultyLeaves } = useAttendance();

  const totalDeptStudents = students.length;
  const activeFacultyCount = 12;
  const weeklyClassSlotsCount = timetable.length;

  const facultyWorkload = [
    { name: 'Dr. Alan Turing', hours: 14, department: 'Computer Science', role: 'Assoc. Professor' },
    { name: 'Prof. Marie Curie', hours: 18, department: 'Computer Science', role: 'Head of Dept' },
    { name: 'Dr. Richard Feynman', hours: 12, department: 'Electronics & Comm.', role: 'Professor' },
    { name: 'Prof. Ada Lovelace', hours: 16, department: 'AI & Data Science', role: 'Professor' },
  ];

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="p-6 rounded-3xl glass-panel bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 border border-indigo-500/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  HOD GOVERNANCE PORTAL
                </span>
                <span className="text-xs text-slate-400 font-mono">Dept: Computer Science</span>
              </div>
              <h2 className="text-xl font-extrabold text-white mt-1">
                Departmental Oversight & Faculty Workload Analytics
              </h2>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl glass-panel text-left">
          <p className="text-xs font-bold text-slate-400">Total Enrolled Department</p>
          <h3 className="text-2xl font-extrabold text-white my-1">{totalDeptStudents}</h3>
          <span className="text-[10px] text-emerald-400 font-bold">100% Biometric Registered</span>
        </div>

        <div className="p-5 rounded-2xl glass-panel text-left">
          <p className="text-xs font-bold text-slate-400">Active Faculty Members</p>
          <h3 className="text-2xl font-extrabold text-white my-1">{activeFacultyCount}</h3>
          <span className="text-[10px] text-indigo-400 font-bold">Full Teaching Capacity</span>
        </div>

        <div className="p-5 rounded-2xl glass-panel text-left">
          <p className="text-xs font-bold text-slate-400">Weekly Scheduled Hours</p>
          <h3 className="text-2xl font-extrabold text-indigo-400 font-mono my-1">{weeklyClassSlotsCount * 3} hrs</h3>
          <span className="text-[10px] text-purple-400 font-bold">Conflict Checked</span>
        </div>

        <div className="p-5 rounded-2xl glass-panel text-left">
          <p className="text-xs font-bold text-slate-400">Class Swaps & Cancellations</p>
          <h3 className="text-2xl font-extrabold text-rose-400 font-mono my-1">
            {swapRequests.length + cancellations.length}
          </h3>
          <span className="text-[10px] text-rose-400 font-bold">All Approved & Audited</span>
        </div>
      </div>

      {/* Faculty Workload Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Workload Table (2 cols) */}
        <div className="lg:col-span-2 p-6 rounded-3xl glass-panel">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-indigo-400" />
            Faculty Teaching Workload Distribution (Hours / Week)
          </h3>

          <div className="space-y-4">
            {facultyWorkload.map((f, idx) => (
              <div key={f.name} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white">{f.name}</span>
                    <p className="text-[10px] text-slate-400">{f.role} • {f.department}</p>
                  </div>
                  <span className="font-bold font-mono text-purple-400 text-sm">
                    {f.hours} hrs/week
                  </span>
                </div>

                <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(f.hours / 20) * 100}%` }}
                    transition={{ duration: 0.6, delay: idx * 0.1 }}
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Audit Log Panel */}
        <div className="p-6 rounded-3xl glass-panel space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-purple-400" />
            HOD Audit Logs
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] font-bold text-indigo-400 uppercase">Class Swap Approved</span>
              <p className="font-semibold text-slate-200 mt-1">Dr. Alan Turing ↔ Prof. Marie Curie</p>
              <p className="text-[10px] text-slate-400 font-mono">Date: 2026-08-07</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] font-bold text-rose-400 uppercase">Class Cancelled</span>
              <p className="font-semibold text-slate-200 mt-1">CS302 Operating Systems</p>
              <p className="text-[10px] text-slate-400 font-mono">Reason: Departmental Academic Audit</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] font-bold text-emerald-400 uppercase">Faculty Leave Approved</span>
              <p className="font-semibold text-slate-200 mt-1">Dr. Alan Turing (Reassigned)</p>
              <p className="text-[10px] text-slate-400 font-mono">Substitute: Prof. Marie Curie</p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
