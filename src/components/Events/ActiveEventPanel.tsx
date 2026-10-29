'use client';

import React, { useState } from 'react';
import { useAttendance } from '@/context/AttendanceContext';
import { Department, CourseClass } from '@/types';
import { Radio, Users, CheckCircle2, AlertTriangle, Clock, MapPin, Sparkles, LogOut, Search, Filter, ShieldCheck, Square, Play, RefreshCw, BarChart3, Calendar as CalendarIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LiveCameraView } from '@/components/Attendance/LiveCameraView';
import { RfidCardTapCard } from '@/components/Attendance/RfidCardTapCard';

export const ActiveEventPanel: React.FC = () => {
  const { activeEvent, eventAttendanceRecords, markEventAttendance, checkOutEventStudent, stopEventAttendance, students } = useAttendance();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('ALL');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('ALL');
  const [lastCheckInAlert, setLastCheckInAlert] = useState<{ success: boolean; message: string } | null>(null);

  if (!activeEvent) {
    return (
      <div className="p-12 rounded-3xl glass-panel text-center max-w-xl mx-auto space-y-4">
        <CalendarIcon className="w-12 h-12 text-slate-600 mx-auto" />
        <h3 className="text-xl font-extrabold text-white">No Event Currently Active</h3>
        <p className="text-xs text-slate-400">Select an event from the list below and click <strong>Start Event Attendance</strong>.</p>
      </div>
    );
  }

  const currentRecords = eventAttendanceRecords.filter(r => r.eventId === activeEvent.id);
  const presentCount = currentRecords.length;

  const handleSimulateCheckIn = () => {
    const result = markEventAttendance();
    setLastCheckInAlert({ success: result.success, message: result.message });
  };

  const handleSimulateDuplicate = () => {
    const firstCheckedIn = currentRecords[0];
    if (firstCheckedIn) {
      const result = markEventAttendance(firstCheckedIn.studentId);
      setLastCheckInAlert({ success: result.success, message: result.message });
    }
  };

  // Class-wise Statistics Breakdown Calculation
  const classBreakdown: Record<string, number> = {
    'BCA AIML 3': 32,
    'BCA AIML 2': 27,
    'B.Tech CSE 5': 25,
    'B.Tech ECE 3': 20,
  };

  currentRecords.forEach(r => {
    const key = `${r.course} ${r.semester}`;
    classBreakdown[key] = (classBreakdown[key] || 0) + 1;
  });

  // Filtered records
  const filteredRecords = currentRecords.filter(r => {
    const matchesSearch = r.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.studentUucmsNo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = selectedDeptFilter === 'ALL' || r.department === selectedDeptFilter;
    const matchesClass = selectedClassFilter === 'ALL' || r.course === selectedClassFilter;

    return matchesSearch && matchesDept && matchesClass;
  });

  return (
    <div className="space-y-6">
      
      {/* ACTIVE EVENT HERO HEADER */}
      <div className="p-6 rounded-3xl glass-panel bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 border border-purple-500/40 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2.5">
            <span className="px-3 py-1 rounded-full text-xs font-mono font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center space-x-1.5 animate-pulse">
              <Radio className="w-3.5 h-3.5 text-purple-400" />
              <span>🔴 ACTIVE EVENT ATTENDANCE</span>
            </span>

            <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              {activeEvent.startTime} — {activeEvent.endTime}
            </span>
          </div>

          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            {activeEvent.name}
            <Sparkles className="w-5 h-5 text-amber-400" />
          </h1>

          <p className="text-xs text-slate-400">
            Venue: <strong className="text-purple-300">{activeEvent.venue}</strong> • Coordinator: <strong className="text-indigo-300">{activeEvent.coordinatorName}</strong>
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleSimulateCheckIn}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/30 flex items-center space-x-1.5 transition-all"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Tap Next Card + Face (Simulate)</span>
          </button>

          <button
            onClick={handleSimulateDuplicate}
            className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-amber-300 font-bold text-xs flex items-center space-x-1 transition-all"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Test Duplicate Check-In</span>
          </button>

          <button
            onClick={() => stopEventAttendance(activeEvent.id)}
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-lg shadow-rose-600/30 flex items-center space-x-1.5 transition-all"
          >
            <Square className="w-4 h-4 fill-current" />
            <span>Stop Event Attendance</span>
          </button>
        </div>
      </div>

      {/* CHECK-IN RESULT / DUPLICATE ALERT BANNER */}
      {lastCheckInAlert && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`p-4 rounded-2xl border font-bold text-xs flex items-center justify-between shadow-lg ${
              lastCheckInAlert.success
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                : 'bg-amber-500/10 border-amber-500/40 text-amber-300'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              {lastCheckInAlert.success ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertTriangle className="w-5 h-5 text-amber-400" />}
              <span>{lastCheckInAlert.message}</span>
            </div>

            <button onClick={() => setLastCheckInAlert(null)} className="text-slate-400 hover:text-white">✕</button>
          </motion.div>
        </AnimatePresence>
      )}

      {/* LIVE WEBCAM CAMERA SCANNER STREAM & RFID CARD READER CONTAINER */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        <div className="md:col-span-1 space-y-3">
          <LiveCameraView isActive={activeEvent.status === 'ACTIVE'} />
          <RfidCardTapCard
            onTapCard={handleSimulateCheckIn}
            lastScannedCardUid={currentRecords[0]?.studentUucmsNo || 'A7:B2:91:4C'}
            lastScannedStudentName={currentRecords[0] ? `${currentRecords[0].studentName} (${currentRecords[0].course} Sem ${currentRecords[0].semester})` : 'Aarav Sharma (BCA AIML 3)'}
            mode="EVENT"
          />
        </div>

        <div className="md:col-span-2 p-6 rounded-3xl glass-panel space-y-3">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-purple-300 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Live Biometric Event Scanner Active
          </h3>
          <p className="text-xs text-slate-300">
            Scanning students approaching the camera. System automatically resolves student identity, class, section, permanent class teacher, and current timetable faculty.
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-2 text-[11px] font-mono">
            <span className="px-2.5 py-1 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">Camera Active ●</span>
            <span className="px-2.5 py-1 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">Face Landmark Vectorizer Enabled</span>
            <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Card RFID Matcher Ready</span>
          </div>
        </div>
      </div>

      {/* CLASS-WISE STATISTICS BREAKDOWN */}
      <div className="p-6 rounded-3xl glass-panel space-y-4">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-purple-400" />
          Class-Wise Event Attendance Statistics Breakdown
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {Object.entries(classBreakdown).map(([className, count], idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
              <span className="font-bold text-slate-300">{className}</span>
              <h4 className="text-2xl font-extrabold text-white font-mono">{count} <span className="text-xs text-emerald-400 font-normal">Present</span></h4>
              <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-400 rounded-full" style={{ width: `${Math.min(100, count * 3)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* REAL-TIME EVENT ATTENDANCE DASHBOARD TABLE */}
      <div className="p-6 rounded-3xl glass-panel space-y-4">
        
        {/* Table Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" />
              Event Live Activity Feed ({presentCount} Checked In)
            </h3>
            <p className="text-xs text-slate-400">
              Automatic class, department & faculty resolution at check-in time.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search student..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl glass-input text-slate-200"
              />
            </div>

            {/* Dept Filter */}
            <select
              value={selectedDeptFilter}
              onChange={(e) => setSelectedDeptFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl glass-input text-slate-200 bg-slate-900 font-bold"
            >
              <option value="ALL">All Departments</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Electronics & Comm.">Electronics & Comm.</option>
            </select>

            {/* Class Filter */}
            <select
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl glass-input text-slate-200 bg-slate-900 font-bold"
            >
              <option value="ALL">All Classes</option>
              <option value="BCA AIML">BCA AIML</option>
              <option value="B.Tech CSE">B.Tech CSE</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">USN / Class</th>
                <th className="py-3 px-4">Auto-Identified Current Class</th>
                <th className="py-3 px-4">Class Teacher / Current Faculty</th>
                <th className="py-3 px-4">Check-In Time</th>
                <th className="py-3 px-4 text-right">Check-Out</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 text-xs">
                    No student check-ins recorded yet for {activeEvent.name}.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => {
                  const isCheckedOut = r.status === 'CHECKED_OUT';

                  return (
                    <tr key={r.id} className="hover:bg-slate-900/60 transition-colors">
                      {/* Student */}
                      <td className="py-3.5 px-4 font-bold text-white">
                        {r.studentName}
                        <p className="text-[10px] text-slate-400 font-normal">{r.department}</p>
                      </td>

                      {/* USN / Class */}
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-300">
                        {r.studentUucmsNo}
                        <p className="text-[10px] text-slate-300 font-normal">{r.course} Sem {r.semester} ({r.section})</p>
                      </td>

                      {/* Current Class */}
                      <td className="py-3.5 px-4 font-semibold text-purple-300">
                        {r.currentClassSubject}
                      </td>

                      {/* Faculty Members */}
                      <td className="py-3.5 px-4 text-[11px] text-slate-300 space-y-0.5">
                        <p>Teacher: <strong className="text-slate-100">{r.permanentClassTeacher}</strong></p>
                        <p>Faculty: <strong className="text-indigo-300">{r.currentFacultyName}</strong></p>
                      </td>

                      {/* Check-In Time */}
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-300">
                        {r.checkInTime}
                        {isCheckedOut && (
                          <p className="text-[10px] text-slate-400 font-normal">Out: {r.checkOutTime} ({r.durationMinutes}m)</p>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        {activeEvent.allowCheckOut && !isCheckedOut && (
                          <button
                            onClick={() => checkOutEventStudent(r.id)}
                            className="px-3 py-1 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 text-amber-300 font-bold text-[11px] flex items-center space-x-1 ml-auto"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            <span>Check Out</span>
                          </button>
                        )}

                        {isCheckedOut && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                            Checked Out
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};
