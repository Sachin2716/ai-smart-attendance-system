'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { CalendarDays, Clock, MapPin, School, RefreshCw } from 'lucide-react';

export default function FacultyTimetablePage() {
  const [timetable, setTimetable] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTimetable = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/faculty/dashboard');
      const data = await res.json();
      if (res.ok && data.success) {
        const resSlots = await fetch(`/api/admin/timetable?facultyId=${data.faculty.id}`);
        const slotData = await resSlots.json();
        if (slotData.success) {
          setTimetable(slotData.slots);
        }
      }
    } catch (e) {
      toast.error('Failed to load timetable');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTimetable();
  }, []);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-[#18181B] border border-[#27272A] shadow-xl shadow-black/40 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#22D3EE] to-transparent opacity-80" />

        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950/70 text-[#22D3EE] border border-cyan-500/30 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              FACULTY TIMETABLE
            </span>
            <span className="text-xs text-[#9CA3AF] font-mono">• BCA AIML Section B</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#F9FAFB] flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-[#22D3EE]" />
            Weekly Teaching Timetable
          </h1>
          <p className="text-xs text-[#9CA3AF] mt-1">
            Weekly scheduled lectures, designated laboratories, and classroom allocations.
          </p>
        </div>

        <button
          onClick={fetchTimetable}
          className="p-2.5 rounded-xl bg-[#111318] hover:bg-[#27272A] text-[#9CA3AF] hover:text-[#F9FAFB] border border-[#27272A] transition-all cursor-pointer self-start sm:self-auto"
          title="Refresh Schedule"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {daysOfWeek.map((day) => {
          const daySlots = timetable.filter((s) => s.dayOfWeek === day);
          return (
            <div key={day} className="p-5 rounded-2xl bg-[#18181B] border border-[#27272A] space-y-3 shadow-xl shadow-black/40 card-hover-effect">
              <div className="flex items-center justify-between pb-2 border-b border-[#27272A]">
                <h3 className="font-bold text-sm text-white">{day}</h3>
                <span className="text-[10px] font-mono bg-cyan-950/60 text-[#22D3EE] border border-cyan-500/30 px-2 py-0.5 rounded">
                  {daySlots.length} Classes
                </span>
              </div>

              <div className="space-y-2 mt-2">
                {daySlots.map((s) => (
                  <div
                    key={s.id}
                    className="p-3 rounded-xl bg-[#111318] border border-[#27272A] hover:border-cyan-500/40 transition-all space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-bold text-cyan-400 bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-500/30">
                        {s.course.code}
                      </span>
                      <span className="text-[10px] text-[#9CA3AF] flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3 text-[#9CA3AF]" />
                        {s.startTime} - {s.endTime}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-white line-clamp-1">{s.course.name}</p>

                    <div className="flex items-center justify-between text-[11px] text-[#9CA3AF] pt-1 border-t border-[#27272A]">
                      <span className="font-mono text-cyan-400 text-[10px]">{s.classSection?.fullLabel}</span>
                      <span className="flex items-center gap-1 font-mono text-[10px] text-[#9CA3AF]">
                        <MapPin className="w-3 h-3 text-cyan-400" />
                        {s.roomNumber}
                      </span>
                    </div>
                  </div>
                ))}

                {daySlots.length === 0 && (
                  <p className="py-6 text-center text-xs text-[#9CA3AF] italic">No lectures assigned</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
