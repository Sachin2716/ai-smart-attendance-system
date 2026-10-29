'use client';

import React, { useState } from 'react';
import { useAttendance } from '@/context/AttendanceContext';
import { TimetableSlot, DayOfWeek } from '@/types';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin, XCircle, RefreshCw, CheckCircle2, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const MonthlyCalendar: React.FC = () => {
  const { timetable, cancellations, swapRequests, startSession } = useAttendance();

  const [currentDate, setCurrentDate] = useState(new Date(2026, 7, 1)); // August 2026
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(2026, 7, 6)); // Today (Aug 6, 2026)
  const [selectedDateSlots, setSelectedDateSlots] = useState<TimetableSlot[]>([]);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Calculate days in month
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleDateClick = (dayNumber: number) => {
    const clickedDate = new Date(year, month, dayNumber);
    setSelectedDate(clickedDate);

    const dayNameMap: DayOfWeek[] = ['Sunday' as DayOfWeek, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeekName = dayNameMap[clickedDate.getDay()];

    const slots = timetable.filter(s => s.day === dayOfWeekName);
    setSelectedDateSlots(slots);
    setIsInspectorOpen(true);
  };

  const isToday = (dayNumber: number) => {
    const now = new Date(2026, 7, 6);
    return dayNumber === now.getDate() && month === now.getMonth() && year === now.getFullYear();
  };

  return (
    <div className="p-6 rounded-3xl glass-panel relative overflow-hidden border border-slate-800">
      
      {/* Calendar Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-2xl bg-indigo-600/10 text-indigo-400 border border-indigo-500/20">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white">
              {monthNames[month]} {year}
            </h3>
            <p className="text-xs text-slate-400">
              Interactive Faculty Academic Calendar
            </p>
          </div>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center space-x-2">
          <button
            onClick={prevMonth}
            className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-slate-300 transition-all"
            title="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-xs font-mono font-bold text-indigo-400 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
            {monthNames[month]}
          </span>

          <button
            onClick={nextMonth}
            className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-slate-300 transition-all"
            title="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Days of Week Header */}
      <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
        {daysOfWeek.map((d) => (
          <div key={d} className="py-1">{d}</div>
        ))}
      </div>

      {/* Calendar Days Grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Empty Padding Slots */}
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} className="min-h-[70px] p-1.5 rounded-2xl bg-slate-900/20 border border-transparent opacity-30" />
        ))}

        {/* Actual Month Days */}
        {Array.from({ length: totalDays }).map((_, i) => {
          const dayNum = i + 1;
          const dayDate = new Date(year, month, dayNum);
          const dayNameMap: DayOfWeek[] = ['Sunday' as DayOfWeek, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          const dayName = dayNameMap[dayDate.getDay()];

          const daySlots = timetable.filter(s => s.day === dayName);
          const dayCancellations = cancellations.filter(c => c.date.endsWith(`-0${dayNum}`) || c.date.endsWith(`-${dayNum}`));
          const daySwaps = swapRequests.filter(s => s.status === 'APPROVED');

          const isCurrentToday = isToday(dayNum);

          return (
            <motion.div
              key={dayNum}
              whileHover={{ scale: 1.02 }}
              onClick={() => handleDateClick(dayNum)}
              className={`min-h-[75px] p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                isCurrentToday
                  ? 'bg-indigo-950/40 border-indigo-500 shadow-lg shadow-indigo-500/20 ring-1 ring-indigo-400'
                  : 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <span className={`font-mono font-bold px-1.5 py-0.5 rounded-lg ${
                  isCurrentToday ? 'bg-indigo-600 text-white' : 'text-slate-300'
                }`}>
                  {dayNum}
                </span>

                {daySlots.length > 0 && (
                  <span className="text-[9px] font-mono text-indigo-400 font-bold">
                    {daySlots.length} Classes
                  </span>
                )}
              </div>

              {/* Status Badges */}
              <div className="space-y-1 mt-1">
                {daySlots.slice(0, 2).map((s) => (
                  <div key={s.id} className="truncate px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                    {s.subjectCode} ({s.startTime.slice(0, 5)})
                  </div>
                ))}

                {dayCancellations.length > 0 && (
                  <div className="truncate px-1 py-0.5 rounded text-[8px] font-bold bg-rose-500/20 text-rose-300 flex items-center gap-1">
                    <XCircle className="w-2.5 h-2.5" />
                    <span>Cancelled</span>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Legend Footer */}
      <div className="mt-6 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
            <span className="text-slate-300 font-medium">Class Scheduled</span>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="text-slate-300 font-medium">Short / Lunch Break</span>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span className="text-slate-300 font-medium">Cancelled Class</span>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-slate-300 font-medium">Swapped Class</span>
          </div>
        </div>
      </div>

      {/* Date Inspection Modal Popup */}
      <AnimatePresence>
        {isInspectorOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg p-6 rounded-3xl glass-panel border border-slate-700/60 shadow-2xl overflow-hidden"
            >
              <button
                onClick={() => setIsInspectorOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all"
              >
                ✕
              </button>

              <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-indigo-400" />
                Schedule for {selectedDate.toDateString()}
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Detailed view of class slots, room numbers & breaks
              </p>

              <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                {selectedDateSlots.length > 0 ? (
                  selectedDateSlots.map((slot) => (
                    <div key={slot.id} className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-mono font-bold text-indigo-400">{slot.subjectCode} - {slot.subjectName}</span>
                        <p className="text-slate-300 font-semibold mt-0.5">{slot.department} Sem {slot.semester} ({slot.section})</p>
                        <p className="text-slate-400 text-[10px] flex items-center gap-2 mt-1">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-indigo-400" /> {slot.startTime} - {slot.endTime}</span>
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-purple-400" /> {slot.classroom}</span>
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          setIsInspectorOpen(false);
                          startSession(slot.subjectCode, slot.department, slot.semester, slot.section, slot.classroom);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px]"
                      >
                        Start Session
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-slate-500 text-xs">
                    No classes scheduled on this date.
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
