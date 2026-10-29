'use client';

import React, { useState } from 'react';
import { useAttendance } from '@/context/AttendanceContext';
import { CreateEventModal } from './CreateEventModal';
import { ActiveEventPanel } from './ActiveEventPanel';
import { ClassTeacherEventNotifications } from './ClassTeacherEventNotifications';
import { StudentEventHistoryModal } from './StudentEventHistoryModal';
import { Student, EventItem } from '@/types';
import { RefreshButton } from '@/components/Common/RefreshButton';
import { Calendar, Plus, Radio, Users, Bell, Sparkles, Clock, MapPin, Play, Square, CheckCircle2, Search, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const EventsModule: React.FC = () => {
  const { events, activeEvent, startEventAttendance, stopEventAttendance, students } = useAttendance();

  const [activeSubTab, setActiveSubTab] = useState<'ACTIVE' | 'ALL_EVENTS' | 'NOTIFICATIONS' | 'STUDENT_HISTORY'>('ACTIVE');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedHistoryStudent, setSelectedHistoryStudent] = useState<Student | null>(null);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
    (s.uucmsNo || '').toLowerCase().includes(studentSearchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Top Header Banner */}
      <div className="p-6 rounded-3xl glass-panel bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 border border-purple-500/40 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-purple-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Calendar className="w-4 h-4" />
            <span>Multi-Department College Events Attendance Module</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            CAIAS Events Management Hub
            <Sparkles className="w-5 h-5 text-amber-400" />
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            RFID + Face dual verification for college-wide workshops, hackathons, and symposiums.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <RefreshButton />

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-extrabold text-xs shadow-xl shadow-indigo-600/30 flex items-center space-x-2 transition-all transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create Event</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB NAVIGATION */}
      <div className="p-2 rounded-2xl glass-panel flex flex-wrap items-center gap-2 text-xs">
        <button
          onClick={() => setActiveSubTab('ACTIVE')}
          className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center space-x-2 ${
            activeSubTab === 'ACTIVE'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Radio className="w-4 h-4 text-rose-400 animate-pulse" />
          <span>Active Event Scanner ({activeEvent ? 1 : 0})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('ALL_EVENTS')}
          className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center space-x-2 ${
            activeSubTab === 'ALL_EVENTS'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>All College Events ({events.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('NOTIFICATIONS')}
          className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center space-x-2 ${
            activeSubTab === 'NOTIFICATIONS'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Bell className="w-4 h-4 text-indigo-400" />
          <span>Class Teacher Notifications</span>
        </button>

        <button
          onClick={() => setActiveSubTab('STUDENT_HISTORY')}
          className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center space-x-2 ${
            activeSubTab === 'STUDENT_HISTORY'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Users className="w-4 h-4 text-emerald-400" />
          <span>Student Event History</span>
        </button>
      </div>

      {/* SUB-TAB VIEWS */}
      {activeSubTab === 'ACTIVE' && <ActiveEventPanel />}

      {activeSubTab === 'NOTIFICATIONS' && <ClassTeacherEventNotifications />}

      {activeSubTab === 'ALL_EVENTS' && (
        <div className="p-6 rounded-3xl glass-panel space-y-4">
          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-400" />
            Registered College Events List
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {events.map((ev) => {
              const isActive = ev.status === 'ACTIVE';

              return (
                <div
                  key={ev.id}
                  className={`p-5 rounded-2xl border transition-all space-y-3 shadow-lg ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-950/40 via-slate-900 to-indigo-950/40 border-purple-500/40'
                      : 'bg-slate-900/60 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      isActive
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                        : ev.status === 'COMPLETED'
                        ? 'bg-slate-800 text-slate-400 border border-slate-700'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      ● {ev.status}
                    </span>

                    <span className="text-xs font-mono text-slate-400">
                      {ev.date} • {ev.startTime} - {ev.endTime}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-lg font-extrabold text-white">{ev.name}</h4>
                    <p className="text-xs text-purple-300 mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{ev.venue}</span>
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                    <span className="text-slate-400">
                      Coordinator: <strong className="text-slate-200">{ev.coordinatorName}</strong>
                    </span>

                    <div>
                      {isActive ? (
                        <button
                          onClick={() => stopEventAttendance(ev.id)}
                          className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
                        >
                          Stop Attendance
                        </button>
                      ) : (
                        <button
                          onClick={() => startEventAttendance(ev.id)}
                          className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center space-x-1"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Start Event Attendance</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeSubTab === 'STUDENT_HISTORY' && (
        <div className="p-6 rounded-3xl glass-panel space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" />
                Select Student for Event Attendance History
              </h3>
              <p className="text-xs text-slate-400">
                View independent event participation records without affecting class attendance.
              </p>
            </div>

            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={studentSearchTerm}
                onChange={(e) => setStudentSearchTerm(e.target.value)}
                placeholder="Search student by name or USN..."
                className="w-full pl-9 pr-3 py-2 rounded-xl glass-input text-xs text-slate-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            {filteredStudents.map((s) => (
              <div
                key={s.id}
                onClick={() => setSelectedHistoryStudent(s)}
                className="p-4 rounded-2xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 flex items-center justify-between cursor-pointer group transition-all"
              >
                <div className="flex items-center space-x-3">
                  <img src={s.avatar} alt={s.name} className="w-9 h-9 rounded-xl object-cover ring-1 ring-slate-700" />
                  <div>
                    <p className="font-bold text-white group-hover:text-indigo-400 transition-colors">{s.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{s.uucmsNo || s.rollNo} • {s.course} {s.section}</p>
                  </div>
                </div>

                <Eye className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      <CreateEventModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {/* Student Event History Modal */}
      <StudentEventHistoryModal
        student={selectedHistoryStudent}
        onClose={() => setSelectedHistoryStudent(null)}
      />

    </div>
  );
};
