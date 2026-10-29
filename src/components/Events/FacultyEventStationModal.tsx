'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAttendance } from '@/context/AttendanceContext';
import { useAuth } from '@/context/AuthContext';
import { Calendar, Clock, MapPin, Users, Radio, Shield, CheckCircle2, AlertCircle, Play, Pause, X, Lock, Keyboard, Search, Download } from 'lucide-react';
import { EventItem, AttendanceRecord, Student } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

import { FacultyBiometricModal } from '@/components/Faculty/FacultyBiometricModal';

interface FacultyEventStationModalProps {
  event: EventItem | null;
  onClose: () => void;
}

export const FacultyEventStationModal: React.FC<FacultyEventStationModalProps> = ({ event, onClose }) => {
  const { students, updateEventItem, eventApprovalNotifications } = useAttendance();
  const { user } = useAuth();

  const [activeStationName, setActiveStationName] = useState<string>('Station 1');
  const [isStationActive, setIsStationActive] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [duplicateMessage, setDuplicateMessage] = useState<string>('');
  const [isBiometricModalOpen, setIsBiometricModalOpen] = useState(false);
  const [isFacultyVerified, setIsFacultyVerified] = useState(false);

  if (!event) return null;

  // Determine currently logged-in faculty's role in this event
  const myAssignment = (event.assignedFaculty || []).find(
    af => af.facultyEmail === user?.email || af.facultyName.toLowerCase().includes((user?.name || '').toLowerCase())
  );
  
  const myRole = myAssignment ? myAssignment.roleInEvent : 'ATTENDANCE_FACULTY';
  const isCoordinator = myRole === 'COORDINATOR' || myRole === 'EVENT_COORDINATOR' || user?.role === 'Admin' || user?.role === 'Head of Dept';
  const isViewer = myRole === 'VIEWER';
  const isLiveStatus = event.status === 'LIVE' || event.status === 'ACTIVE';

  // Event Records
  const records: AttendanceRecord[] = event.records || [];
  const recordMap = new Map<string, AttendanceRecord>();
  records.forEach((r: AttendanceRecord) => recordMap.set(r.studentId, r));

  const totalExpected = event.expectedStrength || students.length;
  const presentCount = records.filter((r: AttendanceRecord) => r.status === 'PRESENT' || r.status === 'LATE').length;
  const absentCount = Math.max(0, totalExpected - presentCount);

  // Filtered Students for Grid
  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.uucmsNo || s.rollNo || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // DUPLICATE & REGISTRATION CHECK ATTENDANCE MARKER
  const markEventStudentAttendance = (student: Student, method: 'RFID_CARD' | 'FACE' | 'MANUAL' | 'SPACEBAR') => {
    if (isViewer) {
      setDuplicateMessage('🚫 Viewer Role: You do not have permission to mark attendance.');
      setTimeout(() => setDuplicateMessage(''), 2500);
      return;
    }

    // Faculty Physical Biometric Verification Check
    if (!isFacultyVerified && !myAssignment?.isBiometricVerified) {
      setIsBiometricModalOpen(true);
      return;
    }

    // Registration Check: Verify if student is registered for this event
    if (event.registeredStudentIds && event.registeredStudentIds.length > 0) {
      const isRegistered = event.registeredStudentIds.includes(student.id) ||
                           event.registeredStudentIds.includes(student.uucmsNo || '') ||
                           event.registeredStudentIds.includes(student.rollNo);
      if (!isRegistered) {
        setDuplicateMessage(`🚫 Access Denied: ${student.name} (${student.uucmsNo || student.rollNo}) is NOT registered for "${event.name}".`);
        setTimeout(() => setDuplicateMessage(''), 3500);
        return;
      }
    }

    // Check Duplicate Attendance across ALL Stations
    if (recordMap.has(student.id)) {
      const existing = recordMap.get(student.id);
      setDuplicateMessage(`⚠️ Already marked present for ${event.name} at ${existing?.markedBy || 'Station 1'}`);
      setTimeout(() => setDuplicateMessage(''), 3000);
      return;
    }

    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const newRecord: AttendanceRecord = {
      id: `EVTREC-${student.id}-${Date.now()}`,
      sessionId: event.id,
      studentId: student.id,
      studentUucmsNo: student.uucmsNo || student.rollNo,
      studentRollNo: student.uucmsNo || student.rollNo,
      studentName: student.name,
      cardUid: student.cardUid || student.rfidTag,
      rfidTag: student.cardUid || student.rfidTag,
      timestamp: nowTime,
      markedAt: nowTime,
      markedBy: `${user?.name || 'Faculty'} (${activeStationName})`,
      method: method === 'SPACEBAR' ? 'SPACEBAR_DEMO' : method,
      status: 'PRESENT',
      lateStatus: 'PRESENT',
      dualFactorVerified: true,
      verificationStatus: 'GRANTED',
      source: 'EVENT',
      eventId: event.id,
      eventName: event.name,
    };

    const updatedRecords = [...records, newRecord];
    updateEventItem(event.id, {
      records: updatedRecords,
      status: 'LIVE',
    });

    setDuplicateMessage(`✓ ${student.name} marked PRESENT at ${activeStationName} • Sent to Class Teacher for approval`);
    setTimeout(() => setDuplicateMessage(''), 3000);
  };

  // Spacebar trigger scan
  const handleSpacebarScan = () => {
    const unmarked = students.find(s => !recordMap.has(s.id));
    if (!unmarked) {
      setDuplicateMessage('🎉 All eligible students have been marked for this event!');
      setTimeout(() => setDuplicateMessage(''), 3000);
      return;
    }
    markEventStudentAttendance(unmarked, 'SPACEBAR');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 text-slate-100 max-h-[90vh] overflow-y-auto relative"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase ${
                myRole === 'COORDINATOR' || myRole === 'EVENT_COORDINATOR' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                myRole === 'ATTENDANCE_FACULTY' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
              }`}>
                ROLE: {myRole === 'COORDINATOR' || myRole === 'EVENT_COORDINATOR' ? '👑 EVENT COORDINATOR' : myRole === 'ATTENDANCE_FACULTY' ? '📷 ATTENDANCE FACULTY' : '👁️ VIEWER'}
              </span>

              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                isLiveStatus ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse' :
                event.status === 'UPCOMING' ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-400'
              }`}>
                STATUS: {event.status}
              </span>
            </div>

            <h2 className="text-2xl font-extrabold text-white mt-1">{event.name}</h2>
            <p className="text-xs text-slate-400">
              Venue: <strong className="text-purple-300">{event.venue}</strong> • Date: <strong className="text-slate-200">{event.date} ({event.startTime})</strong>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Duplicate Notification Banner */}
        {duplicateMessage && (
          <div className="p-3 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 rounded-xl text-xs font-bold flex items-center justify-between">
            <span>{duplicateMessage}</span>
          </div>
        )}

        {/* Live Counters Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl glass-panel border border-slate-800">
            <p className="text-slate-400 font-semibold">Expected Strength</p>
            <p className="text-xl font-extrabold text-white">{totalExpected} Students</p>
          </div>
          <div className="p-3.5 rounded-2xl glass-panel border border-emerald-500/30 bg-emerald-500/10">
            <p className="text-emerald-300 font-semibold">Present (All Stations)</p>
            <p className="text-xl font-extrabold text-emerald-400">{presentCount}</p>
          </div>
          <div className="p-3.5 rounded-2xl glass-panel border border-rose-500/30 bg-rose-500/10">
            <p className="text-rose-300 font-semibold">Absent / Unmarked</p>
            <p className="text-xl font-extrabold text-rose-400">{absentCount}</p>
          </div>
          <div className="p-3.5 rounded-2xl glass-panel border border-indigo-500/30 bg-indigo-500/10">
            <p className="text-indigo-300 font-semibold">Progress %</p>
            <p className="text-xl font-extrabold text-indigo-400">
              {totalExpected > 0 ? Math.round((presentCount / totalExpected) * 100) : 0}%
            </p>
          </div>
        </div>

        {/* CONTROLS ACCORDING TO EVENT ROLE */}
        {isCoordinator && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                👑 Event Coordinator Controls
              </span>
              <div className="space-x-2">
                {!isLiveStatus ? (
                  <button
                    onClick={() => updateEventItem(event.id, { status: 'LIVE' })}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow"
                  >
                    ▶ Start Event Attendance Session
                  </button>
                ) : (
                  <button
                    onClick={() => updateEventItem(event.id, { status: 'COMPLETED' })}
                    className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow"
                  >
                    ⏹ End Event Attendance Session
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STATION CONTROLS FOR ATTENDANCE FACULTY */}
        {!isViewer && (
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-300">Active Station:</span>
                <select
                  value={activeStationName}
                  onChange={e => setActiveStationName(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold"
                >
                  <option value="Station 1 (Main Entrance Gate)">Station 1 (Main Entrance Gate)</option>
                  <option value="Station 2 (Auditorium Left Wing)">Station 2 (Auditorium Left Wing)</option>
                  <option value="Station 3 (Auditorium Right Wing)">Station 3 (Auditorium Right Wing)</option>
                  <option value="Station 4 (VIP Gallery)">Station 4 (VIP Gallery)</option>
                </select>
              </div>

              <button
                onClick={handleSpacebarScan}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs shadow-lg flex items-center space-x-2"
              >
                <Keyboard className="w-4 h-4" />
                <span>Simulate [ Spacebar ] Scan at {activeStationName}</span>
              </button>
            </div>
          </div>
        )}

        {/* VIEWER NOTICE */}
        {isViewer && (
          <div className="p-3 bg-slate-950 border border-slate-800 text-slate-400 rounded-xl text-xs font-semibold flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-400" />
            <span>Viewer Role: Monitoring event progress. Attendance marking controls are restricted.</span>
          </div>
        )}

        {/* STUDENT ATTENDANCE GRID FOR THIS EVENT */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Event Live Attendance Roster
            </h3>
            <input
              type="text"
              placeholder="Search student..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5 max-h-60 overflow-y-auto">
            {filteredStudents.map(s => {
              const isPresent = recordMap.has(s.id);
              const rec = recordMap.get(s.id);

              return (
                <div
                  key={s.id}
                  onClick={() => !isPresent && markEventStudentAttendance(s, 'MANUAL')}
                  className={`p-2.5 rounded-2xl border text-left transition-all ${
                    isPresent
                      ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-200'
                      : isViewer
                      ? 'bg-slate-950 border-slate-800 text-slate-400 cursor-not-allowed'
                      : 'bg-slate-950 border-slate-800 hover:border-indigo-500/50 cursor-pointer text-slate-300'
                  }`}
                >
                  <p className="font-bold text-xs truncate">{s.name}</p>
                  <p className="text-[10px] font-mono text-slate-400 truncate">{s.uucmsNo || s.rollNo}</p>
                  <div className="mt-1 flex items-center justify-between text-[9px]">
                    <span className={`px-1.5 py-0.5 rounded-md font-extrabold ${isPresent ? 'bg-emerald-500/30 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
                      {isPresent ? 'PRESENT ✓' : 'UNMARKED'}
                    </span>
                    {rec?.markedBy && (
                      <span className="text-slate-500 truncate">{rec.markedBy.split(' ')[0]}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* FACULTY PHYSICAL BIOMETRIC VERIFICATION MODAL */}
        <FacultyBiometricModal
          event={event}
          isOpen={isBiometricModalOpen}
          onClose={() => setIsBiometricModalOpen(false)}
          onSuccess={(verifiedFaculty) => {
            setIsFacultyVerified(true);
            setIsBiometricModalOpen(false);
          }}
        />
      </motion.div>
    </div>
  );
};
