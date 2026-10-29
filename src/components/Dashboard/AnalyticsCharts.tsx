'use client';

import React from 'react';
import { useAttendance } from '@/context/AttendanceContext';
import { Department } from '@/types';
import { AlertTriangle, Award, CheckCircle, Flame } from 'lucide-react';
import { motion } from 'framer-motion';

export const AnalyticsCharts: React.FC = () => {
  const { students } = useAttendance();

  const departments: Department[] = [
    'Computer Science',
    'AI & Data Science',
    'Electronics & Comm.',
    'Mechanical Eng.',
    'Civil Eng.',
  ];

  const deptStats = departments.map((dept) => {
    const deptStudents = students.filter((s) => s.department === dept);
    const avg = deptStudents.length
      ? Math.round(deptStudents.reduce((acc, s) => acc + s.attendancePercentage, 0) / deptStudents.length)
      : 85;
    return { dept, count: deptStudents.length || 15, avg };
  });

  const atRiskStudents = students.filter((s) => s.attendancePercentage < 75);
  const topStudents = [...students].sort((a, b) => b.attendancePercentage - a.attendancePercentage).slice(0, 4);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Department Wise Attendance Rate Visualizer (2 Cols) */}
      <div className="lg:col-span-2 p-6 rounded-3xl glass-panel">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-indigo-500" />
              Department Attendance Distribution
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Comparative attendance performance metrics across engineering faculties
            </p>
          </div>
          <span className="text-xs font-mono text-indigo-400 font-bold px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
            Semester Avg: 88.4%
          </span>
        </div>

        {/* Custom Bar Graph */}
        <div className="space-y-4">
          {deptStats.map((item, idx) => (
            <div key={item.dept} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-200">{item.dept}</span>
                <span className="font-bold text-indigo-400 font-mono">{item.avg}% Average</span>
              </div>

              <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden relative p-0.5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${item.avg}%` }}
                  transition={{ duration: 0.8, delay: idx * 0.1 }}
                  className={`h-full rounded-full bg-gradient-to-r ${
                    item.avg >= 90
                      ? 'from-emerald-500 to-teal-400'
                      : item.avg >= 80
                      ? 'from-indigo-500 to-purple-500'
                      : 'from-amber-500 to-rose-500'
                  } shadow-sm`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* At-Risk Warning & Top Performers Card */}
      <div className="space-y-6">
        
        {/* At-Risk Alert */}
        <div className="p-5 rounded-3xl glass-panel border-l-4 border-l-amber-500">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Low Attendance Alert (&lt;75%)
              </h4>
              <p className="text-xs text-slate-400">
                {atRiskStudents.length} student(s) require follow-up warning notice
              </p>
            </div>
          </div>

          <div className="space-y-2 mt-3">
            {atRiskStudents.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-800/40 text-xs"
              >
                <div className="flex items-center space-x-2">
                  <img src={s.avatar} alt={s.name} className="w-6 h-6 rounded-full object-cover" />
                  <span className="font-semibold text-slate-200">{s.name} ({s.rollNo})</span>
                </div>
                <span className="font-bold text-rose-400 font-mono">{s.attendancePercentage}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Performers */}
        <div className="p-5 rounded-3xl glass-panel">
          <div className="flex items-center space-x-2 mb-3">
            <Award className="w-5 h-5 text-amber-400" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Star Attendees (95%+ Attendance)
            </h4>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {topStudents.map((s) => (
              <div key={s.id} className="p-2.5 rounded-xl bg-slate-800/30 border border-slate-700/40 text-center">
                <img src={s.avatar} alt={s.name} className="w-8 h-8 rounded-full object-cover mx-auto mb-1 ring-2 ring-indigo-500/40" />
                <p className="text-xs font-bold text-slate-200 truncate">{s.name}</p>
                <span className="text-[10px] text-emerald-400 font-bold font-mono">{s.attendancePercentage}% Attendance</span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
