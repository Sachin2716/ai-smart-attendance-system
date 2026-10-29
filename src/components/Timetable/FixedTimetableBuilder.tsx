'use client';

import React, { useState } from 'react';
import { useAttendance } from '@/context/AttendanceContext';
import { TimetableSlot, DayOfWeek, CourseClass, Semester, Section, TimetableValidationError } from '@/types';
import { parseTimetableExcel, validateTimetableSlots, downloadSampleTimetableTemplate } from '@/utils/timetableImporter';
import { Clock, Plus, Trash2, Lock, FileSpreadsheet, AlertTriangle, Sparkles, MapPin, X, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { useAuth } from '@/context/AuthContext';

export const FixedTimetableBuilder: React.FC = () => {
  const { timetable, addTimetableSlot, deleteTimetableSlot, setTimetableSlots, selectedCourse, selectedSemester, selectedSection } = useAttendance();
  const { isAdmin } = useAuth();

  const [activeDay, setActiveDay] = useState<DayOfWeek>('Monday');

  // Form State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [subjectCode, setSubjectCode] = useState('CS301');
  const [subjectName, setSubjectName] = useState('Database Management Systems');
  const [classroom, setClassroom] = useState('Room 201');
  const [startTime, setStartTime] = useState('10:00 AM');
  const [endTime, setEndTime] = useState('11:00 AM');

  // Validation State
  const [validationErrors, setValidationErrors] = useState<TimetableValidationError[]>([]);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);

  const days: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const filteredSlots = timetable.filter(
    s => s.day === activeDay &&
         s.course === selectedCourse &&
         s.semester === selectedSemester &&
         s.section === selectedSection
  );

  const handleCreateSlot = (e: React.FormEvent) => {
    e.preventDefault();

    const candidateSlot: TimetableSlot = {
      id: `SLOT-NEW-${Date.now()}`,
      facultyId: 'FAC-101',
      facultyName: 'Dr. Alan Turing',
      subjectCode,
      subjectName,
      course: selectedCourse,
      department: 'Computer Science',
      semester: selectedSemester,
      section: selectedSection,
      classroom,
      day: activeDay,
      startTime,
      endTime,
    };

    const errors = validateTimetableSlots([candidateSlot], timetable);

    if (errors.length > 0) {
      setValidationErrors(errors);
      setIsErrorModalOpen(true);
      return;
    }

    addTimetableSlot(candidateSlot);
    setIsAddModalOpen(false);
  };

  const handleTimetableExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const preview = await parseTimetableExcel(file, timetable);
      if (preview.errors.length > 0) {
        setValidationErrors(preview.errors);
        setIsErrorModalOpen(true);
      } else {
        setTimetableSlots([...timetable, ...preview.slots]);
      }
    } catch (err) {
      console.error('Timetable import error:', err);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Actions */}
      <div className="p-6 rounded-3xl glass-panel flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Clock className="w-4 h-4" />
            <span>{isAdmin ? 'Master Class Schedule Builder' : 'My Assigned Class Schedule'}</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white">
            {selectedCourse} - Sem {selectedSemester} ({selectedSection}) Timetable
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {isAdmin ? 'Organized by time blocks with room conflict protection.' : 'View weekly and daily class schedule for assigned subjects and rooms.'}
          </p>
        </div>

        {isAdmin ? (
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={downloadSampleTimetableTemplate}
              className="px-3.5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-emerald-400 font-bold text-xs flex items-center space-x-1.5 shadow-sm"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Sample Template</span>
            </button>

            <label className="px-4 py-2.5 rounded-2xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center space-x-2 transition-all cursor-pointer shadow-sm">
              <FileSpreadsheet className="w-4 h-4" />
              <span>Import Timetable Excel</span>
              <input type="file" accept=".xlsx, .xls, .csv, .txt" onChange={handleTimetableExcelUpload} className="hidden" />
            </label>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center space-x-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Class Slot</span>
            </button>
          </div>
        ) : (
          <div className="px-3.5 py-2 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 font-bold text-xs flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Timetable Editing Restricted to Admin</span>
          </div>
        )}
      </div>

      {/* DAY TABS SELECTOR */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1">
        {days.map((d) => (
          <button
            key={d}
            onClick={() => setActiveDay(d)}
            className={`px-5 py-3 rounded-2xl text-xs font-extrabold transition-all whitespace-nowrap ${
              activeDay === d
                ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 text-white shadow-xl shadow-indigo-600/25'
                : 'glass-panel text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      {/* VISUALLY DISTINCT TIMETABLE CARDS GRID */}
      <div className="p-6 rounded-3xl glass-panel space-y-4">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          {activeDay} Schedule Time Blocks ({filteredSlots.length} Slots)
        </h3>

        {filteredSlots.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs space-y-2 border border-dashed border-slate-800 rounded-2xl">
            <Clock className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="font-bold text-slate-300">No upcoming classes</p>
            <p>Your timetable is clear for {activeDay}. Click "+ Add Class Slot" to build schedule.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSlots.map((s) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 hover:border-indigo-500/40 transition-all space-y-3 shadow-lg group relative"
              >
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-mono text-xs font-bold">
                    {s.startTime} — {s.endTime}
                  </span>

                  {isAdmin && (
                    <button
                      onClick={() => deleteTimetableSlot(s.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                      title="Delete Slot"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div>
                  <h4 className="font-extrabold text-white text-base group-hover:text-indigo-300 transition-colors">
                    {s.subjectName}
                  </h4>
                  <p className="text-xs text-indigo-400 font-mono font-bold mt-0.5">
                    {s.subjectCode}
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-300 pt-2 border-t border-slate-800">
                  <span className="font-semibold">
                    Class: <strong className="text-slate-100">{s.course} Sem {s.semester} ({s.section})</strong>
                  </span>

                  <span className="flex items-center space-x-1 text-purple-300 font-bold">
                    <MapPin className="w-3.5 h-3.5 text-purple-400" />
                    <span>{s.classroom}</span>
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ADD SLOT MODAL */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md p-6 rounded-3xl glass-panel border border-indigo-500/40 shadow-2xl space-y-4 text-xs"
            >
              <button onClick={() => setIsAddModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-lg font-extrabold text-white">Add Timetable Slot for {activeDay}</h3>

              <form onSubmit={handleCreateSlot} className="space-y-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Subject Code & Name</label>
                  <input
                    type="text"
                    required
                    value={subjectCode}
                    onChange={(e) => setSubjectCode(e.target.value)}
                    placeholder="Subject Code (e.g. CS301)"
                    className="w-full px-3 py-2 rounded-xl glass-input text-slate-200 mb-2 font-mono"
                  />
                  <input
                    type="text"
                    required
                    value={subjectName}
                    onChange={(e) => setSubjectName(e.target.value)}
                    placeholder="Subject Name"
                    className="w-full px-3 py-2 rounded-xl glass-input text-slate-200"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Start Time</label>
                    <input
                      type="text"
                      required
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      placeholder="10:00 AM"
                      className="w-full px-3 py-2 rounded-xl glass-input text-slate-200 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">End Time</label>
                    <input
                      type="text"
                      required
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      placeholder="11:00 AM"
                      className="w-full px-3 py-2 rounded-xl glass-input text-slate-200 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Classroom / Hall</label>
                  <input
                    type="text"
                    required
                    value={classroom}
                    onChange={(e) => setClassroom(e.target.value)}
                    placeholder="Room 201"
                    className="w-full px-3 py-2 rounded-xl glass-input text-slate-200"
                  />
                </div>

                <div className="pt-3 flex items-center justify-end space-x-3 border-t border-slate-800">
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-slate-400 hover:text-white">
                    Cancel
                  </button>
                  <button type="submit" className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold shadow-lg">
                    Save Slot
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* VALIDATION ERROR MODAL */}
      <AnimatePresence>
        {isErrorModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg p-6 rounded-3xl glass-panel border border-rose-500/50 shadow-2xl space-y-4 text-xs"
            >
              <button onClick={() => setIsErrorModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center space-x-3 text-rose-400">
                <AlertTriangle className="w-7 h-7" />
                <div>
                  <h3 className="text-lg font-extrabold text-white">Timetable Validation Blocked</h3>
                  <p className="text-xs text-rose-300">Errors detected! Resolve conflicts before saving.</p>
                </div>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {validationErrors.map((err, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 font-mono text-[11px]">
                    🚨 {err.message}
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setIsErrorModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
