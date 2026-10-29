'use client';

import React, { useState } from 'react';
import { useAttendance } from '@/context/AttendanceContext';
import { Radio, UserPlus, Download, BarChart2, Play, Sparkles } from 'lucide-react';
import { exportStudentsToExcel } from '@/utils/exportExcel';
import { Department, Semester, Section } from '@/types';

export const QuickActions: React.FC<{ onOpenAddStudent: () => void }> = ({ onOpenAddStudent }) => {
  const { startSession, setActiveTab, activeSession, students, subjects } = useAttendance();

  const [subjectCode, setSubjectCode] = useState('CS301');
  const [dept, setDept] = useState<Department>('Computer Science');
  const [sem, setSem] = useState<Semester>(3);
  const [sec, setSec] = useState<Section>('A');

  const handleStartSession = (e: React.FormEvent) => {
    e.preventDefault();
    startSession(subjectCode, dept, sem, sec);
  };

  const handleExportAll = () => {
    exportStudentsToExcel(students);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Session Quick Launcher Card (2 Cols) */}
      <div className="lg:col-span-2 p-6 rounded-3xl glass-panel relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-indigo-600/10 text-indigo-400 border border-indigo-500/20">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Launch Live RFID Attendance Session
                <Sparkles className="w-4 h-4 text-amber-400" />
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Select class configuration and activate real-time card tap reader
              </p>
            </div>
          </div>

          {activeSession && (
            <button
              onClick={() => setActiveTab('session')}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 font-semibold text-xs border border-emerald-500/30 animate-pulse"
            >
              Session Currently Active →
            </button>
          )}
        </div>

        <form onSubmit={handleStartSession} className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1">Subject</label>
            <select
              value={subjectCode}
              onChange={(e) => setSubjectCode(e.target.value)}
              className="w-full px-3 py-2 rounded-xl glass-input text-xs text-slate-200"
            >
              {subjects.map(s => (
                <option key={s.id} value={s.code} className="bg-slate-900 text-slate-200">
                  {s.code} - {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1">Department</label>
            <select
              value={dept}
              onChange={(e) => setDept(e.target.value as Department)}
              className="w-full px-3 py-2 rounded-xl glass-input text-xs text-slate-200"
            >
              <option value="Computer Science" className="bg-slate-900 text-slate-200">Computer Science</option>
              <option value="AI & Data Science" className="bg-slate-900 text-slate-200">AI & Data Science</option>
              <option value="Electronics & Comm." className="bg-slate-900 text-slate-200">Electronics & Comm.</option>
              <option value="Mechanical Eng." className="bg-slate-900 text-slate-200">Mechanical Eng.</option>
              <option value="Civil Eng." className="bg-slate-900 text-slate-200">Civil Eng.</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1">Sem & Section</label>
            <div className="grid grid-cols-2 gap-1.5">
              <select
                value={sem}
                onChange={(e) => setSem(Number(e.target.value) as Semester)}
                className="w-full px-2 py-2 rounded-xl glass-input text-xs text-slate-200"
              >
                {[1,2,3,4,5,6,7,8].map(s => (
                  <option key={s} value={s} className="bg-slate-900 text-slate-200">Sem {s}</option>
                ))}
              </select>
              <select
                value={sec}
                onChange={(e) => setSec(e.target.value as Section)}
                className="w-full px-2 py-2 rounded-xl glass-input text-xs text-slate-200"
              >
                {['A', 'B', 'C', 'D'].map(s => (
                  <option key={s} value={s} className="bg-slate-900 text-slate-200">Sec {s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 flex items-center justify-center space-x-2 transition-all"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Start Session</span>
            </button>
          </div>
        </form>
      </div>

      {/* Quick Action Shortcuts Panel */}
      <div className="p-6 rounded-3xl glass-panel flex flex-col justify-between">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-3">
          Quick Operations
        </h3>

        <div className="space-y-2.5">
          <button
            onClick={onOpenAddStudent}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-800/40 hover:bg-indigo-600/20 border border-slate-700/60 hover:border-indigo-500/40 text-slate-200 text-xs font-semibold transition-all group"
          >
            <div className="flex items-center space-x-3">
              <UserPlus className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
              <span>Enroll New Student</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">+ RFID Badge</span>
          </button>

          <button
            onClick={handleExportAll}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-800/40 hover:bg-emerald-600/20 border border-slate-700/60 hover:border-emerald-500/40 text-slate-200 text-xs font-semibold transition-all group"
          >
            <div className="flex items-center space-x-3">
              <Download className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span>Export Roster to Excel</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono">.XLSX</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-800/40 hover:bg-purple-600/20 border border-slate-700/60 hover:border-purple-500/40 text-slate-200 text-xs font-semibold transition-all group"
          >
            <div className="flex items-center space-x-3">
              <BarChart2 className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
              <span>Analytics & Insights</span>
            </div>
            <span className="text-[10px] text-purple-400 font-mono">Reports</span>
          </button>
        </div>
      </div>

    </div>
  );
};
