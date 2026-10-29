'use client';

import React, { useState, useMemo } from 'react';
import { useAttendance } from '@/context/AttendanceContext';
import { exportManualClassAttendanceToExcel } from '@/utils/exportExcel';
import { RefreshButton } from '@/components/Common/RefreshButton';
import { Student } from '@/types';
import {
  CheckCircle2,
  XCircle,
  Users,
  Search,
  Download,
  Save,
  RotateCcw,
  Sparkles,
  Clock,
  Calendar,
  UserCheck,
  UserX,
  AlertTriangle,
  FileCheck,
  Radio,
  X,
  ArrowRight,
  ShieldCheck,
  Activity,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const SmartManualAttendanceGrid: React.FC = () => {
  const {
    activeSession,
    students,
    toggleStudentManualStatus,
    submitAttendanceSession,
    saveManualAttendanceSession,
  } = useAttendance();

  const [searchTerm, setSearchTerm] = useState('');
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [savedSuccessMsg, setSavedSuccessMsg] = useState<string | null>(null);

  // Load imported students matching active session class/section
  const classStudents: Student[] = useMemo(() => {
    if (!activeSession) return [];
    const matched = students.filter(
      (s) => s.semester === activeSession.semester && s.section === activeSession.section
    );
    return matched.length > 0 ? matched : students.slice(0, 60);
  }, [activeSession, students]);

  // Session Records Map (Single Source of Truth)
  const recordMap = useMemo(() => {
    const map = new Map<string, any>();
    if (activeSession?.records) {
      activeSession.records.forEach((r) => map.set(r.studentId, r));
    }
    return map;
  }, [activeSession?.records]);

  // Real-Time Attendance Calculations (Single Source of Truth)
  const totalCount = classStudents.length || 60;
  
  const presentCount = useMemo(() => {
    return classStudents.filter((s) => {
      const rec = recordMap.get(s.id);
      return rec && (rec.status === 'PRESENT' || rec.status === 'LATE');
    }).length;
  }, [classStudents, recordMap]);

  const absentCount = useMemo(() => {
    return classStudents.filter((s) => {
      const rec = recordMap.get(s.id);
      return rec && rec.status === 'ABSENT';
    }).length;
  }, [classStudents, recordMap]);

  const pendingCount = Math.max(0, totalCount - presentCount - absentCount);
  const attendancePercentage = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  // Dynamic Grid Sorting (1. Absent 🔴 -> 2. Pending 🟡 -> 3. Present 🟢)
  const sortedStudents = useMemo(() => {
    return [...classStudents].sort((a, b) => {
      const recA = recordMap.get(a.id);
      const recB = recordMap.get(b.id);

      const statusA = recA?.status || 'PENDING';
      const statusB = recB?.status || 'PENDING';

      const weight = (st: string) => {
        if (st === 'ABSENT') return 1;
        if (st === 'PENDING') return 2;
        return 3; // PRESENT / LATE
      };

      if (weight(statusA) !== weight(statusB)) {
        return weight(statusA) - weight(statusB);
      }

      // Preserve Roll / UUCMS sequence within status groups
      return (a.uucmsNo || a.rollNo).localeCompare(b.uucmsNo || b.rollNo);
    });
  }, [classStudents, recordMap]);

  // Search Filtered Students
  const displayedStudents = useMemo(() => {
    if (!searchTerm.trim()) return sortedStudents;
    const q = searchTerm.toLowerCase().trim();
    return sortedStudents.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.uucmsNo || s.rollNo).toLowerCase().includes(q)
    );
  }, [sortedStudents, searchTerm]);

  // Absent Students Panel List
  const absentStudentsList = useMemo(() => {
    return classStudents.filter((s) => {
      const rec = recordMap.get(s.id);
      return rec && rec.status === 'ABSENT';
    });
  }, [classStudents, recordMap]);

  // Live Activity Stream Log
  const liveActivityLog = useMemo(() => {
    if (!activeSession?.records) return [];
    return activeSession.records
      .filter((r) => r.status !== 'PENDING')
      .slice(0, 10);
  }, [activeSession?.records]);

  // Actions
  const handleMarkAllPresent = () => {
    classStudents.forEach((s) => {
      const rec = recordMap.get(s.id);
      if (!rec || rec.status !== 'PRESENT') {
        toggleStudentManualStatus(s.id);
      }
    });
  };

  const handleResetAttendance = () => {
    classStudents.forEach((s) => {
      const rec = recordMap.get(s.id);
      if (rec && rec.status !== 'PENDING') {
        toggleStudentManualStatus(s.id);
      }
    });
    setSavedSuccessMsg(null);
  };

  const handleExecuteSubmit = (markPendingAsAbsent = false) => {
    const res = submitAttendanceSession(markPendingAsAbsent);
    if (res.success) {
      setSavedSuccessMsg(
        `✓ Attendance Submitted & Locked! (${res.presentCount} Present, ${res.absentCount} Absent)`
      );
      setIsReviewModalOpen(false);
      setTimeout(() => setSavedSuccessMsg(null), 4000);
    }
  };

  const handleExportExcel = () => {
    if (!activeSession) return;

    const studentRows = classStudents.map((s, idx) => {
      const rec = recordMap.get(s.id);
      return {
        slNo: idx + 1,
        name: s.name,
        uucmsNo: s.uucmsNo || s.rollNo,
        course: `${activeSession.course || 'BCA AIML'} Sem ${activeSession.semester}`,
        section: activeSession.section,
        status: (rec?.status === 'ABSENT' ? 'ABSENT' : rec?.status === 'PRESENT' ? 'PRESENT' : 'PENDING') as any,
        timeMarked: rec?.timestamp || '--:--:--',
      };
    });

    exportManualClassAttendanceToExcel(
      {
        course: activeSession.course || 'BCA AIML',
        semester: activeSession.semester,
        section: activeSession.section,
        subjectName: `${activeSession.subjectCode} - ${activeSession.subjectName}`,
        facultyName: activeSession.facultyName,
        date: activeSession.date || new Date().toISOString().split('T')[0],
        period: `${activeSession.startTime} - ${activeSession.endTime || '11:00 AM'}`,
      },
      studentRows
    );
  };

  if (!activeSession) return null;

  return (
    <div className="space-y-6">
      
      {/* 1. HEADER DASHBOARD METRICS BAR */}
      <div className="p-6 rounded-3xl glass-panel bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/90 border border-indigo-500/30 shadow-2xl space-y-4">
        
        {/* Class Information Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>CAIAS Synchronized Attendance Engine</span>
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              {activeSession.course || 'BCA AIML'} Sem {activeSession.semester} — Section {activeSession.section}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Subject: <strong className="text-indigo-300">{activeSession.subjectCode} - {activeSession.subjectName}</strong> • Faculty: <strong className="text-slate-200">{activeSession.facultyName}</strong>
            </p>
          </div>

          <div className="flex items-center space-x-3 text-xs font-mono text-slate-400">
            <RefreshButton />

            <span className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              {activeSession.date || new Date().toLocaleDateString('en-GB')}
            </span>

            <span className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              {activeSession.startTime} - {activeSession.endTime || '11:00 AM'}
            </span>
          </div>
        </div>

        {/* Real-Time 4-Card Summary Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800/80 text-xs">
          
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-0.5">
            <span className="text-[10px] text-slate-400 font-bold uppercase">TOTAL STUDENTS</span>
            <h4 className="text-2xl font-extrabold text-white font-mono">{totalCount}</h4>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-0.5">
            <span className="text-[10px] text-emerald-400 font-bold uppercase">PRESENT (🟢)</span>
            <h4 className="text-2xl font-extrabold text-emerald-400 font-mono">{presentCount}</h4>
          </div>

          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-0.5">
            <span className="text-[10px] text-rose-400 font-bold uppercase">ABSENT (🔴)</span>
            <h4 className="text-2xl font-extrabold text-rose-400 font-mono">{absentCount}</h4>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-0.5">
            <span className="text-[10px] text-amber-400 font-bold uppercase">PENDING (🟡)</span>
            <h4 className="text-2xl font-extrabold text-amber-300 font-mono">{pendingCount}</h4>
          </div>

        </div>

      </div>

      {/* 2. SEARCH BAR & QUICK CONTROLS TOOLBAR */}
      <div className="p-4 rounded-2xl glass-panel flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
        
        {/* Search Input */}
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search student name / UUCMS ID..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl glass-input text-slate-200 text-xs placeholder:text-slate-500"
          />
        </div>

        {/* Quick Controls Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleMarkAllPresent}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-emerald-300 font-bold flex items-center space-x-1.5 transition-all"
          >
            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Mark All Present</span>
          </button>

          <button
            onClick={handleResetAttendance}
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white font-bold flex items-center space-x-1 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <button
            onClick={() => setIsReviewModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-extrabold shadow-lg shadow-emerald-600/30 flex items-center space-x-2 transition-all transform active:scale-95"
          >
            <FileCheck className="w-4 h-4" />
            <span>REVIEW & SUBMIT</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 font-extrabold flex items-center space-x-1.5 transition-all"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span>Export Excel</span>
          </button>
        </div>

      </div>

      {/* Success Notification Banner */}
      {savedSuccessMsg && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-extrabold text-xs flex items-center justify-between shadow-lg"
          >
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>{savedSuccessMsg}</span>
            </div>
            <button onClick={() => setSavedSuccessMsg(null)} className="text-slate-400 hover:text-white">✕</button>
          </motion.div>
        </AnimatePresence>
      )}

      {/* 3. MAIN GRID & LIVE ACTIVITY PANEL LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        
        {/* COMPACT SEATING GRID (3 COLS ON LARGE) */}
        <div className="lg:col-span-3 p-5 rounded-3xl glass-panel space-y-4">
          
          <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-3">
            <span className="font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" />
              Synchronized Student Seating Grid ({classStudents.length} Students)
            </span>
            <span className="text-slate-400 text-[11px]">
              Click box to toggle: <strong className="text-amber-400">🟡 Pending</strong> ➔ <strong className="text-emerald-400">🟢 Present</strong> ➔ <strong className="text-rose-400">🔴 Absent</strong>
            </span>
          </div>

          {/* Student Grid Container */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 max-h-[620px] overflow-y-auto pr-1">
            {displayedStudents.map((s, idx) => {
              const rec = recordMap.get(s.id);
              const status = rec?.status || 'PENDING';
              const isPresent = status === 'PRESENT' || status === 'LATE';
              const isAbsent = status === 'ABSENT';
              const isPending = status === 'PENDING';

              const isBiometric = rec?.method === 'CARD_FACE' || rec?.method === 'FACE_AND_RFID';
              const slNoStr = (idx + 1).toString().padStart(2, '0');
              const uucmsDisplay = s.uucmsNo || s.rollNo;

              return (
                <motion.div
                  key={s.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleStudentManualStatus(s.id)}
                  className={`relative p-3 rounded-2xl border cursor-pointer select-none transition-all duration-200 flex flex-col justify-between min-h-[95px] shadow-md ${
                    isAbsent
                      ? 'bg-gradient-to-b from-rose-950/90 via-slate-900 to-rose-950/80 border-rose-500/80 shadow-rose-950/40'
                      : isPresent
                      ? 'bg-gradient-to-b from-slate-900 via-slate-900 to-emerald-950/30 hover:bg-slate-800/90 border-emerald-500/60 shadow-emerald-950/30'
                      : 'bg-slate-900/60 hover:bg-slate-800/60 border-slate-800 text-slate-400'
                  }`}
                >
                  
                  {/* UPPER TOP PORTION STATUS BADGE */}
                  <div className="flex items-center justify-between w-full mb-1">
                    {isAbsent ? (
                      <span className="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded bg-rose-500 text-white uppercase tracking-wider shadow">
                        🔴 ABSENT
                      </span>
                    ) : isPresent ? (
                      <span className="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>✓ PRESENT</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        🟡 PENDING
                      </span>
                    )}

                    {isBiometric && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        Card ✓ Face ✓
                      </span>
                    )}
                  </div>

                  {/* Student Details */}
                  <div className="space-y-0.5 mt-1">
                    <p className={`text-xs font-extrabold line-clamp-1 ${isAbsent ? 'text-rose-200' : isPresent ? 'text-white' : 'text-slate-300'}`}>
                      {slNoStr} — {s.name}
                    </p>
                    <p className="text-[10px] font-mono text-slate-400 line-clamp-1">
                      {uucmsDisplay}
                    </p>
                  </div>

                </motion.div>
              );
            })}
          </div>

        </div>

        {/* LIVE ACTIVITY FEED & ABSENT SIDEBAR (1 COL ON LARGE) */}
        <div className="lg:col-span-1 space-y-4">
          
          {/* ABSENT STUDENTS PANEL */}
          <div className="p-4 rounded-3xl glass-panel border border-rose-500/30 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h3 className="font-extrabold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                <UserX className="w-4 h-4 text-rose-400" />
                ABSENT ({absentCount})
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                {absentCount}
              </span>
            </div>

            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {absentStudentsList.length === 0 ? (
                <p className="text-[11px] text-slate-500 text-center py-4">No absent students marked.</p>
              ) : (
                absentStudentsList.map((s, idx) => (
                  <div
                    key={s.id}
                    onClick={() => toggleStudentManualStatus(s.id)}
                    className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/30 flex items-center justify-between cursor-pointer hover:bg-rose-900/30 transition-all text-xs"
                  >
                    <div className="space-y-0.5">
                      <p className="font-bold text-rose-200 text-[11px]">{idx + 1}. {s.name}</p>
                      <p className="text-[9px] text-slate-400 font-mono">{s.uucmsNo || s.rollNo}</p>
                    </div>
                    <span className="text-[10px] text-rose-400 font-bold">Remove</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* LIVE ACTIVITY FEED PANEL */}
          <div className="p-4 rounded-3xl glass-panel border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h3 className="font-extrabold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-indigo-400" />
                LIVE ACTIVITY STREAM
              </h3>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>

            <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1 font-mono text-[10px]">
              {liveActivityLog.length === 0 ? (
                <p className="text-[11px] text-slate-500 text-center py-4 font-sans">No live activity recorded yet.</p>
              ) : (
                liveActivityLog.map((log) => (
                  <div
                    key={log.id}
                    className="p-2 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-0.5"
                  >
                    <div className="flex items-center justify-between text-slate-400">
                      <span>{log.timestamp}</span>
                      <span className={log.status === 'PRESENT' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                        {log.status === 'PRESENT' ? '✓ PRESENT' : '✕ ABSENT'}
                      </span>
                    </div>
                    <p className="font-bold text-white font-sans text-[11px]">{log.studentName}</p>
                    <p className="text-[9px] text-indigo-300">Method: {log.method || 'CARD_FACE'}</p>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

      {/* 4. REVIEW & SUBMIT ATTENDANCE MODAL */}
      {isReviewModalOpen && (
        <AnimatePresence>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg p-6 rounded-3xl glass-panel border border-emerald-500/40 shadow-2xl space-y-5"
            >
              <button
                onClick={() => setIsReviewModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <FileCheck className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-white">Review & Submit Attendance</h3>
                  <p className="text-xs text-slate-400">
                    {activeSession.course || 'BCA AIML'} Sem {activeSession.semester} ({activeSession.section}) • {activeSession.subjectCode}
                  </p>
                </div>
              </div>

              {/* Counts Breakdown */}
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <p className="text-[10px] text-slate-400 font-bold">TOTAL</p>
                  <p className="text-lg font-extrabold text-white font-mono">{totalCount}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40">
                  <p className="text-[10px] text-emerald-400 font-bold">PRESENT</p>
                  <p className="text-lg font-extrabold text-emerald-300 font-mono">{presentCount}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/40">
                  <p className="text-[10px] text-rose-400 font-bold">ABSENT</p>
                  <p className="text-lg font-extrabold text-rose-300 font-mono">{absentCount}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/40">
                  <p className="text-[10px] text-amber-400 font-bold">PENDING</p>
                  <p className="text-lg font-extrabold text-amber-300 font-mono">{pendingCount}</p>
                </div>
              </div>

              {/* Pending Alert Banner */}
              {pendingCount > 0 && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-1">
                  <div className="flex items-center space-x-2 font-extrabold">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>⚠️ {pendingCount} students are still pending verification</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    You can continue attendance or submit and mark all remaining pending students as <strong>ABSENT</strong>.
                  </p>
                </div>
              )}

              {/* Modal Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-slate-400 hover:text-white text-xs font-bold"
                >
                  Continue Attendance
                </button>

                {pendingCount > 0 && (
                  <button
                    onClick={() => handleExecuteSubmit(true)}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center justify-center space-x-1.5"
                  >
                    <span>Mark Remaining Absent & Submit</span>
                  </button>
                )}

                <button
                  onClick={() => handleExecuteSubmit(false)}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2"
                >
                  <span>SUBMIT & LOCK ATTENDANCE</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </motion.div>
          </div>
        </AnimatePresence>
      )}

    </div>
  );
};
