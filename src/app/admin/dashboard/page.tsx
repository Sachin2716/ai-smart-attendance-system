'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Users,
  GraduationCap,
  Briefcase,
  CheckCircle2,
  XCircle,
  Percent,
  TrendingUp,
  RefreshCw,
  Plus,
  ArrowUpRight,
  ShieldCheck,
  CalendarDays,
  FileSpreadsheet,
  Activity,
  Layers,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { toast } from 'sonner';

function CountUpNumber({ value, suffix = '', duration = 0.8 }: { value: number; suffix?: string; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const endValue = Number(value) || 0;
    if (endValue === 0) {
      setDisplayValue(0);
      return;
    }

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / (duration * 1000), 1);
      const easedProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setDisplayValue(Math.floor(endValue * easedProgress));
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setDisplayValue(endValue);
      }
    };
    const reqId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(reqId);
  }, [value, duration]);

  return <>{displayValue}{suffix}</>;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboard = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/dashboard');
      const json = await res.json();
      if (res.ok && json.success) {
        setData(json);
      } else {
        toast.error(json.error || 'Failed to load dashboard metrics');
      }
    } catch (e) {
      toast.error('Network error loading dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  // Loading Skeletons
  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Banner Skeleton */}
        <div className="h-24 bg-[#18181B] border border-[#27272A] rounded-2xl" />
        
        {/* 5 Stat Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-28 bg-[#18181B] border border-[#27272A] rounded-2xl" />
          ))}
        </div>

        {/* Charts & Table Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 h-80 bg-[#18181B] border border-[#27272A] rounded-2xl" />
          <div className="lg:col-span-4 h-80 bg-[#18181B] border border-[#27272A] rounded-2xl" />
        </div>
      </div>
    );
  }

  const stats = data?.stats || {
    totalActiveStudents: 0,
    totalActiveFaculty: 0,
    presentStudents: 0,
    absentStudents: 0,
    overallAttendancePercent: 0,
    sessionsToday: 0,
    totalDepartments: 0,
    totalSections: 0,
  };

  const courseStats = data?.courseStats || [];
  const recentLogs = data?.recentLogs || [];

  return (
    <div className="space-y-6">
      {/* Welcome / System Governance Banner */}
      <div className="p-6 rounded-2xl bg-[#18181B] border border-[#27272A] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl shadow-black/40 relative overflow-hidden">
        {/* Laser Accent line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#3B82F6] to-transparent opacity-80" />

        <div>
          <div className="flex items-center space-x-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-950/70 text-[#22D3EE] border border-cyan-500/30 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              CENTRAL MASTER AUTHORITY
            </span>
            <span className="text-xs text-[#9CA3AF] font-mono">• BCA AIML B & Computer Science</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#F9FAFB]">
            Institutional Governance Dashboard
          </h1>
          <p className="text-xs text-[#9CA3AF] mt-1">
            Real-time biometric analytics, master roster synchronizations, and institutional compliance.
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start md:self-auto">
          <button
            onClick={fetchDashboard}
            className="p-2.5 rounded-xl bg-[#111318] hover:bg-[#27272A] border border-[#27272A] text-[#9CA3AF] hover:text-[#F9FAFB] transition-all duration-200 cursor-pointer"
            title="Refresh Metrics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => router.push('/admin/attendance')}
            className="px-3.5 py-2 rounded-xl bg-[#3B82F6] hover:bg-blue-600 text-white font-semibold text-xs shadow-lg shadow-blue-500/20 flex items-center space-x-1.5 transition-all duration-200 cursor-pointer"
          >
            <Activity className="w-4 h-4 text-cyan-200" />
            <span>Live Audit Feed</span>
          </button>
        </div>
      </div>

      {/* 5 Core Required Statistic Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* 1. Total Students */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="p-5 rounded-2xl bg-[#18181B] border border-[#27272A] card-hover-effect relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#9CA3AF]">Total Students</span>
            <div className="w-8 h-8 rounded-xl bg-blue-600/15 border border-blue-500/30 text-blue-400 flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-[#F9FAFB]">
              <CountUpNumber value={stats.totalActiveStudents} />
            </p>
            <p className="text-[10px] text-[#9CA3AF] mt-1 font-mono">BCA AIML Section B</p>
          </div>
        </motion.div>

        {/* 2. Total Faculty */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.05 }}
          className="p-5 rounded-2xl bg-[#18181B] border border-[#27272A] card-hover-effect relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#9CA3AF]">Faculty Members</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-600/15 border border-cyan-500/30 text-[#22D3EE] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-[#F9FAFB]">
              <CountUpNumber value={stats.totalActiveFaculty} />
            </p>
            <p className="text-[10px] text-[#9CA3AF] mt-1 font-mono">Dept of Computer Science</p>
          </div>
        </motion.div>

        {/* 3. Present Students */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          className="p-5 rounded-2xl bg-[#18181B] border border-emerald-500/30 card-hover-effect relative overflow-hidden bg-gradient-to-b from-[#18181B] to-emerald-950/20"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-400">Present Records</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-[#22C55E] flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-[#22C55E]">
              <CountUpNumber value={stats.presentStudents} />
            </p>
            <p className="text-[10px] text-[#9CA3AF] mt-1 font-mono">Verified Biometric/Rfid</p>
          </div>
        </motion.div>

        {/* 4. Absent Students */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.15 }}
          className="p-5 rounded-2xl bg-[#18181B] border border-rose-500/30 card-hover-effect relative overflow-hidden bg-gradient-to-b from-[#18181B] to-rose-950/20"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-rose-400">Absent Records</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/15 border border-rose-500/30 text-[#EF4444] flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-[#EF4444]">
              <CountUpNumber value={stats.absentStudents} />
            </p>
            <p className="text-[10px] text-[#9CA3AF] mt-1 font-mono">Unverified / Unexcused</p>
          </div>
        </motion.div>

        {/* 5. Attendance Percentage */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.2 }}
          className="p-5 rounded-2xl bg-[#18181B] border border-blue-500/40 card-hover-effect relative overflow-hidden bg-gradient-to-b from-[#18181B] to-blue-950/20"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-cyan-400">Attendance Rate</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-[#22D3EE] flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-[#22D3EE]">
              <CountUpNumber value={stats.overallAttendancePercent} suffix="%" />
            </p>
            <p className="text-[10px] text-[#9CA3AF] mt-1 font-mono">College Target: ≥75%</p>
          </div>
        </motion.div>

      </div>

      {/* Analytics Chart & Audit Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Recharts Analytics Chart (8 Cols) */}
        <div className="lg:col-span-8 p-6 rounded-2xl bg-[#18181B] border border-[#27272A] space-y-4 shadow-xl shadow-black/40">
          <div className="flex items-center justify-between pb-3 border-b border-[#27272A]">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-blue-500/15 text-blue-400 border border-blue-500/30">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#F9FAFB]">Curriculum Attendance Overview</h3>
                <p className="text-[11px] text-[#9CA3AF]">Real-time completion percentage across courses</p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#111318] border border-[#27272A] text-[#9CA3AF]">
              Live Metrics
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            {courseStats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={courseStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
                  <XAxis
                    dataKey="courseCode"
                    stroke="#9CA3AF"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#27272A' }}
                  />
                  <YAxis
                    stroke="#9CA3AF"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#27272A' }}
                    domain={[0, 100]}
                    unit="%"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#111318',
                      borderColor: '#27272A',
                      borderRadius: '12px',
                      color: '#F9FAFB',
                      fontSize: '11px',
                    }}
                    cursor={{ fill: 'rgba(59, 130, 246, 0.08)' }}
                  />
                  <Bar
                    dataKey="percentage"
                    fill="#3B82F6"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={48}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-[#27272A] rounded-xl">
                <CalendarDays className="w-8 h-8 text-[#9CA3AF]/40 mb-2" />
                <p className="text-xs font-semibold text-[#F9FAFB]">No Session Records Yet</p>
                <p className="text-[11px] text-[#9CA3AF] max-w-sm mt-0.5">
                  Attendance charts will automatically plot here as lectures are conducted and logged.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Live Audit Log Feed (4 Cols) */}
        <div className="lg:col-span-4 p-6 rounded-2xl bg-[#18181B] border border-[#27272A] space-y-4 shadow-xl shadow-black/40 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#27272A]">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-cyan-500/15 text-[#22D3EE] border border-cyan-500/30">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-[#F9FAFB]">Security & Audit Trail</h3>
              </div>
              <span className="text-[10px] font-mono text-cyan-400">IMMUTABLE</span>
            </div>

            <div className="space-y-2.5 mt-3 max-h-60 overflow-y-auto pr-1">
              {recentLogs.length > 0 ? (
                recentLogs.map((log: any) => (
                  <div
                    key={log.id}
                    className="p-2.5 rounded-xl bg-[#111318] border border-[#27272A] space-y-1 hover:border-blue-500/30 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-white truncate max-w-[150px]">
                        {log.action}
                      </span>
                      <span className="text-[9px] font-mono text-[#9CA3AF]">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#9CA3AF] line-clamp-1">{log.details}</p>
                    <p className="text-[9px] text-[#22D3EE] font-mono">
                      By: {log.actor?.name || 'System Engine'} ({log.actor?.role || 'SYSTEM'})
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-[#9CA3AF] text-xs">
                  <p>Audit logging active.</p>
                  <p className="text-[10px] text-[#9CA3AF]/60 mt-1">Actions are recorded automatically.</p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-[#27272A]">
            <button
              onClick={() => router.push('/admin/attendance')}
              className="w-full py-2 px-3 rounded-xl bg-[#111318] hover:bg-[#27272A] border border-[#27272A] text-xs font-semibold text-[#9CA3AF] hover:text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>View Full Attendance Logs</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-cyan-400" />
            </button>
          </div>
        </div>

      </div>

      {/* Quick Access Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => router.push('/admin/students')}
          className="p-4 rounded-xl bg-[#18181B] hover:bg-[#1C1C21] border border-[#27272A] hover:border-blue-500/40 text-left transition-all duration-200 cursor-pointer group"
        >
          <div className="flex items-center justify-between text-blue-400 mb-2">
            <GraduationCap className="w-5 h-5" />
            <ArrowUpRight className="w-4 h-4 text-[#9CA3AF] group-hover:text-blue-400 transition-colors" />
          </div>
          <h4 className="text-xs font-bold text-white">Student Roster</h4>
          <p className="text-[10px] text-[#9CA3AF] mt-0.5">Manage accounts & face embeddings</p>
        </button>

        <button
          onClick={() => router.push('/admin/faculty')}
          className="p-4 rounded-xl bg-[#18181B] hover:bg-[#1C1C21] border border-[#27272A] hover:border-cyan-500/40 text-left transition-all duration-200 cursor-pointer group"
        >
          <div className="flex items-center justify-between text-[#22D3EE] mb-2">
            <Users className="w-5 h-5" />
            <ArrowUpRight className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#22D3EE] transition-colors" />
          </div>
          <h4 className="text-xs font-bold text-white">Faculty Directory</h4>
          <p className="text-[10px] text-[#9CA3AF] mt-0.5">Instructors and course assignments</p>
        </button>

        <button
          onClick={() => router.push('/admin/timetable')}
          className="p-4 rounded-xl bg-[#18181B] hover:bg-[#1C1C21] border border-[#27272A] hover:border-blue-500/40 text-left transition-all duration-200 cursor-pointer group"
        >
          <div className="flex items-center justify-between text-blue-400 mb-2">
            <CalendarDays className="w-5 h-5" />
            <ArrowUpRight className="w-4 h-4 text-[#9CA3AF] group-hover:text-blue-400 transition-colors" />
          </div>
          <h4 className="text-xs font-bold text-white">Academic Timetable</h4>
          <p className="text-[10px] text-[#9CA3AF] mt-0.5">Edit lecture timings and classrooms</p>
        </button>

        <button
          onClick={() => router.push('/admin/reports')}
          className="p-4 rounded-xl bg-[#18181B] hover:bg-[#1C1C21] border border-[#27272A] hover:border-cyan-500/40 text-left transition-all duration-200 cursor-pointer group"
        >
          <div className="flex items-center justify-between text-[#22D3EE] mb-2">
            <FileSpreadsheet className="w-5 h-5" />
            <ArrowUpRight className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#22D3EE] transition-colors" />
          </div>
          <h4 className="text-xs font-bold text-white">Compliance Reports</h4>
          <p className="text-[10px] text-[#9CA3AF] mt-0.5">Export CSV & PDF official attendance</p>
        </button>
      </div>

    </div>
  );
}
