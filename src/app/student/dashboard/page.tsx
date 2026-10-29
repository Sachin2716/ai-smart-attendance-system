'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  GraduationCap,
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Percent,
  BookOpen,
  MapPin,
  RefreshCw,
  Fingerprint,
  ChevronRight,
  ShieldAlert,
  CalendarDays,
  FileCheck,
} from 'lucide-react';

export default function StudentDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboard = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/student/dashboard');
      const json = await res.json();
      if (res.ok && json.success) {
        setData(json);
      } else {
        toast.error(json.error || 'Failed to load student dashboard');
      }
    } catch (e) {
      toast.error('Network error loading student dashboard');
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

  const student = data?.student;
  const metrics = data?.metrics || {
    totalEligibleSessions: 0,
    attendedCount: 0,
    presentCount: 0,
    absentCount: 0,
    lateCount: 0,
    excusedCount: 0,
    overallPercentage: 100,
    isLowAttendance: false,
  };
  const subjectWise = data?.subjectWise || [];
  const todayTimetable = data?.todayTimetable || [];
  const recentRecords = data?.recentRecords || [];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="p-6 rounded-2xl bg-[#18181B] border border-[#27272A] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl shadow-black/40 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#22D3EE] to-transparent opacity-80" />

        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950/70 text-[#22D3EE] border border-cyan-500/30 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              STUDENT PROFILE
            </span>
            <span className="text-xs text-[#9CA3AF] font-mono font-bold text-cyan-400">
              • {student?.rollNumber}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#F9FAFB]">Welcome, {student?.name}</h1>
          <p className="text-xs text-[#9CA3AF] mt-1 font-mono">
            {student?.department?.name} • Semester {student?.currentSemester} • Section {student?.currentSection?.sectionName} ({student?.currentSection?.fullLabel})
          </p>
        </div>

        <div className="flex items-center space-x-3 self-start sm:self-auto">
          <button
            onClick={fetchDashboard}
            className="p-2.5 rounded-xl bg-[#111318] hover:bg-[#27272A] text-[#9CA3AF] hover:text-[#F9FAFB] border border-[#27272A] transition-all duration-200 cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Low Attendance Warning Alert Banner */}
      {metrics.isLowAttendance && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 flex items-start space-x-3 shadow-lg"
        >
          <ShieldAlert className="w-5 h-5 text-[#EF4444] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-rose-200">STATUTORY ATTENDANCE WARNING (&lt; 75%)</h3>
            <p className="text-xs text-rose-300/90 leading-relaxed">
              Your overall attendance is currently <strong>{metrics.overallPercentage}%</strong>, which is below the mandatory university threshold of 75%. You risk exam debarment. Please meet your faculty advisor.
            </p>
          </div>
        </motion.div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#18181B] border border-[#27272A] space-y-2 card-hover-effect">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#9CA3AF] font-medium">Aggregate Attendance</span>
            <div className="p-2 rounded-xl bg-blue-600/15 border border-blue-500/30 text-blue-400">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <p
            className={`text-2xl font-black ${
              metrics.overallPercentage >= 75 ? 'text-[#22C55E]' : 'text-[#EF4444]'
            }`}
          >
            {metrics.overallPercentage}%
          </p>
          <p className="text-[11px] text-[#9CA3AF] font-mono">
            {metrics.attendedCount} of {metrics.totalEligibleSessions} Sessions
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#18181B] border border-emerald-500/30 space-y-2 card-hover-effect bg-gradient-to-b from-[#18181B] to-emerald-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs text-emerald-400 font-medium">Present Sessions</span>
            <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-[#22C55E]">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#22C55E]">{metrics.presentCount}</p>
          <p className="text-[11px] text-[#9CA3AF] font-mono">Verified Classroom Presence</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#18181B] border border-rose-500/30 space-y-2 card-hover-effect bg-gradient-to-b from-[#18181B] to-rose-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs text-rose-400 font-medium">Absences Recorded</span>
            <div className="p-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-[#EF4444]">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#EF4444]">{metrics.absentCount}</p>
          <p className="text-[11px] text-[#9CA3AF] font-mono">
            {metrics.excusedCount > 0 ? `+${metrics.excusedCount} Excused Leave` : 'Missed Lectures'}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#18181B] border border-cyan-500/30 space-y-2 card-hover-effect bg-gradient-to-b from-[#18181B] to-cyan-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#22D3EE] font-medium">Biometric ID Status</span>
            <div className="p-2 rounded-xl bg-cyan-600/15 border border-cyan-500/30 text-[#22D3EE]">
              <Fingerprint className="w-4 h-4" />
            </div>
          </div>
          <p className="text-sm font-bold text-white mt-1">
            {student?.isFaceEnrolled ? 'Face Enrolled' : 'Pending Enrollment'}
          </p>
          <p className="text-[11px] text-[#9CA3AF] font-mono">
            {student?.isFaceEnrolled ? 'SFace Deep 128D Multi-Angle' : 'Pending Verification'}
          </p>
        </div>
      </div>

      {/* Subject-Wise Attendance Breakdown */}
      <div className="p-6 rounded-2xl bg-[#18181B] border border-[#27272A] space-y-4 shadow-xl shadow-black/40">
        <div className="flex items-center justify-between pb-3 border-b border-[#27272A]">
          <h2 className="text-sm font-bold text-white">Course-Wise Attendance Breakdown</h2>
          <span className="text-xs text-[#9CA3AF] font-mono">Semester 3 Curriculum</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subjectWise.map((sub: any) => (
            <div
              key={sub.code}
              className="p-4 rounded-xl bg-[#111318] border border-[#27272A] hover:border-blue-500/30 transition-all space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/30">
                  {sub.code}
                </span>
                <span
                  className={`text-xs font-mono font-bold ${
                    sub.percentage >= 75 ? 'text-[#22C55E]' : 'text-[#EF4444]'
                  }`}
                >
                  {sub.percentage}%
                </span>
              </div>
              <h4 className="text-xs font-semibold text-white">{sub.name}</h4>
              
              {/* Progress bar */}
              <div className="w-full bg-[#18181B] rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    sub.percentage >= 75 ? 'bg-[#22C55E]' : 'bg-[#EF4444]'
                  }`}
                  style={{ width: `${Math.min(100, sub.percentage)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-[#9CA3AF] font-mono pt-1">
                <span>{sub.attended} Attended</span>
                <span>{sub.total} Total Sessions</span>
              </div>
            </div>
          ))}

          {subjectWise.length === 0 && (
            <div className="col-span-full py-8 text-center text-[#9CA3AF] text-xs">
              No course attendance records recorded yet.
            </div>
          )}
        </div>
      </div>

      {/* Today's Timetable */}
      <div className="p-6 rounded-2xl bg-[#18181B] border border-[#27272A] space-y-4 shadow-xl shadow-black/40">
        <div className="flex items-center justify-between pb-3 border-b border-[#27272A]">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold text-white">Today's Class Schedule</h3>
          </div>
          <span className="text-xs text-[#9CA3AF] font-mono">BCA AIML B</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {todayTimetable.map((slot: any) => (
            <div
              key={slot.id}
              className="p-4 rounded-xl bg-[#111318] border border-[#27272A] hover:border-cyan-500/40 transition-all space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-cyan-400">{slot.course.code}</span>
                <span className="text-[10px] font-mono text-[#9CA3AF]">{slot.startTime}</span>
              </div>
              <h4 className="text-xs font-semibold text-white line-clamp-1">{slot.course.name}</h4>
              <p className="text-[10px] text-[#9CA3AF] flex items-center gap-1 font-mono">
                <MapPin className="w-3 h-3 text-cyan-400" />
                {slot.roomNumber} • {slot.faculty.name}
              </p>
            </div>
          ))}

          {todayTimetable.length === 0 && (
            <div className="col-span-full py-8 text-center text-[#9CA3AF] text-xs">
              No lectures scheduled for today. Enjoy your day!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
