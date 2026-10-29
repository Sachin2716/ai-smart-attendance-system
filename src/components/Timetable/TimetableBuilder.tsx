'use client';

import React, { useState } from 'react';
import { useAttendance } from '@/context/AttendanceContext';
import { TimetableSlot, DayOfWeek, Department, Semester, Section } from '@/types';
import { Calendar, Plus, Clock, MapPin, AlertCircle, CheckCircle2, Download, ExternalLink, Trash2, Edit3, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const TimetableBuilder: React.FC = () => {
  const { timetable, addTimetableSlot, deleteTimetableSlot, subjects, startSession } = useAttendance();

  const days: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('Thursday');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const [subjectCode, setSubjectCode] = useState('CS301');
  const [dept, setDept] = useState<Department>('Computer Science');
  const [sem, setSem] = useState<Semester>(3);
  const [sec, setSec] = useState<Section>('A');
  const [classroom, setClassroom] = useState('Lab 302');
  const [slotDay, setSlotDay] = useState<DayOfWeek>('Thursday');
  const [startTime, setStartTime] = useState('10:00 AM');
  const [endTime, setEndTime] = useState('11:00 AM');
  const [conflictError, setConflictError] = useState<string | null>(null);

  const [gcalSyncSuccess, setGcalSyncSuccess] = useState(false);

  // Check Overlapping Timetable Conflict
  const checkConflict = (newSlot: Omit<TimetableSlot, 'id' | 'facultyId'>): string | null => {
    const existing = timetable.find((s) => {
      if (s.day !== newSlot.day) return false;
      // Check time overlap
      const sameTime = s.startTime === newSlot.startTime;
      const sameRoom = s.classroom.toLowerCase() === newSlot.classroom.toLowerCase();
      const sameClass = s.department === newSlot.department && s.semester === newSlot.semester && s.section === newSlot.section;

      return sameTime && (sameRoom || sameClass);
    });

    if (existing) {
      return `TIMETABLE CONFLICT DETECTED: Overlaps with ${existing.subjectCode} (${existing.section}) on ${existing.day} at ${existing.startTime} in ${existing.classroom}.`;
    }
    return null;
  };

  const handleAddSlotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setConflictError(null);

    const subject = subjects.find(s => s.code === subjectCode);
    const subjectName = subject ? subject.name : 'Class Session';

    const slotCandidate = {
      subjectCode,
      subjectName,
      department: dept,
      semester: sem,
      section: sec,
      classroom,
      day: slotDay,
      startTime,
      endTime,
    };

    const err = checkConflict(slotCandidate);
    if (err) {
      setConflictError(err);
      return;
    }

    addTimetableSlot(slotCandidate);
    setIsAddModalOpen(false);
  };

  // Export .ics for Google Calendar
  const handleGoogleCalendarSync = () => {
    let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//ApexRFID Smart Attendance System//EN\n";
    timetable.forEach(slot => {
      icsContent += "BEGIN:VEVENT\n";
      icsContent += `SUMMARY:${slot.subjectCode} - ${slot.subjectName} (${slot.section})\n`;
      icsContent += `LOCATION:${slot.classroom}\n`;
      icsContent += `DESCRIPTION:College Class Session - Sem ${slot.semester} ${slot.section}\n`;
      icsContent += "END:VEVENT\n";
    });
    icsContent += "END:VCALENDAR";

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Faculty_Timetable_GoogleCalendarSync.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setGcalSyncSuccess(true);
    setTimeout(() => setGcalSyncSuccess(false), 4000);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="p-6 rounded-3xl glass-panel flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 mb-1">
            <Calendar className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Faculty Schedule Engine</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
            Personal Weekly Timetable Builder
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time conflict detection & Google Calendar automated synchronization
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleGoogleCalendarSync}
            className="px-4 py-2.5 rounded-2xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center space-x-2 transition-all shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Sync Google Calendar (.ics)</span>
          </button>

          <button
            onClick={() => {
              setConflictError(null);
              setIsAddModalOpen(true);
            }}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center space-x-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Class Slot</span>
          </button>
        </div>
      </div>

      {/* Google Sync Alert Banner */}
      {gcalSyncSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-3"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>
            Google Calendar Sync File Generated! Open your downloaded <strong>Faculty_Timetable_GoogleCalendarSync.ics</strong> to sync with Google Calendar / Outlook.
          </span>
        </motion.div>
      )}

      {/* Day Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2">
        {days.map((d) => {
          const count = timetable.filter(s => s.day === d).length;
          const isSelected = selectedDay === d;

          return (
            <button
              key={d}
              onClick={() => setSelectedDay(d)}
              className={`px-5 py-2.5 rounded-2xl font-bold text-xs transition-all whitespace-nowrap flex items-center space-x-2 ${
                isSelected
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'glass-panel text-slate-400 hover:text-white'
              }`}
            >
              <span>{d}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-500'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected Day Timetable Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {timetable.filter(s => s.day === selectedDay).length > 0 ? (
          timetable.filter(s => s.day === selectedDay).map((slot) => (
            <motion.div
              key={slot.id}
              layout
              className="p-5 rounded-3xl glass-panel glass-panel-hover border border-slate-800/80 relative overflow-hidden flex flex-col justify-between"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono font-bold text-xs">
                    {slot.subjectCode}
                  </span>
                  <h3 className="text-base font-extrabold text-white mt-2">
                    {slot.subjectName}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {slot.department} • Sem {slot.semester} ({slot.section})
                  </p>
                </div>

                <button
                  onClick={() => deleteTimetableSlot(slot.id)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                  title="Remove Slot"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center space-x-1.5 text-slate-300">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{slot.startTime} - {slot.endTime}</span>
                </div>

                <div className="flex items-center space-x-1.5 text-purple-400 font-semibold">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{slot.classroom}</span>
                </div>
              </div>

              <button
                onClick={() => startSession(slot.subjectCode, slot.department, slot.semester, slot.section)}
                className="mt-3 w-full py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white font-bold text-xs transition-all flex items-center justify-center space-x-2"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Launch Class Attendance Session</span>
              </button>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full p-8 text-center glass-panel text-slate-500 text-xs">
            No scheduled class slots for {selectedDay}. Click <strong>&quot;Add Class Slot&quot;</strong> to configure your timetable.
          </div>
        )}
      </div>

      {/* Add Slot Modal with Conflict Detection Alert */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg p-6 rounded-3xl glass-panel border border-slate-700/60 shadow-2xl overflow-hidden"
            >
              <h3 className="text-base font-bold text-white mb-4">Add Timetable Class Slot</h3>

              {conflictError && (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/60 text-rose-200 text-xs flex items-start space-x-2 mb-4 animate-shake">
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">TIMETABLE OVERLAP CONFLICT!</p>
                    <p className="text-[11px] text-rose-300 mt-0.5">{conflictError}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleAddSlotSubmit} className="space-y-4 text-xs">
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Subject</label>
                    <select
                      value={subjectCode}
                      onChange={(e) => setSubjectCode(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl glass-input text-slate-200 bg-slate-900"
                    >
                      {subjects.map(s => (
                        <option key={s.id} value={s.code}>{s.code} - {s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Classroom / Lab</label>
                    <input
                      type="text"
                      required
                      value={classroom}
                      onChange={(e) => setClassroom(e.target.value)}
                      placeholder="e.g. Lab 302"
                      className="w-full px-3 py-2 rounded-xl glass-input text-slate-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Department</label>
                    <select
                      value={dept}
                      onChange={(e) => setDept(e.target.value as Department)}
                      className="w-full px-2 py-2 rounded-xl glass-input text-slate-200 bg-slate-900"
                    >
                      <option value="Computer Science">Computer Science</option>
                      <option value="AI & Data Science">AI & Data Science</option>
                      <option value="Electronics & Comm.">Electronics & Comm.</option>
                      <option value="Mechanical Eng.">Mechanical Eng.</option>
                      <option value="Civil Eng.">Civil Eng.</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Semester</label>
                    <select
                      value={sem}
                      onChange={(e) => setSem(Number(e.target.value) as Semester)}
                      className="w-full px-2 py-2 rounded-xl glass-input text-slate-200 bg-slate-900"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                        <option key={s} value={s}>Sem {s}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Section</label>
                    <select
                      value={sec}
                      onChange={(e) => setSec(e.target.value as Section)}
                      className="w-full px-2 py-2 rounded-xl glass-input text-slate-200 bg-slate-900"
                    >
                      {['A', 'B', 'C', 'D'].map(s => (
                        <option key={s} value={s}>Sec {s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Day</label>
                    <select
                      value={slotDay}
                      onChange={(e) => setSlotDay(e.target.value as DayOfWeek)}
                      className="w-full px-2 py-2 rounded-xl glass-input text-slate-200 bg-slate-900"
                    >
                      {days.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Start Time</label>
                    <select
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-2 py-2 rounded-xl glass-input text-slate-200 bg-slate-900"
                    >
                      {['08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM'].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">End Time</label>
                    <select
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-2 py-2 rounded-xl glass-input text-slate-200 bg-slate-900"
                    >
                      {['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-end space-x-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-400 hover:text-white font-semibold"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold shadow-lg"
                  >
                    Save Slot to Timetable
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
