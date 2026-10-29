'use client';

import React, { useState } from 'react';
import { useAttendance } from '@/context/AttendanceContext';
import { useAuth } from '@/context/AuthContext';
import { Department, Semester, Section } from '@/types';
import { XCircle, Calendar, Plus, AlertTriangle, Bell, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export const ClassCancellationModal: React.FC = () => {
  const { cancellations, cancelClass, extraClasses, scheduleExtraClass, timetable, subjects } = useAttendance();
  const { user } = useAuth();

  // Cancel form
  const [cancelSubject, setCancelSubject] = useState('CS302');
  const [cancelDate, setCancelDate] = useState('2026-08-08');
  const [cancelReason, setCancelReason] = useState('Departmental Academic Audit');

  // Extra class form
  const [extraSubject, setExtraSubject] = useState('CS301');
  const [extraDept, setExtraDept] = useState<Department>('Computer Science');
  const [extraSem, setExtraSem] = useState<Semester>(3);
  const [extraSec, setExtraSec] = useState<Section>('A');
  const [extraRoom, setExtraRoom] = useState('Lab 302');
  const [extraDate, setExtraDate] = useState('2026-08-09');
  const [extraStartTime, setExtraStartTime] = useState('04:00 PM');
  const [extraEndTime, setExtraEndTime] = useState('05:00 PM');

  const [activeSubTab, setActiveSubTab] = useState<'cancel' | 'extra'>('cancel');

  const handleCancelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sub = subjects.find(s => s.code === cancelSubject);

    cancelClass({
      facultyId: user?.id || 'FAC-101',
      facultyName: user?.name || 'Dr. Alan Turing',
      subjectCode: cancelSubject,
      subjectName: sub ? sub.name : 'Class Session',
      date: cancelDate,
      reason: cancelReason,
    });
  };

  const handleExtraSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sub = subjects.find(s => s.code === extraSubject);

    scheduleExtraClass({
      facultyId: user?.id || 'FAC-101',
      facultyName: user?.name || 'Dr. Alan Turing',
      subjectCode: extraSubject,
      subjectName: sub ? sub.name : 'Class Session',
      department: extraDept,
      semester: extraSem,
      section: extraSec,
      classroom: extraRoom,
      date: extraDate,
      startTime: extraStartTime,
      endTime: extraEndTime,
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Tab Controls */}
      <div className="p-4 rounded-2xl glass-panel flex items-center justify-between text-xs">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setActiveSubTab('cancel')}
            className={`px-4 py-2 rounded-xl font-bold transition-all ${
              activeSubTab === 'cancel'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Class Cancellation Notice ({cancellations.length})
          </button>

          <button
            onClick={() => setActiveSubTab('extra')}
            className={`px-4 py-2 rounded-xl font-bold transition-all ${
              activeSubTab === 'extra'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Schedule Extra Class ({extraClasses.length})
          </button>
        </div>

        <span className="text-[10px] font-mono text-indigo-400 font-bold hidden sm:inline">
          AUTOMATED STUDENT NOTIFICATION ENGINES ACTIVE
        </span>
      </div>

      {activeSubTab === 'cancel' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Cancel Form */}
          <div className="p-6 rounded-3xl glass-panel border border-rose-500/30">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <XCircle className="w-4 h-4 text-rose-400" />
              Cancel Scheduled Class
            </h3>

            <form onSubmit={handleCancelSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Subject</label>
                <select
                  value={cancelSubject}
                  onChange={(e) => setCancelSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl glass-input text-slate-200 bg-slate-900"
                >
                  {subjects.map(s => (
                    <option key={s.id} value={s.code}>{s.code} - {s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Date of Cancellation</label>
                <input
                  type="date"
                  required
                  value={cancelDate}
                  onChange={(e) => setCancelDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl glass-input text-slate-200"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Reason for Cancellation</label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl glass-input text-slate-200 bg-slate-900 mb-2"
                >
                  <option value="Departmental Academic Audit">Departmental Academic Audit</option>
                  <option value="Faculty Official Duty">Faculty Official Duty</option>
                  <option value="International Research Conference">International Research Conference</option>
                  <option value="Medical Leave">Medical Leave</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold shadow-lg shadow-rose-600/30 flex items-center justify-center space-x-2 transition-all"
              >
                <Bell className="w-4 h-4" />
                <span>Cancel Class & Notify Students</span>
              </button>
            </form>
          </div>

          {/* Cancellation Log (2 cols) */}
          <div className="lg:col-span-2 p-6 rounded-3xl glass-panel">
            <h3 className="text-sm font-bold text-white mb-4">
              Cancellation History & Student Notifications
            </h3>

            <div className="space-y-3">
              {cancellations.length > 0 ? (
                cancellations.map((c) => (
                  <div key={c.id} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-mono font-bold text-rose-400">{c.subjectCode} - {c.subjectName}</span>
                      <p className="text-slate-300 font-semibold mt-0.5">Faculty: {c.facultyName}</p>
                      <p className="text-slate-400 text-[10px]">Date: {c.date} • Reason: {c.reason}</p>
                    </div>

                    <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 font-mono font-bold text-[10px]">
                      CANCELLED & NOTIFIED
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-slate-500 text-xs">
                  No classes cancelled yet.
                </div>
              )}
            </div>
          </div>

        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Extra Class Scheduler Form */}
          <div className="p-6 rounded-3xl glass-panel border border-indigo-500/30">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-400" />
              Schedule Extra Remedial Session
            </h3>

            <form onSubmit={handleExtraSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Subject</label>
                <select
                  value={extraSubject}
                  onChange={(e) => setExtraSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl glass-input text-slate-200 bg-slate-900"
                >
                  {subjects.map(s => (
                    <option key={s.id} value={s.code}>{s.code} - {s.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Dept</label>
                  <select
                    value={extraDept}
                    onChange={(e) => setExtraDept(e.target.value as Department)}
                    className="w-full px-2 py-2 rounded-xl glass-input text-slate-200 bg-slate-900"
                  >
                    <option value="Computer Science">CSE</option>
                    <option value="AI & Data Science">AI-DS</option>
                    <option value="Electronics & Comm.">ECE</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Sem</label>
                  <select
                    value={extraSem}
                    onChange={(e) => setExtraSem(Number(e.target.value) as Semester)}
                    className="w-full px-2 py-2 rounded-xl glass-input text-slate-200 bg-slate-900"
                  >
                    {[1,2,3,4,5,6,7,8].map(s => (
                      <option key={s} value={s}>Sem {s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Sec</label>
                  <select
                    value={extraSec}
                    onChange={(e) => setExtraSec(e.target.value as Section)}
                    className="w-full px-2 py-2 rounded-xl glass-input text-slate-200 bg-slate-900"
                  >
                    {['A', 'B', 'C', 'D'].map(s => (
                      <option key={s} value={s}>Sec {s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Classroom & Date</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    value={extraRoom}
                    onChange={(e) => setExtraRoom(e.target.value)}
                    placeholder="Lab 302"
                    className="w-full px-3 py-2 rounded-xl glass-input text-slate-200"
                  />
                  <input
                    type="date"
                    required
                    value={extraDate}
                    onChange={(e) => setExtraDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl glass-input text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Start Time</label>
                  <select
                    value={extraStartTime}
                    onChange={(e) => setExtraStartTime(e.target.value)}
                    className="w-full px-2 py-2 rounded-xl glass-input text-slate-200 bg-slate-900"
                  >
                    {['04:00 PM', '05:00 PM', '06:00 PM'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">End Time</label>
                  <select
                    value={extraEndTime}
                    onChange={(e) => setExtraEndTime(e.target.value)}
                    className="w-full px-2 py-2 rounded-xl glass-input text-slate-200 bg-slate-900"
                  >
                    {['05:00 PM', '06:00 PM', '07:00 PM'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>Schedule Extra Session</span>
              </button>
            </form>
          </div>

          {/* Extra Classes Log (2 cols) */}
          <div className="lg:col-span-2 p-6 rounded-3xl glass-panel">
            <h3 className="text-sm font-bold text-white mb-4">
              Scheduled Extra Classes (Attendance Locked to Slot Time)
            </h3>

            <div className="space-y-3">
              {extraClasses.length > 0 ? (
                extraClasses.map((ex) => (
                  <div key={ex.id} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-mono font-bold text-indigo-400">{ex.subjectCode} - {ex.subjectName}</span>
                      <p className="text-slate-300 font-semibold mt-0.5">
                        {ex.department} Sem {ex.semester} ({ex.section}) • {ex.classroom}
                      </p>
                      <p className="text-slate-400 text-[10px]">Date: {ex.date} ({ex.startTime} - {ex.endTime})</p>
                    </div>

                    <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 font-mono font-bold text-[10px]">
                      SCHEDULED & NOTIFIED
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-slate-500 text-xs">
                  No extra classes scheduled yet.
                </div>
              )}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
