'use client';

import React from 'react';
import { useAttendance } from '@/context/AttendanceContext';
import { Clock, MapPin, CheckCircle2, Radio, Lock, Sparkles, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';

export const DashboardTimeline: React.FC = () => {
  const { timetable, activeSession, selectedCourse, selectedSemester, selectedSection, setActiveTab } = useAttendance();

  const timelineItems = [
    {
      id: 'timeline-1',
      time: '09:00 AM',
      endTime: '10:00 AM',
      subject: 'Python Programming',
      subjectCode: 'CS201',
      course: 'BCA AIML 2',
      room: 'Room 204',
      status: 'COMPLETED',
    },
    {
      id: 'timeline-2',
      time: '10:00 AM',
      endTime: '11:00 AM',
      subject: 'Database Management Systems',
      subjectCode: 'CS301',
      course: `${selectedCourse} ${selectedSemester}`,
      room: 'Room 201',
      status: activeSession ? 'LIVE' : 'UPCOMING',
    },
    {
      id: 'timeline-3',
      time: '11:15 AM',
      endTime: '12:15 PM',
      subject: 'Artificial Intelligence & ML',
      subjectCode: 'AI302',
      course: `${selectedCourse} ${selectedSemester}`,
      room: 'Room 201',
      status: 'UPCOMING',
    },
    {
      id: 'timeline-4',
      time: '12:15 PM',
      endTime: '01:15 PM',
      subject: 'Lunch & Short Break',
      subjectCode: 'BREAK',
      course: 'All Sections',
      room: 'Cafeteria / Lounge',
      status: 'LOCKED',
    },
  ];

  return (
    <div className="p-6 rounded-3xl glass-panel space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-0.5">
            <Clock className="w-4 h-4" />
            <span>Today's Class Schedule</span>
          </div>
          <h3 className="text-lg font-extrabold text-white">Vertical Timetable Timeline</h3>
        </div>

        <button
          onClick={() => setActiveTab('timetable')}
          className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-indigo-400 font-bold text-xs transition-all"
        >
          View Full Schedule →
        </button>
      </div>

      {/* Vertical Timeline */}
      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
        {timelineItems.map((item, idx) => {
          const isCompleted = item.status === 'COMPLETED';
          const isLive = item.status === 'LIVE';
          const isLocked = item.status === 'LOCKED';

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="relative group"
            >
              {/* Timeline Indicator Dot */}
              <div
                className={`absolute -left-6 top-1.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  isLive
                    ? 'bg-rose-500 border-slate-950 shadow-lg shadow-rose-500/50 animate-ping'
                    : isCompleted
                    ? 'bg-emerald-500 border-slate-950 text-slate-950'
                    : isLocked
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                    : 'bg-slate-900 border-slate-700 text-slate-400'
                }`}
              >
                {isCompleted && <CheckCircle2 className="w-3 h-3 text-slate-950 font-bold" />}
                {isLocked && <Lock className="w-3 h-3 text-amber-400" />}
              </div>

              {/* Timeline Content Card */}
              <div
                className={`p-4 rounded-2xl border transition-all ${
                  isLive
                    ? 'bg-gradient-to-r from-rose-950/40 via-slate-900 to-indigo-950/40 border-rose-500/40 shadow-lg shadow-rose-950/30'
                    : isCompleted
                    ? 'bg-slate-900/40 border-slate-800/80 opacity-85'
                    : isLocked
                    ? 'bg-slate-950/60 border-amber-500/20 text-amber-200'
                    : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 text-xs font-mono">
                      <span className="font-extrabold text-indigo-400">{item.time} – {item.endTime}</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-slate-400 font-semibold">{item.course}</span>
                    </div>

                    <h4 className="font-extrabold text-white text-sm flex items-center gap-2">
                      {item.subject}
                      {item.subjectCode !== 'BREAK' && <span className="text-xs text-indigo-300 font-mono">({item.subjectCode})</span>}
                    </h4>

                    <div className="flex items-center space-x-3 text-xs text-slate-400">
                      <span className="flex items-center space-x-1">
                        <MapPin className="w-3.5 h-3.5 text-purple-400" />
                        <span>{item.room}</span>
                      </span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {isCompleted && (
                      <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>✓ Completed</span>
                      </span>
                    )}

                    {isLive && (
                      <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center space-x-1.5 animate-pulse">
                        <Radio className="w-3.5 h-3.5 text-rose-400" />
                        <span>🔴 Live Class</span>
                      </span>
                    )}

                    {item.status === 'UPCOMING' && (
                      <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Upcoming
                      </span>
                    )}

                    {isLocked && (
                      <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-800 text-slate-400 border border-slate-700">
                        Locked Break
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
