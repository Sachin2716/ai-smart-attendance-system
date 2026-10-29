'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Users,
  Play,
  CalendarCheck,
  Clock,
  MapPin,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  RefreshCw,
  Sparkles,
  Cpu,
} from 'lucide-react';

export default function FacultyDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboard = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/faculty/dashboard');
      const json = await res.json();
      if (res.ok && json.success) {
        setData(json);
      } else {
        toast.error(json.error || 'Failed to load faculty dashboard');
      }
    } catch (e) {
      toast.error('Network error loading faculty dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 bg-[#18181B] border border-[#27272A] rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-[#18181B] border border-[#27272A] rounded-2xl" />
          ))}
        </div>
        <div className="h-64 bg-[#18181B] border border-[#27272A] rounded-2xl" />
      </div>
    );
  }

  const faculty = data?.faculty;
  const todayTimetable = data?.todayTimetable || [];
  const sessionsToday = data?.sessionsToday || [];
  const stats = data?.stats || {
    totalAssignedClasses: 0,
    sessionsConductedToday: 0,
    completedSessionsCount: 0,
    pendingReviewCount: 0,
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 rounded-2xl bg-[#18181B] border border-[#27272A] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl shadow-black/40 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#22D3EE] to-transparent opacity-80" />

        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950/70 text-[#22D3EE] border border-cyan-500/30 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              FACULTY COMMAND CENTER
            </span>
            <span className="text-xs text-[#9CA3AF] font-mono">• {faculty?.employeeId}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#F9FAFB]">Welcome Back, {faculty?.name}</h1>
          <p className="text-xs text-[#9CA3AF] mt-1 font-mono">
            {faculty?.designation} • Department of {faculty?.department?.name}
          </p>
        </div>

        <div className="flex items-center space-x-3 self-start sm:self-auto">
          <button
            onClick={fetchDashboard}
            className="p-2.5 rounded-xl bg-[#111318] hover:bg-[#27272A] text-[#9CA3AF] hover:text-[#F9FAFB] border border-[#27272A] transition-all cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => router.push('/faculty/attendance')}
            className="px-5 py-2.5 rounded-xl bg-[#3B82F6] hover:bg-blue-600 active:scale-98 text-white font-semibold text-xs shadow-lg shadow-blue-500/20 flex items-center space-x-2 transition-all cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current text-cyan-200" />
            <span>Take Attendance Now</span>
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => router.push('/faculty/classes')}
          className="p-5 rounded-2xl bg-[#18181B] border border-[#27272A] hover:border-blue-500/40 transition-all cursor-pointer space-y-2 card-hover-effect group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#9CA3AF] font-medium">Assigned Classes</span>
            <div className="p-2 rounded-xl bg-blue-600/15 border border-blue-500/30 text-blue-400 group-hover:scale-105 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white">{stats.totalAssignedClasses}</p>
          <p className="text-[11px] text-[#9CA3AF] font-mono">Active Course Allocations</p>
        </div>

        <div
          onClick={() => router.push('/faculty/timetable')}
          className="p-5 rounded-2xl bg-[#18181B] border border-[#27272A] hover:border-cyan-500/40 transition-all cursor-pointer space-y-2 card-hover-effect group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#9CA3AF] font-medium">Today's Lectures</span>
            <div className="p-2 rounded-xl bg-cyan-600/15 border border-cyan-500/30 text-[#22D3EE] group-hover:scale-105 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white">{todayTimetable.length}</p>
          <p className="text-[11px] text-cyan-400 font-mono">Scheduled for Today</p>
        </div>

        <div
          onClick={() => router.push('/faculty/history')}
          className="p-5 rounded-2xl bg-[#18181B] border border-[#27272A] hover:border-blue-500/40 transition-all cursor-pointer space-y-2 card-hover-effect group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#9CA3AF] font-medium">Sessions Today</span>
            <div className="p-2 rounded-xl bg-blue-600/15 border border-blue-500/30 text-blue-400 group-hover:scale-105 transition-transform">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white">{sessionsToday.length}</p>
          <p className="text-[11px] text-blue-400 font-mono">Conducted Sessions</p>
        </div>

        <div
          onClick={() => router.push('/faculty/corrections')}
          className="p-5 rounded-2xl bg-[#18181B] border border-[#27272A] hover:border-amber-500/40 transition-all cursor-pointer space-y-2 card-hover-effect group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#9CA3AF] font-medium">Pending Disputes</span>
            <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-[#F59E0B] group-hover:scale-105 transition-transform">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white">{stats.pendingReviewCount}</p>
          <p className="text-[11px] text-[#F59E0B] font-mono">Awaiting Your Review</p>
        </div>
      </div>

      {/* Today's Timetable Section */}
      <div className="p-6 rounded-2xl bg-[#18181B] border border-[#27272A] space-y-4 shadow-xl shadow-black/40">
        <div className="flex items-center justify-between pb-3 border-b border-[#27272A]">
          <div>
            <h2 className="text-base font-bold text-white">Today's Teaching Schedule</h2>
            <p className="text-xs text-[#9CA3AF]">Click any scheduled slot to launch live attendance session</p>
          </div>
          <span className="text-xs text-[#9CA3AF] font-mono bg-[#111318] px-2 py-1 rounded border border-[#27272A]">
            {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {todayTimetable.map((slot: any) => (
            <div
              key={slot.id}
              onClick={() => router.push('/faculty/attendance')}
              className="p-4 rounded-xl bg-[#111318] border border-[#27272A] hover:border-cyan-500/40 transition-all cursor-pointer space-y-2 group card-hover-effect"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-500/30">
                  {slot.course.code}
                </span>
                <span className="text-[10px] text-[#9CA3AF] font-mono flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#9CA3AF]" />
                  {slot.startTime} - {slot.endTime}
                </span>
              </div>

              <h3 className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
                {slot.course.name}
              </h3>

              <div className="flex items-center justify-between text-xs text-[#9CA3AF] pt-2 border-t border-[#27272A]">
                <span className="font-medium text-slate-300">Class {slot.classSection.fullLabel}</span>
                <span className="flex items-center gap-1 text-[11px] text-[#9CA3AF] font-mono">
                  <MapPin className="w-3 h-3 text-cyan-400" />
                  {slot.roomNumber}
                </span>
              </div>
            </div>
          ))}
          {todayTimetable.length === 0 && (
            <div className="col-span-full py-8 text-center text-[#9CA3AF] italic text-xs">
              No classes scheduled on your timetable for today.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
