'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAttendance } from '@/context/AttendanceContext';
import { useAuth } from '@/context/AuthContext';
import { Radio, Users, CheckCircle2, XCircle, Clock, Sparkles, Pause, Play, Download, Search, Keyboard, AlertCircle, RefreshCw, Eye, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Student, AttendanceRecord } from '@/types';
import { exportManualClassAttendanceToExcel } from '@/utils/exportExcel';

export const LiveSessionPanel: React.FC = () => {
  const { isAdmin } = useAuth();
  const {
    activeSession,
    students,
    sessionDemoState,
    startSession,
    pauseDemoSession,
    resumeDemoSession,
    endSession,
    markNextStudentSpacebarDemo,
    toggleStudentManualStatus,
    editAttendanceRecord,
  } = useAttendance();

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTabFilter, setActiveTabFilter] = useState<'ALL' | 'PRESENT' | 'ABSENT' | 'NOT_MARKED'>('ALL');
  
  // Live Activity Banner State
  const [activityBanner, setActivityBanner] = useState<{
    type: 'READY' | 'MARKED' | 'ALL_MARKED' | 'PAUSED';
    studentName?: string;
    studentId?: string;
    time?: string;
    message?: string;
  }>({ type: 'READY' });

  // Spacebar Handler
  const triggerSpacebarScan = useCallback(() => {
    const res = markNextStudentSpacebarDemo();
    if (res.isAllMarked) {
      setActivityBanner({
        type: 'ALL_MARKED',
        message: '🎉 All students have been marked for this session!',
      });
    } else if (res.success && res.student) {
      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setActivityBanner({
        type: 'MARKED',
        studentName: res.student.name,
        studentId: res.student.uucmsNo || res.student.rollNo,
        time: nowTime,
      });

      // Reset activity banner to READY after 2.5 seconds
      setTimeout(() => {
        setActivityBanner(prev => prev.type === 'MARKED' ? { type: 'READY' } : prev);
      }, 2500);
    }
  }, [markNextStudentSpacebarDemo]);

  // Attach Physical Spacebar Keyboard Listener (Faculty Only)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isAdmin || !activeSession || sessionDemoState !== 'RUNNING') return;

      // Ignore spacebar if user is typing inside an input/textarea/select
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        triggerSpacebarScan();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeSession, sessionDemoState, triggerSpacebarScan]);

  if (!activeSession) {
    return (
      <div className="p-12 rounded-3xl glass-panel text-center max-w-xl mx-auto space-y-5 border border-indigo-500/30">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/20">
          {isAdmin ? <Eye className="w-8 h-8" /> : <Radio className="w-8 h-8 animate-pulse" />}
        </div>
        <div>
          <span className="px-3 py-1 rounded-full text-[10px] font-mono font-extrabold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            {isAdmin ? 'ATTENDANCE MONITORING MODE (ADMIN)' : 'LIVE ATTENDANCE MODULE'}
          </span>
          <h2 className="text-xl font-extrabold text-white mt-2">
            {isAdmin ? 'No Active Attendance Session Currently for Monitoring' : 'No Class Attendance Session Currently Active'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isAdmin
              ? 'Admin monitoring updates automatically in real-time when a Faculty member starts a class session.'
              : 'Launch a live class attendance session below for BCA AIML 3rd Sem Sec B to test Spacebar demo and manual student grid marking.'}
          </p>
        </div>

        {!isAdmin && (
          <button
            onClick={() => {
              startSession('CS301', 'Computer Science', 3, 'B', 'Room 201');
            }}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-extrabold text-xs shadow-xl shadow-indigo-600/30 flex items-center space-x-2 mx-auto transition-all hover:scale-105"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>⚡ Launch Live Attendance Session (BCA AIML 3B)</span>
          </button>
        )}
      </div>
    );
  }

  // Session Records Map (Single Source of Truth)
  const recordMap = new Map<string, AttendanceRecord>();
  if (activeSession.records) {
    activeSession.records.forEach((r) => recordMap.set(r.studentId, r));
  }

  // Load students belonging to this class/section (excluding inactive)
  const classStudents: Student[] = students.filter(
    (s) => s.semester === activeSession.semester && s.section === activeSession.section && s.status !== 'inactive'
  );
  const targetStudents = classStudents.length > 0 ? classStudents : students.slice(0, 60);

  // Statistics (Live Counter)
  const totalCount = targetStudents.length;
  const presentCount = targetStudents.filter(s => {
    const rec = recordMap.get(s.id);
    return rec && (rec.status === 'PRESENT' || rec.status === 'LATE');
  }).length;

  const absentCount = targetStudents.filter(s => {
    const rec = recordMap.get(s.id);
    return rec && rec.status === 'ABSENT';
  }).length;

  const notMarkedCount = Math.max(0, totalCount - presentCount - absentCount);
  const attendancePercentage = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  // Filtered Roster for Grid Display
  const displayedStudents = targetStudents.filter((s) => {
    const rec = recordMap.get(s.id);
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.uucmsNo || s.rollNo || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTabFilter === 'PRESENT') return rec && (rec.status === 'PRESENT' || rec.status === 'LATE');
    if (activeTabFilter === 'ABSENT') return rec && rec.status === 'ABSENT';
    if (activeTabFilter === 'NOT_MARKED') return !rec || rec.status === 'PENDING';

    return true;
  });

  // Manual Card Click Handler (Faculty Only)
  const handleCardClick = (studentId: string) => {
    if (isAdmin) return; // Admin cannot manually mark classroom attendance

    const rec = recordMap.get(studentId);
    if (!rec || rec.status === 'PENDING') {
      toggleStudentManualStatus(studentId); // Mark Present
    } else if (rec.status === 'PRESENT' || rec.status === 'LATE') {
      editAttendanceRecord(rec.id, 'ABSENT', 'Manual Teacher Click', 'Faculty Teacher');
    } else {
      toggleStudentManualStatus(studentId); // Cycle back to Present
    }
  };

  const handleExplicitMark = (studentId: string, newStatus: 'PRESENT' | 'ABSENT' | 'PENDING', e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAdmin) return; // Admin cannot manually mark classroom attendance
    const rec = recordMap.get(studentId);
    if (rec) {
      if (newStatus === 'PENDING') {
        editAttendanceRecord(rec.id, 'ABSENT', 'Reset to Unmarked', 'Faculty');
      } else {
        editAttendanceRecord(rec.id, newStatus as any, 'Explicit Manual Action', 'Faculty');
      }
    } else {
      toggleStudentManualStatus(studentId);
    }
  };

  const handleExportExcel = () => {
    const courseInfo = {
      course: activeSession.course || 'BCA AIML',
      semester: activeSession.semester,
      section: activeSession.section,
      subjectName: activeSession.subjectName,
      facultyName: activeSession.facultyName,
      date: new Date().toISOString().split('T')[0],
      period: '09:00 AM - 10:00 AM',
    };

    const studentRows = targetStudents.map((s, idx) => {
      const rec = recordMap.get(s.id);
      return {
        slNo: idx + 1,
        name: s.name,
        uucmsNo: s.uucmsNo || s.rollNo,
        course: s.course || 'BCA AIML',
        section: s.section,
        status: (rec?.status || 'PENDING') as any,
        timeMarked: rec?.timestamp || '--',
        method: rec?.method || 'MANUAL',
      };
    });

    exportManualClassAttendanceToExcel(courseInfo, studentRows);
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER BANNER */}
      <div className="p-6 rounded-3xl glass-panel bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 border border-indigo-500/40 shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-mono font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center space-x-1.5 animate-pulse">
              <Radio className="w-3.5 h-3.5 text-rose-400" />
              <span>{isAdmin ? '👁️ ATTENDANCE MONITORING MODE (ADMIN)' : '🔴 LIVE ATTENDANCE SESSION'}</span>
            </span>

            {!isAdmin && (
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                <Keyboard className="w-3.5 h-3.5 text-indigo-400" />
                <span>Spacebar Scan Active</span>
              </span>
            )}
          </div>

          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2 pt-1">
            {activeSession.course || 'BCA AIML'} {activeSession.semester} — {activeSession.subjectName} ({activeSession.subjectCode})
          </h1>

          <p className="text-xs text-slate-400">
            Classroom: <strong className="text-purple-300">{activeSession.classroom || 'Room 201'}</strong> • Section: <strong className="text-indigo-300">{activeSession.section}</strong> • Faculty: <strong className="text-slate-200">{activeSession.facultyName}</strong>
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {isAdmin ? (
            <div className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 font-bold text-xs flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-400" />
              <span>Monitoring Mode (Read Only)</span>
            </div>
          ) : (
            <>
              {sessionDemoState === 'RUNNING' ? (
                <button
                  onClick={pauseDemoSession}
                  className="px-3.5 py-2 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 text-amber-300 font-bold text-xs flex items-center space-x-1.5 transition-all"
                >
                  <Pause className="w-4 h-4" />
                  <span>Pause Session</span>
                </button>
              ) : (
                <button
                  onClick={resumeDemoSession}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center space-x-1.5 transition-all"
                >
                  <Play className="w-4 h-4" />
                  <span>Resume Session</span>
                </button>
              )}

              <button
                onClick={triggerSpacebarScan}
                disabled={sessionDemoState !== 'RUNNING'}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/30 flex items-center space-x-2 transition-all disabled:opacity-50"
              >
                <Keyboard className="w-4 h-4" />
                <span>Simulate [ Spacebar ] Scan</span>
              </button>

              <button
                onClick={endSession}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-extrabold text-xs shadow-lg shadow-rose-600/30"
              >
                End Attendance Session
              </button>
            </>
          )}

          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center space-x-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* LIVE ACTIVITY INDICATOR BANNER */}
      <div className="p-4 rounded-2xl glass-panel bg-slate-900 border border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`p-2.5 rounded-xl border flex items-center justify-center ${
            activityBanner.type === 'MARKED'
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 animate-pulse'
              : activityBanner.type === 'ALL_MARKED'
              ? 'bg-purple-500/20 text-purple-400 border-purple-500/40'
              : 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
          }`}>
            {activityBanner.type === 'MARKED' ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <Keyboard className="w-5 h-5" />
            )}
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono uppercase tracking-wider font-extrabold text-indigo-400">
                LIVE ACTIVITY INDICATOR
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            </div>

            {activityBanner.type === 'MARKED' ? (
              <p className="text-sm font-extrabold text-emerald-300 flex items-center gap-2">
                ✓ Attendance Marked — <span className="text-white">{activityBanner.studentName}</span> ({activityBanner.studentId}) at {activityBanner.time}
              </p>
            ) : activityBanner.type === 'ALL_MARKED' ? (
              <p className="text-sm font-extrabold text-purple-300">
                {activityBanner.message}
              </p>
            ) : (
              <p className="text-xs font-semibold text-slate-300">
                ⚡ <strong className="text-white">Spacebar Ready</strong> — Press physical <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-indigo-300 font-mono">Spacebar</kbd> on keyboard or click student card to mark attendance
              </p>
            )}
          </div>
        </div>

        <span className="hidden sm:inline-block px-3 py-1 rounded-full text-[10px] font-mono text-slate-400 bg-slate-950 border border-slate-800">
          Press [ Spacebar ] to Auto-Mark Next Student
        </span>
      </div>

      {/* LIVE ATTENDANCE COUNTER BAR */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
        <div className="p-4 rounded-2xl glass-panel border border-slate-800 space-y-1">
          <p className="text-slate-400 font-semibold">Total Roster</p>
          <p className="text-2xl font-extrabold text-white">{totalCount}</p>
        </div>
        <div className="p-4 rounded-2xl glass-panel border border-emerald-500/30 bg-emerald-500/10 space-y-1">
          <p className="text-emerald-300 font-semibold">🟢 Present</p>
          <p className="text-2xl font-extrabold text-emerald-400">{presentCount}</p>
        </div>
        <div className="p-4 rounded-2xl glass-panel border border-rose-500/30 bg-rose-500/10 space-y-1">
          <p className="text-rose-300 font-semibold">🔴 Absent</p>
          <p className="text-2xl font-extrabold text-rose-400">{absentCount}</p>
        </div>
        <div className="p-4 rounded-2xl glass-panel border border-slate-700 bg-slate-800/40 space-y-1">
          <p className="text-slate-300 font-semibold">⚪ Not Marked</p>
          <p className="text-2xl font-extrabold text-slate-300">{notMarkedCount}</p>
        </div>
        <div className="p-4 rounded-2xl glass-panel border border-indigo-500/30 bg-indigo-500/10 space-y-1">
          <p className="text-indigo-300 font-semibold">Attendance %</p>
          <p className="text-2xl font-extrabold text-indigo-400">{attendancePercentage}%</p>
        </div>
      </div>

      {/* UNIFIED STUDENT ATTENDANCE GRID SECTION */}
      <div className="p-6 rounded-3xl glass-panel border border-slate-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" />
              Live Student Attendance Grid (60 Students)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Press physical <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-indigo-300 font-mono text-[10px]">Spacebar</kbd> to automatically mark next student, or click any card directly for manual override.
            </p>
          </div>

          {/* SEARCH AND FILTER TABS */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search Student Name / UUCMS..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
              {(['ALL', 'PRESENT', 'ABSENT', 'NOT_MARKED'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTabFilter(tab)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    activeTabFilter === tab
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab === 'NOT_MARKED' ? 'Not Marked' : tab.charAt(0) + tab.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* COMPACT STUDENT GRID (60 STUDENTS) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5">
          {displayedStudents.map((s) => {
            const rec = recordMap.get(s.id);
            const status = rec?.status || 'PENDING';
            const isPresent = status === 'PRESENT' || status === 'LATE';
            const isAbsent = status === 'ABSENT';
            const isNotMarked = status === 'PENDING';

            return (
              <motion.div
                key={s.id}
                layout
                onClick={() => handleCardClick(s.id)}
                className={`relative p-2.5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-2 select-none group ${
                  isPresent
                    ? 'bg-emerald-500/10 border-emerald-500/50 shadow-md shadow-emerald-500/10'
                    : isAbsent
                    ? 'bg-rose-500/10 border-rose-500/50 shadow-md shadow-rose-500/10'
                    : 'bg-slate-900/60 border-slate-800 hover:border-indigo-500/40 hover:bg-slate-800/60'
                }`}
              >
                {/* Header: Photo + Status Pill */}
                <div className="flex items-center justify-between">
                  <img
                    src={s.avatar || s.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                    alt={s.name}
                    className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-700"
                  />

                  {isPresent && (
                    <span className="p-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </span>
                  )}
                  {isAbsent && (
                    <span className="p-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40">
                      <XCircle className="w-3.5 h-3.5" />
                    </span>
                  )}
                  {isNotMarked && (
                    <span className="p-1 rounded-full bg-slate-800 text-slate-500">
                      <Clock className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>

                {/* Body: Student Name & ID */}
                <div className="space-y-0.5">
                  <p className="font-bold text-white text-[11px] leading-tight truncate" title={s.name}>
                    {s.name}
                  </p>
                  <p className="text-[10px] font-mono text-indigo-300 font-semibold truncate">
                    {s.uucmsNo || s.rollNo}
                  </p>
                </div>

                {/* Status Badge */}
                <div className="pt-1 flex items-center justify-between border-t border-slate-800/60 text-[9px] font-extrabold uppercase tracking-wider">
                  {isPresent && (
                    <span className="text-emerald-400 flex items-center gap-1">
                      🟢 Present
                    </span>
                  )}
                  {isAbsent && (
                    <span className="text-rose-400 flex items-center gap-1">
                      🔴 Absent
                    </span>
                  )}
                  {isNotMarked && (
                    <span className="text-slate-400 flex items-center gap-1">
                      ⚪ Not Marked
                    </span>
                  )}

                  {rec?.timestamp && rec.timestamp !== '--:--:--' && (
                    <span className="font-mono text-[9px] text-slate-400 font-normal">
                      {rec.timestamp}
                    </span>
                  )}
                </div>

                {/* Hover Quick Actions */}
                <div className="absolute inset-0 bg-slate-950/90 rounded-2xl p-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-center gap-1.5 z-10 backdrop-blur-xs">
                  <button
                    onClick={(e) => handleExplicitMark(s.id, 'PRESENT', e)}
                    className="w-full py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[10px] shadow"
                  >
                    ✓ Mark Present
                  </button>
                  <button
                    onClick={(e) => handleExplicitMark(s.id, 'ABSENT', e)}
                    className="w-full py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-[10px] shadow"
                  >
                    ✕ Mark Absent
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
