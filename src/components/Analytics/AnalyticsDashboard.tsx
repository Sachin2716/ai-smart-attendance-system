'use client';

import React, { useState } from 'react';
import { useAttendance } from '@/context/AttendanceContext';
import { CourseClass, Semester, Section, Department } from '@/types';
import { BarChart3, TrendingUp, Users, BookOpen, AlertTriangle, Download, Calendar, Filter, Sparkles, ShieldCheck, FileSpreadsheet } from 'lucide-react';
import { motion } from 'framer-motion';

import { RefreshButton } from '@/components/Common/RefreshButton';

export const AnalyticsDashboard: React.FC = () => {
  const { students, sessions, selectedCourse, setSelectedCourse, selectedSemester, setSelectedSemester, selectedSection, setSelectedSection } = useAttendance();

  const [selectedDept, setSelectedDept] = useState<Department>('Computer Science');
  const [selectedFaculty, setSelectedFaculty] = useState('Dr. Alan Turing');
  const [selectedSubject, setSelectedSubject] = useState('DBMS');
  const [dateRange, setDateRange] = useState('This Month');

  // Metrics
  const totalClassesCount = sessions.length || 24;
  const totalStudentsCount = students.length || 60;
  const avgAttendancePct = Math.round(
    students.reduce((acc, s) => acc + (s.attendancePercentage || 0), 0) / (students.length || 1)
  ) || 84;
  const lowAttendanceCount = students.filter(s => (s.attendancePercentage || 0) < 75).length || 5;

  return (
    <div className="space-y-6">
      
      {/* HEADER BANNER */}
      <div className="p-6 rounded-3xl glass-panel flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
            <BarChart3 className="w-4 h-4" />
            <span>Attendance Analytics & Insights Hub</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Attendance Overview
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Minimal visualizations & multi-filtered reports.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <RefreshButton />

          <button
            onClick={() => alert('Exporting full analytics report to CSV...')}
            className="px-4 py-2.5 rounded-2xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center space-x-2 transition-all shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Export Analytics CSV</span>
          </button>
        </div>
      </div>

      {/* FILTERS BAR */}
      <div className="p-4 rounded-2xl glass-panel grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
        {/* Date Filter */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Date Range</label>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="w-full px-3 py-2 rounded-xl glass-input text-slate-200 bg-slate-900 font-bold"
          >
            <option value="Today">Today</option>
            <option value="This Week">This Week</option>
            <option value="This Month">This Month</option>
            <option value="Semester Total">Semester Total</option>
          </select>
        </div>

        {/* Department Filter */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Department</label>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value as Department)}
            className="w-full px-3 py-2 rounded-xl glass-input text-slate-200 bg-slate-900 font-bold"
          >
            <option value="Computer Science">Computer Science</option>
            <option value="Electronics & Comm">Electronics & Comm</option>
            <option value="Mechanical Eng">Mechanical Eng</option>
            <option value="Basic Sciences">Basic Sciences</option>
          </select>
        </div>

        {/* Class Filter */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Class</label>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value as CourseClass)}
            className="w-full px-3 py-2 rounded-xl glass-input text-slate-200 bg-slate-900 font-bold"
          >
            <option value="BCA AIML">BCA AIML</option>
            <option value="B.Tech CSE">B.Tech CSE</option>
            <option value="B.Tech ECE">B.Tech ECE</option>
            <option value="B.Sc Data Science">B.Sc Data Science</option>
          </select>
        </div>

        {/* Section Filter */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Section</label>
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value as Section)}
            className="w-full px-3 py-2 rounded-xl glass-input text-slate-200 bg-slate-900 font-bold"
          >
            {['A', 'B', 'C', 'D'].map(s => (
              <option key={s} value={s}>Section {s}</option>
            ))}
          </select>
        </div>

        {/* Subject Filter */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Subject</label>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full px-3 py-2 rounded-xl glass-input text-slate-200 bg-slate-900 font-bold"
          >
            <option value="DBMS">DBMS</option>
            <option value="Python">Python</option>
            <option value="AI & ML">AI & ML</option>
            <option value="Data Structures">Data Structures</option>
          </select>
        </div>

        {/* Faculty Filter */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Faculty</label>
          <select
            value={selectedFaculty}
            onChange={(e) => setSelectedFaculty(e.target.value)}
            className="w-full px-3 py-2 rounded-xl glass-input text-slate-200 bg-slate-900 font-bold"
          >
            <option value="Dr. Alan Turing">Dr. Alan Turing</option>
            <option value="Prof. Marie Curie">Prof. Marie Curie</option>
            <option value="Dr. Richard Feynman">Dr. Richard Feynman</option>
          </select>
        </div>
      </div>

      {/* OVERVIEW STAT CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Classes */}
        <div className="p-5 rounded-3xl glass-panel border border-indigo-500/30 space-y-1">
          <div className="flex items-center justify-between text-indigo-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Classes</span>
            <BookOpen className="w-5 h-5" />
          </div>
          <h3 className="text-3xl font-extrabold text-white font-mono">{totalClassesCount}</h3>
          <p className="text-[11px] text-slate-400">Recorded sessions</p>
        </div>

        {/* Total Students */}
        <div className="p-5 rounded-3xl glass-panel border border-purple-500/30 space-y-1">
          <div className="flex items-center justify-between text-purple-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Students</span>
            <Users className="w-5 h-5" />
          </div>
          <h3 className="text-3xl font-extrabold text-white font-mono">{totalStudentsCount}</h3>
          <p className="text-[11px] text-slate-400">Enrolled in roster</p>
        </div>

        {/* Average Attendance */}
        <div className="p-5 rounded-3xl glass-panel border border-emerald-500/30 space-y-1">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-xs font-bold uppercase tracking-wider">Average Attendance</span>
            <TrendingUp className="w-5 h-5" />
          </div>
          <h3 className="text-3xl font-extrabold text-white font-mono">{avgAttendancePct}%</h3>
          <p className="text-[11px] text-slate-400">Overall compliance rate</p>
        </div>

        {/* Low Attendance Students */}
        <div className="p-5 rounded-3xl glass-panel border border-rose-500/30 space-y-1">
          <div className="flex items-center justify-between text-rose-400">
            <span className="text-xs font-bold uppercase tracking-wider">Low Attendance</span>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <h3 className="text-3xl font-extrabold text-white font-mono">{lowAttendanceCount}</h3>
          <p className="text-[11px] text-slate-400">Students below 75% threshold</p>
        </div>
      </div>

      {/* MINIMAL VISUALIZATION BARS */}
      <div className="p-6 rounded-3xl glass-panel space-y-4">
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          Subject-wise Attendance Distribution
        </h3>

        <div className="space-y-3 text-xs">
          {[
            { subject: 'Database Management Systems (DBMS)', percent: 88, color: 'from-emerald-500 to-teal-400' },
            { subject: 'Python Programming (CS201)', percent: 92, color: 'from-indigo-500 to-purple-400' },
            { subject: 'Artificial Intelligence & ML (AI302)', percent: 79, color: 'from-purple-500 to-pink-400' },
            { subject: 'Data Structures & Algorithms (CS301)', percent: 71, color: 'from-amber-500 to-rose-400' },
          ].map((item, idx) => (
            <div key={idx} className="space-y-1.5 p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">{item.subject}</span>
                <span className="font-mono font-extrabold text-indigo-300">{item.percent}%</span>
              </div>

              <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${item.percent}%` }}
                  transition={{ duration: 0.6, delay: idx * 0.1 }}
                  className={`h-full rounded-full bg-gradient-to-r ${item.color}`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
